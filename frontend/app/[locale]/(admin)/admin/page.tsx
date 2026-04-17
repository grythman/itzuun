"use client";
export const dynamic = "force-dynamic";

import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useDashboardLayout } from "@/components/layout/dashboard-layout";
import { RoleSidebar } from "@/components/layout/dashboard-sidebar";
import { RoleGuard } from "@/components/shared/role-guard";
import { ActionButton, ConfirmationDialog, DashboardBottomBar, StatusPill, Modal } from "@/components/ui";
import { adminApi, toArray } from "@/lib/api/endpoints";
import { useAdminSnapshot, useMe, useMutation } from "@/lib/hooks";
import { useToastStore } from "@/lib/stores/toast-store";
import type { AdminPaymentDto, AdminUserDto, DisputeDto, EscrowDto, LedgerEntryDto } from "@/lib/api/types";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function AdminPage() {
  const toast = useToastStore((s) => s.push);
  const inDashboardShell = useDashboardLayout();
  const me = useMe();
  const { users, projects, escrow, disputes, commission, ledger } = useAdminSnapshot();
  
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "pending" | "failed">("all");
  const [resolveTarget, setResolveTarget] = useState<{ disputeId: number; projectId: number } | null>(null);
  const [resolveAction, setResolveAction] = useState<"refund" | "release" | "split">("refund");
  const [splitReleasePct, setSplitReleasePct] = useState(50);
  const [resolveNote, setResolveNote] = useState("");

  const payments = useQuery({
    queryKey: ["admin-payments", paymentFilter],
    queryFn: () => (paymentFilter === "all" ? adminApi.payments() : adminApi.payments(paymentFilter)),
  });

  const userItems = users.data ? toArray<AdminUserDto>(users.data) : [];
  const projectItems = projects.data ? toArray<any>(projects.data) : [];
  const escrowItems = escrow.data ? toArray<EscrowDto>(escrow.data) : [];
  const disputeItems = disputes.data ? toArray<DisputeDto>(disputes.data) : [];
  const paymentItems = payments.data ? toArray<AdminPaymentDto>(payments.data) : [];
  const ledgerItems = ledger.data ? toArray<LedgerEntryDto>(ledger.data) : [];

  const verifyMutation = useMutation({
    mutationFn: ({ userId, action, reason }: { userId: number; action: "approve" | "reject" | "suspend"; reason?: string }) =>
      adminApi.verifyUser(userId, { action: action, rejection_reason: reason }),
    onSuccess: () => {
      users.refetch();
      toast("success", "Хэрэглэгчийн баталгаажуулалт шинэчлэгдлээ");
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ disputeId, projectId }: { disputeId: number; projectId: number }) => {
      const escrowItem = escrowItems.find((item) => item.project === projectId);
      if (!escrowItem) {
        throw new Error("Escrow not found for dispute project");
      }
      
      let release_amount = 0;
      let refund_amount = 0;
      
      if (resolveAction === "refund") {
        refund_amount = escrowItem.amount;
      } else if (resolveAction === "release") {
        release_amount = escrowItem.amount;
      } else if (resolveAction === "split") {
        release_amount = Math.floor(escrowItem.amount * (splitReleasePct / 100));
        refund_amount = escrowItem.amount - release_amount;
      }

      return adminApi.resolveDispute(disputeId, {
        action: resolveAction,
        release_amount,
        refund_amount,
        note: resolveNote || "Resolved by admin",
      });
    },
    onSuccess: () => {
      disputes.refetch();
      setResolveTarget(null);
      setResolveNote("");
      toast("success", "Маргаан шийдвэрлэгдлээ");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const commissionMutation = useMutation({
    mutationFn: (pct: number) => adminApi.setCommission(pct),
    onSuccess: () => {
      commission.refetch();
      toast("success", "Шимтгэл шинэчлэгдлээ");
    },
  });

  const approveMutation = useMutation({
    mutationFn: (escrowId: number) => adminApi.approveEscrow(escrowId),
    onSuccess: () => {
      escrow.refetch();
      toast("success", "Escrow батлагдлаа");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  if (me.isLoading) return <LoadingState label="Админ эрхийг шалгаж байна..." />;
  if (me.isError || !me.data) return <ErrorState label="Эхлээд нэвтэрнэ үү." />;

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="admin" fallbackPath="/auth">
      <section className="space-y-6 pb-20">
        {!inDashboardShell && <h1 className="text-2xl font-semibold">Админ хянах самбар</h1>}

        <div className={inDashboardShell ? "block" : "flex gap-4"}>
          {!inDashboardShell && <RoleSidebar role="admin" />}
          <div className="flex-1 space-y-4">
            
            {/* KPI Metrics */}
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-surface-200/60 bg-white p-4 shadow-card">
                <p className="text-[11px] uppercase tracking-widest text-surface-500">Нийт хэрэглэгч</p>
                <p className="mt-1 text-2xl font-semibold text-surface-900">{users.data ? userItems.length : "..."}</p>
                <p className="text-[11px] text-surface-500 mt-1">
                  {users.data ? userItems.filter((u) => u.is_verified).length : 0} Баталгаажсан
                </p>
              </div>
              <div className="rounded-2xl border border-surface-200/60 bg-white p-4 shadow-card">
                <p className="text-[11px] uppercase tracking-widest text-surface-500">Нийт төсөл</p>
                <p className="mt-1 text-2xl font-semibold text-surface-900">{projects.data ? projectItems.length : "..."}</p>
                <p className="text-[11px] text-surface-500 mt-1">Платформын хэмжээ</p>
              </div>
              <div className="rounded-2xl border border-surface-200/60 bg-white p-4 shadow-card">
                <p className="text-[11px] uppercase tracking-widest text-surface-500">Escrow дүн</p>
                <p className="mt-1 text-2xl font-semibold text-surface-900">
                  {escrow.data ? escrowItems.reduce((acc, item) => acc + item.amount, 0).toLocaleString() : "..."}
                </p>
                <p className="text-[11px] text-surface-500 mt-1">MNT Хадгалагдсан</p>
              </div>
              <div className="rounded-2xl border border-surface-200/60 bg-white p-4 shadow-card">
                <p className="text-[11px] uppercase tracking-widest text-surface-500">Маргаан</p>
                <p className="mt-1 text-2xl font-semibold text-surface-900">{disputes.data ? disputeItems.filter((d) => !d.resolved_at).length : "..."}</p>
                <p className="text-[11px] text-surface-500 mt-1">Идэвхтэй</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
            <h2 className="text-lg font-medium text-surface-900">Шимтгэл</h2>
            {commission.isLoading ? <LoadingState label="Шимтгэл ачааллаж байна..." /> : null}
            {commission.isError ? <ErrorState label="Шимтгэл ачааллах боломжгүй байна." /> : null}
            {commission.data ? <p className="mt-2 text-[13px] text-surface-600">Одоогийн: {commission.data.platform_fee_pct}%</p> : null}
            <ActionButton className="mt-3" onClick={() => commissionMutation.mutate(10)} loading={commissionMutation.isPending}>10% болгох</ActionButton>
          </div>

          <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
            <h2 className="text-lg font-medium text-surface-900">Escrow систем</h2>
            {escrow.isLoading ? <LoadingState label="Escrow ачааллаж байна..." /> : null}
            {escrow.data && escrowItems.length === 0 ? <EmptyState label="Escrow бичлэг алга." /> : null}
            {escrow.data && escrowItems.length > 0 ? (
              <ul className="space-y-2 mt-2">
                {escrowItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-xl border border-surface-200/60 p-3 text-[13px]">
                    <div>
                      <p className="text-surface-800">Escrow #{item.id} — Төсөл #{item.project}</p>
                      <p className="text-[11px] text-surface-500">{item.amount?.toLocaleString()} MNT · <StatusPill label={item.status} tone={item.status === "held" ? "success" : item.status === "created" ? "warning" : "neutral"} /></p>
                    </div>
                    {item.status === "created" && (
                      <ActionButton tone="success" loading={approveMutation.isPending} onClick={() => approveMutation.mutate(item.id)}>Батлах</ActionButton>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
            </div>

            <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium text-surface-900">Төлбөрүүд</h2>
            <div className="flex gap-2">
              <button className="bg-brand-600 text-white hover:bg-brand-700" onClick={() => setPaymentFilter("all")}>Бүгд</button>
              <button className="bg-brand-600 text-white hover:bg-brand-700" onClick={() => setPaymentFilter("paid")}>Төлөгдсөн</button>
              <button className="bg-brand-600 text-white hover:bg-brand-700" onClick={() => setPaymentFilter("pending")}>Хүлээгдэж буй</button>
              <button className="bg-brand-600 text-white hover:bg-brand-700" onClick={() => setPaymentFilter("failed")}>Амжилтгүй</button>
            </div>
          </div>
          <p className="mb-2 text-[11px] uppercase tracking-widest text-surface-500">Шүүлтүүр: {paymentFilter}</p>
          {payments.isLoading ? <LoadingState label="Төлбөрүүдийг ачааллаж байна..." /> : null}
          {payments.data && paymentItems.length === 0 ? <EmptyState label="Төлбөр алга." /> : null}
          {payments.data && paymentItems.length > 0 ? (
            <ul className="space-y-2">
              {paymentItems.map((item) => (
                <li key={item.id} className="rounded-xl border border-surface-200/60 p-3 text-[13px]">
                  <p className="text-surface-800">Нэхэмжлэх: {item.invoice_id}</p>
                  <p className="mt-1">
                    <StatusPill
                      label={item.status}
                      tone={item.status === "paid" ? "success" : item.status === "failed" ? "danger" : "warning"}
                    />
                  </p>
                  <p className="text-surface-600">Төсөл: {item.project}</p>
                  <p className="text-surface-600">Төлсөн огноо: {item.paid_at ?? "-"}</p>
                  <p className="text-surface-600">Escrow: {item.escrow_status ?? "-"}</p>
                </li>
              ))}
            </ul>
          ) : null}
            </div>

            <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-medium text-surface-900">Санхүүгийн аудитын бүртгэл (Ledger)</h2>
              </div>
              {ledger.isLoading ? <LoadingState label="Ledger ачааллаж байна..." /> : null}
              {ledger.data && ledgerItems.length === 0 ? <EmptyState label="Ledger бичлэг алга." /> : null}
              {ledger.data && ledgerItems.length > 0 ? (
                <ul className="space-y-2">
                  {ledgerItems.map((entry) => (
                    <li key={entry.id} className="rounded-xl border border-surface-200/60 p-3 flex flex-col gap-1 text-[13px]">
                      <div className="flex items-center gap-2">
                        <StatusPill
                          label={entry.entry_type}
                          tone={
                            entry.entry_type === "deposit" || entry.entry_type === "release" ? "success" : 
                            entry.entry_type === "refund" ? "warning" : "neutral"
                          }
                        />
                        <span className="font-medium text-surface-800">{entry.amount.toLocaleString()} MNT</span>
                      </div>
                      <p className="text-surface-600">Escrow #{entry.escrow} • {new Date(entry.created_at).toLocaleString()}</p>
                      {entry.note ? <p className="text-surface-500 italic">{entry.note}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
          <h2 className="mb-3 text-lg font-medium text-surface-900">Хэрэглэгчид</h2>
          {users.isLoading ? <LoadingState label="Хэрэглэгчдийг ачааллаж байна..." /> : null}
          {users.isError ? <ErrorState label="Хэрэглэгчдийг ачааллах боломжгүй байна." /> : null}
          {users.data ? (
            <ul className="space-y-2">
              {userItems.map((user) => (
                <li key={user.id} className="flex items-center justify-between rounded-xl border border-surface-200/60 p-3 text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="text-surface-700">{user.email} ({user.role})</span>
                    <StatusPill 
                      label={user.verification_status || "unverified"} 
                      tone={user.verification_status === "verified" ? "success" : user.verification_status === "pending" ? "warning" : user.verification_status === "suspended" ? "danger" : "neutral"} 
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <ActionButton onClick={() => verifyMutation.mutate({ userId: user.id, action: "approve" })} loading={verifyMutation.isPending && verifyMutation.variables?.action === "approve"}>Батлах</ActionButton>
                    <ActionButton tone="danger" onClick={() => {
                      const reason = window.prompt("Татгалзах шалтгаан:");
                      if (reason !== null) {
                        verifyMutation.mutate({ userId: user.id, action: "reject", reason });
                      }
                    }} loading={verifyMutation.isPending && verifyMutation.variables?.action === "reject"}>Татгалзах</ActionButton>
                    <ActionButton tone="danger" onClick={() => {
                      const r = window.prompt("Түр түдгэлзүүлэх шалтгаан:");
                      if (!r || !r.trim()) return;
                      verifyMutation.mutate({ userId: user.id, action: "suspend", reason: r.trim() });
                    }} loading={verifyMutation.isPending && verifyMutation.variables?.action === "suspend"}>Түдгэлзүүлэх</ActionButton>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
            <h2 className="mb-3 text-lg font-medium text-surface-900">Төслүүд</h2>
            {projects.isLoading ? <LoadingState label="Төслүүдийг ачааллаж байна..." /> : null}
            {projects.data ? <p className="text-[13px] text-surface-600">Нийт: {projectItems.length}</p> : null}
          </div>

          <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
            <h2 className="mb-3 text-lg font-medium text-surface-900">Маргаан</h2>
            {disputes.isLoading ? <LoadingState label="Маргааныг ачааллаж байна..." /> : null}
            {disputes.data && disputeItems.length === 0 ? <EmptyState label="Маргаан алга." /> : null}
            {disputes.data && disputeItems.length > 0 ? (
              <ul className="space-y-2">
                {disputeItems.map((item) => (
                  <li key={item.id} className="flex flex-col gap-2 rounded-xl border border-surface-200/60 p-3 text-[13px]">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-surface-800">Маргаан #{item.id} — Төсөл #{item.project}</span>
                      {item.resolved_at ? (
                        <StatusPill tone="success" label="Шийдвэрлэгдсэн" />
                      ) : (
                        <ActionButton tone="warning" onClick={() => setResolveTarget({ disputeId: item.id, projectId: item.project })}>Одоо шийдвэрлэх</ActionButton>
                      )}
                    </div>
                    <div className="text-surface-600">Шалтгаан: {item.reason}</div>
                    {item.note && <div className="mt-1 border-t border-surface-100 pt-2 text-[12px] text-surface-500">Админы тэмдэглэл: {item.note}</div>}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
            </div>
          </div>
        </div>

        <Modal
          open={!!resolveTarget}
          title="Маргааныг шийдвэрлэх"
          onClose={() => setResolveTarget(null)}
        >
          {resolveTarget && (
            <div className="space-y-4 pt-2">
              <p className="text-[13px] text-surface-500">
                Төсөл #{resolveTarget.projectId}-ийн escrow-д хадгалагдаж буй мөнгийг хэрхэн хуваарилахыг сонгоно уу. 
                Одоогийн Escrow дүн: {
                  (escrowItems.find((item) => item.project === resolveTarget.projectId)?.amount || 0).toLocaleString()
                } MNT
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex-1 rounded border px-3 py-2 text-sm ${resolveAction === "refund" ? "bg-brand-600 text-white border-brand-600" : "bg-surface-50 border-surface-200"}`}
                  onClick={() => setResolveAction("refund")}
                >
                  100% Буцаах (Захиалагч)
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded border px-3 py-2 text-sm ${resolveAction === "release" ? "bg-brand-600 text-white border-brand-600" : "bg-surface-50 border-surface-200"}`}
                  onClick={() => setResolveAction("release")}
                >
                  100% Олгох (Фрилансер)
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded border px-3 py-2 text-sm ${resolveAction === "split" ? "bg-brand-600 text-white border-brand-600" : "bg-surface-50 border-surface-200"}`}
                  onClick={() => setResolveAction("split")}
                >
                  Мөнгийг хуваах
                </button>
              </div>

              {resolveAction === "split" && (
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-surface-700">Фрилансерт олгох: {splitReleasePct}%</label>
                  <input
                    type="range"
                    min={1}
                    max={99}
                    value={splitReleasePct}
                    onChange={(e) => setSplitReleasePct(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-[12px] text-surface-500">Үлдсэн {100 - splitReleasePct}%-ийг захиалагчид буцаана.</p>
                </div>
              )}

              <textarea
                placeholder="Шийдвэрийн тэмдэглэл (аудитын бүртгэлд харагдана)..."
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                className="w-full"
                rows={3}
              />

              <div className="flex justify-end gap-2 mt-4">
                <button className="bg-surface-100 text-surface-700 hover:bg-surface-200 px-4 py-2 rounded" onClick={() => setResolveTarget(null)}>
                  Цуцлах
                </button>
                <ActionButton tone="success" loading={resolveMutation.isPending} onClick={() => resolveTarget && resolveMutation.mutate(resolveTarget)}>
                  Шийдвэрийг батлах
                </ActionButton>
              </div>
            </div>
          )}
        </Modal>

        <DashboardBottomBar role="admin" />
      </section>
    </RoleGuard>
  );
}
