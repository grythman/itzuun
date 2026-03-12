"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { ActionButton, ConfirmationDialog, DashboardBottomBar, RoleSidebar, StatusPill } from "@/components/ui-kit";
import { adminApi, toArray } from "@/lib/api/endpoints";
import { useAdminSnapshot, useMe, useMutation } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function AdminPage() {
  const toast = useToastStore((s) => s.push);
  const me = useMe();
  const { users, projects, escrow, disputes, commission } = useAdminSnapshot();
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "pending" | "failed">("all");
  const [resolveTarget, setResolveTarget] = useState<{ disputeId: number; projectId: number } | null>(null);

  const payments = useQuery({
    queryKey: ["admin-payments", paymentFilter],
    queryFn: () => (paymentFilter === "all" ? adminApi.payments() : adminApi.payments(paymentFilter)),
  });

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
      const escrowItems = escrow.data ? toArray(escrow.data) : [];
      const escrowItem = escrowItems.find((item) => item.project === projectId);
      if (!escrowItem) {
        throw new Error("Escrow not found for dispute project");
      }
      return adminApi.resolveDispute(disputeId, {
        action: "refund",
        release_amount: 0,
        refund_amount: escrowItem.amount,
        note: "Resolved by admin",
      });
    },
    onSuccess: () => {
      disputes.refetch();
      toast("success", "Dispute resolved");
    },
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
            {escrow.data && toArray(escrow.data).length === 0 ? <EmptyState label="No escrow rows." /> : null}
            {escrow.data && toArray(escrow.data).length > 0 ? (
              <ul className="space-y-2 mt-2">
                {toArray(escrow.data).map((item) => (
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
          {payments.data && toArray(payments.data).length === 0 ? <EmptyState label="No payments." /> : null}
          {payments.data && toArray(payments.data).length > 0 ? (
            <ul className="space-y-2">
              {toArray(payments.data).map((item) => (
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
          <h2 className="mb-3 text-lg font-medium text-surface-900">Users</h2>
          {users.isLoading ? <LoadingState label="Loading users..." /> : null}
          {users.isError ? <ErrorState label="Unable to load users." /> : null}
          {users.data ? (
            <ul className="space-y-2">
              {toArray(users.data).map((user) => (
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
                    <ActionButton tone="danger" onClick={() => verifyMutation.mutate({ userId: user.id, action: "suspend" })} loading={verifyMutation.isPending && verifyMutation.variables?.action === "suspend"}>Suspend</ActionButton>
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
            {projects.data ? <p className="text-[13px] text-surface-600">Total: {toArray(projects.data).length}</p> : null}
          </div>

          <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
            <h2 className="mb-3 text-lg font-medium text-surface-900">Disputes</h2>
            {disputes.isLoading ? <LoadingState label="Loading disputes..." /> : null}
            {disputes.data && toArray(disputes.data).length === 0 ? <EmptyState label="No disputes." /> : null}
            {disputes.data && toArray(disputes.data).length > 0 ? (
              <ul className="space-y-2">
                {toArray(disputes.data).map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-xl border border-surface-200/60 p-3 text-[13px]">
                    <span className="text-surface-700">Dispute #{item.id}</span>
                    <ActionButton tone="success" onClick={() => setResolveTarget({ disputeId: item.id, projectId: item.project })}>Resolve</ActionButton>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
            </div>
          </div>
        </div>

        <ConfirmationDialog
          open={!!resolveTarget}
          title="Resolve Dispute"
          message="This will resolve the dispute using admin refund action. Continue?"
          confirmLabel="Confirm Resolve"
          confirmTone="success"
          loading={resolveMutation.isPending}
          onCancel={() => setResolveTarget(null)}
          onConfirm={() => {
            if (!resolveTarget) return;
            resolveMutation.mutate(resolveTarget, {
              onSuccess: () => setResolveTarget(null),
              onError: () => setResolveTarget(null),
            });
          }}
        />

        <DashboardBottomBar role="admin" />
      </section>
    </RoleGuard>
  );
}
