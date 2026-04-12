"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { ActionButton, AppCard, ConfirmationDialog, DashboardBottomBar, StatusPill } from "@/components/ui-kit";
import { VerificationBanner } from "@/components/verification-banner";
import { projectsApi, toArray } from "@/lib/api/endpoints";
import { useMe, useMutation, useMyProfile, useProjectProposals, useProjects } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";
import type { ProposalDto } from "@/lib/api/types";

function proposalFreelancerLabel(freelancer: ProposalDto["freelancer"]): string | number {
  if (typeof freelancer === "number" || typeof freelancer === "string") return freelancer;
  return freelancer.id;
}

function formatMnt(amount: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(amount)} ₮`;
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
  if (status === "in_progress") return "In Progress";
  if (status === "awaiting_client_review") return "Awaiting Review";
  if (status === "completed") return "Released";
  if (status === "disputed") return "Disputed";
  return "Open";
}

function initials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "IZ";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
}

function statusMeta(status: string): { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info"; nextStep: string; escrowLabel: string } {
  if (status === "in_progress") {
    return { label: "Escrow Held", tone: "success", nextStep: "Гүйцэтгэлийг хянаад шаардлагатай үед маргаан нээ.", escrowLabel: "Мөнгө найдвартай түгжээтэй байна." };
  }
  if (status === "awaiting_client_review") {
    return { label: "Completion Pending", tone: "warning", nextStep: "Ажлыг шалгаад дууссаныг баталгаажуул.", escrowLabel: "Баталгаажуулмагц мөнгө freelancer руу шилжинэ." };
  }
  if (status === "disputed") {
    return { label: "Disputed", tone: "danger", nextStep: "Нотолгоогоо шалгаад admin шийдвэрийг хүлээ.", escrowLabel: "Escrow маргааны горимд байна." };
  }
  if (status === "completed") {
    return { label: "Released", tone: "info", nextStep: "Төсөл дууссан. Үнэлгээ үлдээж болно.", escrowLabel: "Escrow амжилттай release хийгдсэн." };
  }
  return { label: "Open", tone: "info", nextStep: "Саналуудаа харьцуулж freelancer сонго.", escrowLabel: "Escrow эхлээгүй байна." };
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
      toast("success", "Escrow амжилттай release хийгдлээ.");
      setReleaseTarget(null);
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const disputeMutation = useMutation({
    mutationFn: (projectId: number) => projectsApi.createDispute(projectId, { reason: "Client dashboard-аас маргаан нээв" }),
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
      toast("success", "Freelancer сонгогдлоо.");
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
        <div className="h-40 animate-pulse rounded-3xl border border-[#d6e2ee] bg-[#eef4fa]" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 animate-pulse rounded-2xl border border-[#dce4ec] bg-[#f3f7fc]" />
          <div className="h-24 animate-pulse rounded-2xl border border-[#dce4ec] bg-[#f3f7fc]" />
          <div className="h-24 animate-pulse rounded-2xl border border-[#dce4ec] bg-[#f3f7fc]" />
        </div>
        <div className="h-64 animate-pulse rounded-2xl border border-[#dce4ec] bg-[#f8fbff]" />
      </section>
    );
  }
  if (me.isError || !me.data) {
    return (
      <ErrorState
        label="Please sign in first."
        action={
          <button className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700" onClick={() => router.push(withLocale("/auth/login"))}>
            Go to sign in
          </button>
        }
      />
    );
  }
  if (projects.isError || !projects.data) {
    return (
      <ErrorState
        label="Could not load projects."
        action={
          <button className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700" onClick={retryAll}>
            Retry
          </button>
        }
      />
    );
  }

  const proposalItems = proposals.data ? toArray<ProposalDto>(proposals.data) : [];
  const activeProject = myProjects.find((project) => project.id === activeProjectId) || null;

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

  const activeCount = myProjects.filter((p) => p.status === "in_progress").length;
  const openCount = myProjects.filter((p) => p.status === "open").length;
  const totalEscrow = myProjects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
  const completedCount = myProjects.filter((p) => p.status === "completed").length;
  const awaitingReview = myProjects.find((project) => project.status === "awaiting_client_review");
  const inProgressProject = myProjects.find((project) => project.status === "in_progress");
  const securedEscrow = myProjects
    .filter((project) => ["in_progress", "awaiting_client_review", "disputed"].includes(project.status))
    .reduce((sum, project) => sum + Number(project.budget || 0), 0);
  const pendingEscrow = myProjects
    .filter((project) => project.status === "open")
    .reduce((sum, project) => sum + Number(project.budget || 0), 0);
  const clientName = profile.data?.full_name || me.data.first_name || me.data.email?.split("@")[0] || "Client";

  let urgencyText = "Одоо хийх ажил: Шинэ төсөл оруулж ажил эхлүүлэх.";
  if (awaitingReview) urgencyText = "Одоо хийх ажил: Completion баталгаажуулж escrow release хийх.";
  else if (openProject) urgencyText = "Одоо хийх ажил: Саналуудыг харьцуулж freelancer сонгох.";
  else if (inProgressProject) urgencyText = "Одоо хийх ажил: Гүйцэтгэлийг хянаж эрсдэл гарвал маргаан нээх.";

  const freshestUpdate = myProjects.reduce<string | undefined>((latest, project) => {
    const candidate = (project as { updated_at?: string; created_at?: string }).updated_at || (project as { updated_at?: string; created_at?: string }).created_at;
    if (!candidate) return latest;
    if (!latest) return candidate;
    return new Date(candidate).getTime() > new Date(latest).getTime() ? candidate : latest;
  }, undefined);

  const sortedProposalItems = [...proposalItems].sort((a, b) => {
    const aScore = Number(a.price || 0) + Math.max(1, Number(a.timeline_days || 1)) * 1000;
    const bScore = Number(b.price || 0) + Math.max(1, Number(b.timeline_days || 1)) * 1000;
    return aScore - bScore;
  });

  const releaseProject = myProjects.find((p) => p.id === releaseTarget) || null;
  const disputeProject = myProjects.find((p) => p.id === disputeTarget) || null;
  const proposalInbox = sortedProposalItems.slice(0, 3);
  const proposalBadgeCount = proposalInbox.length;

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="client" fallbackPath={withLocale("/auth")}>
      <section className="space-y-6 pb-24">
        <div className="grid gap-6 xl:grid-cols-[272px_minmax(0,1fr)]">
          <aside className="hidden xl:flex xl:min-h-[calc(100vh-7rem)] xl:flex-col xl:rounded-[28px] xl:bg-slate-100 xl:p-6 xl:sticky xl:top-24">
            <div className="mb-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#031636] text-sm font-bold text-white">IZ</div>
                <div>
                  <h2 className="font-headline text-lg font-bold leading-none text-[#031636]">Project Console</h2>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Client Tier</span>
                </div>
              </div>
              <Link
                href={withLocale("/projects/new")}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#031636] px-4 text-sm font-bold text-[#d8e2ff] shadow-lg shadow-[#031636]/20 transition-opacity hover:opacity-90"
              >
                <span className="text-lg">+</span>
                Create New Brief
              </Link>
            </div>

            <nav className="flex-1 space-y-1 px-1">
              <Link href={withLocale("/client")} className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 text-[13px] font-medium text-[#031636] shadow-[0_4px_12px_rgba(3,22,54,0.08)]">
                <span>📁</span>
                Active Projects
              </Link>
              <Link href={withLocale("/projects/new")} className="flex items-center gap-3 rounded-lg px-4 py-3 text-[13px] font-medium text-slate-500 transition hover:translate-x-1 hover:bg-slate-200/60">
                <span>＋</span>
                Post a Project
              </Link>
              <button type="button" onClick={() => (openProject ? focusProposalSection(openProject.id) : null)} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-[13px] font-medium text-slate-500 transition hover:translate-x-1 hover:bg-slate-200/60">
                <span>▣</span>
                Proposals
              </button>
              <button type="button" onClick={() => (inProgressProject ? router.push(withLocale(`/projects/${inProgressProject.id}/payment`)) : null)} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-[13px] font-medium text-slate-500 transition hover:translate-x-1 hover:bg-slate-200/60">
                <span>₮</span>
                Payments & Escrow
              </button>
              <Link href={withLocale("/client/profile")} className="flex items-center gap-3 rounded-lg px-4 py-3 text-[13px] font-medium text-slate-500 transition hover:translate-x-1 hover:bg-slate-200/60">
                <span>⚙</span>
                Settings
              </Link>
            </nav>

            <div className="mt-6 rounded-xl bg-[#eef2f6] p-4">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1a2b4c]">Тусламж хэрэгтэй юу?</p>
              <p className="mb-3 text-xs text-slate-600">Манай зөвлөхүүдтэй шууд холбогдоно уу.</p>
              <Link href={withLocale("/support")} className="inline-flex items-center gap-1 text-xs font-bold text-[#031636]">
                Contact Support
                <span>→</span>
              </Link>
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            <header className="sticky top-16 z-20 flex flex-col gap-4 rounded-[24px] border border-slate-200/70 bg-slate-50/80 px-5 py-4 shadow-[0_20px_50px_rgba(3,22,54,0.04)] backdrop-blur-md md:flex-row md:items-center md:justify-between">
              <div className="relative max-w-md flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
                <input
                  className="h-11 w-full rounded-full border-none bg-[#eceef0] pl-10 pr-4 text-sm text-slate-700 focus:ring-2 focus:ring-[#031636]/15"
                  placeholder="Төсөл, freelancer, escrow хайх..."
                  type="text"
                  aria-label="Хайх"
                />
              </div>
              <div className="flex items-center gap-4 self-end md:self-auto">
                <button className="text-sm font-medium text-slate-500 transition-colors hover:text-[#13696a]">MN/EN</button>
                <button className="text-slate-500 transition-colors hover:text-[#13696a]" aria-label="Notifications">🔔</button>
                <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#031636]">{clientName}</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Client Admin</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#d8e2ff] text-xs font-bold text-[#031636] shadow-sm">
                    {initials(clientName)}
                  </div>
                </div>
              </div>
            </header>

            {me.data?.verification_status !== "verified" && <VerificationBanner user={me.data} />}

            <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-headline text-3xl font-extrabold tracking-tight text-[#031636] md:text-4xl">
                  Өдрийн мэнд, {clientName} 👋
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  Таны төслүүдийн явц болон санхүүгийн тойм энд байна. Бүх үйл ажиллагаа escrow хамгаалалттай явагдаж байна.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={withLocale("/projects")} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#13696a] px-5 text-sm font-bold text-white shadow-lg shadow-[#13696a]/10 transition hover:-translate-y-0.5">
                  <span>⌕</span>
                  Freelancers хайх
                </Link>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
              <div className="grid gap-6 rounded-[2rem] bg-[#031636] p-8 text-white shadow-2xl md:grid-cols-3">
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-white/60">Нийт зарцуулсан</p>
                    <h3 className="font-headline text-3xl font-bold">{formatMnt(totalEscrow)}</h3>
                  </div>
                  <span className="mt-4 w-fit rounded bg-white/10 px-2 py-1 text-[10px]">All projects</span>
                </div>
                <div className="flex flex-col justify-between border-l border-white/10 pl-6">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#a5eff0]">Эскроу дансанд</p>
                    <h3 className="font-headline text-3xl font-bold text-[#a5eff0]">{formatMnt(securedEscrow)}</h3>
                  </div>
                  <p className="mt-4 text-[10px] text-white/50">Fully Secured</p>
                </div>
                <div className="flex flex-col justify-between border-l border-white/10 pl-6">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-white/60">Хүлээгдэж буй</p>
                    <h3 className="font-headline text-3xl font-bold">{formatMnt(pendingEscrow)}</h3>
                  </div>
                  <button type="button" onClick={() => (openProject ? focusProposalSection(openProject.id) : null)} className="mt-4 w-fit text-[10px] font-bold text-[#a5eff0] underline underline-offset-4">
                    Саналууд харах
                  </button>
                </div>
              </div>

              <div className="flex flex-col rounded-[2rem] bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h4 className="font-headline text-lg font-bold text-[#031636]">Шинэ саналууд</h4>
                  <span className="rounded-full bg-[#ffdad6] px-2 py-1 text-[10px] font-bold text-[#93000a]">{proposalBadgeCount} ШИНЭ</span>
                </div>
                <div className="space-y-3">
                  {proposalInbox.length ? proposalInbox.map((proposal) => (
                    <button
                      key={`hero-proposal-${proposal.id}`}
                      type="button"
                      onClick={() => activeProjectId && selectMutation.mutate({ projectId: activeProjectId, proposalId: proposal.id })}
                      className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[#f2f4f6]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eceef0] text-xs font-bold text-[#031636]">
                        {initials(`F ${proposalFreelancerLabel(proposal.freelancer)}`)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#031636]">Freelancer #{proposalFreelancerLabel(proposal.freelancer)}</p>
                        <p className="truncate text-[10px] text-slate-500">{formatMnt(Number(proposal.price || 0))} · {proposal.timeline_days} өдөр</p>
                      </div>
                      <span className="text-sm text-slate-300 transition-colors group-hover:text-[#031636]">→</span>
                    </button>
                  )) : (
                    <EmptyState label="Шинэ санал алга." action={<button className="rounded-lg bg-[#f2f4f6] px-3 py-1.5 text-xs font-semibold text-[#031636]" onClick={retryAll}>Сэргээх</button>} />
                  )}
                </div>
                <button type="button" onClick={() => (openProject ? focusProposalSection(openProject.id) : null)} className="mt-auto border-t border-slate-100 pt-4 text-center text-xs font-bold text-[#1a2b4c]">
                  Бүх саналыг үзэх
                </button>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-4">
              <AppCard className="rounded-[1.5rem] border-[#d8e3ee] bg-white shadow-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4a6785]">{t("activeProjectsLabel")}</p>
                <p className="mt-2 text-2xl font-extrabold text-[#132945]">{activeCount}</p>
                <p className="mt-1 text-xs text-[#5a728d]">Одоо гүйцэтгэл явж буй төслүүд</p>
              </AppCard>
              <AppCard className="rounded-[1.5rem] border-[#d8e3ee] bg-white shadow-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4a6785]">{t("openBidsLabel")}</p>
                <p className="mt-2 text-2xl font-extrabold text-[#132945]">{openCount}</p>
                <p className="mt-1 text-xs text-[#5a728d]">Freelancer сонгох хүлээгдэж байна</p>
              </AppCard>
              <AppCard className="rounded-[1.5rem] border-[#d8e3ee] bg-white shadow-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4a6785]">Completed</p>
                <p className="mt-2 text-2xl font-extrabold text-[#132945]">{completedCount}</p>
                <p className="mt-1 text-xs text-[#5a728d]">Амжилттай дууссан төслүүд</p>
              </AppCard>
              <AppCard className="rounded-[1.5rem] border-[#d8e3ee] bg-white shadow-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4a6785]">Profile Ready</p>
                <p className="mt-2 text-2xl font-extrabold text-[#132945]">{profileCompleteness}%</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-[#dbe5ef]">
                  <div className="h-1.5 rounded-full bg-[#031636]" style={{ width: `${profileCompleteness}%` }} />
                </div>
              </AppCard>
            </section>

            <section className="rounded-[2rem] bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-headline text-2xl font-bold text-[#031636]">Идэвхтэй төслүүд</h2>
                  <p className="text-sm text-slate-500">Статус, төсөв, дараагийн алхамыг нэг харагдацаар удирдана.</p>
                </div>
                <Link href={withLocale("/projects/new")} className="inline-flex min-h-11 items-center rounded-xl bg-[#031636] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#d8e2ff]">
                  {t("postProject")}
                </Link>
              </div>

              {!myProjects.length ? (
                <div className="p-6">
                  <EmptyState
                    label={t("noProjects")}
                    action={
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-[#5a728d]">{t("noProjectsDesc")}</p>
                        <Link href={withLocale("/projects/new")} className="rounded-full bg-[#17618f] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
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
                        <tr className="bg-[#f1f4f7]">
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Төслийн нэр</th>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Escrow</th>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Явц</th>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Төлөв</th>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Үйлдэл</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {myProjects.map((project) => {
                          const meta = statusMeta(project.status);
                          const progress = projectProgress(project.status);
                          return (
                            <tr key={project.id} className="transition-colors hover:bg-slate-50/60">
                              <td className="px-6 py-5">
                                <p className="mb-1 text-sm font-bold text-[#031636]">{project.title}</p>
                                <p className="text-[11px] text-slate-400">Дараагийн алхам: {meta.nextStep}</p>
                              </td>
                              <td className="px-6 py-5">
                                <p className="text-xs font-semibold text-slate-700">{formatMnt(Number(project.budget || 0))}</p>
                                <p className="text-[11px] text-slate-500">{meta.escrowLabel}</p>
                              </td>
                              <td className="px-6 py-5 w-56">
                                <div className="flex items-center gap-3">
                                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e0e3e5]">
                                    <div className="h-full rounded-full bg-[#031636]" style={{ width: `${progress}%` }} />
                                  </div>
                                  <span className="text-[10px] font-bold text-[#031636]">{progress}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <StatusPill label={projectStatusLabel(project.status)} tone={meta.tone} />
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex flex-wrap gap-2">
                                  {project.status === "open" ? (
                                    <button className="rounded-lg bg-[#031636] px-3 py-1.5 text-[11px] font-bold text-[#d8e2ff]" onClick={() => focusProposalSection(project.id)}>
                                      Санал харах
                                    </button>
                                  ) : project.status === "awaiting_client_review" ? (
                                    <button className="rounded-lg bg-[#13696a] px-3 py-1.5 text-[11px] font-bold text-white" onClick={() => setReleaseTarget(project.id)}>
                                      Төлбөр шилжүүлэх
                                    </button>
                                  ) : (
                                    <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-[#031636]" onClick={() => router.push(withLocale(`/projects/${project.id}`))}>
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
                        <li key={project.id} className="rounded-2xl border border-slate-200 bg-[#fbfcfd] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-semibold text-[#031636]">{project.title}</p>
                            <StatusPill label={projectStatusLabel(project.status)} tone={meta.tone} />
                          </div>
                          <p className="mt-2 text-xs text-slate-500">Төсөв: {formatMnt(Number(project.budget || 0))}</p>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="h-1.5 flex-1 rounded-full bg-[#e0e3e5]">
                              <div className="h-full rounded-full bg-[#031636]" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-[#031636]">{progress}%</span>
                          </div>
                          <p className="mt-3 text-xs text-slate-600">Дараагийн алхам: {meta.nextStep}</p>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </section>

            <div ref={proposalSectionRef} className="rounded-[2rem] border border-[#dae4ef] bg-white p-6 shadow-card">
              <h2 className="mb-1 font-headline text-2xl font-bold text-[#10243f]">Санал харьцуулалт</h2>
              <p className="mb-3 text-[13px] text-[#4f6782]">1-2 товшилтоор freelancer сонгох урсгал.</p>
              {activeProject ? (
                <div className="mb-4 rounded-xl border border-[#dbe6f2] bg-[#f5f9ff] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[12px] font-semibold text-[#1f4d76]">Сонгосон төсөл: {activeProject.title}</p>
                      <p className="text-[11px] text-[#4f6782]">Саналын inbox-оос шууд freelancer сонгох боломжтой.</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center rounded-xl border border-[#bfd3e6] bg-white px-4 text-[13px] font-semibold text-[#1e4f78]"
                      onClick={() => router.push(withLocale(`/projects/${activeProject.id}`))}
                    >
                      Дэлгэрэнгүй рүү
                    </button>
                  </div>
                </div>
              ) : null}
              {!activeProjectId ? (
                <EmptyState
                  label="Эхлээд нэг төсөл сонгоно уу."
                  action={
                    openProject ? (
                      <button className="inline-flex min-h-11 items-center rounded-xl bg-[#17618f] px-4 text-[13px] font-semibold text-white" onClick={() => focusProposalSection(openProject.id)}>
                        Нээлттэй төслийн санал харах
                      </button>
                    ) : (
                      <Link href={withLocale("/projects/new")} className="inline-flex min-h-11 items-center rounded-xl bg-[#17618f] px-4 text-[13px] font-semibold text-white">
                        Төсөл оруулах
                      </Link>
                    )
                  }
                />
              ) : proposals.isLoading ? (
                <div className="space-y-2">
                  <div className="h-16 animate-pulse rounded-xl border border-[#dce6ef] bg-[#f3f8fd]" />
                  <div className="h-16 animate-pulse rounded-xl border border-[#dce6ef] bg-[#f3f8fd]" />
                  <div className="h-16 animate-pulse rounded-xl border border-[#dce6ef] bg-[#f3f8fd]" />
                </div>
              ) : proposals.isError ? (
                <ErrorState
                  label="Санал ачааллахад алдаа гарлаа."
                  action={
                    <div className="flex gap-2">
                      <button className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-[13px] font-semibold text-red-700" onClick={() => proposals.refetch()}>
                        Дахин оролдох
                      </button>
                      <button className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-[13px] font-semibold text-red-700" onClick={retryAll}>
                        Dashboard сэргээх
                      </button>
                    </div>
                  }
                />
              ) : !proposalItems.length ? (
                <EmptyState
                  label="Одоогоор санал ирээгүй байна."
                  action={
                    <button className="inline-flex min-h-11 items-center rounded-xl bg-[#17618f] px-4 text-[13px] font-semibold text-white" onClick={() => proposals.refetch()}>
                      Сэргээж шалгах
                    </button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-[#d9e5f1] bg-[#f9fcff] p-3">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#3a6287]">Шинэ саналууд (Inbox)</p>
                    <ul className="mt-2 space-y-2">
                      {proposalInbox.map((proposal, idx) => (
                        <li key={`inbox-${proposal.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-[#e1e9f2] bg-white px-3 py-2">
                          <div>
                            <p className="text-[13px] font-semibold text-[#17304e]">Freelancer #{proposalFreelancerLabel(proposal.freelancer)}</p>
                            <p className="text-[11px] text-[#5a728d]">
                              {formatMnt(Number(proposal.price || 0))} · {proposal.timeline_days} өдөр
                            </p>
                          </div>
                          <button
                            type="button"
                            className="inline-flex min-h-11 items-center rounded-xl bg-[#17618f] px-3 text-[12px] font-semibold text-white"
                            onClick={() => selectMutation.mutate({ projectId: activeProjectId, proposalId: proposal.id })}
                            disabled={selectMutation.isPending}
                          >
                            {idx === 0 ? "Top санал сонгох" : "Сонгох"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <ul className="space-y-2">
                    {sortedProposalItems.map((proposal, idx) => (
                    <li key={proposal.id} className="rounded-xl border border-[#dce6ef] bg-[#f9fcff] p-3 text-[13px]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#17304e]">Freelancer #{proposalFreelancerLabel(proposal.freelancer)}</p>
                          <p className="text-[#4f6782]">Үнэ: {formatMnt(Number(proposal.price || 0))}</p>
                          <p className="text-[#4f6782]">Хугацаа: {proposal.timeline_days} өдөр</p>
                          {idx === 0 ? <p className="mt-1 inline-flex rounded-full bg-[#e7f7ef] px-2 py-0.5 text-[11px] font-semibold text-[#186a44]">Best value</p> : null}
                        </div>
                        <ActionButton
                          className="min-h-11 rounded-xl px-4 text-[13px] font-semibold"
                          loading={selectMutation.isPending}
                          onClick={() => selectMutation.mutate({ projectId: activeProjectId, proposalId: proposal.id })}
                        >
                          Сонгох
                        </ActionButton>
                      </div>
                    </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <DashboardBottomBar role="client" />

        <ConfirmationDialog
          open={releaseTarget !== null}
          title="Escrow release баталгаажуулах"
          message={
            releaseProject
              ? `${releaseProject.title} төслийг дууссан гэж баталгаажуулбал ${formatMnt(Number(releaseProject.budget || 0))} escrow freelancer руу шууд шилжинэ. Буцаах боломжгүй.`
              : "Та ажил бүрэн дууссан гэдгийг баталгаажуулбал escrow шууд freelancer руу шилжинэ. Буцаах боломжгүй тул ажлыг бүрэн шалгаарай."
          }
          confirmLabel="Тийм, release хий"
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
              ? `${disputeProject.title} төсөл дээр маргаан нээгдмэгц ${formatMnt(Number(disputeProject.budget || 0))} escrow түр түгжигдэж admin шалгалт эхэлнэ.`
              : "Маргаан нээгдмэгц escrow түр түгжигдэж admin шалгалт эхэлнэ. Зөвхөн бодит эрсдэлтэй үед энэ үйлдлийг ашигла."
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
