"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { RoleGuard } from "@/components/shared/role-guard";
import { ActionButton, AppCard, StatusPill } from "@/components/ui";
import { adminApi, toArray } from "@/lib/api/endpoints";
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

  const records = toArray<EscrowItem>(escrowQuery.data as any);
  const totalPendingAmount = records.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const createdCount = records.filter((item) => item.status === "created").length;
  const audits = toArray<AuditItem>(auditQuery.data as any).filter((item) => {
    if (!auditDate) return true;
    return (item.created_at || "").slice(0, 10) >= auditDate;
  });

  const approve = (escrowId: number) => {
    if (!window.confirm(t("approveConfirm"))) return;
    approveMutation.mutate(escrowId);
  };

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="admin" fallbackPath={withLocale("/auth")}>
      <section className="mx-auto max-w-7xl space-y-6 pb-10">
        <div className="ui-surface p-5">
          <p className="ui-eyebrow">{t("kicker")}</p>
          <h1 className="mt-2 font-headline text-[2rem] font-black tracking-tight text-primary">{t("title")}</h1>
          <p className="mt-2 text-sm text-on-surface/65">
            {t("summary", { total: records.length })}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface/45">{t("pendingRecordsLabel")}</p>
            <p className="mt-1 font-headline text-3xl font-black tracking-tight text-primary">{records.length}</p>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface/45">{t("createdStatusLabel")}</p>
            <p className="mt-1 font-headline text-3xl font-black tracking-tight text-primary">{createdCount}</p>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface/45">{t("amountAtHoldLabel")}</p>
            <p className="mt-1 font-headline text-3xl font-black tracking-tight text-primary">{totalPendingAmount.toLocaleString()} ₮</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <AppCard className="h-full">
              <h2 className="mb-4 text-sm font-semibold text-surface-800">{t("pendingApprovalTitle")}</h2>
              {!records.length ? (
                <EmptyState label={t("empty")} />
              ) : (
                <ul className="space-y-3">
                  {records.slice(0, 25).map((item) => (
                    <li key={item.id} className="flex flex-col items-start justify-between gap-4 rounded-xl bg-surface-container-low p-4 text-[13px] sm:flex-row sm:items-center">
                      <div className="space-y-1">
                        <p className="font-semibold text-primary">{t("escrow")} #{item.id}</p>
                        <p className="text-on-surface/65">{t("project")}: #{item.project}</p>
                        <p className="text-on-surface/65">{t("amount")}: {item.amount.toLocaleString()} MNT</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill label={item.status} tone={item.status === "created" ? "warning" : "info"} />
                        {item.status === "created" && (
                          <ActionButton
                            className="rounded-xl px-4 py-2 text-sm"
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

          <div className="lg:col-span-2">
            <AppCard className="h-full">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-surface-800">{t("recentAuditTitle")}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-xl bg-surface-container-low px-3 py-2 text-xs"
                    value={auditAction}
                    onChange={(event) => setAuditAction(event.target.value)}
                  >
                    <option value="">{t("auditActionAll")}</option>
                    <option value="approve">{t("auditActionApprove")}</option>
                    <option value="deposit">{t("auditActionDeposit")}</option>
                    <option value="release">{t("auditActionRelease")}</option>
                    <option value="refund">{t("auditActionRefund")}</option>
                  </select>
                  <input
                    type="date"
                    className="rounded-xl bg-surface-container-low px-3 py-2 text-xs"
                    value={auditDate}
                    onChange={(event) => setAuditDate(event.target.value)}
                  />
                </div>
              </div>
              {!audits.length ? (
                <EmptyState label={t("auditEmpty")} />
              ) : (
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {audits.slice(0, 20).map((log) => (
                    <li key={log.id} className="rounded-xl bg-surface-container-low p-3 text-[12px] text-on-surface/65">
                      <p className="font-semibold text-primary">
                        {log.action_type} / {log.entity_type} #{log.entity_id}
                      </p>
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
