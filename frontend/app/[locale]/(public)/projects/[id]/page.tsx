"use client";
export const dynamic = "force-dynamic";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";

import { ActionButton, ConfirmationDialog, EscrowStatusBadge, RatingStars, StatusPill, VerifiedBadge } from "@/components/ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import ProjectChat from "@/components/features/projects/project-chat";
import { projectsApi, toArray } from "@/lib/api/endpoints";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useMe, useMutation, useProjectDetail, useProjectProposals, useQuery } from "@/lib/hooks";
import { useToastStore } from "@/lib/stores/toast-store";
import type { ProposalDto } from "@/lib/api/types";
import { proposalSchema, reviewSchema } from "@/lib/validators";
import { profilesApi } from "@/lib/api/endpoints";
import type { z } from "zod";

type ProposalForm = z.infer<typeof proposalSchema>;
type ReviewForm = z.infer<typeof reviewSchema>;
type EscrowLifecycleState = "created" | "pending_admin" | "held" | "released" | "disputed" | "refunded";

function formatMnt(value: number): string {
  return `₮${new Intl.NumberFormat("mn-MN").format(value)}`;
}
function resolveFreelancerId(freelancer: unknown): string | number | null {
  if (typeof freelancer === "number" || typeof freelancer === "string") return freelancer;
  if (freelancer && typeof freelancer === "object" && "id" in freelancer) return (freelancer as { id: string | number }).id;
  return null;
}
function normalizeProjectStatus(status: string): string {
  if (status === "awaiting_review") return "awaiting_client_review";
  return status;
}
function escrowStateFromProjectStatus(status: string): EscrowLifecycleState {
  const s = normalizeProjectStatus(status);
  if (s === "pending_admin") return "pending_admin";
  if (s === "in_progress" || s === "awaiting_client_review") return "held";
  if (s === "completed") return "released";
  if (s === "disputed") return "disputed";
  if (s === "refunded") return "refunded";
  return "created";
}
function normalizeSkills(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((i) => String(i || "").trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((i) => i.trim()).filter(Boolean);
  return [];
}
function statusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function CopyShareUrl({ projectId }: { projectId: string | number }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/projects/${projectId}` : `itzuun.mn/projects/${projectId}`;
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-surface-container-low p-2">
      <span className="flex-1 truncate px-3 text-[12px] font-medium text-surface-400">{url}</span>
      <button
        type="button"
        onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-lowest shadow-sm transition-all hover:shadow-ambient"
      >
        {copied
          ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-secondary"><path d="M20 6 9 17l-5-5" /></svg>
          : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-surface-400"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>}
      </button>
    </div>
  );
}

function ProposalTrustMeta({ freelancerId, verificationStatus, fallbackVerified }: { freelancerId: string | number | null; verificationStatus?: string; fallbackVerified?: boolean }) {
  const rating = useQuery({ queryKey: ["rating-summary", freelancerId], queryFn: () => projectsApi.ratingSummary(freelancerId as string | number), enabled: !!freelancerId });
  const profile = useQuery({ queryKey: ["profile", freelancerId], queryFn: () => profilesApi.get(freelancerId as string | number), enabled: !!freelancerId });
  const skills = Array.isArray(profile.data?.skills) ? profile.data.skills.slice(0, 3) : [];
  return (
    <div className="rounded-2xl bg-surface-container-low p-4">
      <div className="flex flex-wrap items-center gap-3">
        <VerifiedBadge status={verificationStatus} verified={fallbackVerified} />
        {rating.data?.total
          ? <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-surface-600"><RatingStars value={rating.data.average} />{rating.data.total} reviews</span>
          : <span className="text-[11px] text-surface-400">Одоогоор review байхгүй</span>}
      </div>
      {skills.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{skills.map((s: string) => <span key={s} className="rounded-xl bg-surface-container-lowest px-3 py-1 text-[11px] font-bold text-surface-400 font-headline">{s}</span>)}</div>}
      {profile.data?.bio && <p className="mt-2 line-clamp-2 text-[12px] text-surface-500">{profile.data.bio}</p>}
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const id = params.id;
  const toast = useToastStore((s) => s.push);
  const me = useMe();

  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

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
  const [selectedProposalIds, setSelectedProposalIds] = useState<number[]>([]);
  const [reviewStep, setReviewStep] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [wouldRecommend, setWouldRecommend] = useState<"yes" | "no">("yes");
  const [reviewRecap, setReviewRecap] = useState<null | { rating: number; communication: number; quality: number; recommend: "yes" | "no"; comment: string }>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState("");
  const [proposalsOpen, setProposalsOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  const proposalForm = useForm<ProposalForm>({ resolver: zodResolver(proposalSchema), defaultValues: { price: 1000000, timeline_days: 14, message: "" } });
  const reviewForm = useForm<ReviewForm>({ resolver: zodResolver(reviewSchema), defaultValues: { rating: 5, comment: "" } });

  const proposalMutation = useMutation({ mutationFn: (v: ProposalForm) => projectsApi.submitProposal(id, v), onSuccess: () => { proposals.refetch(); toast("success", "Proposal илгээгдлээ"); }, onError: (e: Error) => toast("error", e.message) });
  const selectMutation = useMutation({ mutationFn: (pid: number) => projectsApi.selectFreelancer(id, pid), onSuccess: () => { detail.refetch(); proposals.refetch(); toast("success", "Freelancer сонгогдлоо"); }, onError: (e: Error) => toast("error", e.message) });
  const completionMutation = useMutation({ mutationFn: () => projectsApi.confirmCompletion(id), onSuccess: () => { detail.refetch(); toast("success", "Escrow released, төсөл дууслаа"); }, onError: (e: Error) => toast("error", e.message) });
  const disputeMutation = useMutation({ mutationFn: () => projectsApi.createDispute(id, { reason: disputeEvidence.trim() ? `${disputeReason}\nEvidence: ${disputeEvidence}` : disputeReason }), onSuccess: () => { detail.refetch(); setDisputeReason(""); setDisputeEvidence(""); toast("warning", "Маргаан нээгдлээ"); }, onError: (e: Error) => toast("error", e.message) });
  const uploadDeliverableMutation = useMutation({
    mutationFn: async () => {
      if (!deliverableFile) throw new Error("Файл сонго");
      if (!checksum.trim()) throw new Error("Checksum оруул");
      const upload = await projectsApi.uploadMessageFile(id, deliverableFile, setDeliverableUploadProgress);
      await projectsApi.uploadDeliverable(id, { file_id: String(upload.file_id), checksum: checksum.trim() });
      const fileData = JSON.stringify({ name: upload.name || deliverableFile.name, url: upload.url });
      await projectsApi.sendMessage(id, fileData, "file");
      await projectsApi.sendMessage(id, "Deliverable илгээлээ. Шалгаад баталгаажуулна уу.");
    },
    onSuccess: () => { setDeliverableUploadProgress(0); toast("success", "Deliverable uploaded"); },
    onError: (e: any) => { setDeliverableUploadProgress(0); toast("error", "Upload failed", extractApiErrorMessage(e, "Дахин оролдоно уу")); },
  });
  const resultMutation = useMutation({ mutationFn: () => projectsApi.submitResult(id, { note: "Work submitted" }), onSuccess: () => { detail.refetch(); toast("success", "Үр дүн илгээгдлээ"); }, onError: (e: Error) => toast("error", e.message) });
  const reviewMutation = useMutation({
    mutationFn: (v: ReviewForm) => projectsApi.review(id, v),
    onSuccess: (_data, variables) => { setReviewRecap({ rating: variables.rating, communication: communicationRating, quality: qualityRating, recommend: wouldRecommend, comment: variables.comment || "" }); toast("success", "Review илгээгдлээ"); },
    onError: (e: Error) => toast("error", e.message),
  });

  if (detail.isLoading || me.isLoading) return <LoadingState label="Төслийн мэдээлэл ачааллаж байна..." />;
  if (detail.isError || !detail.data) return <ErrorState label="Төсөл олдсонгүй." />;
  if (!me.data) return <ErrorState label="Нэвтэрч орно уу." />;

  const project = detail.data;
  const status = normalizeProjectStatus(project.status);
  const escrowState = escrowStateFromProjectStatus(status);
  const proposalItems = proposals.data ? toArray<ProposalDto>(proposals.data) : [];
  const selectedProposal = proposalItems.find((item) => item.id === selectConfirmProposalId) || null;

  const isClientOwner = me.data.id === project.owner;
  const canFreelancerPropose = me.data.role === "freelancer" && status === "open" && me.data.is_verified;
  const needsVerification = me.data.role === "freelancer" && status === "open" && !me.data.is_verified;
  const isSelectedFreelancer = proposalItems.some((item) => item.id === project.selected_proposal && resolveFreelancerId(item.freelancer) === me.data?.id);
  const canRelease = status === "awaiting_client_review";
  const canDispute = ["in_progress", "awaiting_client_review"].includes(status);
  const skills = normalizeSkills(project.required_skills);

  const budget = Number(project.budget || 0);
  const milestones = [
    { num: "01", title: "Загварчлал & Архитектур", desc: "Систем болон UI/UX дизайны суурь тавих", amount: Math.round(budget * 0.24), badge: escrowState === "held" || escrowState === "released" ? "FUNDING READY" : null },
    { num: "02", title: "Гол хөгжүүлэлт", desc: "Үндсэн функцуудыг хөгжүүлж дуусгах", amount: Math.round(budget * 0.50), badge: null },
    { num: "03", title: "Тест & Нэвтрүүлэлт", desc: "Тест болон зах зээлд нэвтрэх", amount: Math.round(budget * 0.26), badge: null },
  ];

  return (
    <section className="space-y-12 pb-24">
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start xl:gap-14">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-10 min-w-0">

          {/* Header */}
          <div>
            {project.category_obj && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-secondary-fixed px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-secondary font-headline">
                {project.category_obj.name_mn || project.category_obj.name_en || project.category_obj.name}
              </span>
            )}
            <h1 className="mt-5 max-w-[18ch] font-headline text-[40px] font-black leading-[0.95] tracking-tighter text-primary md:text-[56px]">
              {project.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-[13px] font-medium text-surface-400">
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                Posted recently
              </span>
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                Ulaanbaatar, MN
              </span>
              <StatusPill label={statusLabel(status)} tone={status === "open" ? "success" : status === "completed" ? "info" : "warning"} />
            </div>
          </div>

          {/* Description */}
          <div className="rounded-[2.5rem] bg-surface-container-low p-8 md:p-10">
            <h2 className="font-headline text-[13px] font-black uppercase tracking-[0.2em] text-surface-400">Төслийн танилцуулга</h2>
            <p className="mt-6 text-[16px] font-medium leading-[1.8] text-surface-600 whitespace-pre-line">{project.description}</p>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h2 className="font-headline text-[13px] font-black uppercase tracking-[0.2em] text-surface-400">Шаардлагатай үр чадварууд</h2>
              <div className="mt-5 flex flex-wrap gap-3">
                {skills.map((s) => (
                  <span key={s} className="rounded-2xl bg-surface-container-lowest px-5 py-2.5 text-[13px] font-black text-primary shadow-sm font-headline">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Milestones */}
          <div>
            <h2 className="font-headline text-[28px] font-black tracking-tighter text-primary">Төлөвлөсөн үе шатууд</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {milestones.map((m) => (
                <div key={m.num} className="relative rounded-[2.5rem] bg-surface-container-lowest p-8 shadow-sm transition-all hover:shadow-ambient">
                  {m.badge && (
                    <span className="absolute right-6 top-6 rounded-xl bg-secondary-fixed px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-secondary font-headline">{m.badge}</span>
                  )}
                  <span className="font-headline text-[42px] font-black leading-none tracking-tighter text-surface-200">{m.num}</span>
                  <h3 className="mt-6 font-headline text-[20px] font-black tracking-tight text-primary">{m.title}</h3>
                  <p className="mt-3 text-[14px] font-medium leading-relaxed text-surface-400">{m.desc}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="font-headline text-[22px] font-black text-secondary">{formatMnt(m.amount)}</span>
                    <div className="h-[2px] flex-1 rounded-full bg-secondary/20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Proposal Form (Freelancer) */}
          {canFreelancerPropose && (
            <div className="rounded-[2.5rem] bg-surface-container-low p-8 md:p-10">
              <h2 className="font-headline text-[24px] font-black tracking-tighter text-primary">Санал илгээх</h2>
              <form className="mt-8 space-y-5" onSubmit={proposalForm.handleSubmit((v) => proposalMutation.mutate(v))}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 font-headline">Үнэ (₮)</label>
                    <input type="number" {...proposalForm.register("price", { valueAsNumber: true })} className="w-full rounded-2xl bg-surface-container-lowest px-5 py-4 text-[15px] font-bold text-primary outline-none shadow-sm focus:shadow-ambient" />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 font-headline">Хугацаа (өдөр)</label>
                    <input type="number" {...proposalForm.register("timeline_days", { valueAsNumber: true })} className="w-full rounded-2xl bg-surface-container-lowest px-5 py-4 text-[15px] font-bold text-primary outline-none shadow-sm focus:shadow-ambient" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 font-headline">Захидал / Мессеж</label>
                  <textarea rows={4} {...proposalForm.register("message")} placeholder="Яагаад та энэ төслийг хийх чадвартай вэ?" className="w-full rounded-2xl bg-surface-container-lowest px-5 py-4 text-[15px] font-medium text-primary outline-none shadow-sm focus:shadow-ambient resize-none" />
                </div>
                <ActionButton className="w-full rounded-2xl py-4 text-[11px] font-black uppercase tracking-[0.2em] font-headline" type="submit" loading={proposalMutation.isPending}>
                  Санал илгээх →
                </ActionButton>
              </form>
            </div>
          )}
          {needsVerification && (
            <div className="rounded-[2.5rem] bg-yellow-50 p-8 border border-yellow-100">
              <p className="font-headline text-[16px] font-black text-yellow-800">Баталгаажуулалт шаардлагатай</p>
              <p className="mt-3 text-[14px] font-medium leading-relaxed text-yellow-700">Санал илгээхийн тулд эхлээд профайлаа баталгаажуулна уу.</p>
              <Link href={withLocale("/freelancer/profile")} className="mt-6 inline-flex rounded-2xl bg-yellow-800 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white font-headline">
                Профайл руу очих →
              </Link>
            </div>
          )}

          {/* Proposals Panel (Client/Admin) */}
          {canReadProposals && (
            <div className="space-y-6">
              <button type="button" onClick={() => setProposalsOpen((v) => !v)} className="flex w-full items-center justify-between rounded-[2.5rem] bg-surface-container-low px-8 py-6">
                <span className="font-headline text-[24px] font-black tracking-tighter text-primary">Саналууд ({proposalItems.length})</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`h-5 w-5 text-surface-400 transition-transform ${proposalsOpen ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {proposalsOpen && (
                !proposalItems.length ? <EmptyState label="Одоогоор санал байхгүй." /> : (
                  <ul className="space-y-4">
                    {proposalItems.map((item) => {
                      const price = Number(item.price || 0);
                      const fId = resolveFreelancerId(item.freelancer);
                      return (
                        <li key={item.id} className="rounded-[2.5rem] bg-surface-container-lowest p-8 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="font-headline text-[18px] font-black text-primary">Freelancer #{fId}</p>
                              <div className="mt-2 flex items-center gap-4 text-[14px] font-bold text-secondary font-headline">
                                <span>{formatMnt(price)}</span>
                                <span className="text-surface-400 font-medium">{item.timeline_days} өдөр</span>
                              </div>
                            </div>
                            {isClientOwner && status === "open" && (
                              <ActionButton className="rounded-2xl py-3 px-6 text-[11px] font-black uppercase tracking-widest font-headline" onClick={() => setSelectConfirmProposalId(item.id)} disabled={selectMutation.isPending}>
                                Сонгох
                              </ActionButton>
                            )}
                          </div>
                          {item.message && <p className="mt-5 text-[14px] font-medium leading-relaxed text-surface-500">{item.message}</p>}
                          <div className="mt-5">
                            <ProposalTrustMeta freelancerId={fId} verificationStatus={item.freelancer_verification_status} fallbackVerified={item.freelancer_is_verified} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )
              )}
            </div>
          )}

          {/* Dispute Panel */}
          {isClientOwner && canDispute && (
            <div className="rounded-[2.5rem] bg-yellow-50 p-8 border border-yellow-100">
              <h2 className="font-headline text-[20px] font-black text-yellow-800">Маргаан нээх</h2>
              <p className="mt-3 text-[14px] font-medium leading-relaxed text-yellow-700">Шалтгаанаа тодорхой бичээд нотолгооны линк/тайлбараа нэм.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Scope зөрсөн", "Хугацаа хэтэрсэн", "Чанарын асуудал", "Communication issue"].map((chip) => (
                  <button key={chip} type="button" onClick={() => setDisputeReason(chip)} className={`rounded-2xl px-4 py-2 text-[12px] font-black font-headline transition-all ${disputeReason === chip ? "bg-yellow-700 text-white" : "bg-white text-yellow-800 shadow-sm"}`}>{chip}</button>
                ))}
              </div>
              <textarea className="mt-5 w-full rounded-2xl bg-white px-5 py-4 text-[14px] font-medium text-primary outline-none shadow-sm" rows={2} value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="Маргааны шалтгаан" />
              <textarea className="mt-3 w-full rounded-2xl bg-white px-5 py-4 text-[14px] font-medium text-primary outline-none shadow-sm" rows={2} value={disputeEvidence} onChange={(e) => setDisputeEvidence(e.target.value)} placeholder="Нотолгоо (линк/тайлбар)" />
            </div>
          )}

          {/* Freelancer Delivery Panel */}
          {me.data.role === "freelancer" && isSelectedFreelancer && ["in_progress", "awaiting_client_review"].includes(status) && (
            <div className="rounded-[2.5rem] bg-surface-container-low p-8 md:p-10">
              <h2 className="font-headline text-[24px] font-black tracking-tighter text-primary">Ажлын үр дүн илгээх</h2>
              <div className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 font-headline">Файл оруулах</label>
                  <input type="file" onChange={(e) => setDeliverableFile(e.target.files?.[0] || null)} disabled={status !== "in_progress"} className="w-full rounded-2xl bg-surface-container-lowest px-5 py-4 text-[14px] text-surface-500 outline-none" />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 font-headline">Checksum</label>
                  <input value={checksum} onChange={(e) => setChecksum(e.target.value)} placeholder="SHA-256 checksum" disabled={status !== "in_progress"} className="w-full rounded-2xl bg-surface-container-lowest px-5 py-4 text-[14px] font-bold text-primary outline-none shadow-sm" />
                </div>
                {uploadDeliverableMutation.isPending && (
                  <div className="rounded-2xl bg-surface-container-lowest p-4">
                    <div className="mb-2 flex justify-between text-[11px] font-bold text-surface-500 font-headline"><span>Uploading...</span><span>{deliverableUploadProgress}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-container"><div className="h-full bg-secondary transition-all" style={{ width: `${deliverableUploadProgress}%` }} /></div>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <ActionButton className="rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest font-headline" onClick={() => uploadDeliverableMutation.mutate()} disabled={status !== "in_progress"} loading={uploadDeliverableMutation.isPending}>
                    Файл upload хийх
                  </ActionButton>
                  <ActionButton className="rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest font-headline" tone="success" onClick={() => setSubmitResultConfirmOpen(true)} disabled={status !== "in_progress"}>
                    Үр дүн илгээх
                  </ActionButton>
                </div>
              </div>
            </div>
          )}

          {/* Review */}
          {status === "completed" && (
            reviewRecap ? (
              <div className="rounded-[2.5rem] bg-secondary-fixed p-8">
                <p className="font-headline text-[18px] font-black text-secondary">Review амжилттай илгээгдлээ ✓</p>
                <p className="mt-2 text-[14px] font-medium text-surface-500">Ерөнхий: {reviewRecap.rating}/5 · Харилцаа: {reviewRecap.communication}/5 · Чанар: {reviewRecap.quality}/5</p>
              </div>
            ) : (
              <div className="rounded-[2.5rem] bg-surface-container-low p-8 md:p-10">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline text-[24px] font-black tracking-tighter text-primary">Review үлдээх</h2>
                  <span className="text-[11px] font-black text-surface-400 font-headline">Алхам {reviewStep + 1} / 3</span>
                </div>
                <form className="mt-8 space-y-6" onSubmit={reviewForm.handleSubmit((v) => { const avg = Math.round((communicationRating + qualityRating) / 2); reviewMutation.mutate({ ...v, rating: Math.max(1, Math.min(5, avg)), comment: `${v.comment || ""}\nHarилцаа: ${communicationRating}/5\nЧанар: ${qualityRating}/5\nЗөвлөх эсэх: ${wouldRecommend}`.trim() }); })}>
                  {reviewStep === 0 && <div><label className="mb-3 block text-[13px] font-bold text-primary">Харилцааны үнэлгээ: {communicationRating}/5</label><input type="range" min={1} max={5} value={communicationRating} onChange={(e) => setCommunicationRating(Number(e.target.value))} className="w-full accent-secondary" /></div>}
                  {reviewStep === 1 && <div><label className="mb-3 block text-[13px] font-bold text-primary">Чанарын үнэлгээ: {qualityRating}/5</label><input type="range" min={1} max={5} value={qualityRating} onChange={(e) => setQualityRating(Number(e.target.value))} className="w-full accent-secondary" /></div>}
                  {reviewStep === 2 && (
                    <div className="space-y-4">
                      <label className="block text-[13px] font-bold text-primary">Дахин зөвлөх үү?</label>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setWouldRecommend("yes")} className={`rounded-2xl px-6 py-3 text-[12px] font-black font-headline transition-all ${wouldRecommend === "yes" ? "bg-secondary text-white" : "bg-surface-container-lowest text-surface-500 shadow-sm"}`}>Тийм</button>
                        <button type="button" onClick={() => setWouldRecommend("no")} className={`rounded-2xl px-6 py-3 text-[12px] font-black font-headline transition-all ${wouldRecommend === "no" ? "bg-red-500 text-white" : "bg-surface-container-lowest text-surface-500 shadow-sm"}`}>Үгүй</button>
                      </div>
                      <textarea placeholder="Дэлгэрэнгүй санал" {...reviewForm.register("comment")} rows={3} className="w-full rounded-2xl bg-surface-container-lowest px-5 py-4 text-[14px] outline-none shadow-sm resize-none" />
                    </div>
                  )}
                  <div className="flex justify-between gap-3">
                    <button type="button" onClick={() => setReviewStep((p) => Math.max(0, p - 1))} disabled={reviewStep === 0} className="rounded-2xl bg-surface-container-lowest px-6 py-3 text-[12px] font-black font-headline text-surface-500 shadow-sm disabled:opacity-30">Буцах</button>
                    {reviewStep < 2
                      ? <button type="button" onClick={() => setReviewStep((p) => Math.min(2, p + 1))} className="rounded-2xl primary-gradient px-8 py-3 text-[12px] font-black font-headline text-primary-fixed shadow-ambient">Дараах →</button>
                      : <ActionButton className="rounded-2xl px-8 py-3 text-[11px] font-black uppercase tracking-widest font-headline" type="submit" loading={reviewMutation.isPending}>Илгээх</ActionButton>}
                  </div>
                </form>
              </div>
            )
          )}

          {/* Chat */}
          <div>
            <button type="button" onClick={() => setChatOpen((v) => !v)} className="flex w-full items-center justify-between rounded-[2.5rem] bg-surface-container-low px-8 py-6">
              <span className="font-headline text-[24px] font-black tracking-tighter text-primary">Мессеж</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`h-5 w-5 text-surface-400 transition-transform ${chatOpen ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {chatOpen && <div className="mt-4"><ProjectChat projectId={id} currentUserId={me.data.id} /></div>}
          </div>
        </div>

        {/* ── RIGHT STICKY SIDEBAR ── */}
        <aside className="space-y-5 xl:sticky xl:top-24">

          {/* Budget + CTA */}
          <div className="rounded-[2.5rem] primary-gradient p-8 text-primary-fixed shadow-ambient">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60 font-headline">Төслийн төсөв</p>
            <p className="mt-3 font-headline text-[38px] font-black leading-none tracking-tighter">
              {formatMnt(Math.round(budget * 0.8))} — {formatMnt(budget)}
            </p>
            <div className="mt-3 flex gap-4 text-[13px] font-bold opacity-70">
              <span>{project.timeline_days} сар</span>
              <span className="capitalize">{(project as any).experience_level || "Intermediate"}</span>
            </div>
            {canFreelancerPropose && (
              <button type="button" className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-white/10 px-6 py-4 text-[12px] font-black uppercase tracking-[0.2em] backdrop-blur-sm transition-all hover:bg-white/20 font-headline">
                Apply for this Project →
              </button>
            )}
            {isClientOwner && (
              <div className="mt-6 grid gap-3">
                {canRelease && (
                  <button type="button" onClick={() => setReleaseConfirmOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-6 py-4 text-[12px] font-black uppercase tracking-widest font-headline">
                    Release Escrow ✓
                  </button>
                )}
                {canDispute && (
                  <button type="button" onClick={() => setDisputeConfirmOpen(true)} disabled={!disputeReason.trim()} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-4 text-[12px] font-black uppercase tracking-widest font-headline disabled:opacity-30">
                    Маргаан нээх
                  </button>
                )}
                {status === "open" && (
                  <button type="button" onClick={() => router.push(withLocale(`/projects/${id}/edit`))} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-4 text-[12px] font-black uppercase tracking-widest font-headline">
                    Засах
                  </button>
                )}
                <button type="button" onClick={() => router.push(withLocale(`/projects/${id}/payment`))} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-4 text-[12px] font-black uppercase tracking-widest font-headline">
                  Төлбөр хийх
                </button>
              </div>
            )}
          </div>

          {/* Escrow Status */}
          <div className="rounded-[2.5rem] bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="font-headline text-[13px] font-black uppercase tracking-[0.2em] text-surface-400">Escrow төлөв</h3>
            <div className="mt-4 flex items-center gap-3">
              <EscrowStatusBadge status={escrowState} />
              <span className="text-[14px] font-bold text-primary capitalize">{escrowState.replace(/_/g, " ")}</span>
            </div>
            <div className="mt-5 rounded-2xl bg-secondary-fixed p-4">
              <div className="flex items-start gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 h-5 w-5 shrink-0 text-secondary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <p className="text-[13px] font-medium leading-relaxed text-secondary">Payment is verified and secured via ITZUUN Escrow system.</p>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="rounded-[2.5rem] bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-[13px] font-black uppercase tracking-[0.2em] text-surface-400">About the Client</h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-secondary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary font-headline text-[18px] font-black text-primary-fixed">
                {String(project.owner || "C")[0].toUpperCase()}
              </div>
              <div>
                <p className="font-headline text-[15px] font-black text-primary">Client #{project.owner}</p>
                <div className="mt-1 flex items-center gap-1.5"><RatingStars value={5} /><span className="text-[12px] font-bold text-surface-400">(5.0)</span></div>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-[13px]">
              {[
                { label: "Location", value: "Ulaanbaatar, MN" },
                { label: "Projects Posted", value: "—" },
                { label: "Hire Rate", value: "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="font-medium text-surface-400">{label}</span>
                  <span className="font-black text-primary font-headline">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Share */}
          <div className="rounded-[2.5rem] bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 mb-4">Share this job</h3>
            <CopyShareUrl projectId={id} />
          </div>
        </aside>
      </div>

      {/* Confirmations */}
      <ConfirmationDialog open={selectConfirmProposalId !== null} title="Freelancer сонгохыг баталгаажуулах"
        message={selectedProposal ? `Freelancer #${resolveFreelancerId(selectedProposal.freelancer)}-г сонговол төсэл эхэлж, escrow идэвхжинэ.\nҮнэ: ${formatMnt(Number(selectedProposal.price || 0))}, хугацаа: ${selectedProposal.timeline_days} өдөр.` : "Сонголтоо баталгаажуулна уу."}
        confirmLabel="Тийм, сонгоё" confirmTone="primary" loading={selectMutation.isPending}
        onCancel={() => setSelectConfirmProposalId(null)}
        onConfirm={() => { if (selectConfirmProposalId !== null) { selectMutation.mutate(selectConfirmProposalId, { onSettled: () => setSelectConfirmProposalId(null) }); } }} />
      <ConfirmationDialog open={releaseConfirmOpen} title="Release Escrow"
        message={`Энэ үйлдлээр ${formatMnt(budget)} escrow freelancer руу шилжинэ. Буцаах боломжгүй.`}
        confirmLabel="Release Now" confirmTone="success" loading={completionMutation.isPending}
        onCancel={() => setReleaseConfirmOpen(false)}
        onConfirm={() => completionMutation.mutate(undefined, { onSettled: () => setReleaseConfirmOpen(false) })} />
      <ConfirmationDialog open={disputeConfirmOpen} title="Маргаан нээх"
        message="Маргаан нээгдмэгц release хаагдаж admin mediation эхэлнэ."
        confirmLabel="Нээх" confirmTone="warning" loading={disputeMutation.isPending}
        onCancel={() => setDisputeConfirmOpen(false)}
        onConfirm={() => disputeMutation.mutate(undefined, { onSettled: () => setDisputeConfirmOpen(false) })} />
      <ConfirmationDialog open={submitResultConfirmOpen} title="Үр дүн илгээх"
        message="Үр дүн илгээснээр төсөл client review шат руу орно."
        confirmLabel="Илгээх" confirmTone="success" loading={resultMutation.isPending}
        onCancel={() => setSubmitResultConfirmOpen(false)}
        onConfirm={() => resultMutation.mutate(undefined, { onSettled: () => setSubmitResultConfirmOpen(false) })} />
    </section>
  );
}
