"use client";

import Link from "next/link";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { toArray } from "@/lib/api/endpoints";
import { useMe, useMutation, useMyProposals, useProjects } from "@/lib/hooks";
import { projectsApi } from "@/lib/api/endpoints";
import { useToastStore } from "@/lib/toast-store";

export default function FreelancerDashboardPage() {
  const me = useMe();
  const proposals = useMyProposals();
  const projects = useProjects(1);
  const toast = useToastStore((s) => s.push);

  const submitMutation = useMutation({
    mutationFn: (projectId: number) => projectsApi.submitResult(projectId, { note: "Freelancer submission" }),
    onSuccess: () => {
      projects.refetch();
      toast("success", "Result submitted");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  if (me.isLoading || proposals.isLoading || projects.isLoading) return <LoadingState label="Loading freelancer dashboard..." />;
  if (me.isError || !me.data) return <ErrorState label="Please sign in first." />;
  if (proposals.isError || !proposals.data || projects.isError || !projects.data) return <ErrorState label="Could not load dashboard data." />;

  const myProposals = toArray(proposals.data);
  const myProposalIds = new Set(myProposals.map((proposal) => proposal.id));
  const activeProjects = projects.data.results.filter(
    (project) =>
      project.selected_proposal &&
      myProposalIds.has(project.selected_proposal) &&
      ["in_progress", "awaiting_client_review"].includes(project.status),
  );

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="freelancer" fallbackPath="/auth">
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold">Freelancer Dashboard</h1>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium">My Proposals</h2>
          {!myProposals.length ? (
            <EmptyState label="No proposals submitted yet." />
          ) : (
            <ul className="space-y-2">
              {myProposals.map((proposal) => (
                <li key={proposal.id} className="rounded border border-slate-200 p-3 text-sm">
                  <p>Project #{proposal.project}</p>
                  <p>Price: {proposal.price}</p>
                  <p>Status: {proposal.status || "pending"}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium">Active Projects</h2>
          {!activeProjects.length ? (
            <EmptyState label="No active selected projects." />
          ) : (
            <ul className="space-y-2">
              {activeProjects.map((project) => (
                <li key={project.id} className="rounded border border-slate-200 p-3 text-sm space-y-2">
                  <p className="font-medium">{project.title}</p>
                  <p>Status: {project.status}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/projects/${project.id}`} className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                      Open Project
                    </Link>
                    <button className="bg-green-600 text-white" onClick={() => submitMutation.mutate(project.id)}>
                      Submit Result
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </RoleGuard>
  );
}
