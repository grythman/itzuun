"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { ActionButton, AppCard, StatusPill } from "@/components/ui-kit";
import { adminApi } from "@/lib/api/endpoints";
import { useMe } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";

type DisputeItem = {
  id: number;
  project: number;
  escrow_amount?: number;
  reason: string;
  created_at?: string;
  resolved_at?: string | null;
  note?: string;
};

type AuditItem = {
  id: number;
  action_type: string;
  entity_type: string;
  entity_id: number;
  reason?: string;
  created_at: string;
};

function toResults<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.results)) return payload.results;
  return [];
}

export default function AdminDisputesPage() {
  const t = useTranslations("AdminDisputesPage");
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.push);
  const [formState, setFormState] = useState<Record<number, { action: "release" | "refund" | "split"; release: string; refund: string; note: string }>>({});
  const [auditAction, setAuditAction] = useState<string>("");
  const [auditDate, setAuditDate] = useState<string>("");

  const disputesQuery = useQuery({
    queryKey: ["admin", "disputes", "unresolved"],
    queryFn: () => adminApi.disputes(true),
  });

  const auditQuery = useQuery({
    queryKey: ["admin", "audit-logs", "dispute", auditAction],
    queryFn: () => adminApi.auditLogs({ entity_type: "dispute", action_type: auditAction || undefined }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => adminApi.resolveDispute(id, payload),
    onSuccess: () => {
      pushToast("success", t("resolveSuccess"));
      queryClient.invalidateQueries({ queryKey: ["admin", "disputes"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs", "dispute"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "escrow"] });
    },
    onError: () => {
      pushToast("error", t("resolveFailed"), t("resolveFailedDetail"));
    },
  });

  if (me.isLoading || disputesQuery.isLoading || auditQuery.isLoading) return <LoadingState label={t("loading")} />;
  if (me.isError || !me.data) return <ErrorState label={t("signinRequired")} />;
  if (disputesQuery.isError || auditQuery.isError) return <ErrorState label={t("loadError")} />;

  const disputes = toResults<DisputeItem>(disputesQuery.data);
  const audits = toResults<AuditItem>(auditQuery.data).filter((item) => {
    if (!auditDate) return true;
    return (item.created_at || "").slice(0, 10) >= auditDate;
  });

  const getState = (id: number) =>
    formState[id] || {
      action: "split" as const,
      release: "0",
      refund: "0",
      note: "",
    };

  const patchState = (id: number, patch: Partial<{ action: "release" | "refund" | "split"; release: string; refund: string; note: string }>) => {
    setFormState((prev) => ({
      ...prev,
      [id]: {
        ...getState(id),
        ...patch,
      },
    }));
  };

  const submitResolve = (item: DisputeItem) => {
    const state = getState(item.id);
    const escrowAmount = Number(item.escrow_amount || 0);
    if (!state.note.trim()) {
      window.alert(t("noteRequired"));
      return;
    }

    let releaseAmount = 0;
    let refundAmount = 0;

    if (state.action === "release") {
      releaseAmount = escrowAmount;
      refundAmount = 0;
    } else if (state.action === "refund") {
      releaseAmount = 0;
      refundAmount = escrowAmount;
    } else {
      releaseAmount = Number(state.release || 0);
      refundAmount = Number(state.refund || 0);
      if (releaseAmount + refundAmount !== escrowAmount) {
        window.alert(t("splitTotalMismatch", { amount: escrowAmount }));
        return;
      }
    }

    resolveMutation.mutate({
      id: item.id,
      payload: {
        action: state.action,
        release_amount: releaseAmount,
        refund_amount: refundAmount,
        note: state.note.trim(),
      },
    });
  };

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="admin" fallbackPath={withLocale("/auth")}>
      <section className="mx-auto max-w-7xl space-y-6 px-4">
        <h1 className="font-headline text-3xl font-extrabold text-surface-900">{t("title")}</h1>

        <AppCard>
          <h2 className="mb-4 text-sm font-semibold text-surface-800">{t("unresolvedTitle")}</h2>
          {!disputes.length ? (
            <EmptyState label={t("empty")} />
          ) : (
            <ul className="space-y-4">
              {disputes.slice(0, 20).map((item) => {
                const state = getState(item.id);
                return (
                  <li key={item.id} className="space-y-4 rounded-xl border border-surface-200/60 p-5 text-[13px]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-surface-900">{t("dispute")} #{item.id}</p>
                      <StatusPill label={item.resolved_at ? t("resolved") : t("open")} tone={item.resolved_at ? "success" : "warning"} />
                    </div>
                    <p className="text-surface-600">{t("project")}: #{item.project}</p>
                    <p className="text-surface-600">{t("escrowAmount")}: {Number(item.escrow_amount || 0)}</p>
                    <p className="text-surface-600">{t("reason")}: {item.reason || "-"}</p>

                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                      <select
                        className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm"
                        value={state.action}
                        onChange={(e) => patchState(item.id, { action: e.target.value as "release" | "refund" | "split" })}
                      >
                        <option value="release">{t("actionRelease")}</option>
                        <option value="refund">{t("actionRefund")}</option>
                        <option value="split">{t("actionSplit")}</option>
                      </select>

                      <input
                        className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm"
                        type="number"
                        min={0}
                        disabled={state.action !== "split"}
                        value={state.release}
                        onChange={(e) => patchState(item.id, { release: e.target.value })}
                        placeholder={t("releaseAmount")}
                      />

                      <input
                        className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm"
                        type="number"
                        min={0}
                        disabled={state.action !== "split"}
                        value={state.refund}
                        onChange={(e) => patchState(item.id, { refund: e.target.value })}
                        placeholder={t("refundAmount")}
                      />

                      <ActionButton
                        className="rounded-lg px-4 py-2 text-sm whitespace-nowrap"
                        loading={resolveMutation.isPending}
                        onClick={() => submitResolve(item)}
                      >
                        {t("resolve")}
                      </ActionButton>
                    </div>

                    <textarea
                      className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-[13px] col-span-1 sm:col-span-2 lg:col-span-5"
                      rows={3}
                      value={state.note}
                      onChange={(e) => patchState(item.id, { note: e.target.value })}
                      placeholder={t("notePlaceholder")}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </AppCard>

        <AppCard>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-surface-800">{t("recentAuditTitle")}</h2>
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-xs"
                value={auditAction}
                onChange={(e) => setAuditAction(e.target.value)}
              >
                <option value="">{t("auditActionAll")}</option>
                <option value="release">{t("auditActionRelease")}</option>
                <option value="refund">{t("auditActionRefund")}</option>
                <option value="dispute">{t("auditActionDispute")}</option>
              </select>
              <input
                type="date"
                className="rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-xs"
                value={auditDate}
                onChange={(e) => setAuditDate(e.target.value)}
              />
            </div>
          </div>
          {!audits.length ? (
            <EmptyState label={t("auditEmpty")} />
          ) : (
            <ul className="space-y-3 max-h-80 overflow-y-auto">
              {audits.slice(0, 10).map((log) => (
                <li key={log.id} className="rounded-lg border border-surface-200/60 p-3 text-[12px] text-surface-600">
                  <p className="font-semibold text-surface-900">{log.action_type} / {log.entity_type} #{log.entity_id}</p>
                  <p>{log.reason || "-"}</p>
                </li>
              ))}
            </ul>
          )}
        </AppCard>
      </section>
    </RoleGuard>
  );
}
