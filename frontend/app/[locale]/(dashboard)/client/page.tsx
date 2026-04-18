"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { EmptyState, ErrorState } from "@/components/shared/states";
import { RoleGuard } from "@/components/shared/role-guard";
import { ConfirmationDialog, StatusPill } from "@/components/ui";
import { VerificationBanner } from "@/components/shared/verification-banner";
import { projectsApi, toArray } from "@/lib/api/endpoints";
import { useMe, useMutation, useMyProfile, useProjectProposals, useProjects } from "@/lib/hooks";
import { useToastStore } from "@/lib/stores/toast-store";
import type { ProposalDto } from "@/lib/api/types";

function proposalFreelancerLabel(freelancer: ProposalDto["freelancer"]): string | number {
  if (typeof freelancer === "number" || typeof freelancer === "string") return freelancer;
  return freelancer.id;
}

function formatMnt(amount: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(amount)} ₮`;
}

function formatMntInline(amount: number): string {
  return `₮${new Intl.NumberFormat("mn-MN").format(amount)}`;
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return "Шинэчлэлийн мэдээлэл алга";
  const diffMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs)) return "Шинэчлэлийн мэдээлэл алга";
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Яг одоо шинэчлэгдсэн";
  if (diffMin < 60) return `${diffMin} минутын өмнө шинэчлэгдсэн`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} цагийн өмнө шинэчлэгдсэн`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} өдрийн өмнө шинэчлэгдсэн`;
}

function projectProgress(status: string): number {
  if (status === "completed") return 100;
  if (status === "awaiting_client_review") return 92;
  if (status === "in_progress") return 65;
  if (status === "disputed") return 58;
  return 18;
}

function projectStatusLabel(status: string): string {
  if (status === "in_progress") return "Ажил явагдаж байна";
  if (status === "awaiting_client_review") return "Таны шалгалтыг хүлээж байна 🕐";
  if (status === "completed") return "Бүрэн дууссан";
  if (status === "disputed") return "Маргаан шийдвэрлэж байна";
  return "Нээлттэй";
}

function initials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "IZ";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
}

function DashboardIcon({ name, className = "h-5 w-5" }: { name: "folder" | "add" | "doc" | "payments" | "settings" | "search" | "notifications"; className?: string }) {
  const common = { className, "aria-hidden": true };
  if (name === "folder") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M10 4 12 6h7a2 2 0 0 1 2 2v8.5A3.5 3.5 0 0 1 17.5 20h-11A3.5 3.5 0 0 1 3 16.5V7a3 3 0 0 1 3-3h4Z"/></svg>;
  }
  if (name === "add") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-6 14h-2v-4H7v-2h4V7h2v4h4v2h-4v4Z"/></svg>;
  }
  if (name === "doc") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V7h3.5L13 3.5ZM8 11h8v1.5H8V11Zm0 3h8v1.5H8V14Zm0 3h5v1.5H8V17Z"/></svg>;
  }
  if (name === "payments") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3V6Zm0 4h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8Zm11 3a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3Z"/></svg>;
  }
  if (name === "settings") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m19.4 13 .1-1-.1-1 2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-1.7-1L15 2h-6l-.3 2.9a7.5 7.5 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6-.1 1 .1 1-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 1.7 1L9 22h6l.3-2.9a7.5 7.5 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"/></svg>;
  }
  if (name === "search") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m21 20-5.6-5.6a7 7 0 1 0-1 1L20 21l1-1ZM5 10a5 5 0 1 1 10 0 5 5 0 0 1-10 0Z"/></svg>;
  }
  return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7v4.6L3.7 15A1 1 0 0 0 4.4 17h15.2a1 1 0 0 0 .7-1.7L19 13.6V9a7 7 0 0 0-7-7Zm0 20a3 3 0 0 0 2.8-2H9.2A3 3 0 0 0 12 22Z"/></svg>;
}

function statusMeta(status: string): { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info"; nextStep: string; escrowLabel: string } {
  if (status === "in_progress") {
    return { label: "Эскроу түгжээтэй", tone: "success", nextStep: "Гүйцэтгэлийг хянаад шаардлагатай үед маргаан нээ.", escrowLabel: "Мөнгө найдвартай түгжээтэй байна." };
  }
  if (status === "awaiting_client_review") {
    return { label: "Баталгаажуулалт хүлээгдэж байна", tone: "warning", nextStep: "Ажлыг шалгаад дууссаныг баталгаажуул.", escrowLabel: "Баталгаажуулмагц мөнгө фрилансер руу шилжинэ." };
  }
  if (status === "disputed") {
    return { label: "Маргаантай", tone: "danger", nextStep: "Нотолгоогоо шалгаад админы шийдвэрийг хүлээ.", escrowLabel: "Эскроу маргааны горимд байна." };
  }
  if (status === "completed") {
    return { label: "Шилжүүлсэн", tone: "info", nextStep: "Төсөл дууссан. Үнэлгээ үлдээж болно.", escrowLabel: "Эскроу амжилттай чөлөөлөгдсөн." };
  }
  return { label: "Нээлттэй", tone: "info", nextStep: "Саналуудаа харьцуулж фрилансер сонго.", escrowLabel: "Эскроу эхлээгүй байна." };
}

export default function ClientDashboardPage() {
  const t = useTranslations("ClientDash");
  const router = useRouter();
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const profile = useMyProfile();
  const projects = useProjects(1);
  const toast = useToastStore((s) => s.push);
  const proposalSectionRef = useRef<HTMLDivElement | null>(null);

  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const proposals = useProjectProposals(activeProjectId || "");
  const [releaseTarget, setReleaseTarget] = useState<number | null>(null);
  const [disputeTarget, setDisputeTarget] = useState<number | null>(null);
  const retryAll = () => {
    me.refetch();
    profile.refetch();
    projects.refetch();
    if (activeProjectId) proposals.refetch();
  };

  const releaseMutation = useMutation({
    mutationFn: (projectId: number) => projectsApi.confirmCompletion(projectId),
    onSuccess: () => {
      projects.refetch();
      toast("success", "Эскроу амжилттай чөлөөлөгдлөө.");
      setReleaseTarget(null);
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const disputeMutation = useMutation({
    mutationFn: (projectId: number) => projectsApi.createDispute(projectId, { reason: "Клиент самбараас маргаан нээв" }),
    onSuccess: () => {
      projects.refetch();
      toast("warning", "Маргаан нээгдлээ.");
      setDisputeTarget(null);
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const selectMutation = useMutation({
    mutationFn: ({ projectId, proposalId }: { projectId: number; proposalId: number }) => projectsApi.selectFreelancer(projectId, proposalId),
    onSuccess: () => {
      projects.refetch();
      proposals.refetch();
      toast("success", "Фрилансер сонгогдлоо.");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const focusProposalSection = (projectId: number) => {
    setActiveProjectId(projectId);
    setTimeout(() => proposalSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const myProjects = (projects.data?.results || []).filter((project) => project.owner === me.data?.id);
  const openProject = myProjects.find((project) => project.status === "open");

  useEffect(() => {
    if (!activeProjectId && openProject) {
      setActiveProjectId(openProject.id);
    }
  }, [activeProjectId, openProject]);

  if (me.isLoading || projects.isLoading || profile.isLoading) {
    return (
      <section className="space-y-4 pb-20">
        <div className="h-40 animate-pulse rounded-3xl bg-surface-container-low" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 animate-pulse rounded-2xl bg-surface-container-low" />
          <div className="h-24 animate-pulse rounded-2xl bg-surface-container-low" />
          <div className="h-24 animate-pulse rounded-2xl bg-surface-container-low" />
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-surface-container-lowest" />
      </section>
    );
  }
  if (me.isError || !me.data) {
    return (
      <ErrorState
        label="Нэвтэрч орно уу."
        action={
          <button className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700" onClick={() => router.push(withLocale("/auth/login"))}>
            Нэвтрэх хуудас руу
          </button>
        }
      />
    );
  }
  if (projects.isError || !projects.data) {
    return (
      <ErrorState
        label="Төслүүдийг ачаалж чадсангүй."
        action={
          <button className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700" onClick={retryAll}>
            Дахин оролдох
          </button>
        }
      />
    );
  }

  const proposalItems = proposals.data ? toArray<ProposalDto>(proposals.data) : [];
  const activeProject = myProjects.find((project) => project.id === activeProjectId) || null;

  const profileData = profile.data;
  const totalEscrow = myProjects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
  const awaitingReview = myProjects.find((project) => project.status === "awaiting_client_review");
  const inProgressProject = myProjects.find((project) => project.status === "in_progress");
  const securedEscrow = myProjects
    .filter((project) => ["in_progress", "awaiting_client_review", "disputed"].includes(project.status))
    .reduce((sum, project) => sum + Number(project.budget || 0), 0);
  const pendingEscrow = myProjects
    .filter((project) => project.status === "open")
    .reduce((sum, project) => sum + Number(project.budget || 0), 0);
  const clientName = profile.data?.full_name || me.data.first_name || me.data.email?.split("@")[0] || "Захиалагч";

  const sortedProposalItems = [...proposalItems].sort((a, b) => {
    const aScore = Number(a.price || 0) + Math.max(1, Number(a.timeline_days || 1)) * 1000;
    const bScore = Number(b.price || 0) + Math.max(1, Number(b.timeline_days || 1)) * 1000;
    return aScore - bScore;
  });

  const releaseProject = myProjects.find((p) => p.id === releaseTarget) || null;
  const disputeProject = myProjects.find((p) => p.id === disputeTarget) || null;
  const proposalInbox = sortedProposalItems.slice(0, 3);
  const proposalBadgeCount = proposalInbox.length;

  let priorityAction = null;
  if (awaitingReview) {
    priorityAction = {
      title: "Баталгаажуулалт хүлээгдэж байна 🕐",
      desc: `"${awaitingReview.title}" төслийн үр дүнг шалгаад Эскроу төлбөрийг чөлөөлнө үү.`,
      cta: "Шалгах",
      onClick: () => setReleaseTarget(awaitingReview.id)
    };
  } else if (proposalBadgeCount > 0) {
    priorityAction = {
      title: `${proposalBadgeCount} шинэ санал шалгана уу ✨`,
      desc: openProject ? `"${openProject.title}" төсөлд шинэ санал ирсэн байна.` : "Мэргэжилтнүүдийн илгээсэн саналуудтай танилцана уу.",
      cta: "Саналуудыг харах",
      onClick: () => openProject && focusProposalSection(openProject.id)
    };
  } else if (myProjects.length === 0) {
    priorityAction = {
      title: "Таны анхны төсөл 🚀",
      desc: "Шилдэг мэргэжилтнүүдтэй хамтрахын тулд яг одоо төслөө нийтлэнэ үү.",
      cta: "Төсөл нийтлэх",
      onClick: () => router.push(withLocale("/client/projects/new"))
    };
  }

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="client" fallbackPath={withLocale("/auth")}>
      <section className="pb-24 xl:pb-10">
        <div className="grid gap-0">
          <main className="min-w-0 overflow-x-hidden bg-transparent">

            <div className="mx-auto w-full max-w-[1440px] space-y-10 px-4 py-6 md:px-8 md:py-8 2xl:max-w-[1600px]">
              {me.data?.verification_status !== "verified" && <VerificationBanner user={me.data} />}

              <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                <div>
                  <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary md:text-4xl">
                    Өдрийн мэнд, {clientName} 👋
                  </h1>
                  <p className="mt-2 text-sm text-on-surface/60">
                    Таны төслүүдийн явц болон санхүүгийн тойм энд байна.
                  </p>
                  {priorityAction && (
                    <div className="mt-6 rounded-2xl bg-surface-container-low px-6 py-5 shadow-sm transition-all hover:shadow-ambient">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-secondary-fixed text-secondary">●</span>
                          <div>
                          <p className="font-headline text-sm font-bold text-on-surface">{priorityAction.title}</p>
                          <p className="mt-1 text-xs text-on-surface/60">{priorityAction.desc}</p>
                          </div>
                        </div>
                        <button type="button" onClick={priorityAction.onClick} className="shrink-0 rounded-xl bg-secondary px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5">
                          {priorityAction.cta}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3 xl:justify-end">
                  <Link href={withLocale("/client/projects/new")} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-fixed shadow-ambient transition hover:-translate-y-0.5">
                    <DashboardIcon name="add" className="h-[18px] w-[18px]" />
                    Төсөл оруулах
                  </Link>
                  <Link href={withLocale("/freelancers")} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-white shadow-ambient transition hover:-translate-y-0.5">
                    <DashboardIcon name="search" className="h-[18px] w-[18px]" />
                    Мэргэжилтэн хайх
                  </Link>
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-12">
              <div className="primary-gradient grid gap-4 rounded-[2rem] p-6 text-white shadow-ambient sm:p-8 lg:col-span-7 md:grid-cols-3">
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-white/60">Нийт зарцуулсан</p>
                    <h3 className="font-headline text-[clamp(1.7rem,2.1vw,2.7rem)] font-bold leading-[1.05] tabular-nums whitespace-nowrap">
                      {formatMntInline(totalEscrow)}
                    </h3>
                  </div>
                  <span className="mt-4 w-fit rounded bg-white/10 px-2 py-1 text-[10px]">Бүх төсөл</span>
                </div>
                <div className="flex flex-col justify-between rounded-xl bg-white/5 px-5 py-4">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-accent-300">Эскроу дансанд</p>
                    <h3 className="font-headline text-[clamp(1.7rem,2.1vw,2.7rem)] font-bold leading-[1.05] text-accent-300 tabular-nums whitespace-nowrap">
                      {formatMntInline(securedEscrow)}
                    </h3>
                  </div>
                  <p className="mt-4 text-[10px] text-white/50">Хамгаалалтай хадгалалажсан</p>
                </div>
                <div className="flex flex-col justify-between rounded-xl bg-white/5 px-5 py-4">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-white/60">Хүлээгдэж буй</p>
                    <h3 className="font-headline text-[clamp(1.7rem,2.1vw,2.7rem)] font-bold leading-[1.05] tabular-nums whitespace-nowrap">
                      {formatMntInline(pendingEscrow)}
                    </h3>
                  </div>
                  <button type="button" onClick={() => (openProject ? focusProposalSection(openProject.id) : null)} className="mt-4 w-fit text-[10px] font-bold text-accent-300 underline underline-offset-4">
                    Нэхэмжлэх харах
                  </button>
                </div>
              </div>

              <div className="flex flex-col rounded-[2rem] bg-surface-container-lowest p-6 shadow-sm lg:col-span-5">
                <div className="mb-6 flex items-center justify-between">
                  <h4 className="font-headline text-lg font-bold text-on-surface">Шинэ саналууд</h4>
                  <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700">{proposalBadgeCount || 0} ШИНЭ</span>
                </div>
                <div className="space-y-3">
                  {proposalInbox.length > 0 ? proposalInbox.map((proposal) => (
                    <button
                      key={`hero-proposal-${proposal.id}`}
                      type="button"
                      onClick={() => (activeProjectId ? focusProposalSection(activeProjectId) : openProject ? focusProposalSection(openProject.id) : null)}
                      className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-surface-container-low"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-low text-xs font-bold text-on-surface">
                        {initials(`F ${proposalFreelancerLabel(proposal.freelancer)}`)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-on-surface font-headline">{(proposal as any).freelancer_name || `Фрилансер #${proposalFreelancerLabel(proposal.freelancer)}`}</p>
                        <p className="truncate text-[10px] text-on-surface/60">{formatMnt(Number(proposal.price || 0))} · {proposal.timeline_days} өдөр</p>
                      </div>
                      <span className="text-sm text-on-surface/40 transition-colors group-hover:text-primary">→</span>
                    </button>
                  )) : (
                    <EmptyState label="Шинэ санал алга." action={<button className="rounded-lg bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-primary font-headline" onClick={retryAll}>Сэргээх</button>} />
                  )}
                </div>
                <div className="ui-divider-soft mt-auto" />
                <button type="button" onClick={() => (openProject ? focusProposalSection(openProject.id) : null)} className="pt-4 text-center text-xs font-bold text-primary font-headline hover:text-primary-container">
                  Бүх саналыг үзэх
                </button>
              </div>
              </section>

              <section>
              <div className="flex flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-headline text-2xl font-bold text-primary">Идэвхтэй төслүүд</h2>
                  <p className="text-sm text-on-surface/60">Статус, төсөв, дараагийн алхамыг нэг харагдацаар удирдана.</p>
                </div>
                <Link href={withLocale("/client/projects")} className="inline-flex min-h-11 items-center rounded-xl bg-surface-container-low px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-primary hover:bg-surface-container">
                  Бүх төслийг удирдах
                </Link>
              </div>

              <div className="overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-sm">
              {!myProjects.length ? (
                <div className="p-6">
                  <EmptyState
                    label={t("noProjects")}
                    action={
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-on-surface/60">{t("noProjectsDesc")}</p>
                        <Link href={withLocale("/client/projects/new")} className="rounded-full primary-gradient px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                          {t("postProject")}
                        </Link>
                      </div>
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-surface-container-low/50">
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface/55">Төслийн нэр</th>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface/55">Эскроу</th>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface/55">Явц</th>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface/55">Төлөв</th>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface/55">Үйлдэл</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myProjects.map((project) => {
                          const meta = statusMeta(project.status);
                          const progress = projectProgress(project.status);
                          return (
                            <tr key={project.id} className="transition-colors hover:bg-surface-container-low/30 odd:bg-surface-container-low/20">
                              <td className="px-6 py-5">
                                <p className="mb-1 text-sm font-bold text-on-surface font-headline">{project.title}</p>
                                <div className="space-y-1">
                                  <p className="text-[11px] text-primary">Дараагийн алхам: {meta.nextStep}</p>
                                  <p className="text-[11px] text-on-surface/60">
                                    {project.category ? `Ангилал: ${project.category}` : "Ангилал сонгоогүй"} · {project.timeline_days || 0} өдөр
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <p className="text-xs font-semibold text-on-surface font-headline">{formatMnt(Number(project.budget || 0))}</p>
                                <p className="text-[11px] text-on-surface/60">{meta.escrowLabel}</p>
                              </td>
                              <td className="px-6 py-5 w-56">
                                <div className="flex items-center gap-3">
                                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container-high">
                                    <div className="h-full rounded-full primary-gradient" style={{ width: `${progress}%` }} />
                                  </div>
                                  <span className="text-[10px] font-bold text-primary">{progress}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <StatusPill label={projectStatusLabel(project.status)} tone={meta.tone} />
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex flex-wrap gap-2">
                                  {project.status === "open" ? (
                                    <button className="rounded-lg primary-gradient px-3 py-1.5 text-[11px] font-bold text-white transition-transform hover:-translate-y-0.5" onClick={() => focusProposalSection(project.id)}>
                                      Санал харах
                                    </button>
                                  ) : project.status === "awaiting_client_review" ? (
                                    <button className="rounded-lg bg-secondary px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:opacity-90" onClick={() => setReleaseTarget(project.id)}>
                                      Төлбөр шилжүүлэх
                                    </button>
                                  ) : (
                                    <button className="rounded-lg bg-surface-container-low px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-outline-variant/20" onClick={() => router.push(withLocale(`/projects/${project.id}`))}>
                                      Дэлгэрэнгүй
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <ul className="grid gap-3 p-4 md:hidden">
                    {myProjects.map((project) => {
                      const meta = statusMeta(project.status);
                      const progress = projectProgress(project.status);
                      return (
                        <li key={project.id} className="rounded-[1.5rem] bg-gradient-to-b from-surface-container-lowest to-surface-container-low p-4 shadow-[0_10px_24px_rgba(3,22,54,0.06)]">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-semibold text-primary">{project.title}</p>
                            <StatusPill label={projectStatusLabel(project.status)} tone={meta.tone} />
                          </div>
                          <div className="mt-2 grid gap-1 text-xs text-on-surface/60">
                            <p>Төсөв: {formatMnt(Number(project.budget || 0))}</p>
                            <p>{project.category ? `Ангилал: ${project.category}` : "Ангилал сонгоогүй"} · {project.timeline_days || 0} өдөр</p>
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="h-1.5 flex-1 rounded-full bg-surface-container-high">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-primary">{progress}%</span>
                          </div>
                          <div className="mt-3 rounded-xl bg-surface-container-low px-3 py-2">
                            <p className="text-[11px] font-semibold text-accent-700">Дараагийн алхам</p>
                            <p className="mt-1 text-xs text-on-surface/65">{meta.nextStep}</p>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {project.status === "open" ? (
                              <button className="min-h-11 rounded-xl bg-primary px-3 text-xs font-bold text-primary-fixed" onClick={() => focusProposalSection(project.id)}>
                                Санал харах
                              </button>
                            ) : project.status === "awaiting_client_review" ? (
                              <button className="min-h-11 rounded-xl bg-secondary px-3 text-xs font-bold text-white" onClick={() => setReleaseTarget(project.id)}>
                                Төлбөр шилжүүлэх
                              </button>
                            ) : (
                              <button className="min-h-11 rounded-xl bg-surface-container-lowest px-3 text-xs font-bold text-primary shadow-sm" onClick={() => router.push(withLocale(`/projects/${project.id}`))}>
                                Дэлгэрэнгүй
                              </button>
                            )}
                            <button
                              className="min-h-11 rounded-xl bg-surface-container-lowest px-3 text-xs font-bold text-accent-700 shadow-sm"
                              onClick={() => (["in_progress", "awaiting_client_review"].includes(project.status) ? setDisputeTarget(project.id) : router.push(withLocale(`/projects/${project.id}/payment`)))}
                            >
                              {["in_progress", "awaiting_client_review"].includes(project.status) ? "Маргаан" : "Эскроу"}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
              </div>
            </section>

            <section ref={proposalSectionRef} className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <Link
                href={withLocale("/client/projects/new")}
                className="group flex min-h-[260px] flex-col justify-between rounded-[2rem] bg-secondary p-8 text-white transition-transform hover:scale-[1.02] md:col-span-1"
              >
                <span className="text-4xl">⊕</span>
                <div>
                  <h4 className="font-headline text-xl font-bold">Шинэ төсөл үүсгэх</h4>
                  <p className="mt-2 text-xs text-white/75">Brief-ээ оруулаад шилдэг мэргэжилтнүүдийг уриарай.</p>
                </div>
              </Link>

              <Link
                href={withLocale("/freelancers")}
                className="group flex min-h-[260px] flex-col justify-between rounded-[2rem] bg-surface-container p-8 transition-transform hover:scale-[1.02] md:col-span-1"
              >
                <DashboardIcon name="search" className="h-10 w-10 text-primary" />
                <div>
                  <h4 className="font-headline text-xl font-bold text-primary">Мэргэжилтэн хайх</h4>
                  <p className="mt-2 text-xs text-on-surface/60">Freelancers жагсаалтаас шүүлтүүр ашиглан хайх.</p>
                </div>
              </Link>

              <div className="relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-sm md:col-span-2">
                <div className="relative z-10">
                  <div className="flex items-center gap-8">
                    <div className="flex-1">
                      <h4 className="font-headline text-xl font-bold text-primary">Эскроу хамгаалалттай 🛡️</h4>
                      <p className="mb-4 mt-2 text-xs text-on-surface/60">
                        Таны бүх төлбөр тооцоо аюулгүй байдлын үүднээс Эскроу системээр дамжина. Ажил 100% баталгаажсаны дараа төлбөрийг чөлөөлөх боломжтой.
                      </p>
                      <Link href={withLocale(inProgressProject ? `/projects/${inProgressProject.id}/payment` : "/client")} className="text-xs font-bold text-secondary underline underline-offset-4">
                        Дэлгэрэнгүй унших
                      </Link>
                    </div>
                    <div className="hidden h-32 w-32 shrink-0 items-center justify-center rounded-full bg-surface-container-low lg:flex">
                        <svg viewBox="0 0 24 24" className="h-14 w-14 text-secondary" fill="currentColor" aria-hidden="true">
                          <path d="m12 2 8 3v6c0 5-3.4 9.7-8 11-4.6-1.3-8-6-8-11V5l8-3Zm0 5a3 3 0 0 0-3 3v1h-1v2h1v4h2v-4h2v4h2v-4h1v-2h-1v-1a3 3 0 0 0-3-3Z" />
                        </svg>
                      </div>
                  </div>
                </div>
              </div>
            </section>


            </div>
          </main>
        </div>

        <ConfirmationDialog
          open={releaseTarget !== null}
          title="Эскроу чөлөөлөлт баталгаажуулах"
          message={
            releaseProject
              ? `${releaseProject.title} төслийг дууссан гэж баталгаажуулбал ${formatMnt(Number(releaseProject.budget || 0))} эскроу дүн фрилансер руу шууд шилжинэ. Буцаах боломжгүй.`
              : "Та ажил бүрэн дууссан гэдгийг баталгаажуулбал эскроу дүн фрилансер руу шууд шилжинэ. Буцаах боломжгүй тул ажлыг бүрэн шалгаарай."
          }
          confirmLabel="Тийм, чөлөөлөх"
          confirmTone="success"
          loading={releaseMutation.isPending}
          onCancel={() => setReleaseTarget(null)}
          onConfirm={() => {
            if (releaseTarget !== null) {
              releaseMutation.mutate(releaseTarget);
            }
          }}
        />

        <ConfirmationDialog
          open={disputeTarget !== null}
          title="Маргаан нээх үү?"
          message={
            disputeProject
              ? `${disputeProject.title} төсөл дээр маргаан нээгдмэгц ${formatMnt(Number(disputeProject.budget || 0))} эскроу дүн түр түгжигдэж админы шалгалт эхэлнэ.`
              : "Маргаан нээгдмэгц эскроу дүн түр түгжигдэж админы шалгалт эхэлнэ. Зөвхөн бодит эрсдэлтэй үед энэ үйлдлийг ашигла."
          }
          confirmLabel="Маргаан нээх"
          confirmTone="warning"
          loading={disputeMutation.isPending}
          onCancel={() => setDisputeTarget(null)}
          onConfirm={() => {
            if (disputeTarget !== null) {
              disputeMutation.mutate(disputeTarget);
            }
          }}
        />
      </section>
    </RoleGuard>
  );
}
