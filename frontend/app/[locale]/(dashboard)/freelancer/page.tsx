"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { RoleGuard } from "@/components/shared/role-guard";
import { ConfirmationDialog, RatingStars, StatusPill, VerifiedBadge } from "@/components/ui";
import { VerificationBanner } from "@/components/shared/verification-banner";
import { toArray } from "@/lib/api/endpoints";
import { useMe, useMutation, useMyProfile, useMyProposals, usePremiumMe, useProjects } from "@/lib/hooks";
import { projectsApi } from "@/lib/api/endpoints";
import { useToastStore } from "@/lib/stores/toast-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { proposalSchema } from "@/lib/validators";
import type { z } from "zod";
import type { ProposalDto } from "@/lib/api/types";

type ProposalForm = z.infer<typeof proposalSchema>;

function formatMnt(value: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} ₮`;
}

function proposalAgeLabelRaw(createdAt?: string): { key: string; params?: Record<string, unknown> } {
  if (!createdAt) return { key: "noDateLabel" };
  const diffDays = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)));
  if (diffDays === 0) return { key: "todaySent" };
  return { key: "daysWaiting", params: { count: diffDays } };
}

function projectStatusMetaKeys(status: string): { labelKey: string; tone: "neutral" | "success" | "warning" | "danger" | "info"; nextStepKey: string } {
  if (status === "in_progress") {
    return { labelKey: "statusInProgress", tone: "info", nextStepKey: "nextStepInProgress" };
  }
  if (status === "awaiting_client_review") {
    return { labelKey: "statusAwaitingReview", tone: "warning", nextStepKey: "nextStepAwaitingReview" };
  }
  if (status === "disputed") {
    return { labelKey: "statusDisputed", tone: "danger", nextStepKey: "nextStepDisputed" };
  }
  return { labelKey: status, tone: "neutral", nextStepKey: "nextStepDefault" };
}

function DashboardIcon({
  name,
  className = "h-5 w-5",
}: {
  name:
    | "dashboard"
    | "work"
    | "search"
    | "payments"
    | "settings"
    | "help"
    | "notifications"
    | "chat"
    | "wallet"
    | "trend"
    | "hourglass"
    | "bank"
    | "star";
  className?: string;
}) {
  const common = { className, "aria-hidden": true };
  if (name === "dashboard") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-10h8V3h-8v8Z"/></svg>;
  }
  if (name === "work") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M10 4V3h4v1h5a2 2 0 0 1 2 2v3H3V6a2 2 0 0 1 2-2h5Zm11 7H3v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8Z"/></svg>;
  }
  if (name === "search") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m21 20-5.6-5.6a7 7 0 1 0-1 1L20 21l1-1ZM5 10a5 5 0 1 1 10 0 5 5 0 0 1-10 0Z"/></svg>;
  }
  if (name === "payments" || name === "wallet") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3V6Zm0 4h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8Zm11 3a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3Z"/></svg>;
  }
  if (name === "settings") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m19.4 13 .1-1-.1-1 2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-1.7-1L15 2h-6l-.3 2.9a7.5 7.5 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6-.1 1 .1 1-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 1.7 1L9 22h6l.3-2.9a7.5 7.5 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"/></svg>;
  }
  if (name === "help") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M11 18h2v-2h-2v2Zm1-16a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Zm0-14a3 3 0 0 0-3 3h2a1 1 0 1 1 1 1c-1.1 0-2 .9-2 2v1h2v-1a3 3 0 1 0-3-3h2a1 1 0 1 1 1-1Z"/></svg>;
  }
  if (name === "notifications") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7v4.6L3.7 15A1 1 0 0 0 4.4 17h15.2a1 1 0 0 0 .7-1.7L19 13.6V9a7 7 0 0 0-7-7Zm0 20a3 3 0 0 0 2.8-2H9.2A3 3 0 0 0 12 22Z"/></svg>;
  }
  if (name === "chat") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2Z"/></svg>;
  }
  if (name === "trend") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m16 6 2.3 2.3-5.6 5.6-3-3L4 16.6 5.4 18l4.3-4.3 3 3L19.7 9 22 11.3V6h-6Z"/></svg>;
  }
  if (name === "hourglass") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M6 2v6a6 6 0 0 0 3 5 6 6 0 0 0-3 5v4h12v-4a6 6 0 0 0-3-5 6 6 0 0 0 3-5V2H6Zm10 16v2H8v-2a4 4 0 0 1 2.2-3.6L12 13.5l1.8.9A4 4 0 0 1 16 18ZM12 10.5 10.2 9.6A4 4 0 0 1 8 6V4h8v2a4 4 0 0 1-2.2 3.6L12 10.5Z"/></svg>;
  }
  if (name === "star") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m12 17.3-5.3 3 1.4-6-4.6-4 6.1-.5L12 4l2.4 5.8 6.1.5-4.6 4 1.4 6-5.3-3Z"/></svg>;
  }
  return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M3 5h18v2H3V5Zm2 4h14v10H5V9Zm5 2v6h2v-6h-2Z"/></svg>;
}

export default function FreelancerDashboardPage() {
  const t = useTranslations("FreelancerDash");
  const router = useRouter();
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = useCallback((href: string) => `/${locale}${href}`, [locale]);
  const me = useMe();
  const proposals = useMyProposals();
  const projects = useProjects(1, { page_size: 100 });
  const premiumMe = usePremiumMe({ enabled: !!me.data });
  const profile = useMyProfile();
  const queryClient = useQueryClient();
  const [editingProposalId, setEditingProposalId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "in_progress" | "awaiting_client_review" | "disputed">("all");
  const [submitTarget, setSubmitTarget] = useState<number | null>(null);
  const [hideOnboarding, setHideOnboarding] = useState(false);

  const rating = useQuery({
    queryKey: ["my-rating", me.data?.id],
    queryFn: () => projectsApi.ratingSummary(me.data!.id),
    enabled: !!me.data?.id,
  });
  const toast = useToastStore((s) => s.push);

  useEffect(() => {
    try {
      setHideOnboarding(localStorage.getItem("freelancer_onboarding_dismissed_v1") === "1");
    } catch {}
  }, []);

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
      toast("success", t("resultSuccess"));
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
      toast("success", t("proposalUpdated"));
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
    return <LoadingState label={t("loading")} />;
  }

  if (me.isError || !me.data) {
    return (
      <ErrorState
        label={t("loginRequired")}
        action={
          <button className="min-h-11 rounded-lg bg-surface-container-lowest px-4 py-2 text-xs font-semibold text-red-700" onClick={() => router.push(withLocale("/auth/login"))}>
            {t("loginBtn")}
          </button>
        }
      />
    );
  }

  if (proposals.isError || !proposals.data || projects.isError || !projects.data) {
    return (
      <ErrorState
        label={t("loadError")}
        action={
          <div className="flex flex-wrap gap-2">
            <button className="min-h-11 rounded-lg bg-surface-container-lowest px-4 py-2 text-xs font-semibold text-red-700" onClick={retryAll}>
              {t("retry")}
            </button>
            <Link href={withLocale("/projects")} className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white">
              {t("searchProjects")}
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
  const rejectedProposals = myProposals.filter((item) => item.status === "rejected").length;
  const acceptedProposals = myProposals.filter((item) => item.status === "accepted").length;

  // Real earnings: completed projects where this freelancer was selected, net of 10% platform fee
  const completedProjects = projects.data.results.filter(
    (project) =>
      project.selected_proposal &&
      myProposalIds.has(project.selected_proposal) &&
      project.status === "completed",
  );
  const COMMISSION = 0.1;
  const earnings = completedProjects.reduce(
    (acc, item) => acc + Math.round(Number(item.budget || 0) * (1 - COMMISSION)),
    0,
  );
  // Pending payout: value held in escrow for active work, net of fee
  const pendingPayout = activeProjects.reduce(
    (acc, item) => acc + Math.round(Number(item.budget || 0) * (1 - COMMISSION)),
    0,
  );

  const rank = (status: string) => {
    if (status === "pending") return 0;
    if (status === "accepted") return 1;
    if (status === "rejected") return 2;
    if (status === "withdrawn") return 3;
    return 4;
  };
  const sortedProposals = [...myProposals].sort((a, b) => rank(a.status || "pending") - rank(b.status || "pending") || Number(a.id) - Number(b.id));

  const projectById = new Map(projects.data.results.map((project) => [project.id, project]));
  const filteredActiveProjects = activeProjects.filter((project) => (activeFilter === "all" ? true : project.status === activeFilter));
  const submitProject = activeProjects.find((project) => project.id === submitTarget) || null;

  let verificationGuidance: { tone: "warning" | "danger" | "info"; title: string; text: string; cta: string; href: string } | null = null;
  if (me.data.verification_status === "pending") {
    verificationGuidance = {
      tone: "warning",
      title: t("verificationPendingTitle"),
      text: t("verificationPendingText"),
      cta: t("verificationPendingCta"),
      href: withLocale("/freelancer/profile"),
    };
  } else if (me.data.verification_status === "suspended") {
    verificationGuidance = {
      tone: "danger",
      title: t("verificationSuspendedTitle"),
      text: t("verificationSuspendedText"),
      cta: t("verificationSuspendedCta"),
      href: withLocale("/support"),
    };
  } else if (me.data.verification_status !== "verified") {
    verificationGuidance = {
      tone: "info",
      title: t("verificationRequiredTitle"),
      text: t("verificationRequiredText"),
      cta: t("verificationRequiredCta"),
      href: withLocale("/freelancer/profile"),
    };
  }

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

  const filteredRecommendations = sortedProposals.filter((proposal) => (proposal.status || "pending") === "pending").slice(0, 2);
  const recentProposals = sortedProposals.slice(0, 4);
  const freelancerName = profile.data?.full_name || me.data.first_name || me.data.email?.split("@")[0] || "Freelancer";

  const inProgressProjectForFreelancer = activeProjects.find((project) => project.status === "in_progress");
  let priorityAction = null;
  if (inProgressProjectForFreelancer) {
    priorityAction = {
      title: t("priorityInProgressTitle"),
      desc: t("priorityInProgressDesc", { title: inProgressProjectForFreelancer.title }),
      cta: t("priorityInProgressCta"),
      onClick: () => router.push(withLocale(`/projects/${inProgressProjectForFreelancer.id}`))
    };
  } else if (!activeProjects.length && !pendingProposals) {
    priorityAction = {
      title: t("priorityFindWorkTitle"),
      desc: t("priorityFindWorkDesc"),
      cta: t("priorityFindWorkCta"),
      onClick: () => router.push(withLocale("/projects"))
    };
  }

  const showOnboarding = !hideOnboarding && activeProjects.length === 0 && myProposals.length === 0;

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="freelancer" fallbackPath={withLocale("/auth")}>
      <section aria-label="Freelancer dashboard" className="pb-24 xl:pb-10">
        <div className="grid gap-0">
          <main className="min-w-0 bg-transparent">

            <div className="mx-auto max-w-[1680px] p-4 md:p-8">
              {me.data?.verification_status !== "verified" && <VerificationBanner user={me.data} />}

              <section className="mb-10">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="mb-2 font-headline text-3xl font-extrabold tracking-tight text-primary">{t("greeting", { name: freelancerName })}</h1>
                    <p className="font-medium text-on-surface/70">{t("summaryLine", { pending: pendingProposals, active: activeProjects.length })}</p>
                    <p className="mt-2 text-[13px] text-on-surface/60">
                      {t("proposalStats", { pending: pendingProposals, rejected: rejectedProposals, accepted: acceptedProposals })}
                    </p>
                    {priorityAction && (
                      <div className="mt-8 max-w-3xl rounded-2xl bg-surface-container-low px-6 py-5 shadow-sm transition-all hover:shadow-ambient">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-primary-fixed text-primary">●</span>
                            <div>
                            <p className="font-headline text-sm font-bold text-on-surface">{priorityAction.title}</p>
                            <p className="mt-1 text-xs text-on-surface/60">{priorityAction.desc}</p>
                            </div>
                          </div>
                          <button type="button" onClick={priorityAction.onClick} className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5">
                            {priorityAction.cta}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="self-start">
                    <VerifiedBadge status={me.data.verification_status} verified={me.data.is_verified} />
                  </div>
                </div>
              </section>

              {showOnboarding ? (
                <section className="mb-10 rounded-3xl bg-surface-container-low p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="ui-eyebrow">{t("onboardingEyebrow")}</p>
                      <h2 className="mt-2 font-headline text-2xl font-black text-primary">{t("onboardingTitle")}</h2>
                      <p className="mt-2 text-[13px] text-on-surface/60">{t("onboardingSubtitle")}</p>
                    </div>
                    <button
                      type="button"
                      className="ui-btn-ghost"
                      onClick={() => {
                        try {
                          localStorage.setItem("freelancer_onboarding_dismissed_v1", "1");
                        } catch {}
                        setHideOnboarding(true);
                      }}
                    >
                      {t("onboardingDismiss")}
                    </button>
                  </div>
                  <ul className="mt-5 grid gap-3 md:grid-cols-2">
                    <li className="rounded-2xl bg-surface-container-lowest p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface/55">{t("onboardingStep1")}</p>
                      <Link href={withLocale("/freelancer/profile")} className="mt-2 inline-flex text-[13px] font-semibold text-primary">{t("onboardingStep1Link")}</Link>
                    </li>
                    <li className="rounded-2xl bg-surface-container-lowest p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface/55">{t("onboardingStep2")}</p>
                      <Link href={withLocale("/freelancer/profile#portfolio")} className="mt-2 inline-flex text-[13px] font-semibold text-primary">{t("onboardingStep2Link")}</Link>
                    </li>
                    <li className="rounded-2xl bg-surface-container-lowest p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface/55">{t("onboardingStep3")}</p>
                      <Link href={withLocale("/projects")} className="mt-2 inline-flex text-[13px] font-semibold text-primary">{t("onboardingStep3Link")}</Link>
                    </li>
                    <li className="rounded-2xl bg-surface-container-lowest p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface/55">{t("onboardingStep4")}</p>
                      <Link href={withLocale("/projects")} className="mt-2 inline-flex text-[13px] font-semibold text-primary">{t("onboardingStep4Link")}</Link>
                    </li>
                  </ul>
                </section>
              ) : null}

              <section className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-sm transition-all hover:shadow-ambient">
                  <div className="mb-6 flex items-start justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface/55 font-headline">{t("totalEarnings")}</span>
                    <div className="rounded-xl bg-surface-container-low p-2 text-primary">
                      <DashboardIcon name="payments" className="h-5 w-5 opacity-40" />
                    </div>
                  </div>
                  <span className="text-4xl font-extrabold text-on-surface font-headline tracking-tight">{formatMnt(earnings)}</span>
                  <p className="mt-4 text-[11px] font-bold text-on-surface/55 font-headline tracking-wide uppercase">{t("completedProjectsCount", { count: completedProjects.length })}</p>
                </div>

                <div className="primary-gradient rounded-3xl p-8 text-white shadow-ambient transition-all hover:-translate-y-1">
                  <div className="mb-6 flex items-start justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60 font-headline">{t("pendingLabel")}</span>
                    <div className="rounded-xl bg-white/10 p-2">
                      <DashboardIcon name="hourglass" className="h-5 w-5 opacity-60" />
                    </div>
                  </div>
                  <span className="text-4xl font-extrabold text-white font-headline tracking-tight">{formatMnt(pendingPayout)}</span>
                  <p className="mt-4 text-[11px] font-bold text-white/50 font-headline tracking-wide uppercase">{t("pendingEscrow", { count: activeProjects.length })}</p>
                </div>

                <div className="rounded-3xl bg-surface-container-low p-8 transition-all hover:bg-surface-container-lowest hover:shadow-ambient">
                  <div className="mb-6 flex items-start justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface/55 font-headline">{t("ratingLabel")}</span>
                    <div className="rounded-xl bg-surface-container-high p-2 text-primary">
                      <DashboardIcon name="star" className="h-5 w-5 opacity-40" />
                    </div>
                  </div>
                  <span className="text-4xl font-extrabold text-on-surface font-headline tracking-tight">
                    {(rating.data?.average ?? 0).toFixed(1)}
                  </span>
                  <p className="mt-4 text-[11px] font-bold text-on-surface/55 font-headline tracking-wide uppercase">
                    {t("reviewsCount", { count: rating.data?.total ?? 0 })}
                  </p>
                </div>
              </section>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.6fr]">
                <div className="space-y-6">
                  <div className="overflow-hidden rounded-[2.5rem] bg-surface-container-lowest shadow-sm">
                    <div className="flex items-center justify-between p-8">
                      <h2 className="text-xl font-extrabold text-primary font-headline tracking-tight">{t("activeProjectsSection")}</h2>
                      <button type="button" onClick={() => setActiveFilter("all")} className="text-[11px] font-bold uppercase tracking-widest text-secondary hover:underline font-headline">{t("viewAll")}</button>
                    </div>
                    {!filteredActiveProjects.length ? (
                      <div className="p-8">
                        <EmptyState
                          label={activeFilter === "all" ? t("noActive") : t("noActiveForFilter")}
                          action={<Link href={withLocale("/projects")} className="inline-flex min-h-12 items-center rounded-xl primary-gradient px-6 text-sm font-bold text-primary-fixed shadow-ambient">{t("browseProjects")}</Link>}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="hidden overflow-x-auto md:block">
                          <table className="w-full text-left">
                          <thead className="bg-surface-container-low/50">
                            <tr>
                              <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-on-surface/55 font-headline">{t("colProjectName")}</th>
                              <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-on-surface/55 font-headline">{t("colClient")}</th>
                              <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-on-surface/55 font-headline">{t("colDeadline")}</th>
                              <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-on-surface/55 font-headline">{t("colNextStep")}</th>
                              <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-on-surface/55 font-headline">{t("colStatus")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredActiveProjects.map((project) => {
                              const meta = projectStatusMetaKeys(project.status);
                              return (
                                <tr key={project.id} className="transition-colors hover:bg-surface-container-low/30 odd:bg-surface-container-low/20">
                                  <td className="px-8 py-6">
                                    <p className="text-sm font-bold text-on-surface font-headline">{project.title}</p>
                                    <p className="mt-0.5 text-[11px] font-bold text-on-surface/45 font-headline">{project.category || t("generalProject")}</p>
                                  </td>
                                  <td className="px-8 py-6 text-sm font-bold text-on-surface font-headline italic opacity-80">{t("clientLabel", { id: project.owner })}</td>
                                  <td className="px-8 py-6 text-sm text-on-surface/60 font-medium">{project.timeline_days ? t("daysRemaining", { count: project.timeline_days }) : t("deadlineUnknown")}</td>
                                  <td className="px-8 py-6 text-[13px] text-primary font-medium">{t(meta.nextStepKey)}</td>
                                  <td className="px-8 py-6">
                                    <StatusPill label={t(meta.labelKey)} tone={meta.tone} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <ul className="grid gap-3 p-4 md:hidden">
                        {filteredActiveProjects.map((project) => {
                          const meta = projectStatusMetaKeys(project.status);
                          return (
                            <li key={project.id} className="rounded-[1.5rem] bg-surface-container-low p-4 shadow-[0_10px_24px_rgba(3,22,54,0.06)]">
                              <div className="flex items-start justify-between gap-3">
                                <p className="font-semibold text-primary font-headline">{project.title}</p>
                                <StatusPill label={t(meta.labelKey)} tone={meta.tone} />
                              </div>
                              <div className="mt-2 text-xs text-on-surface/60">
                                <p>{project.category || t("generalProject")}</p>
                                <p className="mt-1 italic">{t("clientLabel", { id: project.owner })} · {project.timeline_days ? t("daysRemaining", { count: project.timeline_days }) : t("deadlineUnknownMobile")}</p>
                              </div>
                              <div className="mt-3 rounded-xl bg-surface-container-lowest px-3 py-2">
                                <p className="text-[11px] font-semibold text-primary">{t("nextStepLabel")}</p>
                                <p className="mt-1 text-xs text-on-surface/65">{t(meta.nextStepKey)}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                    )}
                  </div>

                  <div>
                    <div className="mb-8 flex items-center justify-between">
                      <h2 className="text-xl font-extrabold text-primary font-headline tracking-tight">{t("recommendedProjects")}</h2>
                      <Link href={withLocale("/projects")} className="rounded-xl bg-primary px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-primary-fixed shadow-ambient hover:-translate-y-0.5 transition-all">{t("findWork")}</Link>
                    </div>
                    {filteredRecommendations.length ? (
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {filteredRecommendations.map((proposal, index) => {
                          const project = projectById.get(Number(proposal.project));
                          const ageInfo = proposalAgeLabelRaw(proposal.created_at);
                          return (
                            <div key={proposal.id} className="group rounded-3xl bg-surface-container-lowest p-6 shadow-sm transition-all hover:shadow-ambient">
                              <div className="mb-4 flex items-start justify-between">
                                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest font-headline ${index === 0 ? "bg-secondary text-white" : "bg-primary-fixed text-primary"}`}>
                                  {index === 0 ? t("highBudget") : t("quickStart")}
                                </span>
                                <span className="text-[10px] font-bold text-on-surface/45 font-headline uppercase tracking-widest">{t(ageInfo.key, ageInfo.params)}</span>
                              </div>
                              <h3 className="mb-3 text-lg font-bold text-on-surface transition-colors group-hover:text-primary font-headline">{project?.title || `${t("project")} #${proposal.project}`}</h3>
                              <p className="mb-6 line-clamp-2 text-xs leading-relaxed text-on-surface/60">{project?.description || proposal.message || t("matchingProposal")}</p>
                              <div className="ui-divider-soft" />
                              <div className="flex items-center justify-between pt-4">
                                <span className="text-lg font-black text-primary font-headline tracking-tighter">{formatMnt(Number(proposal.price || 0))}</span>
                                <button type="button" className="text-on-surface/45 hover:text-primary transition-colors transition-transform hover:scale-110" onClick={() => openEditModal(proposal)}>✎</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <EmptyState
                        label={t("noActiveProjects")}
                        description={t("noActiveProjectsDesc")}
                        action={<Link href={withLocale("/projects")} className="inline-flex min-h-11 items-center gap-2 rounded-xl primary-gradient px-6 text-sm font-bold text-primary-fixed shadow-ambient hover:-translate-y-0.5 transition-all">{t("findWork")}</Link>}
                      />
                    )}
                  </div>
                </div>

                  <aside className="space-y-6">
                  {recentProposals.length ? (
                    <div className="rounded-[2rem] bg-surface-container-lowest p-6 shadow-sm">
                      <h3 className="font-headline text-lg font-black text-primary">{t("recentProposals")}</h3>
                      <ul className="mt-4 space-y-3">
                        {recentProposals.map((proposal) => {
                          const linkedProject = projectById.get(Number(proposal.project));
                          const ageInfo = proposalAgeLabelRaw(proposal.created_at);
                          const statusKey = proposal.status === "accepted" ? "proposalStatusAccepted" : proposal.status === "rejected" ? "proposalStatusRejected" : proposal.status === "withdrawn" ? "proposalStatusWithdrawn" : "proposalStatusPending";
                          return (
                            <li key={`proposal-row-${proposal.id}`} className="rounded-xl bg-surface-container-low p-3">
                              <p className="text-[13px] font-bold text-primary">{linkedProject?.title || `${t("project")} #${proposal.project}`}</p>
                              <p className="mt-1 text-[11px] text-on-surface/60">
                                {formatMnt(Number(proposal.price || 0))} • {t(ageInfo.key, ageInfo.params)}
                              </p>
                              <p className="mt-1 text-[11px] font-semibold text-secondary">{t(statusKey)}</p>
                            </li>
                          );
                        })}
                      </ul>
                      <Link href={withLocale("/freelancer/proposals")} className="mt-4 inline-flex text-[12px] font-bold text-primary underline underline-offset-4">
                        {t("viewAllProposals")}
                      </Link>
                    </div>
                  ) : null}

                  <div className="relative overflow-hidden rounded-[2.5rem] bg-surface-container-lowest p-8 shadow-sm transition-all hover:shadow-ambient">
                    <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
                    <h2 className="mb-8 text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface/55 font-headline">{t("profilePerformance")}</h2>
                    <div className="relative mx-auto mb-8 h-40 w-40">
                      <svg className="h-full w-full -rotate-90">
                        <circle className="text-surface-container-low" cx="80" cy="80" fill="transparent" r="74" stroke="currentColor" strokeWidth="10" />
                        <circle
                          className="text-secondary"
                          cx="80"
                          cy="80"
                          fill="transparent"
                          r="74"
                          stroke="currentColor"
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray="464.9"
                          strokeDashoffset={464.9 - (464.9 * profileCompleteness) / 100}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-primary font-headline">{profileCompleteness}%</span>
                        <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-on-surface/45 font-headline">{t("completed")}</span>
                      </div>
                    </div>
                    <ul className="mb-8 space-y-4">
                      <li className="flex items-center text-[13px] font-bold text-on-surface font-headline"><span className="mr-3 text-secondary">✦</span> {t("portfolioAdded")}</li>
                      <li className="flex items-center text-[13px] font-bold text-on-surface font-headline"><span className="mr-3 text-secondary">✦</span> {t("emailVerified")}</li>
                      <li className="flex items-center text-[13px] font-medium text-on-surface/45 font-headline italic opacity-60"><span className="mr-3 text-on-surface/35">○</span> {t("phoneVerify")}</li>
                    </ul>
                    <div className="flex items-center justify-between rounded-2xl bg-surface-container-low p-6">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/55 font-headline">{t("ratingLabel")}</p>
                        <div className="mt-2 flex items-center">
                          <span className="mr-3 text-2xl font-black text-primary font-headline">{(rating.data?.average ?? 0).toFixed(1)}</span>
                          <RatingStars value={rating.data?.average ?? 0} />
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-on-surface/45 font-headline uppercase tracking-widest">{t("reviewsCount", { count: rating.data?.total ?? 0 })}</span>
                    </div>
                  </div>

                  {me.data.verification_status !== "verified" && verificationGuidance ? (
                    <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
                      <p className="text-sm font-semibold text-primary">{verificationGuidance.title}</p>
                      <p className="mt-2 text-xs text-on-surface/70">{verificationGuidance.text}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link href={verificationGuidance.href} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-[13px] font-semibold text-white">{verificationGuidance.cta}</Link>
                        <Link href={withLocale("/support?topic=verification")} className="inline-flex min-h-11 items-center rounded-xl bg-surface-container-low px-4 text-[13px] font-semibold text-on-surface/75">{t("helpLabel")}</Link>
                      </div>
                    </div>
                  ) : null}

                  {premiumMe.data && !premiumMe.data.is_premium ? (
                    <div className="group relative overflow-hidden rounded-2xl bg-primary-container p-6 text-white">
                      <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:10px_10px]" />
                      <h3 className="relative z-10 mb-2 text-sm font-bold">{t("premiumTitle")}</h3>
                      <p className="relative z-10 mb-6 text-xs text-primary-fixed">{t("premiumDesc")}</p>
                      <Link href={withLocale("/pro")} className="relative z-10 flex min-h-11 w-full items-center justify-center rounded-lg bg-surface-container-lowest py-2 text-xs font-bold text-primary transition-all hover:bg-secondary hover:text-white">{t("premiumCta")}</Link>
                    </div>
                  ) : null}

                  <div className="rounded-2xl bg-surface-container-low p-6">
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-primary">{t("recentTransactions")}</h3>
                    <div className="space-y-4">
                      {completedProjects.length ? completedProjects.slice(0, 4).map((project) => {
                        const net = Math.round(Number(project.budget || 0) * (1 - COMMISSION));
                        return (
                          <div key={project.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                                <span className="text-sm text-green-600" aria-hidden>↗</span>
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-primary">{project.title}</p>
                                <p className="text-[9px] text-on-surface/45">{t("transactionCompleted")}</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-green-600">+{formatMnt(net)}</span>
                          </div>
                        );
                      }) : (
                        <p className="text-xs text-on-surface/60">{t("noTransactions")}</p>
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            {editingProposalId !== null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm">
                <div className="w-full max-w-[480px] rounded-2xl bg-surface-container-lowest p-6 shadow-modal">
                  <h3 className="text-lg font-semibold text-on-surface">{t("editProposal")}</h3>
                  <form className="mt-4 space-y-3" onSubmit={editForm.handleSubmit((v) => updateProposalMutation.mutate(v))}>
                    <label className="block text-[13px] font-medium text-on-surface/75">
                      {t("price")} (MNT)
                      <input type="number" {...editForm.register("price", { valueAsNumber: true })} className="mt-1" />
                    </label>
                    <label className="block text-[13px] font-medium text-on-surface/75">
                      {t("timeline")} ({t("days")})
                      <input type="number" {...editForm.register("timeline_days", { valueAsNumber: true })} className="mt-1" />
                    </label>
                    <label className="block text-[13px] font-medium text-on-surface/75">
                      {t("message")}
                      <textarea {...editForm.register("message")} rows={3} className="mt-1" />
                    </label>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        className="min-h-11 flex-1 rounded-lg bg-surface-container-low py-2 text-[13px] text-on-surface/75 hover:bg-surface-container"
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
          </main>
        </div>

        <ConfirmationDialog
          open={submitTarget !== null}
          title={t("confirmSubmitTitle")}
          message={
            submitProject
              ? t("confirmSubmitMessage", { title: submitProject.title })
              : t("confirmSubmitGeneric")
          }
          confirmLabel={t("confirmSubmitBtn")}
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
