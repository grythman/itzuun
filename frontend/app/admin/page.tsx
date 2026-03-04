"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import AdminGuard from "@/components/admin-guard";
import { adminApi } from "@/lib/api/endpoints";
import { Card, EmptyState, ErrorState, SectionTitle } from "@/components/ui";
import { useToastStore } from "@/lib/toast-store";

export default function AdminPage() {
  const pushToast = useToastStore((state) => state.push);
  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: adminApi.users });
  const projectsQuery = useQuery({ queryKey: ["admin-projects"], queryFn: adminApi.projects });
  const escrowQuery = useQuery({ queryKey: ["admin-escrow"], queryFn: adminApi.escrow });
  const disputesQuery = useQuery({ queryKey: ["admin-disputes"], queryFn: adminApi.disputes });
  const commissionQuery = useQuery({ queryKey: ["admin-commission"], queryFn: adminApi.commissionDetail });

  const verifyUserMutation = useMutation({
    mutationFn: (id: number) => adminApi.verifyUser(id),
    onSuccess: () => {
      pushToast("success", "User verified");
      usersQuery.refetch();
    },
    onError: () => pushToast("error", "Verify failed"),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: number) => adminApi.resolveDispute(id, "resolved_by_admin"),
    onSuccess: () => {
      pushToast("success", "Dispute resolved");
      disputesQuery.refetch();
    },
    onError: () => pushToast("error", "Resolve failed"),
  });

  const commissionMutation = useMutation({
    mutationFn: (value: string) => adminApi.updateCommission(value),
    onSuccess: () => {
      pushToast("success", "Commission updated");
      commissionQuery.refetch();
    },
    onError: () => pushToast("error", "Commission update failed"),
  });

  return (
    <AdminGuard>
      <div className="space-y-4">
        <SectionTitle title="Admin Dashboard" subtitle="Users, projects, escrow, disputes, commission" />

        <Card>
          <h3 className="mb-2 font-medium">Users</h3>
          {usersQuery.isLoading ? <p className="text-sm">Loading...</p> : null}
          {usersQuery.isError ? <ErrorState message="Failed to load users" /> : null}
          {usersQuery.data && usersQuery.data.results.length === 0 ? <EmptyState message="No users" /> : null}
          <div className="space-y-2">
            {usersQuery.data?.results.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded border p-2 text-sm">
                <span>
                  {user.email} ({user.role}) {user.is_verified ? "✓" : ""}
                </span>
                {!user.is_verified ? (
                  <button
                    className="rounded border px-2 py-1"
                    onClick={() => verifyUserMutation.mutate(user.id)}
                    disabled={verifyUserMutation.isPending}
                  >
                    Verify
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-2 font-medium">Projects</h3>
          <p className="mb-2 text-sm text-slate-600">Count: {projectsQuery.data?.count ?? 0}</p>
          {projectsQuery.data?.results.slice(0, 5).map((project) => (
            <div key={project.id} className="rounded border p-2 text-sm">
              {project.title}
            </div>
          ))}
        </Card>

        <Card>
          <h3 className="mb-2 font-medium">Escrow</h3>
          <p className="text-sm text-slate-600">Count: {escrowQuery.data?.count ?? 0}</p>
        </Card>

        <Card>
          <h3 className="mb-2 font-medium">Disputes</h3>
          {disputesQuery.data?.results.map((dispute) => (
            <div key={dispute.id} className="mb-2 flex items-center justify-between rounded border p-2 text-sm">
              <span>
                #{dispute.id} - {dispute.status}
              </span>
              <button className="rounded border px-2 py-1" onClick={() => resolveMutation.mutate(dispute.id)}>
                Resolve
              </button>
            </div>
          ))}
        </Card>

        <Card>
          <h3 className="mb-2 font-medium">Commission</h3>
          <p className="mb-2 text-sm text-slate-600">Current: {commissionQuery.data?.value ?? "-"}</p>
          <button className="rounded border px-3 py-2 text-sm" onClick={() => commissionMutation.mutate("10")}>Set 10%</button>
        </Card>
      </div>
    </AdminGuard>
  );
}
