"use client";
export const dynamic = "force-dynamic";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { ActionButton, ConfirmationDialog, DashboardBottomBar, RoleSidebar, StatusPill, Modal } from "@/components/ui-kit";
import { adminApi, toArray } from "@/lib/api/endpoints";
import { useAdminSnapshot, useMe, useMutation } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";
import type { AdminPaymentDto, AdminUserDto, DisputeDto, EscrowDto, LedgerEntryDto } from "@/lib/api/types";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function AdminPage() {
  const toast = useToastStore((s) => s.push);
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
      toast("success", "User verification updated");
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
      toast("success", "Dispute resolved");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const commissionMutation = useMutation({
    mutationFn: (pct: number) => adminApi.setCommission(pct),
    onSuccess: () => {
      commission.refetch();
      toast("success", "Commission updated");
    },
  });

  const approveMutation = useMutation({
    mutationFn: (escrowId: number) => adminApi.approveEscrow(escrowId),
    onSuccess: () => {
      escrow.refetch();
      toast("success", "Escrow approved");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  if (me.isLoading) return <LoadingState label="Checking admin session..." />;
  if (me.isError || !me.data) return <ErrorState label="Please sign in first." />;

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="admin" fallbackPath="/auth">
      <section className="space-y-6 pb-20">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

        <div className="flex gap-4">
          <RoleSidebar role="admin" />
          <div className="flex-1 space-y-4">
            
            {/* KPI Metrics */}
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-surface-200/60 bg-white p-4 shadow-card">
                <p className="text-[11px] uppercase tracking-widest text-surface-500">Total Users</p>
                <p className="mt-1 text-2xl font-semibold text-surface-900">{users.data ? userItems.length : "..."}</p>
                <p className="text-[11px] text-surface-500 mt-1">
                  {users.data ? userItems.filter((u) => u.is_verified).length : 0} Verified
                </p>
              </div>
              <div className="rounded-2xl border border-surface-200/60 bg-white p-4 shadow-card">
                <p className="text-[11px] uppercase tracking-widest text-surface-500">Total Projects</p>
                <p className="mt-1 text-2xl font-semibold text-surface-900">{projects.data ? projectItems.length : "..."}</p>
                <p className="text-[11px] text-surface-500 mt-1">Platform volume</p>
              </div>
              <div className="rounded-2xl border border-surface-200/60 bg-white p-4 shadow-card">
                <p className="text-[11px] uppercase tracking-widest text-surface-500">Escrow Value</p>
                <p className="mt-1 text-2xl font-semibold text-surface-900">
                  {escrow.data ? escrowItems.reduce((acc, item) => acc + item.amount, 0).toLocaleString() : "..."}
                </p>
                <p className="text-[11px] text-surface-500 mt-1">MNT Held</p>
              </div>
              <div className="rounded-2xl border border-surface-200/60 bg-white p-4 shadow-card">
                <p className="text-[11px] uppercase tracking-widest text-surface-500">Disputes</p>
                <p className="mt-1 text-2xl font-semibold text-surface-900">{disputes.data ? disputeItems.filter((d) => !d.resolved_at).length : "..."}</p>
                <p className="text-[11px] text-surface-500 mt-1">Active</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
            <h2 className="text-lg font-medium text-surface-900">Commission</h2>
            {commission.isLoading ? <LoadingState label="Loading commission..." /> : null}
            {commission.isError ? <ErrorState label="Unable to load commission." /> : null}
            {commission.data ? <p className="mt-2 text-[13px] text-surface-600">Current: {commission.data.platform_fee_pct}%</p> : null}
            <ActionButton className="mt-3" onClick={() => commissionMutation.mutate(10)} loading={commissionMutation.isPending}>Set 10%</ActionButton>
          </div>

          <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
            <h2 className="text-lg font-medium text-surface-900">Escrow</h2>
            {escrow.isLoading ? <LoadingState label="Loading escrow..." /> : null}
            {escrow.data && escrowItems.length === 0 ? <EmptyState label="No escrow rows." /> : null}
            {escrow.data && escrowItems.length > 0 ? (
              <ul className="space-y-2 mt-2">
                {escrowItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-xl border border-surface-200/60 p-3 text-[13px]">
                    <div>
                      <p className="text-surface-800">Escrow #{item.id} — Project #{item.project}</p>
                      <p className="text-[11px] text-surface-500">{item.amount?.toLocaleString()} MNT · <StatusPill label={item.status} tone={item.status === "held" ? "success" : item.status === "created" ? "warning" : "neutral"} /></p>
                    </div>
                    {item.status === "created" && (
                      <ActionButton tone="success" loading={approveMutation.isPending} onClick={() => approveMutation.mutate(item.id)}>Approve</ActionButton>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
            </div>

            <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium text-surface-900">Payments</h2>
            <div className="flex gap-2">
              <button className="bg-brand-600 text-white hover:bg-brand-700" onClick={() => setPaymentFilter("all")}>All</button>
              <button className="bg-brand-600 text-white hover:bg-brand-700" onClick={() => setPaymentFilter("paid")}>Paid</button>
              <button className="bg-brand-600 text-white hover:bg-brand-700" onClick={() => setPaymentFilter("pending")}>Pending</button>
              <button className="bg-brand-600 text-white hover:bg-brand-700" onClick={() => setPaymentFilter("failed")}>Failed</button>
            </div>
          </div>
          <p className="mb-2 text-[11px] uppercase tracking-widest text-surface-500">Filter: {paymentFilter}</p>
          {payments.isLoading ? <LoadingState label="Loading payments..." /> : null}
          {payments.data && paymentItems.length === 0 ? <EmptyState label="No payments." /> : null}
          {payments.data && paymentItems.length > 0 ? (
            <ul className="space-y-2">
              {paymentItems.map((item) => (
                <li key={item.id} className="rounded-xl border border-surface-200/60 p-3 text-[13px]">
                  <p className="text-surface-800">Invoice: {item.invoice_id}</p>
                  <p className="mt-1">
                    <StatusPill
                      label={item.status}
                      tone={item.status === "paid" ? "success" : item.status === "failed" ? "danger" : "warning"}
                    />
                  </p>
                  <p className="text-surface-600">Project: {item.project}</p>
                  <p className="text-surface-600">Paid at: {item.paid_at ?? "-"}</p>
                  <p className="text-surface-600">Escrow: {item.escrow_status ?? "-"}</p>
                </li>
              ))}
            </ul>
          ) : null}
            </div>

            <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-medium text-surface-900">Financial Audit Logs (Ledger)</h2>
              </div>
              {ledger.isLoading ? <LoadingState label="Loading ledger..." /> : null}
              {ledger.data && ledgerItems.length === 0 ? <EmptyState label="No ledger entries." /> : null}
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
          <h2 className="mb-3 text-lg font-medium text-surface-900">Users</h2>
          {users.isLoading ? <LoadingState label="Loading users..." /> : null}
          {users.isError ? <ErrorState label="Unable to load users." /> : null}
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
                    <ActionButton onClick={() => verifyMutation.mutate({ userId: user.id, action: "approve" })} loading={verifyMutation.isPending && verifyMutation.variables?.action === "approve"}>Approve</ActionButton>
                    <ActionButton tone="danger" onClick={() => {
                      const reason = window.prompt("Татгалзах шалтгаан:");
                      if (reason !== null) {
                        verifyMutation.mutate({ userId: user.id, action: "reject", reason });
                      }
                    }} loading={verifyMutation.isPending && verifyMutation.variables?.action === "reject"}>Reject</ActionButton>
                    <ActionButton tone="danger" onClick={() => {
                      const r = window.prompt("Түр түдгэлзүүлэх шалтгаан:");
                      if (!r || !r.trim()) return;
                      verifyMutation.mutate({ userId: user.id, action: "suspend", reason: r.trim() });
                    }} loading={verifyMutation.isPending && verifyMutation.variables?.action === "suspend"}>Suspend</ActionButton>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
            <h2 className="mb-3 text-lg font-medium text-surface-900">Projects</h2>
            {projects.isLoading ? <LoadingState label="Loading projects..." /> : null}
            {projects.data ? <p className="text-[13px] text-surface-600">Total: {projectItems.length}</p> : null}
          </div>

          <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
            <h2 className="mb-3 text-lg font-medium text-surface-900">Disputes</h2>
            {disputes.isLoading ? <LoadingState label="Loading disputes..." /> : null}
            {disputes.data && disputeItems.length === 0 ? <EmptyState label="No disputes." /> : null}
            {disputes.data && disputeItems.length > 0 ? (
              <ul className="space-y-2">
                {disputeItems.map((item) => (
                  <li key={item.id} className="flex flex-col gap-2 rounded-xl border border-surface-200/60 p-3 text-[13px]">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-surface-800">Dispute #{item.id} — Project #{item.project}</span>
                      {item.resolved_at ? (
                        <StatusPill tone="success" label="Resolved" />
                      ) : (
                        <ActionButton tone="warning" onClick={() => setResolveTarget({ disputeId: item.id, projectId: item.project })}>Resolve Now</ActionButton>
                      )}
                    </div>
                    <div className="text-surface-600">Reason: {item.reason}</div>
                    {item.note && <div className="mt-1 border-t border-surface-100 pt-2 text-[12px] text-surface-500">Admin Note: {item.note}</div>}
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
          title="Resolve Dispute"
          onClose={() => setResolveTarget(null)}
        >
          {resolveTarget && (
            <div className="space-y-4 pt-2">
              <p className="text-[13px] text-surface-500">
                Choose how to distribute the funds held in escrow for Project #{resolveTarget.projectId}. 
                Current Escrow Amount: {
                  (escrowItems.find((item) => item.project === resolveTarget.projectId)?.amount || 0).toLocaleString()
                } MNT
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex-1 rounded border px-3 py-2 text-sm ${resolveAction === "refund" ? "bg-brand-600 text-white border-brand-600" : "bg-surface-50 border-surface-200"}`}
                  onClick={() => setResolveAction("refund")}
                >
                  Refund 100% (Client)
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded border px-3 py-2 text-sm ${resolveAction === "release" ? "bg-brand-600 text-white border-brand-600" : "bg-surface-50 border-surface-200"}`}
                  onClick={() => setResolveAction("release")}
                >
                  Release 100% (Freelancer)
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded border px-3 py-2 text-sm ${resolveAction === "split" ? "bg-brand-600 text-white border-brand-600" : "bg-surface-50 border-surface-200"}`}
                  onClick={() => setResolveAction("split")}
                >
                  Split Funds
                </button>
              </div>

              {resolveAction === "split" && (
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-surface-700">Release to Freelancer: {splitReleasePct}%</label>
                  <input
                    type="range"
                    min={1}
                    max={99}
                    value={splitReleasePct}
                    onChange={(e) => setSplitReleasePct(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-[12px] text-surface-500">The remaining {100 - splitReleasePct}% will be refunded to the client.</p>
                </div>
              )}

              <textarea
                placeholder="Resolution note (visible in audit log)..."
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                className="w-full"
                rows={3}
              />

              <div className="flex justify-end gap-2 mt-4">
                <button className="bg-surface-100 text-surface-700 hover:bg-surface-200 px-4 py-2 rounded" onClick={() => setResolveTarget(null)}>
                  Cancel
                </button>
                <ActionButton tone="success" loading={resolveMutation.isPending} onClick={() => resolveTarget && resolveMutation.mutate(resolveTarget)}>
                  Confirm Resolution
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
