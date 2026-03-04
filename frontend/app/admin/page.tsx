"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
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

  const payments = useQuery({
    queryKey: ["admin-payments", paymentFilter],
    queryFn: () => (paymentFilter === "all" ? adminApi.payments() : adminApi.payments(paymentFilter)),
  });

  const verifyMutation = useMutation({
    mutationFn: adminApi.verifyUser,
    onSuccess: () => {
      users.refetch();
      toast("success", "User verified");
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

  if (me.isLoading) return <LoadingState label="Checking admin session..." />;
  if (me.isError || !me.data) return <ErrorState label="Please sign in first." />;

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="admin" fallbackPath="/auth">
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium">Commission</h2>
            {commission.isLoading ? <LoadingState label="Loading commission..." /> : null}
            {commission.isError ? <ErrorState label="Unable to load commission." /> : null}
            {commission.data ? <p className="mt-2 text-sm">Current: {commission.data.platform_fee_pct}%</p> : null}
            <button className="mt-3 bg-blue-600 text-white hover:bg-blue-700" onClick={() => commissionMutation.mutate(10)}>
              Set 10%
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium">Escrow</h2>
            {escrow.isLoading ? <LoadingState label="Loading escrow..." /> : null}
            {escrow.data && toArray(escrow.data).length === 0 ? <EmptyState label="No escrow rows." /> : null}
            {escrow.data && toArray(escrow.data).length > 0 ? <p className="text-sm">Rows: {toArray(escrow.data).length}</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium">Payments</h2>
            <div className="flex gap-2">
              <button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setPaymentFilter("all")}>All</button>
              <button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setPaymentFilter("paid")}>Paid</button>
              <button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setPaymentFilter("pending")}>Pending</button>
              <button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setPaymentFilter("failed")}>Failed</button>
            </div>
          </div>
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Filter: {paymentFilter}</p>
          {payments.isLoading ? <LoadingState label="Loading payments..." /> : null}
          {payments.data && toArray(payments.data).length === 0 ? <EmptyState label="No payments." /> : null}
          {payments.data && toArray(payments.data).length > 0 ? (
            <ul className="space-y-2">
              {toArray(payments.data).map((item) => (
                <li key={item.id} className="rounded border border-slate-200 p-3 text-sm">
                  <p>Invoice: {item.invoice_id}</p>
                  <p>Status: {item.status}</p>
                  <p>Project: {item.project}</p>
                  <p>Paid at: {item.paid_at ?? "-"}</p>
                  <p>Escrow: {item.escrow_status ?? "-"}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium">Users</h2>
          {users.isLoading ? <LoadingState label="Loading users..." /> : null}
          {users.isError ? <ErrorState label="Unable to load users." /> : null}
          {users.data ? (
            <ul className="space-y-2">
              {toArray(users.data).map((user) => (
                <li key={user.id} className="flex items-center justify-between rounded border border-slate-200 p-3 text-sm">
                  <span>{user.email} ({user.role})</span>
                  <button className="bg-blue-600 text-white" onClick={() => verifyMutation.mutate(user.id)}>
                    Verify
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-medium">Projects</h2>
            {projects.isLoading ? <LoadingState label="Loading projects..." /> : null}
            {projects.data ? <p className="text-sm">Total: {toArray(projects.data).length}</p> : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-medium">Disputes</h2>
            {disputes.isLoading ? <LoadingState label="Loading disputes..." /> : null}
            {disputes.data && toArray(disputes.data).length === 0 ? <EmptyState label="No disputes." /> : null}
            {disputes.data && toArray(disputes.data).length > 0 ? (
              <ul className="space-y-2">
                {toArray(disputes.data).map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded border border-slate-200 p-3 text-sm">
                    <span>Dispute #{item.id}</span>
                    <button className="bg-green-600 text-white" onClick={() => resolveMutation.mutate({ disputeId: item.id, projectId: item.project })}>
                      Resolve
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>
    </RoleGuard>
  );
}
