"use client";
export const dynamic = "force-dynamic";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { ActionButton, CompareTable, ConfirmationDialog, EscrowStatusBadge, RatingStars, StatusPill, TrustPanel, VerifiedBadge } from "@/components/ui-kit";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import ProjectChat from "@/components/project-chat";
import { projectsApi, toArray } from "@/lib/api/endpoints";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useMe, useMutation, useProjectDetail, useProjectProposals, useQuery } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";
import type { ProposalDto } from "@/lib/api/types";
import { proposalSchema, reviewSchema } from "@/lib/validators";
import { profilesApi } from "@/lib/api/endpoints";

import type { z } from "zod";

type ProposalForm = z.infer<typeof proposalSchema>;
type ReviewForm = z.infer<typeof reviewSchema>;

type EscrowLifecycleState = "created" | "pending_admin" | "held" | "released" | "disputed" | "refunded";

function formatMnt(value: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} ₮`;
}

function resolveFreelancerId(freelancer: unknown): string | number | null {
  if (typeof freelancer === "number" || typeof freelancer === "string") return freelancer;
  if (freelancer && typeof freelancer === "object" && "id" in freelancer) {
    return (freelancer as { id: string | number }).id;
  }
  return null;
}

function resolveFreelancerLabel(freelancer: unknown): string | number {
  return resolveFreelancerId(freelancer) ?? "unknown";
}

function normalizeProjectStatus(status: string): string {
  if (status === "awaiting_review") return "awaiting_client_review";
  return status;
}

function escrowStateFromProjectStatus(status: string): EscrowLifecycleState {
  const normalized = normalizeProjectStatus(status);
  if (normalized === "pending_admin") return "pending_admin";
  if (normalized === "in_progress" || normalized === "awaiting_client_review") return "held";
  if (normalized === "completed") return "released";
  if (normalized === "disputed") return "disputed";
  if (normalized === "refunded") return "refunded";
  return "created";
}

const lifecycleOrder: EscrowLifecycleState[] = ["created", "pending_admin", "held", "released", "disputed", "refunded"];

const lifecycleMeta: Record<EscrowLifecycleState, { title: string; tone: "info" | "warning" | "success" | "danger" | "neutral"; what: string; now: string; actor: string; next: string }> = {
  created: {
    title: "Created",
    tone: "info",
    what: "Escrow үүссэн, төлбөр хүлээгдэж байна.",
    now: "Client invoice төлнө.",
    actor: "Client",
    next: "Төлбөр баталгаажвал Pending admin эсвэл Held шат руу орно.",
  },
  pending_admin: {
    title: "Pending admin",
    tone: "warning",
    what: "Төлбөрийн баталгаажуулалт админ хяналтад байна.",
    now: "Хүлээгээд status шинэчлэлээ шалга.",
    actor: "Admin",
    next: "Баталгаажмагц Held шат руу орно.",
  },
  held: {
    title: "Held",
    tone: "success",
    what: "Мөнгө escrow-д түгжигдсэн, аюулгүй хадгалагдаж байна.",
    now: "Freelancer ажил гүйцэтгэж, Client review хийнэ.",
    actor: "Freelancer + Client",
    next: "Completion баталгаажвал Released, асуудал гарвал Disputed.",
  },
  released: {
    title: "Released",
    tone: "info",
    what: "Escrow амжилттай release хийгдсэн.",
    now: "Project хаагдсан, review үлдээж болно.",
    actor: "System",
    next: "Дууссан төлөв.",
  },
  disputed: {
    title: "Disputed",
    tone: "danger",
    what: "Маргаан нээгдсэн, escrow түр түгжигдсэн.",
    now: "Нотолгоо бүрдүүлж шийдвэр хүлээ.",
    actor: "Admin",
    next: "Шийдвэрээс хамаарч Released эсвэл Refunded.",
  },
  refunded: {
    title: "Refunded",
    tone: "neutral",
    what: "Мөнгө client руу буцаагдсан.",
    now: "Маргаан/цуцлалт хаагдсан.",
    actor: "Admin/System",
    next: "Дууссан төлөв.",
  },
};

function ProposalTrustMeta({ freelancerId, verificationStatus, fallbackVerified }: { freelancerId: string | number | null; verificationStatus?: string; fallbackVerified?: boolean }) {
  const rating = useQuery({
    queryKey: ["rating-summary", freelancerId],
    queryFn: () => projectsApi.ratingSummary(freelancerId as string | number),
    enabled: !!freelancerId,
  });
  const profile = useQuery({
    queryKey: ["profile", freelancerId],
    queryFn: () => profilesApi.get(freelancerId as string | number),
    enabled: !!freelancerId,
  });
  const skills = Array.isArray(profile.data?.skills) ? profile.data.skills.slice(0, 2) : [];

  return (
    <div className="mb-2 rounded-lg border border-surface-200/70 bg-surface-50 px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <VerifiedBadge status={verificationStatus} verified={fallbackVerified} />
        {rating.data?.total ? (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-surface-600">
            <RatingStars value={rating.data.average} />
            <span>{rating.data.total} reviews</span>
          </span>
        ) : (
          <span className="text-[11px] text-surface-400">No reviews yet</span>
        )}
        {skills.length ? <span className="text-[11px] text-surface-600">Skills: {skills.join(", ")}</span> : null}
        {rating.data?.total ? <span className="text-[11px] text-surface-600">Completed: {rating.data.total}</span> : null}
      </div>
      {profile.data?.bio ? <p className="mt-1 line-clamp-1 text-[11px] text-surface-500">{profile.data.bio}</p> : null}
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const toast = useToastStore((s) => s.push);
  const me = useMe();

  const detail = useProjectDetail(id);
  const canReadProposals = me.data?.role === "admin" || (typeof detail.data?.owner === "number" && me.data?.id === detail.data.owner);
  const proposals = useProjectProposals(id, { enabled: Boolean(id && canReadProposals) });

  const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
  const [deliverableUploadProgress, setDeliverableUploadProgress] = useState(0);
  const [checksum, setChecksum] = useState("");
  const [releaseConfirmOpen, setReleaseConfirmOpen] = useState(false);
  const [disputeConfirmOpen, setDisputeConfirmOpen] = useState(false);
  const [selectConfirmProposalId, setSelectConfirmProposalId] = useState<number | null>(null);
  const [submitResultConfirmOpen, setSubmitResultConfirmOpen] = useState(false);
  const [proposalCompareMode, setProposalCompareMode] = useState(false);
  const [selectedProposalIds, setSelectedProposalIds] = useState<number[]>([]);
  const [reviewStep, setReviewStep] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [wouldRecommend, setWouldRecommend] = useState<"yes" | "no">("yes");
  const [reviewRecap, setReviewRecap] = useState<null | { rating: number; communication: number; quality: number; recommend: "yes" | "no"; comment: string }>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState("");
  const [openLifecycle, setOpenLifecycle] = useState<EscrowLifecycleState | null>(null);

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
    mutationFn: () => projectsApi.createDispute(id, { reason: disputeEvidence.trim() ? `${disputeReason}\nEvidence: ${disputeEvidence}` : disputeReason }),
    onSuccess: () => {
      detail.refetch();
      setDisputeReason("");
      setDisputeEvidence("");
      toast("warning", "Dispute submitted");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const uploadDeliverableMutation = useMutation({
    mutationFn: async () => {
      if (!deliverableFile) throw new Error("Select a file first");
      if (!checksum.trim()) throw new Error("Checksum is required");
      const upload = await projectsApi.uploadMessageFile(id, deliverableFile, setDeliverableUploadProgress);
      await projectsApi.uploadDeliverable(id, { file_id: String(upload.file_id), checksum: checksum.trim() });
      const fileData = JSON.stringify({ name: upload.name || deliverableFile.name, url: upload.url });
      await projectsApi.sendMessage(id, fileData, "file");
      await projectsApi.sendMessage(id, "I have submitted a deliverable for your review.");
    },
    onSuccess: () => {
      setDeliverableUploadProgress(0);
      toast("success", "Deliverable uploaded");
    },
    onError: (error: any) => {
      setDeliverableUploadProgress(0);
      toast("error", "Deliverable upload failed", extractApiErrorMessage(error, "Upload failed. Please try again."));
    },
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
  const status = normalizeProjectStatus(project.status);
  const escrowState = escrowStateFromProjectStatus(status);
  const proposalItems = proposals.data ? toArray<ProposalDto>(proposals.data) : [];
  const selectedProposal = proposalItems.find((item) => item.id === selectConfirmProposalId) || null;

  const compareRows = proposalItems
    .filter((item) => selectedProposalIds.includes(item.id))
    .slice(0, 2)
    .map((item) => ({ id: item.id, freelancer: item.freelancer, price: Number(item.price || 0), timeline: Number(item.timeline_days || 0), message: item.message || "-" }));

  const proposalPrices = proposalItems.map((item) => Number(item.price || 0)).sort((a, b) => a - b);
  const proposalTimelines = proposalItems.map((item) => Number(item.timeline_days || 0)).sort((a, b) => a - b);
  const medianPrice = proposalPrices.length ? proposalPrices[Math.floor(proposalPrices.length / 2)] : 0;
  const medianTimeline = proposalTimelines.length ? proposalTimelines[Math.floor(proposalTimelines.length / 2)] : 0;

  const bestProposalId = proposalItems.length
    ? [...proposalItems]
        .sort((a, b) => Number(a.price || 0) + Number(a.timeline_days || 0) * 10000 - (Number(b.price || 0) + Number(b.timeline_days || 0) * 10000))[0]?.id
    : null;

  const bestValueProposalId =
    compareRows.length < 2
      ? null
      : compareRows[0].price / Math.max(1, compareRows[0].timeline) <= compareRows[1].price / Math.max(1, compareRows[1].timeline)
        ? compareRows[0].id
        : compareRows[1].id;

  const isClientOwner = me.data.id === project.owner;
  const canFreelancerPropose = me.data.role === "freelancer" && status === "open" && me.data.is_verified;
  const needsVerification = me.data.role === "freelancer" && status === "open" && !me.data.is_verified;
  const isSelectedFreelancer = proposalItems.some((item) => item.id === project.selected_proposal && resolveFreelancerId(item.freelancer) === me.data?.id);
  const canRelease = status === "awaiting_client_review";
  const canDispute = ["in_progress", "awaiting_client_review"].includes(status);
  const activeLifecycle = openLifecycle || escrowState;

  const toggleCompareProposal = (proposalId: number) => {
    setSelectedProposalIds((prev) => {
      if (prev.includes(proposalId)) return prev.filter((idValue) => idValue !== proposalId);
      if (prev.length >= 2) return [prev[1], proposalId];
      return [...prev, proposalId];
    });
  };

  return (
    <section className="space-y-6 pb-20">
      <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
        <h1 className="text-2xl font-semibold text-surface-900">{project.title}</h1>
        <p className="mt-2 text-[13px] text-surface-600">{project.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusPill label={`Status: ${status}`} tone="info" />
          <EscrowStatusBadge status={escrowState} />
          <span className="text-[12px] text-surface-600">Төсөв: {formatMnt(Number(project.budget || 0))}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-[#d8e3ee] bg-[#f8fbff] p-4">
        <h2 className="text-lg font-semibold text-[#18324b]">Escrow Lifecycle</h2>
        <p className="mt-1 text-[12px] text-[#4c6480]">Төлөв бүр дээр юу болсон, хэн юу хийхийг ил тод харуулна.</p>
        <div className="mt-3 space-y-2 md:grid md:grid-cols-2 md:gap-2 lg:grid-cols-3">
          {lifecycleOrder.map((item) => {
            const meta = lifecycleMeta[item];
            const active = item === escrowState;
            const expanded = item === activeLifecycle;
            return (
              <div key={item} className={`rounded-xl border p-3 ${active ? "border-brand-500 bg-brand-50" : "border-surface-200 bg-white"}`}>
                <div className="mb-2 flex items-center justify-between">
                  <button type="button" className="text-left text-[13px] font-semibold text-surface-900 md:cursor-default" onClick={() => setOpenLifecycle(item)}>
                    {meta.title}
                  </button>
                  <StatusPill label={active ? "Current" : "State"} tone={active ? meta.tone : "neutral"} />
                </div>
                <ul className={`space-y-1 text-[12px] text-surface-700 ${expanded ? "block" : "hidden md:block"}`}>
                  <li><strong>Юу болсон:</strong> {meta.what}</li>
                  <li><strong>Одоо юу хийх:</strong> {meta.now}</li>
                  <li><strong>Хэн хийх:</strong> {meta.actor}</li>
                  <li><strong>Дараагийн алхам:</strong> {meta.next}</li>
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {escrowState === "held" ? <TrustPanel /> : null}

      {isClientOwner ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {status === "open" ? (
            <ActionButton className="min-h-11 rounded-xl px-4 text-[13px] font-semibold" onClick={() => router.push(`/projects/${id}/edit`)}>
              Edit Project
            </ActionButton>
          ) : null}
          <ActionButton className="min-h-11 rounded-xl px-4 text-[13px] font-semibold" onClick={() => router.push(`/projects/${id}/payment`)}>
            Open Payment Page
          </ActionButton>
          <ActionButton className="min-h-11 rounded-xl px-4 text-[13px] font-semibold" tone="success" onClick={() => setReleaseConfirmOpen(true)} disabled={!canRelease}>
            Release Escrow
          </ActionButton>
          <ActionButton className="min-h-11 rounded-xl px-4 text-[13px] font-semibold" tone="warning" onClick={() => setDisputeConfirmOpen(true)} disabled={!canDispute || !disputeReason.trim()}>
            Open Dispute
          </ActionButton>
        </div>
      ) : null}

      {isClientOwner && canDispute ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px]">
          <p className="font-semibold text-amber-900">Dispute мэдээлэл</p>
          <p className="mt-1 text-amber-800">Шалтгаанаа тодорхой бичээд нотолгооны линк/тайлбараа нэм. Энэ үед release action хаагдана.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Scope зөрсөн", "Хугацаа хэтэрсэн", "Чанарын асуудал", "Communication issue"].map((chip) => (
              <button
                key={chip}
                type="button"
                className={`min-h-11 rounded-lg px-3 text-[12px] font-semibold ${disputeReason === chip ? "bg-amber-600 text-white" : "bg-white text-amber-900"}`}
                onClick={() => setDisputeReason(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
          <textarea className="mt-2 w-full" rows={2} value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="Маргааны шалтгаан" />
          <textarea className="mt-2 w-full" rows={2} value={disputeEvidence} onChange={(e) => setDisputeEvidence(e.target.value)} placeholder="Нотолгоо (линк/тайлбар)" />
          <div className="mt-2">
            <a href="/support" className="text-[12px] font-semibold text-amber-900 underline">Support-т хандах</a>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {canFreelancerPropose ? (
          <form className="space-y-3 rounded-xl border border-surface-200/60 bg-white p-4" onSubmit={proposalForm.handleSubmit((v) => proposalMutation.mutate(v))}>
            <h2 className="text-lg font-medium text-surface-900">Submit Proposal</h2>
            <input type="number" {...proposalForm.register("price", { valueAsNumber: true })} aria-label="Proposal price" />
            <input type="number" {...proposalForm.register("timeline_days", { valueAsNumber: true })} aria-label="Proposal timeline" />
            <textarea placeholder="Message" {...proposalForm.register("message")} aria-label="Proposal message" rows={3} />
            <ActionButton className="min-h-11 rounded-xl px-4 text-[13px] font-semibold" type="submit" loading={proposalMutation.isPending}>Send Proposal</ActionButton>
          </form>
        ) : needsVerification ? (
          <div className="rounded-xl border border-amber-200/60 bg-amber-50 p-4 text-[13px] text-amber-800">
            <strong>Verification Required:</strong> You must be verified to submit proposals. Please go to your dashboard to complete your profile verification.
          </div>
        ) : (
          <div className="rounded-xl border border-surface-200/60 bg-white p-4 text-[13px] text-surface-500">Proposal submission is available for freelancers on open projects.</div>
        )}

        {status === "completed" ? (
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
              <span className="text-[11px] text-surface-500">Step {reviewStep + 1} / 3</span>
            </div>
            {reviewStep === 0 ? (
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-surface-700">Rate communication</label>
                <input type="range" min={1} max={5} value={communicationRating} onChange={(event) => setCommunicationRating(Number(event.target.value))} />
                <p className="text-[13px] text-surface-600">Communication score: {communicationRating}/5</p>
              </div>
            ) : null}
            {reviewStep === 1 ? (
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-surface-700">Rate quality</label>
                <input type="range" min={1} max={5} value={qualityRating} onChange={(event) => setQualityRating(Number(event.target.value))} />
                <p className="text-[13px] text-surface-600">Quality score: {qualityRating}/5</p>
              </div>
            ) : null}
            {reviewStep === 2 ? (
              <div className="space-y-3">
                <label className="block text-[13px] font-medium text-surface-700">Would you recommend this freelancer?</label>
                <div className="flex gap-2">
                  <button type="button" className={wouldRecommend === "yes" ? "bg-emerald-600 text-white" : "bg-surface-100 text-surface-700"} onClick={() => setWouldRecommend("yes")}>Yes</button>
                  <button type="button" className={wouldRecommend === "no" ? "bg-red-600 text-white" : "bg-surface-100 text-surface-700"} onClick={() => setWouldRecommend("no")}>No</button>
                </div>
                <textarea placeholder="Detailed feedback" {...reviewForm.register("comment")} aria-label="Review comment" rows={3} />
              </div>
            ) : null}
            <div className="flex justify-between gap-2">
              <button type="button" className="bg-surface-100 text-surface-700" onClick={() => setReviewStep((prev) => Math.max(0, prev - 1))} disabled={reviewStep === 0}>Back</button>
              {reviewStep < 2 ? (
                <button type="button" className="bg-brand-600 text-white" onClick={() => setReviewStep((prev) => Math.min(2, prev + 1))}>Next</button>
              ) : (
                <button className="bg-blue-600 text-white" type="submit">Submit Review</button>
              )}
            </div>
            {reviewRecap ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <p className="font-semibold">Review submitted successfully</p>
                <p className="mt-1">Overall: {reviewRecap.rating}/5</p>
              </div>
            ) : null}
          </form>
        ) : (
          <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">Review is available after escrow is released and project is completed.</div>
        )}
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Proposals</h2>
          <div className="flex gap-2">
            <button className="bg-slate-200 text-slate-800" onClick={() => setProposalCompareMode((prev) => !prev)}>{proposalCompareMode ? "Hide Compare" : "Compare Proposals"}</button>
            {canReadProposals ? <button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => proposals.refetch()}>Refresh</button> : null}
          </div>
        </div>

        {!canReadProposals ? <div className="rounded-xl border border-surface-200/60 bg-surface-50 p-4 text-[13px] text-surface-600">Proposal list is visible to the project owner and admins.</div> : null}

        {canReadProposals && proposalCompareMode && compareRows.length >= 2 ? (
          <div className="mb-3 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">Metric</th>
                  <th className={`px-3 py-2 text-left ${bestValueProposalId === compareRows[0].id ? "bg-emerald-50" : ""}`}>Freelancer #{resolveFreelancerLabel(compareRows[0].freelancer)} {bestValueProposalId === compareRows[0].id ? "(Best Value)" : ""}</th>
                  <th className={`px-3 py-2 text-left ${bestValueProposalId === compareRows[1].id ? "bg-emerald-50" : ""}`}>Freelancer #{resolveFreelancerLabel(compareRows[1].freelancer)} {bestValueProposalId === compareRows[1].id ? "(Best Value)" : ""}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100"><td className="px-3 py-2">Price</td><td className="px-3 py-2">{formatMnt(compareRows[0].price)}</td><td className="px-3 py-2">{formatMnt(compareRows[1].price)}</td></tr>
                <tr className="border-t border-slate-100"><td className="px-3 py-2">Timeline</td><td className="px-3 py-2">{compareRows[0].timeline} days</td><td className="px-3 py-2">{compareRows[1].timeline} days</td></tr>
                <tr className="border-t border-slate-100"><td className="px-3 py-2">Message</td><td className="px-3 py-2">{compareRows[0].message}</td><td className="px-3 py-2">{compareRows[1].message}</td></tr>
              </tbody>
            </table>
          </div>
        ) : null}

        {canReadProposals && !proposalItems.length ? (
          <EmptyState label="No proposals yet." />
        ) : canReadProposals ? (
          <ul className="space-y-2">
            {proposalItems.map((item) => {
              const price = Number(item.price || 0);
              const timeline = Number(item.timeline_days || 0);
              const lowPriceRisk = medianPrice > 0 && price < medianPrice * 0.6;
              const longTimelineRisk = medianTimeline > 0 && timeline > medianTimeline * 1.7;
              return (
                <li key={item.id} className="rounded border border-slate-200 p-3 text-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold">Freelancer #{resolveFreelancerLabel(item.freelancer)}</p>
                    {bestProposalId === item.id ? <StatusPill label="Best value" tone="success" /> : null}
                  </div>
                  <ProposalTrustMeta freelancerId={resolveFreelancerId(item.freelancer)} verificationStatus={item.freelancer_verification_status} fallbackVerified={item.freelancer_is_verified} />
                  <CompareTable rows={[{ label: "Price", value: formatMnt(price) }, { label: "Timeline", value: `${timeline} days` }]} />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {lowPriceRisk ? <StatusPill label="Risk: price too low" tone="warning" /> : null}
                    {longTimelineRisk ? <StatusPill label="Risk: long timeline" tone="warning" /> : null}
                  </div>
                  {proposalCompareMode ? (
                    <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                      <input type="checkbox" checked={selectedProposalIds.includes(item.id)} onChange={() => toggleCompareProposal(item.id)} />
                      Select for comparison (up to 2)
                    </label>
                  ) : null}
                  {isClientOwner && status === "open" ? (
                    <ActionButton className="mt-2 min-h-11 rounded-xl px-4 text-[13px] font-semibold" onClick={() => setSelectConfirmProposalId(item.id)} disabled={selectMutation.isPending}>
                      Select Freelancer
                    </ActionButton>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <ProjectChat projectId={id} currentUserId={me.data.id} />

      {me.data.role === "freelancer" && isSelectedFreelancer && ["in_progress", "awaiting_client_review"].includes(status) ? (
        <div className="rounded-md border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="text-lg font-medium">Delivery Actions</h2>
          <input type="file" onChange={(event) => setDeliverableFile(event.target.files?.[0] || null)} disabled={status !== "in_progress"} />
          <input value={checksum} onChange={(event) => setChecksum(event.target.value)} placeholder="Checksum" aria-label="Deliverable checksum" disabled={status !== "in_progress"} />
          <div className="flex gap-2">
            <ActionButton className="min-h-11 rounded-xl px-4 text-[13px] font-semibold" onClick={() => uploadDeliverableMutation.mutate()} disabled={status !== "in_progress"} loading={uploadDeliverableMutation.isPending}>Upload Deliverable</ActionButton>
            <ActionButton className="min-h-11 rounded-xl px-4 text-[13px] font-semibold" tone="success" onClick={() => setSubmitResultConfirmOpen(true)} disabled={status !== "in_progress"}>Submit Result</ActionButton>
          </div>
          {uploadDeliverableMutation.isPending ? (
            <div className="rounded-lg bg-surface-50 px-3 py-2">
              <div className="mb-1 flex items-center justify-between text-[11px] text-surface-500"><span>Uploading deliverable...</span><span>{deliverableUploadProgress}%</span></div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-200"><div className="h-full bg-brand-600 transition-all" style={{ width: `${deliverableUploadProgress}%` }} /></div>
            </div>
          ) : null}
        </div>
      ) : null}

      <ConfirmationDialog
        open={selectConfirmProposalId !== null}
        title="Freelancer сонгохыг баталгаажуулах"
        message={selectedProposal ? `${resolveFreelancerLabel(selectedProposal.freelancer)}-г сонговол төслийн гол ажил эхэлж, escrow урсгал идэвхжинэ. Үнэ: ${formatMnt(Number(selectedProposal.price || 0))}, хугацаа: ${selectedProposal.timeline_days} өдөр.` : "Сонголтоо баталгаажуулна уу."}
        confirmLabel="Тийм, сонгоё"
        confirmTone="primary"
        loading={selectMutation.isPending}
        onCancel={() => setSelectConfirmProposalId(null)}
        onConfirm={() => {
          if (selectConfirmProposalId !== null) {
            selectMutation.mutate(selectConfirmProposalId, {
              onSettled: () => setSelectConfirmProposalId(null),
            });
          }
        }}
      />

      <ConfirmationDialog
        open={releaseConfirmOpen}
        title="Release Escrow"
        message={`Энэ үйлдлээр ${formatMnt(Number(project.budget || 0))} escrow freelancer руу шилжинэ. Буцаах боломжгүй тул deliverable бүрэн шалгана уу.`}
        confirmLabel="Release Now"
        confirmTone="success"
        loading={completionMutation.isPending}
        onCancel={() => setReleaseConfirmOpen(false)}
        onConfirm={() => {
          completionMutation.mutate(undefined, {
            onSettled: () => setReleaseConfirmOpen(false),
          });
        }}
      />

      <ConfirmationDialog
        open={disputeConfirmOpen}
        title="Open Dispute"
        message="Маргаан нээгдмэгц release action хаагдаж admin mediation эхэлнэ. Шалтгаан, нотолгоо зөв эсэхийг шалгаад үргэлжлүүлнэ үү."
        confirmLabel="Open Dispute"
        confirmTone="warning"
        loading={disputeMutation.isPending}
        onCancel={() => setDisputeConfirmOpen(false)}
        onConfirm={() => {
          disputeMutation.mutate(undefined, {
            onSettled: () => setDisputeConfirmOpen(false),
          });
        }}
      />

      <ConfirmationDialog
        open={submitResultConfirmOpen}
        title="Submit Result"
        message="Үр дүн илгээснээр төсөл client review шат руу орно. Файлаа оруулж, checksum-аа баталгаажуулсан эсэхээ шалга."
        confirmLabel="Submit"
        confirmTone="success"
        loading={resultMutation.isPending}
        onCancel={() => setSubmitResultConfirmOpen(false)}
        onConfirm={() => {
          resultMutation.mutate(undefined, {
            onSettled: () => setSubmitResultConfirmOpen(false),
          });
        }}
      />
    </section>
  );
}
