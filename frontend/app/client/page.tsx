"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { AppCard, DashboardBottomBar, RoleSidebar, TrustPanel } from "@/components/ui-kit";
import { VerificationBanner } from "@/components/verification-banner";
import { projectsApi, toArray } from "@/lib/api/endpoints";
import { useMe, useMutation, useProjectProposals, useProjects, useMyProfile } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";

export default function ClientDashboardPage() {
  const router = useRouter();
  const me = useMe();
  const projects = useProjects(1);
  const toast = useToastStore((s) => s.push);
    const profile = useMyProfile();
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const proposals = useProjectProposals(activeProjectId || "");

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

    if (me.isLoading || projects.isLoading || profile.isLoading) return <LoadingState label="Loading client dashboard..." />;
  if (me.isError || !me.data) return <ErrorState label="Please sign in first." />;
  if (projects.isError || !projects.data) return <ErrorState label="Could not load projects." />;

  const myProjects = projects.data.results.filter((project) => project.owner === me.data?.id);
  const proposalItems = proposals.data ? toArray(proposals.data) : [];

    const profileData = profile.data;
    let profileCompleteness = 0;
    if (profileData) {
      let filled = 0;
      if (profileData.full_name) filled++;
      if (profileData.bio) filled++;
      if (profileData.skills?.length > 0) filled++;
      if (profileData.hourly_rate > 0) filled++;
      profileCompleteness = Math.round((filled / 4) * 100);
    }

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="client" fallbackPath="/auth">
      <section className="space-y-6 pb-20">
        <h1 className="text-2xl font-semibold">Client Dashboard</h1>

        <div className="flex gap-4">
          <RoleSidebar role="client" />
          <div className="flex-1 space-y-4">
            {me.data?.verification_status !== "verified" && (
              <VerificationBanner user={me.data} />
            )}
            
            <TrustPanel />

            <AppCard>
              <p className="text-[13px] font-semibold text-surface-800">Company Profile Completeness: {profileCompleteness}%</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-surface-100">
                <div className="h-1.5 rounded-full bg-brand-600" style={{ width: `${profileCompleteness}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-surface-500">
                {profileCompleteness < 100 ? (
                  <Link href="/client/profile" className="text-brand-600 hover:underline">
                    Complete your profile to build trust with freelancers →
                  </Link>
                ) : (
                  "Your profile is complete!"
                )}
              </p>
            </AppCard>

            <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
              <h2 className="mb-3 text-lg font-medium text-surface-900">My Projects</h2>
              {!myProjects.length ? (
                <EmptyState label="No projects created yet." />
              ) : (
                <ul className="space-y-2">
                  {myProjects.map((project) => (
                    <li key={project.id} className="rounded-xl border border-surface-200/60 p-3 text-[13px] space-y-2">
                      <p className="font-medium text-surface-900">{project.title}</p>
                      <p className="text-surface-500">Status: {project.status}</p>
                      <div className="flex flex-wrap gap-2">
                        <button className="bg-brand-600 text-white hover:bg-brand-700" onClick={() => setActiveProjectId(project.id)}>
                          View Proposals
                        </button>
                        <button className="bg-brand-700 text-white hover:bg-brand-800" onClick={() => router.push(`/projects/${project.id}/payment`)}>
                          Open Escrow Payment
                        </button>
                        <button className="bg-emerald-600 text-white" onClick={() => releaseMutation.mutate(project.id)}>
                          Release Escrow
                        </button>
                        <button className="bg-accent-600 text-white" onClick={() => disputeMutation.mutate(project.id)}>
                          Open Dispute
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
              <h2 className="mb-3 text-lg font-medium text-surface-900">Project Proposals</h2>
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
                    <li key={proposal.id} className="rounded-xl border border-surface-200/60 p-3 text-[13px]">
                      <p className="text-surface-700">Freelancer #{proposal.freelancer}</p>
                      <p className="text-surface-600">Price: {proposal.price}</p>
                      <p className="text-surface-600">Timeline: {proposal.timeline_days} days</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <DashboardBottomBar role="client" />
      </section>
    </RoleGuard>
  );
}
