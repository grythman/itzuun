"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { adminApi, toArray } from "@/lib/api/endpoints";
import { useAdminSnapshot, useMe, useMutation } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";

export default function AdminPage() {
  const toast = useToastStore((s) => s.push);
  const me = useMe();
  const { users, projects, escrow, disputes, commission } = useAdminSnapshot();

  const verifyMutation = useMutation({
    mutationFn: adminApi.verifyUser,
    onSuccess: () => {
      users.refetch();
      toast("success", "User verified");
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: number) => adminApi.resolveDispute(id, { resolution: "Resolved by admin" }),
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
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-medium">Commission</h2>
            {commission.isLoading ? <LoadingState label="Loading commission..." /> : null}
            {commission.isError ? <ErrorState label="Unable to load commission." /> : null}
            {commission.data ? <p className="mt-2 text-sm">Current: {commission.data.commission_pct}%</p> : null}
            <button className="mt-3 bg-slate-900 text-white" onClick={() => commissionMutation.mutate(10)}>
              Set 10%
            </button>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-medium">Escrow</h2>
            {escrow.isLoading ? <LoadingState label="Loading escrow..." /> : null}
            {escrow.data && escrow.data.length === 0 ? <EmptyState label="No escrow rows." /> : null}
            {escrow.data && escrow.data.length > 0 ? <p className="text-sm">Rows: {escrow.data.length}</p> : null}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4">
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
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-lg font-medium">Projects</h2>
            {projects.isLoading ? <LoadingState label="Loading projects..." /> : null}
            {projects.data ? <p className="text-sm">Total: {toArray(projects.data).length}</p> : null}
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-lg font-medium">Disputes</h2>
            {disputes.isLoading ? <LoadingState label="Loading disputes..." /> : null}
            {disputes.data && disputes.data.length === 0 ? <EmptyState label="No disputes." /> : null}
            {disputes.data && disputes.data.length > 0 ? (
              <ul className="space-y-2">
                {disputes.data.map((item: any, idx: number) => (
                  <li key={item.id || idx} className="flex items-center justify-between rounded border border-slate-200 p-3 text-sm">
                    <span>Dispute #{item.id || idx + 1}</span>
                    <button className="bg-green-600 text-white" onClick={() => resolveMutation.mutate(item.id || idx + 1)}>
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
