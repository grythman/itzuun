"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { EmptyState, ErrorState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { ConfirmationDialog, RatingStars, StatusPill, VerifiedBadge } from "@/components/ui-kit";
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
    | "bank";
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
  const projects = useProjects(1);
  const premiumMe = usePremiumMe({ enabled: !!me.data });
  const profile = useMyProfile();
  const queryClient = useQueryClient();
  const [editingProposalId, setEditingProposalId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "in_progress" | "awaiting_client_review" | "disputed">("all");
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
      title: "Баталгаажуулалт хянагдаж байна",
      text: "Түр хүлээгээд meanwhile профайлаа сайжруулж, төсөл хайж shortlist бэлд.",
      cta: "Профайл нээх",
      href: withLocale("/freelancer/profile"),
    };
  } else if (me.data.verification_status === "suspended") {
    verificationGuidance = {
      tone: "danger",
      title: "Данс түр хаагдсан",
      text: "Support-т тайлбар илгээж сэргээх хүсэлт гарга. Идэвхтэй ажлаа чат дээр үргэлжлүүлж болно.",
      cta: "Support",
      href: withLocale("/support"),
    };
  } else if (me.data.verification_status !== "verified") {
    verificationGuidance = {
      tone: "info",
      title: "Баталгаажуулалт шаардлагатай",
      text: "Санал илгээх боломжоо бүрэн нээхийн тулд verification хүсэлтээ одоо илгээ.",
      cta: "Verification эхлүүлэх",
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
  const availableBalance = Math.max(0, Math.round(earnings * 0.33));
  const pendingPayout = Math.max(0, earnings - availableBalance);
  const latestTransactions = activeProjects.slice(0, 2).map((project, index) => ({
    id: project.id,
    label: project.title,
    date: projectStatusMeta(project.status).label,
    amount: index === 0 ? Number(project.budget || 0) : -Math.round(Number(project.budget || 0) * 0.1),
  }));
  const freelancerName = profile.data?.full_name || me.data.first_name || me.data.email?.split("@")[0] || "Фрилансер";

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="freelancer" fallbackPath={withLocale("/auth")}>
      <section aria-label="Freelancer dashboard" className="pb-24 xl:pb-10">
        <div className="grid gap-0 xl:grid-cols-[256px_minmax(0,1fr)]">
          <aside className="hidden xl:flex xl:h-screen xl:flex-col xl:space-y-2 xl:bg-surface-container-low xl:px-4 xl:py-6">
            <div className="mb-10 px-4">
              <span className="text-xl font-black text-primary font-headline tracking-tight">ITZuun</span>
            </div>
            <div className="mb-8 flex items-center space-x-3 px-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-xs font-bold text-primary shadow-sm">
                {freelancerName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 font-headline">Сайн байна уу?</p>
                <p className="text-sm font-bold text-on-surface font-headline">{freelancerName}</p>
              </div>
            </div>
            <nav className="flex-1 space-y-1">
              <Link href={withLocale("/freelancer")} className="flex items-center space-x-3 rounded-lg bg-surface-container-lowest px-4 py-3 font-bold text-primary shadow-sm hover:shadow-ambient transition-all">
                <DashboardIcon name="dashboard" className="h-5 w-5" />
                <span className="text-sm font-headline">Хянах самбар</span>
              </Link>
              <Link href={withLocale("/freelancer/proposals")} className="flex items-center space-x-3 rounded-lg px-4 py-3 text-surface-600 transition-all hover:translate-x-1 hover:bg-surface-container-lowest/50 hover:text-on-surface">
                <DashboardIcon name="work" className="h-5 w-5" />
                <span className="text-sm font-headline">Миний төслүүд</span>
              </Link>
              <Link href={withLocale("/projects")} className="flex items-center space-x-3 rounded-lg px-4 py-3 text-surface-600 transition-all hover:translate-x-1 hover:bg-surface-container-lowest/50 hover:text-on-surface">
                <DashboardIcon name="search" className="h-5 w-5" />
                <span className="text-sm font-headline">Ажил хайх</span>
              </Link>
              <Link href={withLocale("/notifications")} className="flex items-center space-x-3 rounded-lg px-4 py-3 text-surface-600 transition-all hover:translate-x-1 hover:bg-surface-container-lowest/50 hover:text-on-surface">
                <DashboardIcon name="payments" className="h-5 w-5" />
                <span className="text-sm font-headline">Санхүү</span>
              </Link>
              <Link href={withLocale("/freelancer/profile")} className="flex items-center space-x-3 rounded-lg px-4 py-3 text-surface-600 transition-all hover:translate-x-1 hover:bg-surface-container-lowest/50 hover:text-on-surface">
                <DashboardIcon name="settings" className="h-5 w-5" />
                <span className="text-sm font-headline">Тохиргоо</span>
              </Link>
            </nav>
            <div className="border-t border-outline-variant/10 pt-4">
              <Link href={withLocale("/support")} className="flex items-center space-x-3 rounded-lg px-4 py-3 text-surface-500 transition-all hover:translate-x-1">
                <DashboardIcon name="help" className="h-5 w-5" />
                <span className="text-sm font-headline">Тусламж</span>
              </Link>
              <div className="mt-4 px-4">
                <Link href={withLocale("/projects")} className="flex min-h-12 w-full items-center justify-center rounded-xl primary-gradient px-4 text-sm font-bold text-primary-fixed shadow-ambient hover:-translate-y-0.5 transition-all">
                  Төсөл эхлүүлэх
                </Link>
              </div>
            </div>
          </aside>

          <main className="min-w-0 bg-surface">
            <header className="sticky top-0 z-10 flex h-auto flex-col justify-between gap-4 bg-surface/80 px-4 py-4 backdrop-blur-md md:flex-row md:items-center md:px-8 xl:h-16">
              <div className="flex max-w-xl flex-1 items-center">
                <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
                    <DashboardIcon name="search" className="h-4 w-4" />
                  </span>
                  <input className="w-full rounded-full border-none bg-surface-container-low py-2 pl-10 pr-4 text-sm text-on-surface focus:ring-0 focus:bg-surface-container-lowest focus:shadow-ambient transition-all" placeholder="Ажил хайх..." type="text" />
                </div>
              </div>
              <div className="ml-0 flex items-center space-x-6 md:ml-8">
                <div className="hidden space-x-6 lg:flex">
                  <Link href={withLocale("/projects")} className="border-b-2 border-secondary pb-1 text-sm font-bold text-primary font-headline">Ажил хайх</Link>
                  <Link href={withLocale("/freelancer/proposals")} className="text-sm font-medium text-surface-500 transition-colors hover:text-secondary font-headline">Миний төслүүд</Link>
                </div>
                <div className="flex items-center space-x-4 border-l border-outline-variant/30 pl-6">
                  <button className="relative text-surface-500 transition-colors hover:text-primary"><DashboardIcon name="notifications" className="h-5 w-5" /><span className="absolute right-0 top-0 h-2 w-2 rounded-full border-2 border-surface bg-red-500" /></button>
                  <button className="text-surface-500 transition-colors hover:text-primary"><DashboardIcon name="chat" className="h-5 w-5" /></button>
                  <button className="text-surface-500 transition-colors hover:text-primary"><DashboardIcon name="wallet" className="h-5 w-5" /></button>
                </div>
              </div>
            </header>

            <div className="mx-auto max-w-[1680px] p-4 md:p-8">
              {me.data?.verification_status !== "verified" && <VerificationBanner user={me.data} />}

              <section className="mb-10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h1 className="mb-2 font-headline text-3xl font-extrabold tracking-tight text-[#031636]">Өдрийн мэнд, {freelancerName} 👋</h1>
                    <p className="font-medium text-[#44474e]">{pendingProposals} шинэ санал, {activeProjects.length} идэвхтэй төсөл байна.</p>
                  </div>
                  <VerifiedBadge status={me.data.verification_status} verified={me.data.is_verified} />
                </div>
              </section>

              <section className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-sm transition-all hover:shadow-ambient">
                  <div className="mb-6 flex items-start justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-surface-500 font-headline">Нийт орлого</span>
                    <div className="rounded-xl bg-surface-container-low p-2 text-primary">
                      <DashboardIcon name="payments" className="h-5 w-5 opacity-40" />
                    </div>
                  </div>
                  <span className="text-4xl font-extrabold text-on-surface font-headline tracking-tight">{formatMnt(earnings)}</span>
                  <p className="mt-4 flex items-center text-[11px] font-bold text-secondary font-headline"><DashboardIcon name="trend" className="mr-1.5 h-3.5 w-3.5" /> +12% Өмнөх сараас</p>
                </div>

                <div className="primary-gradient rounded-3xl p-8 text-white shadow-ambient transition-all hover:-translate-y-1">
                  <div className="mb-6 flex items-start justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60 font-headline">Хүлээгдэж буй</span>
                    <div className="rounded-xl bg-white/10 p-2">
                      <DashboardIcon name="hourglass" className="h-5 w-5 opacity-60" />
                    </div>
                  </div>
                  <span className="text-4xl font-extrabold text-white font-headline tracking-tight">{formatMnt(pendingPayout)}</span>
                  <p className="mt-4 text-[11px] font-bold text-white/50 font-headline tracking-wide uppercase">{activeProjects.length} төслийн санхүүжилт</p>
                </div>

                <div className="rounded-3xl bg-surface-container-low p-8 transition-all hover:bg-surface-container-lowest hover:shadow-ambient">
                  <div className="mb-6 flex items-start justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-surface-500 font-headline">Ү                  <div className="overflow-hidden rounded-[2.5rem] bg-surface-container-lowest shadow-sm">
                    <div className="flex items-center justify-between border-b border-outline-variant/10 p-8">
                      <h2 className="text-xl font-extrabold text-primary font-headline tracking-tight">Идэвхтэй төслүүд</h2>
                      <button type="button" onClick={() => setActiveFilter("all")} className="text-[11px] font-bold uppercase tracking-widest text-secondary hover:underline font-headline">Бүгдийг үзэх</button>
                    </div>
                    {!filteredActiveProjects.length ? (
                      <div className="p-8">
                        <EmptyState
                          label={activeFilter === "all" ? t("noActive") : "Энэ төлөвт идэвхтэй ажил алга."}
                          action={<Link href={withLocale("/projects")} className="inline-flex min-h-12 items-center rounded-xl primary-gradient px-6 text-sm font-bold text-primary-fixed shadow-ambient">{t("browseProjects")}</Link>}
                        />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-surface-container-low/50">
                            <tr>
                              <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-surface-500 font-headline">Төслийн нэр</th>
                              <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-surface-500 font-headline">Захиалагч</th>
                              <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-surface-500 font-headline">Дуусах хугацаа</th>
                              <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-surface-500 font-headline">Явц</th>
                              <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-surface-500 font-headline">Төлөв</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/5">
                            {filteredActiveProjects.map((project) => {
                              const meta = projectStatusMeta(project.status);
                              const progress = project.status === "awaiting_client_review" ? 100 : project.status === "in_progress" ? 75 : 30;
                              return (
                                <tr key={project.id} className="transition-colors hover:bg-surface-container-low/30">
                                  <td className="px-8 py-6">
                                    <p className="text-sm font-bold text-on-surface font-headline">{project.title}</p>
                                    <p className="text-[11px] font-bold text-surface-400 font-headline mt-0.5">{project.category || "General project"}</p>
                                  </td>
                                  <td className="px-8 py-6 text-sm font-bold text-on-surface font-headline italic opacity-80">Client #{project.owner}</td>
                                  <td className="px-8 py-6 text-sm text-surface-500 font-medium">{project.timeline_days ? `${project.timeline_days} хоног` : "Тодорхойгүй"}</td>
                                  <td className="px-8 py-6">
                                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-container-low">
                                      <div className="h-full primary-gradient" style={{ width: `${progress}%` }} />
                                    </div>
                                    <span className="mt-1.5 block text-[10px] font-bold text-primary font-headline uppercase tracking-widest">{progress}% САНАЛ</span>
                                  </td>
                                  <td className="px-8 py-6">
                                    <StatusPill label={meta.label} tone={meta.tone} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-8 flex items-center justify-between">
                      <h2 className="text-xl font-extrabold text-primary font-headline tracking-tight">Танд тохирох шинэ төслүүд</h2>
                      <Link href={withLocale("/projects")} className="rounded-xl bg-primary px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-primary-fixed shadow-ambient hover:-translate-y-0.5 transition-all">Ажил хайх</Link>
                    </div>
                    {filteredRecommendations.length ? (
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {filteredRecommendations.map((proposal, index) => {
                          const project = projectById.get(Number(proposal.project));
                          return (
                            <div key={proposal.id} className="group rounded-3xl bg-surface-container-lowest p-6 shadow-sm transition-all hover:shadow-ambient">
                              <div className="mb-4 flex items-start justify-between">
                                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest font-headline ${index === 0 ? "bg-secondary text-white" : "bg-primary-fixed text-primary"}`}>
                                  {index === 0 ? "High Budget" : "Urgent"}
                                </span>
                                <span className="text-[10px] font-bold text-surface-400 font-headline uppercase tracking-widest">{proposalAgeLabel(proposal.created_at)}</span>
                              </div>
                              <h3 className="mb-3 text-lg font-bold text-on-surface transition-colors group-hover:text-primary font-headline">{project?.title || `Төсөл #${proposal.project}`}</h3>
                              <p className="mb-6 line-clamp-2 text-xs leading-relaxed text-surface-500">{project?.description || proposal.message || "Саналд тохирох төсөл."}</p>
                              <div className="flex items-center justify-between border-t border-outline-variant/10 pt-4">
                                <span className="text-lg font-black text-primary font-headline tracking-tighter">{formatMnt(Number(proposal.price || 0))}</span>
                                <button type="button" className="text-surface-400 hover:text-primary transition-colors transition-transform hover:scale-110" onClick={() => openEditModal(proposal)}>✎</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <EmptyState
                        label={t("noProposals")}
                        action={<Link href={withLocale("/projects")} className="inline-flex min-h-12 items-center rounded-xl primary-gradient px-6 text-sm font-bold text-primary-fixed shadow-ambient">{t("browseProjects")}</Link>}
                      />
                    )}
                  </div>
                </div>

                  <aside className="space-y-6">
                  <div className="relative overflow-hidden rounded-[2.5rem] bg-surface-container-lowest p-8 shadow-sm transition-all hover:shadow-ambient">
                    <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
                    <h2 className="mb-8 text-[11px] font-bold uppercase tracking-[0.2em] text-surface-500 font-headline">Профайлын гүйцэтгэл</h2>
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
                        <span className="text-[10px] font-bold uppercase tracking-widest text-surface-400 font-headline mt-1">Дууссан</span>
                      </div>
                    </div>
                    <ul className="mb-8 space-y-4">
                      <li className="flex items-center text-[13px] font-bold text-on-surface font-headline"><span className="mr-3 text-secondary">✦</span> Портфолио нэмсэн</li>
                      <li className="flex items-center text-[13px] font-bold text-on-surface font-headline"><span className="mr-3 text-secondary">✦</span> И-мэйл баталгаажсан</li>
                      <li className="flex items-center text-[13px] font-medium text-surface-400 font-headline italic opacity-60"><span className="mr-3 text-surface-container">○</span> Утас баталгаажуулах</li>
                    </ul>
                    <div className="flex items-center justify-between rounded-2xl bg-surface-container-low p-6">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 font-headline">Үнэлгээ</p>
                        <div className="mt-2 flex items-center">
                          <span className="mr-3 text-2xl font-black text-primary font-headline">{(rating.data?.average ?? 0).toFixed(1)}</span>
                          <RatingStars value={rating.data?.average ?? 0} />
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-surface-400 font-headline uppercase tracking-widest">{rating.data?.total ?? 0} сэтгэгдэл</span>
                    </div>
                  </div>

                  {me.data.verification_status !== "verified" && verificationGuidance ? (
                    <div className="rounded-2xl border border-[#d8e3ee] bg-white p-5">
                      <p className="text-sm font-semibold text-[#031636]">{verificationGuidance.title}</p>
                      <p className="mt-2 text-xs text-[#44474e]">{verificationGuidance.text}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link href={verificationGuidance.href} className="inline-flex min-h-11 items-center rounded-xl bg-[#031636] px-4 text-[13px] font-semibold text-white">{verificationGuidance.cta}</Link>
                        <Link href={withLocale("/support?topic=verification")} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700">Support</Link>
                      </div>
                    </div>
                  ) : null}

                  {premiumMe.data && !premiumMe.data.is_premium ? (
                    <div className="group relative overflow-hidden rounded-2xl bg-[#1a2b4c] p-6 text-white">
                      <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:10px_10px]" />
                      <h3 className="relative z-10 mb-2 text-sm font-bold">ITZuun Premium</h3>
                      <p className="relative z-10 mb-6 text-xs text-[#c7d2e6]">Төслүүдэд түрүүлж санал өгөх болон шимтгэлийн хөнгөлөлт эдлээрэй.</p>
                      <Link href={withLocale("/pro")} className="relative z-10 flex min-h-11 w-full items-center justify-center rounded-lg bg-white py-2 text-xs font-bold text-[#031636] transition-all hover:bg-[#13696a] hover:text-white">Шинэчлэх</Link>
                    </div>
                  ) : null}

                  <div className="rounded-2xl bg-[#f2f4f6] p-6">
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#031636]">Сүүлийн үеийн гүйлгээ</h3>
                    <div className="space-y-4">
                      {latestTransactions.length ? latestTransactions.map((txn) => (
                        <div key={txn.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${txn.amount >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                              <span className={`text-sm ${txn.amount >= 0 ? "text-green-600" : "text-red-600"}`}>{txn.amount >= 0 ? "↗" : "↙"}</span>
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-[#031636]">{txn.label}</p>
                              <p className="text-[9px] text-slate-400">{txn.date}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold ${txn.amount >= 0 ? "text-green-600" : "text-red-600"}`}>{txn.amount >= 0 ? "+" : "-"}{formatMnt(Math.abs(txn.amount))}</span>
                        </div>
                      )) : (
                        <p className="text-xs text-slate-500">Гүйлгээ хараахан бүртгэгдээгүй.</p>
                      )}
                    </div>
                  </div>
                </aside>
              </div>
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
          </main>
        </div>

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
