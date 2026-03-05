"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { ActionButton, CompareTable, ConfirmationDialog, EscrowStatusBadge, RatingStars, TrustPanel, VerifiedBadge } from "@/components/ui-kit";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import ProjectChat from "@/components/project-chat";
import { projectsApi, toArray } from "@/lib/api/endpoints";
import { useMe, useMutation, useProjectDetail, useProjectProposals } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";
import { proposalSchema, reviewSchema } from "@/lib/validators";

import type { z } from "zod";

type ProposalForm = z.infer<typeof proposalSchema>;
type ReviewForm = z.infer<typeof reviewSchema>;

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const toast = useToastStore((s) => s.push);
  const me = useMe();

  const detail = useProjectDetail(id);
  const proposals = useProjectProposals(id);

  const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
  const [checksum, setChecksum] = useState("");
  const [releaseConfirmOpen, setReleaseConfirmOpen] = useState(false);
  const [disputeConfirmOpen, setDisputeConfirmOpen] = useState(false);
  const [proposalCompareMode, setProposalCompareMode] = useState(false);
  const [selectedProposalIds, setSelectedProposalIds] = useState<number[]>([]);
  const [reviewStep, setReviewStep] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [wouldRecommend, setWouldRecommend] = useState<"yes" | "no">("yes");
  const [reviewRecap, setReviewRecap] = useState<null | {
    rating: number;
    communication: number;
    quality: number;
    recommend: "yes" | "no";
    comment: string;
  }>(null);

  const proposalForm = useForm<ProposalForm>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { price: 1000000, timeline_days: 14, message: "" },
  });

  const reviewForm = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, comment: "" },
  });

  const proposalMutation = useMutation({
    mutationFn: (values: ProposalForm) => projectsApi.submitProposal(id, values),
    onSuccess: () => {
      proposals.refetch();
      toast("success", "Proposal submitted");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const selectMutation = useMutation({
    mutationFn: (proposal_id: number) => projectsApi.selectFreelancer(id, proposal_id),
    onSuccess: () => {
      detail.refetch();
      proposals.refetch();
      toast("success", "Freelancer selected");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const completionMutation = useMutation({
    mutationFn: () => projectsApi.confirmCompletion(id),
    onSuccess: () => {
      detail.refetch();
      toast("success", "Escrow released and project completed");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const disputeMutation = useMutation({
    mutationFn: () => projectsApi.createDispute(id, { reason: "Dispute raised from dashboard" }),
    onSuccess: () => {
      detail.refetch();
      toast("warn", "Dispute submitted");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const uploadDeliverableMutation = useMutation({
    mutationFn: async () => {
      if (!deliverableFile) {
        throw new Error("Select a file first");
      }
      if (!checksum.trim()) {
        throw new Error("Checksum is required");
      }
      const upload = await projectsApi.uploadMessageFile(id, deliverableFile);
      await projectsApi.uploadDeliverable(id, { file_id: String(upload.file_id), checksum: checksum.trim() });
    },
    onSuccess: () => toast("success", "Deliverable uploaded"),
    onError: (error: Error) => toast("error", error.message),
  });

  const resultMutation = useMutation({
    mutationFn: () => projectsApi.submitResult(id, { note: "Work submitted" }),
    onSuccess: () => {
      detail.refetch();
      toast("success", "Result submitted for client review");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const reviewMutation = useMutation({
    mutationFn: (values: ReviewForm) => projectsApi.review(id, values),
    onSuccess: (_data, variables) => {
      setReviewRecap({
        rating: variables.rating,
        communication: communicationRating,
        quality: qualityRating,
        recommend: wouldRecommend,
        comment: variables.comment || "",
      });
      toast("success", "Review submitted");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  if (detail.isLoading || me.isLoading) return <LoadingState label="Loading project..." />;
  if (detail.isError || !detail.data) return <ErrorState label="Project not found." />;
  if (!me.data) return <ErrorState label="Please sign in first." />;

  const project = detail.data;
  const proposalItems = proposals.data ? toArray(proposals.data) : [];

  const compareRows = useMemo(
    () =>
      proposalItems
        .filter((item) => selectedProposalIds.includes(item.id))
        .slice(0, 2)
        .map((item) => ({
          id: item.id,
          freelancer: item.freelancer,
          price: item.price,
          timeline: item.timeline_days,
          message: item.message || "-",
        })),
    [proposalItems, selectedProposalIds],
  );

  const bestValueProposalId = useMemo(() => {
    if (compareRows.length < 2) return null;
    const firstScore = compareRows[0].price / Math.max(1, compareRows[0].timeline);
    const secondScore = compareRows[1].price / Math.max(1, compareRows[1].timeline);
    return firstScore <= secondScore ? compareRows[0].id : compareRows[1].id;
  }, [compareRows]);

  const isClientOwner = me.data.id === project.owner;
  const canFreelancerPropose = me.data.role === "freelancer" && project.status === "open";
  const isSelectedFreelancer = proposalItems.some(
    (item) => item.id === project.selected_proposal && item.freelancer === me.data?.id,
  );
  const milestoneBanner = project.status === "in_progress" ? "Project in escrow. Deliver milestones to unlock review." : null;

  const toggleCompareProposal = (proposalId: number) => {
    setSelectedProposalIds((prev) => {
      if (prev.includes(proposalId)) {
        return prev.filter((idValue) => idValue !== proposalId);
      }
      if (prev.length >= 2) {
        return [prev[1], proposalId];
      }
      return [...prev, proposalId];
    });
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold">{project.title}</h1>
        <p className="mt-2 text-sm text-slate-700">{project.description}</p>
        <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Status: {project.status}</p>
        <div className="mt-2"><EscrowStatusBadge status={project.status === "completed" ? "released" : "held"} /></div>
      </div>

      {milestoneBanner ? <TrustPanel /> : null}

      {isClientOwner ? (
        <div className="grid gap-3 md:grid-cols-3">
          <button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => router.push(`/projects/${id}/payment`)}>
            Open Payment Page
          </button>
          <button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setReleaseConfirmOpen(true)}>
            Release Escrow
          </button>
          <button className="bg-amber-600 text-white" onClick={() => setDisputeConfirmOpen(true)}>
            Open Dispute
          </button>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {canFreelancerPropose ? (
          <form
            className="space-y-3 rounded-md border border-slate-200 bg-white p-4"
            onSubmit={proposalForm.handleSubmit((v) => proposalMutation.mutate(v))}
          >
            <h2 className="text-lg font-medium">Submit Proposal</h2>
            <input type="number" {...proposalForm.register("price", { valueAsNumber: true })} aria-label="Proposal price" />
            <input
              type="number"
              {...proposalForm.register("timeline_days", { valueAsNumber: true })}
              aria-label="Proposal timeline"
            />
            <textarea placeholder="Message" {...proposalForm.register("message")} aria-label="Proposal message" rows={3} />
            <button className="bg-blue-600 text-white" type="submit">Send Proposal</button>
          </form>
        ) : (
          <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Proposal submission is available for freelancers on open projects.
          </div>
        )}

        {project.status === "completed" ? (
          <form
            className="space-y-3 rounded-md border border-slate-200 bg-white p-4"
            onSubmit={reviewForm.handleSubmit((v) => {
              const guidedAverage = Math.round((communicationRating + qualityRating) / 2);
              const finalRating = Math.max(1, Math.min(5, guidedAverage));
              reviewMutation.mutate({
                ...v,
                rating: finalRating,
                comment: `${v.comment || ""}\nCommunication: ${communicationRating}/5\nQuality: ${qualityRating}/5\nWould recommend: ${wouldRecommend}`.trim(),
              });
            })}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Guided Review</h2>
              <span className="text-xs text-slate-500">Step {reviewStep + 1} / 3</span>
            </div>

            {reviewStep === 0 ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium">Rate communication</label>
                <input type="range" min={1} max={5} value={communicationRating} onChange={(event) => setCommunicationRating(Number(event.target.value))} />
                <p className="text-sm text-slate-600">Communication score: {communicationRating}/5</p>
              </div>
            ) : null}

            {reviewStep === 1 ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium">Rate quality</label>
                <input type="range" min={1} max={5} value={qualityRating} onChange={(event) => setQualityRating(Number(event.target.value))} />
                <p className="text-sm text-slate-600">Quality score: {qualityRating}/5</p>
              </div>
            ) : null}

            {reviewStep === 2 ? (
              <div className="space-y-3">
                <label className="block text-sm font-medium">Would you recommend this freelancer?</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={wouldRecommend === "yes" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-800"}
                    onClick={() => setWouldRecommend("yes")}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={wouldRecommend === "no" ? "bg-red-600 text-white" : "bg-slate-200 text-slate-800"}
                    onClick={() => setWouldRecommend("no")}
                  >
                    No
                  </button>
                </div>
                <textarea placeholder="Detailed feedback" {...reviewForm.register("comment")} aria-label="Review comment" rows={3} />
              </div>
            ) : null}

            <div className="flex justify-between gap-2">
              <button type="button" className="bg-slate-200 text-slate-800" onClick={() => setReviewStep((prev) => Math.max(0, prev - 1))} disabled={reviewStep === 0}>
                Back
              </button>
              {reviewStep < 2 ? (
                <button type="button" className="bg-blue-600 text-white" onClick={() => setReviewStep((prev) => Math.min(2, prev + 1))}>
                  Next
                </button>
              ) : (
                <button className="bg-blue-600 text-white" type="submit">Submit Review</button>
              )}
            </div>

            {reviewRecap ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <p className="font-semibold">Review submitted successfully</p>
                <p className="mt-1">Overall: {reviewRecap.rating}/5</p>
                <p>Communication: {reviewRecap.communication}/5 • Quality: {reviewRecap.quality}/5</p>
                <p>Recommend: {reviewRecap.recommend === "yes" ? "Yes" : "No"}</p>
                {reviewRecap.comment ? <p className="mt-1 text-emerald-800">"{reviewRecap.comment.split("\n")[0]}"</p> : null}
              </div>
            ) : null}
          </form>
        ) : (
          <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Review is available after escrow is released and project is completed.
          </div>
        )}
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Proposals</h2>
          <div className="flex gap-2">
            <button className="bg-slate-200 text-slate-800" onClick={() => setProposalCompareMode((prev) => !prev)}>
              {proposalCompareMode ? "Hide Compare" : "Compare Proposals"}
            </button>
            <button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => proposals.refetch()}>Refresh</button>
          </div>
        </div>

        {proposalCompareMode && compareRows.length >= 2 ? (
          <div className="mb-3 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">Metric</th>
                  <th className={`px-3 py-2 text-left ${bestValueProposalId === compareRows[0].id ? "bg-emerald-50" : ""}`}>
                    Freelancer #{compareRows[0].freelancer} {bestValueProposalId === compareRows[0].id ? "(Best Value)" : ""}
                  </th>
                  <th className={`px-3 py-2 text-left ${bestValueProposalId === compareRows[1].id ? "bg-emerald-50" : ""}`}>
                    Freelancer #{compareRows[1].freelancer} {bestValueProposalId === compareRows[1].id ? "(Best Value)" : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100">
                  <td className="px-3 py-2">Price</td>
                  <td className="px-3 py-2">{compareRows[0].price} MNT</td>
                  <td className="px-3 py-2">{compareRows[1].price} MNT</td>
                </tr>
                <tr className="border-t border-slate-100">
                  <td className="px-3 py-2">Timeline</td>
                  <td className="px-3 py-2">{compareRows[0].timeline} days</td>
                  <td className="px-3 py-2">{compareRows[1].timeline} days</td>
                </tr>
                <tr className="border-t border-slate-100">
                  <td className="px-3 py-2">Message</td>
                  <td className="px-3 py-2">{compareRows[0].message}</td>
                  <td className="px-3 py-2">{compareRows[1].message}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}

        {!proposalItems.length ? (
          <EmptyState label="No proposals yet." />
        ) : (
          <ul className="space-y-2">
            {proposalItems.map((item) => (
              <li key={item.id} className="rounded border border-slate-200 p-3 text-sm">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold">Freelancer #{item.freelancer}</p>
                  <VerifiedBadge verified={true} />
                </div>
                <div className="mb-2"><RatingStars value={4.7} /></div>
                <CompareTable rows={[{ label: "Price", value: `${item.price} MNT` }, { label: "Timeline", value: `${item.timeline_days} days` }, { label: "Completed projects", value: 12 }]} />
                {proposalCompareMode ? (
                  <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={selectedProposalIds.includes(item.id)}
                      onChange={() => toggleCompareProposal(item.id)}
                    />
                    Select for comparison (up to 2)
                  </label>
                ) : null}
                {isClientOwner && project.status === "open" ? (
                  <button className="mt-2 bg-green-600 text-white" onClick={() => selectMutation.mutate(item.id)}>
                    Select Freelancer
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ProjectChat projectId={id} currentUserId={me.data.id} />

      {me.data.role === "freelancer" && isSelectedFreelancer ? (
        <div className="rounded-md border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="text-lg font-medium">Delivery Actions</h2>
          <input type="file" onChange={(event) => setDeliverableFile(event.target.files?.[0] || null)} />
          <input
            value={checksum}
            onChange={(event) => setChecksum(event.target.value)}
            placeholder="Checksum"
            aria-label="Deliverable checksum"
          />
          <div className="flex gap-2">
            <button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => uploadDeliverableMutation.mutate()}>
              Upload Deliverable
            </button>
            <button className="bg-green-600 text-white" onClick={() => resultMutation.mutate()}>
              Submit Result
            </button>
            <button className="bg-emerald-600 text-white" onClick={() => toast("success", "Milestone marked as delivered")}>Mark Milestone Delivered</button>
          </div>
        </div>
      ) : null}

      <ConfirmationDialog
        open={releaseConfirmOpen}
        title="Release Escrow"
        message="Confirming this will release escrow and complete the project."
        confirmLabel="Release Now"
        confirmTone="success"
        loading={completionMutation.isPending}
        onCancel={() => setReleaseConfirmOpen(false)}
        onConfirm={() => {
          completionMutation.mutate(undefined, {
            onSuccess: () => setReleaseConfirmOpen(false),
            onError: () => setReleaseConfirmOpen(false),
          });
        }}
      />

      <ConfirmationDialog
        open={disputeConfirmOpen}
        title="Open Dispute"
        message="This action escalates the project to admin mediation. Continue?"
        confirmLabel="Open Dispute"
        confirmTone="warning"
        loading={disputeMutation.isPending}
        onCancel={() => setDisputeConfirmOpen(false)}
        onConfirm={() => {
          disputeMutation.mutate(undefined, {
            onSuccess: () => setDisputeConfirmOpen(false),
            onError: () => setDisputeConfirmOpen(false),
          });
        }}
      />
    </section>
  );
}
