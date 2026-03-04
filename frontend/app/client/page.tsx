"use client";

import { useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { projectsApi, toArray } from "@/lib/api/endpoints";
import { useMe, useMutation, useProjectProposals, useProjects } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";

export default function ClientDashboardPage() {
  const me = useMe();
  const projects = useProjects(1);
  const toast = useToastStore((s) => s.push);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const proposals = useProjectProposals(activeProjectId || "");

  const depositMutation = useMutation({
    mutationFn: (projectId: number) => projectsApi.depositEscrow(projectId),
    onSuccess: () => toast("success", "Escrow deposited"),
    onError: (error: Error) => toast("error", error.message),
  });

  const releaseMutation = useMutation({
    mutationFn: (projectId: number) => projectsApi.confirmCompletion(projectId),
    onSuccess: () => {
      projects.refetch();
      toast("success", "Escrow released");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const disputeMutation = useMutation({
    mutationFn: (projectId: number) => projectsApi.createDispute(projectId, { reason: "Client raised dispute" }),
    onSuccess: () => {
      projects.refetch();
      toast("warn", "Dispute opened");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  if (me.isLoading || projects.isLoading) return <LoadingState label="Loading client dashboard..." />;
  if (me.isError || !me.data) return <ErrorState label="Please sign in first." />;
  if (projects.isError || !projects.data) return <ErrorState label="Could not load projects." />;

  const myProjects = projects.data.results.filter((project) => project.owner === me.data?.id);
  const proposalItems = proposals.data ? toArray(proposals.data) : [];

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="client" fallbackPath="/auth">
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold">Client Dashboard</h1>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium">My Projects</h2>
          {!myProjects.length ? (
            <EmptyState label="No projects created yet." />
          ) : (
            <ul className="space-y-2">
              {myProjects.map((project) => (
                <li key={project.id} className="rounded border border-slate-200 p-3 text-sm space-y-2">
                  <p className="font-medium">{project.title}</p>
                  <p>Status: {project.status}</p>
                  <div className="flex flex-wrap gap-2">
                    <button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setActiveProjectId(project.id)}>
                      View Proposals
                    </button>
                    <button className="bg-blue-600 text-white" onClick={() => depositMutation.mutate(project.id)}>
                      Deposit Escrow
                    </button>
                    <button className="bg-green-600 text-white" onClick={() => releaseMutation.mutate(project.id)}>
                      Release Escrow
                    </button>
                    <button className="bg-amber-600 text-white" onClick={() => disputeMutation.mutate(project.id)}>
                      Open Dispute
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium">Project Proposals</h2>
          {!activeProjectId ? (
            <EmptyState label="Select a project to view proposals." />
          ) : proposals.isLoading ? (
            <LoadingState label="Loading proposals..." />
          ) : proposals.isError ? (
            <ErrorState label="Could not load proposals." />
          ) : !proposalItems.length ? (
            <EmptyState label="No proposals for this project." />
          ) : (
            <ul className="space-y-2">
              {proposalItems.map((proposal) => (
                <li key={proposal.id} className="rounded border border-slate-200 p-3 text-sm">
                  <p>Freelancer #{proposal.freelancer}</p>
                  <p>Price: {proposal.price}</p>
                  <p>Timeline: {proposal.timeline_days} days</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </RoleGuard>
  );
}
