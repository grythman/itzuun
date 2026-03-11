"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { AppCard, DashboardBottomBar, RatingStars, RoleSidebar, VerifiedBadge } from "@/components/ui-kit";
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
            <div className="grid gap-3 md:grid-cols-4">
              <AppCard>
                <p className="text-xs uppercase tracking-wide text-slate-500">Earnings summary</p>
                <p className="mt-1 text-xl font-semibold">{earnings.toLocaleString()} MNT</p>
              </AppCard>
              <AppCard>
                <p className="text-xs uppercase tracking-wide text-slate-500">Active projects</p>
                <p className="mt-1 text-xl font-semibold">{activeProjects.length}</p>
              </AppCard>
              <AppCard>
                <p className="text-xs uppercase tracking-wide text-slate-500">Pending proposals</p>
                <p className="mt-1 text-xl font-semibold">{pendingProposals}</p>
              </AppCard>
              <AppCard>
                <p className="text-xs uppercase tracking-wide text-slate-500">Rating</p>
                <div className="mt-1"><RatingStars value={rating.data?.average ?? 0} /></div>
                <p className="mt-0.5 text-xs text-slate-500">{rating.data?.total ?? 0} reviews</p>
              </AppCard>
            </div>

            <AppCard>
              <p className="text-sm font-semibold">Profile completeness: {profileCompleteness}%</p>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${profileCompleteness}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-600">
                {profileCompleteness < 100 ? (
                  <Link href="/freelancer/profile" className="text-blue-600 hover:underline">
                    Complete your profile to get 2x more selection chances →
                  </Link>
                ) : (
                  "Your profile is complete!"
                )}
              </p>
            </AppCard>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-medium">My Proposals</h2>
              {!myProposals.length ? (
                <EmptyState label="No proposals submitted yet." />
              ) : (
                <ul className="space-y-2">
                  {myProposals.map((proposal) => (
                    <li key={proposal.id} className="rounded border border-slate-200 p-3 text-sm">
                      <p className="font-medium">Project #{proposal.project}</p>
                      <p>Price: {Number(proposal.price).toLocaleString()} MNT</p>
                      <p>Timeline: {proposal.timeline_days} days</p>
                      <p>Status: <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 capitalize text-xs">{proposal.status || "pending"}</span></p>
                      {(proposal.status || "pending") === "pending" && (
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
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
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                <div className="w-full max-w-[480px] rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                  <h3 className="text-lg font-semibold">Edit Proposal</h3>
                  <form className="mt-4 space-y-3" onSubmit={editForm.handleSubmit((v) => updateProposalMutation.mutate(v))}>
                    <label className="block text-sm">
                      Price (MNT)
                      <input type="number" {...editForm.register("price", { valueAsNumber: true })} className="mt-1" />
                    </label>
                    <label className="block text-sm">
                      Timeline (days)
                      <input type="number" {...editForm.register("timeline_days", { valueAsNumber: true })} className="mt-1" />
                    </label>
                    <label className="block text-sm">
                      Message
                      <textarea {...editForm.register("message")} rows={3} className="mt-1" />
                    </label>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        className="flex-1 rounded-lg bg-slate-200 py-2 text-sm text-slate-800 hover:bg-slate-300"
                        onClick={() => setEditingProposalId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateProposalMutation.isPending}
                        className="flex-1 rounded-lg bg-blue-600 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {updateProposalMutation.isPending ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

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
          </div>
        </div>

        <DashboardBottomBar role="freelancer" />
      </section>
    </RoleGuard>
  );
}
