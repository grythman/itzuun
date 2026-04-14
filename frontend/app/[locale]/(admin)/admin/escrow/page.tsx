"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { RoleGuard } from "@/components/shared/role-guard";
import { ActionButton, AppCard, StatusPill } from "@/components/ui";
import { adminApi } from "@/lib/api/endpoints";
import { useMe } from "@/lib/hooks";
import { useToastStore } from "@/lib/stores/toast-store";

type EscrowItem = {
  id: number;
  project: number;
  amount: number;
  status: string;
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

export default function AdminEscrowPage() {
  const t = useTranslations("AdminEscrowPage");
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.push);
  const [auditAction, setAuditAction] = useState<string>("");
  const [auditDate, setAuditDate] = useState<string>("");

  const escrowQuery = useQuery({
    queryKey: ["admin", "escrow", "created"],
    queryFn: () => adminApi.escrow("created"),
  });

  const auditQuery = useQuery({
    queryKey: ["admin", "audit-logs", "escrow", auditAction],
    queryFn: () => adminApi.auditLogs({ entity_type: "escrow", action_type: auditAction || undefined }),
  });

  const approveMutation = useMutation({
    mutationFn: (escrowId: number) => adminApi.approveEscrow(escrowId),
    onSuccess: () => {
      pushToast("success", t("approveSuccess"));
      queryClient.invalidateQueries({ queryKey: ["admin", "escrow"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs", "escrow"] });
    },
    onError: () => {
      pushToast("error", t("approveFailed"), t("approveFailedDetail"));
    },
  });

  if (me.isLoading || escrowQuery.isLoading || auditQuery.isLoading) return <LoadingState label={t("loading")} />;
  if (me.isError || !me.data) return <ErrorState label={t("signinRequired")} />;
  if (escrowQuery.isError || auditQuery.isError) return <ErrorState label={t("loadError")} />;

  const records = toResults<EscrowItem>(escrowQuery.data);
  const audits = toResults<AuditItem>(auditQuery.data).filter((item) => {
    if (!auditDate) return true;
    return (item.created_at || "").slice(0, 10) >= auditDate;
  });

  const approve = (escrowId: number) => {
    if (!window.confirm(t("approveConfirm"))) return;
    approveMutation.mutate(escrowId);
  };

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="admin" fallbackPath={withLocale("/auth")}>
      <section className="mx-auto max-w-7xl space-y-6 px-4">
        <h1 className="font-headline text-3xl font-extrabold text-surface-900">{t("title")}</h1>

        <div className="grid gap-6 lg:grid-cols-5 xl:grid-cols-3 2xl:grid-cols-2">
          <div className="lg:col-span-3 xl:col-span-2 2xl:col-span-1">
            <AppCard className="h-full">
              <h2 className="mb-4 text-sm font-semibold text-surface-800">{t("pendingApprovalTitle")}</h2>
              {!records.length ? (
                <EmptyState label={t("empty")} />
              ) : (
                <ul className="space-y-3">
                  {records.slice(0, 20).map((item) => (
                    <li key={item.id} className="flex flex-col items-start justify-between gap-4 rounded-xl border border-surface-200/60 p-4 text-[13px] sm:flex-row sm:items-center">
                    <div className="space-y-2">
                      <p className="font-semibold text-surface-900">{t("escrow")} #{item.id}</p>
                      <p className="text-surface-600">{t("project")}: #{item.project}</p>
                      <p className="text-surface-600 font-mono">{t("amount")}: {item.amount}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                    <StatusPill label={item.status} tone={item.status === "created" ? "warning" : "info"} />
                    {item.status === "created" && (
                      <ActionButton
                        className="rounded-lg px-3 py-2 text-sm"
                        loading={approveMutation.isPending}
                        onClick={() => approve(item.id)}
                      >
                        {t("approve")}
                      </ActionButton>
                    )}
                  </div>
                    </li>
                  ))}
                </ul>
              )}
            </AppCard>
          </div>
          <div className="lg:col-span-2 2xl:col-span-1">
            <AppCard className="h-full">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-surface-800">{t("recentAuditTitle")}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-xs"
                    value={auditAction}
                    onChange={(e) => setAuditAction(e.target.value)}
                  >
                    <option value="">{t("auditActionAll")}</option>
                    <option value="approve">{t("auditActionApprove")}</option>
                    <option value="deposit">{t("auditActionDeposit")}</option>
                    <option value="release">{t("auditActionRelease")}</option>
                    <option value="refund">{t("auditActionRefund")}</option>
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
                <ul className="space-y-3 max-h-96 overflow-y-auto">
                  {audits.slice(0, 15).map((log) => (
                    <li key={log.id} className="rounded-lg border border-surface-200/60 p-3 text-[12px] text-surface-600">
                      <p className="font-semibold text-surface-900">{log.action_type} / {log.entity_type} #{log.entity_id}</p>
                      <p className="truncate">{log.reason || "-"}</p>
                    </li>
                  ))}
                </ul>
              )}
            </AppCard>
          </div>
        </div>
      </section>
    </RoleGuard>
  );
}
