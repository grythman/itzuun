"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { AppCard, DashboardBottomBar, RatingStars, RoleSidebar, VerifiedBadge } from "@/components/ui-kit";
import { VerificationBanner } from "@/components/verification-banner";
import { toArray } from "@/lib/api/endpoints";
import { useMe, useMutation, useMyProfile, useMyProposals, useProjects } from "@/lib/hooks";
import { projectsApi } from "@/lib/api/endpoints";
import { useToastStore } from "@/lib/toast-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { proposalSchema } from "@/lib/validators";
import type { z } from "zod";
import type { Proposal } from "@/lib/types";

type ProposalForm = z.infer<typeof proposalSchema>;

export default function FreelancerDashboardPage() {
  const me = useMe();
  const proposals = useMyProposals();
  const projects = useProjects(1);
  const profile = useMyProfile();
  const queryClient = useQueryClient();
  const [editingProposalId, setEditingProposalId] = useState<number | null>(null);

  const editForm = useForm<ProposalForm>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { price: 0, timeline_days: 0, message: "" },
  });

  const rating = useQuery({
    queryKey: ["my-rating", me.data?.id],
    queryFn: () => projectsApi.ratingSummary(me.data!.id),
    enabled: !!me.data?.id,
  });
  const toast = useToastStore((s) => s.push);

  const submitMutation = useMutation({
    mutationFn: (projectId: number) => projectsApi.submitResult(projectId, { note: "Freelancer submission" }),
    onSuccess: () => {
      projects.refetch();
      toast("success", "Result submitted");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const updateProposalMutation = useMutation({
    mutationFn: (values: ProposalForm) => {
      if (!editingProposalId) throw new Error("No proposal selected");
      return projectsApi.updateProposal(editingProposalId, values);
    },
    onSuccess: () => {
      proposals.refetch();
      queryClient.invalidateQueries({ queryKey: ["project-proposals"] });
      setEditingProposalId(null);
      editForm.reset();
      toast("success", "Proposal updated");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const withdrawMutation = useMutation({
    mutationFn: (proposalId: number) => projectsApi.withdrawProposal(proposalId),
    onSuccess: () => {
      proposals.refetch();
      queryClient.invalidateQueries({ queryKey: ["project-proposals"] });
      toast("success", "Proposal withdrawn");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  function openEditModal(proposal: Proposal) {
    setEditingProposalId(proposal.id);
    editForm.reset({
      price: proposal.price,
      timeline_days: proposal.timeline_days,
      message: proposal.message || "",
    });
  }

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
  const pendingProposals = myProposals.filter((item) => (item.status || "pending") === "pending").length;
  const earnings = activeProjects.reduce((acc, item) => acc + item.budget, 0);

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
    <RoleGuard currentRole={me.data.role} requiredRole="freelancer" fallbackPath="/auth">
      <section className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Freelancer Dashboard</h1>
          <VerifiedBadge verified={me.data.is_verified} />
        </div>

        <div className="flex gap-4">
          <RoleSidebar role="freelancer" />
          <div className="flex-1 space-y-4">
            
            {me.data?.verification_status !== "verified" && (
              <VerificationBanner user={me.data} />
            )}

            <div className="grid gap-3 md:grid-cols-4">
              <AppCard>
                <p className="text-[11px] uppercase tracking-widest text-surface-500">Earnings summary</p>
                <p className="mt-1 text-xl font-semibold text-surface-900">{earnings.toLocaleString()} MNT</p>
              </AppCard>
              <AppCard>
                <p className="text-[11px] uppercase tracking-widest text-surface-500">Active projects</p>
                <p className="mt-1 text-xl font-semibold text-surface-900">{activeProjects.length}</p>
              </AppCard>
              <AppCard>
                <p className="text-[11px] uppercase tracking-widest text-surface-500">Pending proposals</p>
                <p className="mt-1 text-xl font-semibold text-surface-900">{pendingProposals}</p>
              </AppCard>
              <AppCard>
                <p className="text-[11px] uppercase tracking-widest text-surface-500">Rating</p>
                <div className="mt-1"><RatingStars value={rating.data?.average ?? 0} /></div>
                <p className="mt-0.5 text-[11px] text-surface-500">{rating.data?.total ?? 0} reviews</p>
              </AppCard>
            </div>

            <AppCard>
              <p className="text-[13px] font-semibold text-surface-800">Profile completeness: {profileCompleteness}%</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-surface-100">
                <div className="h-1.5 rounded-full bg-emerald-600" style={{ width: `${profileCompleteness}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-surface-500">
                {profileCompleteness < 100 ? (
                  <Link href="/freelancer/profile" className="text-brand-600 hover:underline">
                    Complete your profile to get 2x more selection chances →
                  </Link>
                ) : (
                  "Your profile is complete!"
                )}
              </p>
            </AppCard>

            <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
              <h2 className="mb-3 text-lg font-medium text-surface-900">My Proposals</h2>
              {!myProposals.length ? (
                <div className="text-center py-10">
                  <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                  </div>
                  <h3 className="text-sm font-medium text-surface-900">No proposals submitted</h3>
                  <p className="mt-1 text-xs text-surface-500 max-w-sm mx-auto">Browse available projects and submit proposals to start earning.</p>
                  <Link href="/projects" className="mt-4 inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700">
                    Browse Projects
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2">
                  {myProposals.map((proposal) => (
                    <li key={proposal.id} className="rounded-xl border border-surface-200/60 p-3 text-[13px]">
                      <p className="font-medium text-surface-900">Project #{proposal.project}</p>
                      <p className="text-surface-600">Price: {Number(proposal.price).toLocaleString()} MNT</p>
                      <p className="text-surface-600">Timeline: {proposal.timeline_days} days</p>
                      <p className="text-surface-600">Status: <span className="inline-block rounded-full bg-surface-100 px-2 py-0.5 capitalize text-[11px]">{proposal.status || "pending"}</span></p>
                      {(proposal.status || "pending") === "pending" && (
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs text-white hover:bg-brand-700"
                            onClick={() => openEditModal(proposal)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100"
                            disabled={withdrawMutation.isPending}
                            onClick={() => withdrawMutation.mutate(proposal.id)}
                          >
                            {withdrawMutation.isPending ? "Withdrawing..." : "Withdraw"}
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {editingProposalId !== null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 backdrop-blur-sm p-4">
                <div className="w-full max-w-[480px] rounded-2xl border border-surface-200/60 bg-white p-6 shadow-modal">
                  <h3 className="text-lg font-semibold text-surface-900">Edit Proposal</h3>
                  <form className="mt-4 space-y-3" onSubmit={editForm.handleSubmit((v) => updateProposalMutation.mutate(v))}>
                    <label className="block text-[13px] font-medium text-surface-700">
                      Price (MNT)
                      <input type="number" {...editForm.register("price", { valueAsNumber: true })} className="mt-1" />
                    </label>
                    <label className="block text-[13px] font-medium text-surface-700">
                      Timeline (days)
                      <input type="number" {...editForm.register("timeline_days", { valueAsNumber: true })} className="mt-1" />
                    </label>
                    <label className="block text-[13px] font-medium text-surface-700">
                      Message
                      <textarea {...editForm.register("message")} rows={3} className="mt-1" />
                    </label>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        className="flex-1 rounded-lg bg-surface-100 py-2 text-[13px] text-surface-700 hover:bg-surface-200"
                        onClick={() => setEditingProposalId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateProposalMutation.isPending}
                        className="flex-1 rounded-lg bg-brand-600 py-2 text-[13px] text-white hover:bg-brand-700 disabled:opacity-60"
                      >
                        {updateProposalMutation.isPending ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
              <h2 className="mb-3 text-lg font-medium text-surface-900">Active Projects</h2>
              {!activeProjects.length ? (
                <EmptyState label="No active selected projects." />
              ) : (
                <ul className="space-y-2">
                  {activeProjects.map((project) => (
                    <li key={project.id} className="rounded-xl border border-surface-200/60 p-3 text-[13px] space-y-2">
                      <p className="font-medium text-surface-900">{project.title}</p>
                      <p className="text-surface-600">Status: {project.status}</p>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/projects/${project.id}`} className="rounded-xl bg-brand-600 px-4 py-2 text-[13px] text-white hover:bg-brand-700">
                          Open Project
                        </Link>
                        <button className="bg-emerald-600 text-white" onClick={() => submitMutation.mutate(project.id)}>
                          Submit Result
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <DashboardBottomBar role="freelancer" />
      </section>
    </RoleGuard>
  );
}
