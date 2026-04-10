"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { EmptyState, ErrorState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { ActionButton, AppCard, ConfirmationDialog, DashboardBottomBar, MetricCard, RatingStars, RoleSidebar, StatusPill, VerifiedBadge } from "@/components/ui-kit";
import { VerificationBanner } from "@/components/verification-banner";
import { toArray } from "@/lib/api/endpoints";
import { useMe, useMutation, useMyProfile, useMyProposals, usePremiumMe, useProjects } from "@/lib/hooks";
import { projectsApi } from "@/lib/api/endpoints";
import { useToastStore } from "@/lib/toast-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { proposalSchema } from "@/lib/validators";
import type { z } from "zod";
import type { ProposalDto } from "@/lib/api/types";

type ProposalForm = z.infer<typeof proposalSchema>;

function formatMnt(value: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} ₮`;
}

function proposalAgeLabel(createdAt?: string): string {
  if (!createdAt) return "Огноо алга";
  const diffDays = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)));
  if (diffDays === 0) return "Өнөөдөр илгээсэн";
  return `${diffDays} хоног хүлээгдэж байна`;
}

function relativeUpdatedLabel(updatedAt?: string): string {
  if (!updatedAt) return "Шинэчлэлийн огноо алга";
  const diffHours = Math.max(0, Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60)));
  if (diffHours < 1) return "Сая шинэчлэгдсэн";
  if (diffHours < 24) return `${diffHours} цагийн өмнө шинэчлэгдсэн`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} өдрийн өмнө шинэчлэгдсэн`;
}

function projectRisk(project: { created_at?: string; timeline_days?: number }): { label: string; tone: "warning" | "danger" } | null {
  const createdAt = project.created_at;
  const timelineDays = Number(project.timeline_days || 0);
  if (!createdAt || !timelineDays) return null;
  const elapsedDays = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)));
  if (elapsedDays > timelineDays) return { label: `Хугацаа хэтэрсэн: +${elapsedDays - timelineDays} хоног`, tone: "danger" };
  if (elapsedDays >= Math.ceil(timelineDays * 0.8)) return { label: "Deadline ойртож байна", tone: "warning" };
  return null;
}

function proposalStatusMeta(status: string): { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" } {
  if (status === "accepted") return { label: "Accepted", tone: "success" };
  if (status === "rejected") return { label: "Rejected", tone: "danger" };
  if (status === "withdrawn") return { label: "Withdrawn", tone: "neutral" };
  return { label: "Pending", tone: "warning" };
}

function projectStatusMeta(status: string): { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info"; nextStep: string } {
  if (status === "in_progress") {
    return { label: "In progress", tone: "info", nextStep: "Даалгавраа гүйцээгээд үр дүнгээ илгээ." };
  }
  if (status === "awaiting_client_review") {
    return { label: "Client review", tone: "warning", nextStep: "Client баталгаажуулалтыг хүлээж байна." };
  }
  if (status === "disputed") {
    return { label: "Disputed", tone: "danger", nextStep: "Нотолгоогоо шинэчилж admin шийдвэрийг хүлээ." };
  }
  return { label: status, tone: "neutral", nextStep: "Төслийн явцаа шалга." };
}

export default function FreelancerDashboardPage() {
  const t = useTranslations("FreelancerDash");
  const router = useRouter();
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;
  const me = useMe();
  const proposals = useMyProposals();
  const projects = useProjects(1);
  const premiumMe = usePremiumMe({ enabled: !!me.data });
  const profile = useMyProfile();
  const queryClient = useQueryClient();
  const [editingProposalId, setEditingProposalId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "in_progress" | "awaiting_client_review" | "disputed">("all");
  const [proposalFilter, setProposalFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [submitTarget, setSubmitTarget] = useState<number | null>(null);

  const rating = useQuery({
    queryKey: ["my-rating", me.data?.id],
    queryFn: () => projectsApi.ratingSummary(me.data!.id),
    enabled: !!me.data?.id,
  });
  const toast = useToastStore((s) => s.push);

  const retryAll = () => {
    me.refetch();
    proposals.refetch();
    projects.refetch();
    profile.refetch();
    rating.refetch();
  };

  const editForm = useForm<ProposalForm>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { price: 0, timeline_days: 0, message: "" },
  });

  const submitMutation = useMutation({
    mutationFn: (projectId: number) => projectsApi.submitResult(projectId, { note: "Freelancer submission" }),
    onSuccess: () => {
      projects.refetch();
      toast("success", "Үр дүн амжилттай илгээгдлээ.");
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
      toast("success", "Санал шинэчлэгдлээ.");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const withdrawMutation = useMutation({
    mutationFn: (proposalId: number) => projectsApi.withdrawProposal(proposalId),
    onSuccess: () => {
      proposals.refetch();
      queryClient.invalidateQueries({ queryKey: ["project-proposals"] });
      toast("success", "Санал буцаагдлаа.");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  function openEditModal(proposal: ProposalDto) {
    setEditingProposalId(Number(proposal.id));
    editForm.reset({
      price: Number(proposal.price ?? 0),
      timeline_days: Number(proposal.timeline_days ?? 0),
      message: proposal.message || "",
    });
  }

  if (me.isLoading || proposals.isLoading || projects.isLoading || profile.isLoading) {
    return (
      <section className="space-y-4 pb-20" aria-busy="true" aria-live="polite">
        <div className="h-36 animate-pulse rounded-3xl border border-[#d8e3ee] bg-[#eef4fa]" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-24 animate-pulse rounded-2xl border border-[#dce4ec] bg-[#f3f7fc]" />
          <div className="h-24 animate-pulse rounded-2xl border border-[#dce4ec] bg-[#f3f7fc]" />
          <div className="h-24 animate-pulse rounded-2xl border border-[#dce4ec] bg-[#f3f7fc]" />
          <div className="h-24 animate-pulse rounded-2xl border border-[#dce4ec] bg-[#f3f7fc]" />
        </div>
        <div className="h-60 animate-pulse rounded-2xl border border-[#dce4ec] bg-[#f8fbff]" />
        <p className="text-sm text-surface-500">Хянах самбар ачааллаж байна. Түр хүлээнэ үү...</p>
      </section>
    );
  }

  if (me.isError || !me.data) {
    return (
      <ErrorState
        label="Please sign in first."
        action={
          <button className="min-h-11 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-red-700" onClick={() => router.push(withLocale("/auth/login"))}>
            Go to sign in
          </button>
        }
      />
    );
  }

  if (proposals.isError || !proposals.data || projects.isError || !projects.data) {
    return (
      <ErrorState
        label="Dashboard мэдээлэл ачааллахад алдаа гарлаа."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="min-h-11 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-red-700" onClick={retryAll}>
              Дахин оролдох
            </button>
            <Link href={withLocale("/projects")} className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white">
              Төсөл хайх
            </Link>
          </div>
        }
      />
    );
  }

  const myProposals = toArray<ProposalDto>(proposals.data);
  const myProposalIds = new Set(myProposals.map((proposal) => proposal.id));
  const activeProjects = projects.data.results.filter(
    (project) =>
      project.selected_proposal &&
      myProposalIds.has(project.selected_proposal) &&
      ["in_progress", "awaiting_client_review", "disputed"].includes(project.status),
  );

  const pendingProposals = myProposals.filter((item) => (item.status || "pending") === "pending").length;
  const earnings = activeProjects.reduce((acc, item) => acc + Number(item.budget || 0), 0);

  const sortedProposals = useMemo(() => {
    const rank = (status: string) => {
      if (status === "pending") return 0;
      if (status === "accepted") return 1;
      if (status === "rejected") return 2;
      if (status === "withdrawn") return 3;
      return 4;
    };
    return [...myProposals].sort((a, b) => rank(a.status || "pending") - rank(b.status || "pending") || Number(a.id) - Number(b.id));
  }, [myProposals]);

  const inProgressProject = activeProjects.find((p) => p.status === "in_progress");
  const firstPendingProposal = sortedProposals.find((p) => (p.status || "pending") === "pending");
  const projectById = useMemo(() => new Map(projects.data.results.map((project) => [project.id, project])), [projects.data.results]);
  const filteredProposals = sortedProposals.filter((proposal) => {
    const status = proposal.status || "pending";
    return proposalFilter === "all" ? true : status === proposalFilter;
  });
  const filteredActiveProjects = activeProjects.filter((project) => (activeFilter === "all" ? true : project.status === activeFilter));
  const submitProject = activeProjects.find((project) => project.id === submitTarget) || null;

  const primaryAction = useMemo(() => {
    if (me.data.verification_status === "suspended") {
      return {
        title: "Одоогийн гол зорилт: Бүртгэлийн асуудлаа шийдэх",
        description: "Таны данс түр хаагдсан тул эхлээд support-т холбогдож дансаа сэргээ.",
        actionLabel: "Support руу очих",
        actionHref: withLocale("/support"),
      };
    }
    if (me.data.verification_status !== "verified") {
      return {
        title: "Одоогийн гол зорилт: Баталгаажуулалтаа дуусгах",
        description: "Verified болсноор илүү олон client таны саналыг хүлээн авах магадлал өснө.",
        actionLabel: "Баталгаажуулалт илгээх",
        actionHref: withLocale("/freelancer/profile"),
      };
    }
    if (inProgressProject) {
      return {
        title: "Одоогийн гол зорилт: Ажлаа дуусгаад төлбөрөө авах",
        description: `"${inProgressProject.title}" дээр үр дүнгээ илгээж client review руу оруул.`,
        actionLabel: "Үр дүн илгээх",
        actionProjectId: inProgressProject.id,
      };
    }
    if (firstPendingProposal) {
      return {
        title: "Одоогийн гол зорилт: Pending саналаа хүчтэй болгох",
        description: "Саналын үнэ, хугацаагаа шинэчилж ялгарал нэм.",
        actionLabel: "Санал засах",
        actionProposalId: firstPendingProposal.id,
      };
    }
    return {
      title: "Одоогийн гол зорилт: Шинэ ажил олох",
      description: "Өнөөдөр дор хаяж 3 төсөлд санал илгээж pipeline-аа өсгө.",
      actionLabel: "Төсөл хайх",
      actionHref: withLocale("/projects"),
    };
  }, [me.data.verification_status, inProgressProject, firstPendingProposal, withLocale]);

  const verificationGuidance = useMemo(() => {
    if (me.data.verification_status === "verified") return null;
    if (me.data.verification_status === "pending") {
      return {
        tone: "warning" as const,
        title: "Баталгаажуулалт хянагдаж байна",
        text: "Түр хүлээгээд meanwhile профайлаа сайжруулж, төсөл хайж shortlist бэлд.",
        cta: "Профайл нээх",
        href: withLocale("/freelancer/profile"),
      };
    }
    if (me.data.verification_status === "suspended") {
      return {
        tone: "danger" as const,
        title: "Данс түр хаагдсан",
        text: "Support-т тайлбар илгээж сэргээх хүсэлт гарга. Идэвхтэй ажлаа чат дээр үргэлжлүүлж болно.",
        cta: "Support",
        href: withLocale("/support"),
      };
    }
    return {
      tone: "info" as const,
      title: "Баталгаажуулалт шаардлагатай",
      text: "Санал илгээх боломжоо бүрэн нээхийн тулд verification хүсэлтээ одоо илгээ.",
      cta: "Verification эхлүүлэх",
      href: withLocale("/freelancer/profile"),
    };
  }, [me.data.verification_status, withLocale]);

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
    <RoleGuard currentRole={me.data.role} requiredRole="freelancer" fallbackPath={withLocale("/auth")}>
      <section className="space-y-6 pb-20" aria-label="Freelancer dashboard">
        <div className="relative overflow-hidden rounded-[28px] border border-[#d6e2ee] bg-gradient-to-br from-[#f8fbff] via-[#f2f8ff] to-[#eefaf4] p-5 shadow-[0_20px_48px_rgba(13,39,80,0.12)] md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#44b39c]/12 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-20 h-56 w-56 rounded-full bg-[#5b8dff]/12 blur-3xl" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h1 className="font-headline text-[28px] font-extrabold tracking-tight text-[#12243a] sm:text-4xl">{t("title")}</h1>
              <VerifiedBadge status={me.data.verification_status} verified={me.data.is_verified} />
            </div>
            <div className="rounded-2xl border border-[#d8e5f0] bg-white/80 p-4">
              <p className="text-sm font-semibold text-[#163457]">{primaryAction.title}</p>
              <p className="mt-1 text-xs text-[#4d6681]">{primaryAction.description}</p>
              <div className="mt-3">
                {primaryAction.actionHref ? (
                  <Link href={primaryAction.actionHref} className="inline-flex min-h-11 items-center rounded-xl bg-[#175f8d] px-4 text-[13px] font-semibold text-white">
                    {primaryAction.actionLabel}
                  </Link>
                ) : primaryAction.actionProjectId ? (
                  <ActionButton className="min-h-11 rounded-xl px-4 text-[13px] font-semibold" tone="success" onClick={() => setSubmitTarget(primaryAction.actionProjectId)}>
                    {primaryAction.actionLabel}
                  </ActionButton>
                ) : (
                  <ActionButton
                    className="min-h-11 rounded-xl px-4 text-[13px] font-semibold"
                    onClick={() => {
                      const target = sortedProposals.find((proposal) => proposal.id === primaryAction.actionProposalId);
                      if (target) openEditModal(target);
                    }}
                  >
                    {primaryAction.actionLabel}
                  </ActionButton>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <RoleSidebar role="freelancer" />
          <div className="flex-1 space-y-4">
            {me.data?.verification_status !== "verified" && <VerificationBanner user={me.data} />}
            {verificationGuidance ? (
              <div className="rounded-2xl border border-surface-200/70 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-surface-900">{verificationGuidance.title}</p>
                    <p className="mt-1 text-xs text-surface-600">{verificationGuidance.text}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill label={me.data.verification_status || "unverified"} tone={verificationGuidance.tone} />
                    <Link href={verificationGuidance.href} className="inline-flex min-h-11 items-center rounded-xl bg-brand-600 px-4 text-[13px] font-semibold text-white">
                      {verificationGuidance.cta}
                    </Link>
                    <Link href={withLocale("/support?topic=verification")} className="inline-flex min-h-11 items-center rounded-xl border border-surface-200 bg-white px-4 text-[13px] font-semibold text-surface-700">
                      Support shortcut
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
            {me.data.verification_status === "verified" && premiumMe.data && !premiumMe.data.is_premium ? (
              <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-surface-900">PRO-оор саналын лимитээ өсгөх үү?</p>
                    <p className="mt-1 text-xs text-surface-600">Одоогийн лимит: {premiumMe.data.proposal_limit_monthly}/сар. PRO бол 50/сар болно.</p>
                  </div>
                  <Link href={withLocale("/pro")} className="inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-4 text-[13px] font-semibold text-white">
                    PRO үзэх
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label={t("earnings")}
                value={formatMnt(earnings)}
                hint="Идэвхтэй ажлуудын баталгаажсан дүн"
                className="border border-[#cfe0df] bg-gradient-to-br from-[#0f5963] to-[#1f7f87] text-white shadow-[0_14px_34px_rgba(15,89,99,0.28)]"
                valueClassName="text-white"
              />
              <MetricCard label={t("activeProjects")} value={activeProjects.length} hint="Гүйцэтгэх шатанд" />
              <MetricCard label={t("pendingProposals")} value={pendingProposals} hint="Хариу хүлээж буй саналууд" />
              <AppCard>
                <p className="text-[11px] uppercase tracking-widest text-surface-500">{t("rating")}</p>
                <div className="mt-1"><RatingStars value={rating.data?.average ?? 0} /></div>
                <p className="mt-0.5 text-[11px] text-surface-500">{rating.data?.total ?? 0} {t("reviews")}</p>
              </AppCard>
            </div>

            <AppCard className="border border-[#dde4ec] bg-[#f8fbff]">
              <p className="text-[13px] font-semibold text-[#17304e]">
                {t("profileCompleteness")}: {profileCompleteness}%
              </p>
              <div className="mt-2 h-2 w-full rounded-full bg-[#dbe5ef]">
                <div className="h-2 rounded-full bg-[#207ca0]" style={{ width: `${profileCompleteness}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-[#5a728d]">
                {profileCompleteness < 100 ? (
                  <Link href={withLocale("/freelancer/profile")} className="text-[#175b89] hover:underline">
                    {t("completeProfile")} →
                  </Link>
                ) : (
                  t("profileDone")
                )}
              </p>
            </AppCard>

            <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-surface-900">{t("myProposals")}</h2>
                <Link href={withLocale("/projects")} className="inline-flex min-h-11 items-center rounded-xl bg-brand-600 px-4 text-[13px] font-semibold text-white">
                  Төсөл хайх
                </Link>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {[
                  { key: "all", label: "Бүгд" },
                  { key: "pending", label: "Pending" },
                  { key: "accepted", label: "Accepted" },
                  { key: "rejected", label: "Rejected" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`min-h-11 rounded-lg px-3 text-[12px] font-semibold ${
                      proposalFilter === item.key ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-600"
                    }`}
                    onClick={() => setProposalFilter(item.key as typeof proposalFilter)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {!sortedProposals.length ? (
                <EmptyState
                  label={t("noProposals")}
                  action={
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs text-surface-500">Орлогоо эхлүүлэхийн тулд одоо төсөл сонгоод санал илгээ.</p>
                      <Link href={withLocale("/projects")} className="inline-flex min-h-11 items-center rounded-xl bg-brand-600 px-4 text-[13px] font-semibold text-white">
                        {t("browseProjects")}
                      </Link>
                    </div>
                  }
                />
              ) : filteredProposals.length ? (
                <ul className="space-y-2">
                  {filteredProposals.map((proposal) => {
                    const meta = proposalStatusMeta(proposal.status || "pending");
                    const isPending = (proposal.status || "pending") === "pending";
                    const project = projectById.get(Number(proposal.project));
                    return (
                      <li key={proposal.id} className="rounded-xl border border-surface-200/60 bg-[#f9fcff] p-3 text-[13px]">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-1">
                            <p className="font-semibold text-surface-900">{project?.title || `Төсөл #${proposal.project}`}</p>
                            <p className="text-[12px] text-surface-500">{project?.category_obj?.name_mn || project?.category || "Ангилалгүй"}</p>
                            <p className="text-surface-600">Үнэ: <strong>{formatMnt(Number(proposal.price || 0))}</strong></p>
                            <p className="text-surface-600">Хугацаа: <strong>{proposal.timeline_days} {t("days")}</strong></p>
                            <p className="text-[12px] text-[#27577f]">{proposalAgeLabel(proposal.created_at)}</p>
                            <p className="text-[12px] text-surface-500">{relativeUpdatedLabel((proposal as { updated_at?: string }).updated_at || proposal.created_at)}</p>
                          </div>
                          <StatusPill label={meta.label} tone={meta.tone} />
                        </div>
                        {isPending ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <ActionButton
                              type="button"
                              className="min-h-11 rounded-xl px-4 text-[13px] font-semibold"
                              onClick={() => openEditModal(proposal)}
                            >
                              {t("edit")}
                            </ActionButton>
                            <button
                              type="button"
                              className="inline-flex min-h-11 items-center rounded-xl border border-red-200 bg-red-50 px-4 text-[13px] font-semibold text-red-700"
                              disabled={withdrawMutation.isPending}
                              onClick={() => withdrawMutation.mutate(proposal.id)}
                            >
                              {withdrawMutation.isPending ? t("withdrawing") : t("withdraw")}
                            </button>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  label="Энэ шүүлтүүрт санал алга."
                  action={
                    <button className="min-h-11 rounded-xl bg-surface-100 px-4 text-[13px] font-semibold text-surface-700" onClick={() => setProposalFilter("all")}>
                      Бүх санал харах
                    </button>
                  }
                />
              )}
            </div>

            {editingProposalId !== null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 p-4 backdrop-blur-sm">
                <div className="w-full max-w-[480px] rounded-2xl border border-surface-200/60 bg-white p-6 shadow-modal">
                  <h3 className="text-lg font-semibold text-surface-900">{t("editProposal")}</h3>
                  <form className="mt-4 space-y-3" onSubmit={editForm.handleSubmit((v) => updateProposalMutation.mutate(v))}>
                    <label className="block text-[13px] font-medium text-surface-700">
                      {t("price")} (MNT)
                      <input type="number" {...editForm.register("price", { valueAsNumber: true })} className="mt-1" />
                    </label>
                    <label className="block text-[13px] font-medium text-surface-700">
                      {t("timeline")} ({t("days")})
                      <input type="number" {...editForm.register("timeline_days", { valueAsNumber: true })} className="mt-1" />
                    </label>
                    <label className="block text-[13px] font-medium text-surface-700">
                      {t("message")}
                      <textarea {...editForm.register("message")} rows={3} className="mt-1" />
                    </label>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        className="min-h-11 flex-1 rounded-lg bg-surface-100 py-2 text-[13px] text-surface-700 hover:bg-surface-200"
                        onClick={() => setEditingProposalId(null)}
                      >
                        {t("cancel")}
                      </button>
                      <button
                        type="submit"
                        disabled={updateProposalMutation.isPending}
                        className="min-h-11 flex-1 rounded-lg bg-brand-600 py-2 text-[13px] text-white hover:bg-brand-700 disabled:opacity-60"
                      >
                        {updateProposalMutation.isPending ? t("saving") : t("save")}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-surface-900">{t("activeProjectsSection")}</h2>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "all", label: "Бүгд" },
                    { key: "in_progress", label: "In progress" },
                    { key: "awaiting_client_review", label: "Review" },
                    { key: "disputed", label: "Disputed" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`min-h-11 rounded-lg px-3 text-[12px] font-semibold ${
                        activeFilter === item.key ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-600"
                      }`}
                      onClick={() => setActiveFilter(item.key as typeof activeFilter)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              {!filteredActiveProjects.length ? (
                <EmptyState
                  label={activeFilter === "all" ? t("noActive") : "Энэ төлөвт идэвхтэй ажил алга."}
                  action={
                    <div className="flex flex-wrap items-center gap-2">
                      {activeFilter !== "all" ? (
                        <button className="inline-flex min-h-11 items-center rounded-xl bg-surface-100 px-4 text-[13px] font-semibold text-surface-700" onClick={() => setActiveFilter("all")}>
                          Бүх төлөв харах
                        </button>
                      ) : (
                        <>
                          <p className="text-xs text-surface-500">Идэвхтэй ажил алга. Орлого үргэлжлүүлэхийн тулд шинэ төсөл хай.</p>
                          <Link href={withLocale("/projects")} className="inline-flex min-h-11 items-center rounded-xl bg-brand-600 px-4 text-[13px] font-semibold text-white">
                            {t("browseProjects")}
                          </Link>
                        </>
                      )}
                    </div>
                  }
                />
              ) : (
                <ul className="space-y-2">
                  {filteredActiveProjects.map((project) => {
                    const meta = projectStatusMeta(project.status);
                    const risk = projectRisk(project as { created_at?: string; timeline_days?: number });
                    return (
                      <li key={project.id} className="rounded-xl border border-surface-200/60 p-3 text-[13px]">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-1">
                            <p className="font-semibold text-surface-900">{project.title}</p>
                            <p className="text-surface-600">Төсөв: {formatMnt(Number(project.budget || 0))}</p>
                            <p className="text-[12px] font-medium text-[#1e4f78]">Дараагийн алхам: {meta.nextStep}</p>
                            <p className="text-[12px] text-surface-500">
                              Төлбөрийн төлөв: {project.status === "awaiting_client_review" ? "Client баталгаажуулмагц payout хийгдэнэ." : "Result илгээсний дараа client review шат руу орно."}
                            </p>
                            {risk ? <StatusPill label={risk.label} tone={risk.tone} /> : null}
                          </div>
                          <StatusPill label={meta.label} tone={meta.tone} />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link href={withLocale(`/projects/${project.id}`)} className="inline-flex min-h-11 items-center rounded-xl border border-[#bfd3e6] bg-white px-4 text-[13px] font-semibold text-[#1e4f78]">
                            {t("openProject")}
                          </Link>
                          {project.status === "in_progress" ? (
                            <ActionButton className="min-h-11 rounded-xl px-4 text-[13px] font-semibold" tone="success" onClick={() => setSubmitTarget(project.id)}>
                              {t("submitResult")}
                            </ActionButton>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        <DashboardBottomBar role="freelancer" />

        <ConfirmationDialog
          open={submitTarget !== null}
          title="Үр дүн илгээхийг баталгаажуулах"
          message={
            submitProject
              ? `${submitProject.title} төсөл дээр үр дүн илгээхэд client review эхэлнэ. Шалгах жагсаалт: 1) Deliverable файл хавсаргасан 2) Тайлбар тодорхой 3) Scope бүрэн биелсэн.`
              : "Үр дүн илгээхэд client review эхэлнэ."
          }
          confirmLabel="Тийм, илгээе"
          confirmTone="success"
          loading={submitMutation.isPending}
          onCancel={() => setSubmitTarget(null)}
          onConfirm={() => {
            if (submitTarget !== null) {
              submitMutation.mutate(submitTarget);
              setSubmitTarget(null);
            }
          }}
        />
      </section>
    </RoleGuard>
  );
}
