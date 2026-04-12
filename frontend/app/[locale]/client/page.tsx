"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { ActionButton, AppCard, ConfirmationDialog, DashboardBottomBar, RoleSidebar, StatusPill, TrustPanel } from "@/components/ui-kit";
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

  const myProjects = projects.data.results.filter((project) => project.owner === me.data?.id);
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
  const openProject = myProjects.find((project) => project.status === "open");
  const inProgressProject = myProjects.find((project) => project.status === "in_progress");

  const urgencyText = useMemo(() => {
    if (awaitingReview) return "Одоо хийх ажил: Completion баталгаажуулж escrow release хийх.";
    if (openProject) return "Одоо хийх ажил: Саналуудыг харьцуулж freelancer сонгох.";
    if (inProgressProject) return "Одоо хийх ажил: Гүйцэтгэлийг хянаж эрсдэл гарвал маргаан нээх.";
    return "Одоо хийх ажил: Шинэ төсөл оруулж ажил эхлүүлэх.";
  }, [awaitingReview, openProject, inProgressProject]);

  const freshestUpdate = myProjects.reduce<string | undefined>((latest, project) => {
    const candidate = (project as { updated_at?: string; created_at?: string }).updated_at || (project as { updated_at?: string; created_at?: string }).created_at;
    if (!candidate) return latest;
    if (!latest) return candidate;
    return new Date(candidate).getTime() > new Date(latest).getTime() ? candidate : latest;
  }, undefined);

  const sortedProposalItems = useMemo(() => {
    return [...proposalItems].sort((a, b) => {
      const aScore = Number(a.price || 0) + Math.max(1, Number(a.timeline_days || 1)) * 1000;
      const bScore = Number(b.price || 0) + Math.max(1, Number(b.timeline_days || 1)) * 1000;
      return aScore - bScore;
    });
  }, [proposalItems]);

  const releaseProject = myProjects.find((p) => p.id === releaseTarget) || null;
  const disputeProject = myProjects.find((p) => p.id === disputeTarget) || null;
  const proposalInbox = sortedProposalItems.slice(0, 3);

  useEffect(() => {
    if (!activeProjectId && openProject) {
      setActiveProjectId(openProject.id);
    }
  }, [activeProjectId, openProject]);

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="client" fallbackPath={withLocale("/auth")}>
      <section className="space-y-6 pb-20">
        <div className="relative overflow-hidden rounded-[28px] border border-[#d6e2ee] bg-gradient-to-br from-[#f8fbff] via-[#f2f8ff] to-[#eefaf4] p-5 shadow-[0_20px_48px_rgba(13,39,80,0.12)] md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#44b39c]/12 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-20 h-56 w-56 rounded-full bg-[#5b8dff]/12 blur-3xl" />
          <div className="relative grid gap-6 md:grid-cols-[1.5fr_1fr] md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1f5f96]">{t("controlRoomLabel")}</p>
              <h1 className="mt-2 font-headline text-[30px] font-extrabold tracking-tight text-[#12243a] sm:text-4xl md:text-5xl">{t("title")}</h1>
              <p className="mt-2 max-w-3xl text-sm text-[#355067]">{urgencyText}</p>
              <p className="mt-2 text-xs text-[#45637e]">{formatRelativeTime(freshestUpdate)}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <Link
                  href={withLocale("/projects/new")}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#175f8d] px-4 text-[13px] font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#175f8d]"
                >
                  Төсөл оруулах
                </Link>
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#bfd3e6] bg-white px-4 text-[13px] font-semibold text-[#1e4f78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e4f78]"
                  onClick={() => (openProject ? focusProposalSection(openProject.id) : null)}
                  disabled={!openProject}
                >
                  Санал харах
                </button>
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#bfd3e6] bg-white px-4 text-[13px] font-semibold text-[#1e4f78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e4f78]"
                  onClick={() => (inProgressProject ? router.push(withLocale(`/projects/${inProgressProject.id}/payment`)) : null)}
                  disabled={!inProgressProject}
                >
                  Escrow удирдах
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <AppCard className="border border-[#d2deec] bg-white/90 p-4 shadow-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4a6785]">{t("activeProjectsLabel")}</p>
                <p className="mt-2 text-2xl font-extrabold text-[#102239]">{activeCount}</p>
              </AppCard>
              <AppCard className="border border-[#d2deec] bg-white/90 p-4 shadow-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4a6785]">{t("openBidsLabel")}</p>
                <p className="mt-2 text-2xl font-extrabold text-[#102239]">{openCount}</p>
              </AppCard>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <RoleSidebar role="client" />

          <div className="flex-1 space-y-4">
            {me.data?.verification_status !== "verified" && <VerificationBanner user={me.data} />}

            <div className="anim-rise anim-delay-1 grid gap-4 md:grid-cols-3">
              <AppCard className="border border-[#cfe0df] bg-gradient-to-br from-[#0f5963] to-[#1f7f87] text-white shadow-[0_14px_34px_rgba(15,89,99,0.28)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#bceaf0]">{t("securedVolumeLabel")}</p>
                <p className="mt-2 text-2xl font-extrabold">{formatMnt(totalEscrow)}</p>
                <p className="mt-1 text-xs text-[#d3f1f4]">{t("securedVolumeSub")}</p>
              </AppCard>
              <AppCard className="border border-[#dce4ec] bg-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3f6589]">{t("activeProjectsLabel")}</p>
                <p className="mt-2 text-2xl font-extrabold text-[#132945]">{activeCount}</p>
                <p className="mt-1 text-xs text-[#5a728d]">{t("activeProjectsSub")}</p>
              </AppCard>
              <AppCard className="border border-[#dce4ec] bg-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3f6589]">{t("openBidsLabel")}</p>
                <p className="mt-2 text-2xl font-extrabold text-[#132945]">{openCount}</p>
                <p className="mt-1 text-xs text-[#5a728d]">{t("openBidsSub")}</p>
              </AppCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <TrustPanel />

              <AppCard className="border border-[#d8e3ee] bg-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3f6589]">Completed</p>
                <p className="mt-2 text-2xl font-extrabold text-[#132945]">{completedCount}</p>
                <p className="mt-1 text-xs text-[#5a728d]">Delivery success in your portfolio</p>
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
                  <Link href={withLocale("/client/profile")} className="text-[#175b89] hover:underline">
                    {t("completeProfile")} →
                  </Link>
                ) : (
                  t("profileDone")
                )}
              </p>
            </AppCard>

            <div className="anim-rise anim-delay-2 rounded-2xl border border-[#dae4ef] bg-white p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="font-headline text-2xl font-bold text-[#10243f]">{t("myProjects")}</h2>
                <Link href={withLocale("/projects/new")} className="inline-flex min-h-11 items-center rounded-xl bg-[#17618f] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17618f]">
                  {t("postProject")}
                </Link>
              </div>

              {!myProjects.length ? (
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
              ) : (
                <ul className="grid gap-3 md:grid-cols-2">
                  {myProjects.map((project) => (
                    <li key={project.id} className="rounded-xl border border-[#dce6ef] bg-gradient-to-b from-[#ffffff] to-[#f7fbff] p-4 text-[13px] space-y-3">
                      {(() => {
                        const meta = statusMeta(project.status);
                        return (
                          <>
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-semibold text-[#122740]">{project.title}</p>
                              <StatusPill label={meta.label} tone={meta.tone} />
                            </div>
                            <div className="grid gap-2 text-[#4f6782]">
                              <p>Төсөв: <span className="font-semibold text-[#16314f]">{formatMnt(Number(project.budget || 0))}</span></p>
                              <p>Төлөв: {project.status}</p>
                              <p className="rounded-lg bg-[#eef6ff] px-2.5 py-2 text-[12px] text-[#205483]">
                                {meta.escrowLabel}{" "}
                                <span className="cursor-help underline decoration-dotted" title="Escrow нь milestone дуусах хүртэл мөнгийг түр хадгалж, маргаан гарвал хамгаалалт үүсгэнэ.">
                                  (?)</span>
                              </p>
                              <p className="text-[12px] font-medium text-[#1e4f78]">Дараагийн алхам: {meta.nextStep}</p>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {project.status === "open" ? (
                                <ActionButton className="min-h-11 rounded-xl px-4 text-[13px] font-semibold" onClick={() => focusProposalSection(project.id)}>
                                  Санал харьцуулах
                                </ActionButton>
                              ) : project.status === "awaiting_client_review" ? (
                                <ActionButton className="min-h-11 rounded-xl px-4 text-[13px] font-semibold" tone="success" onClick={() => setReleaseTarget(project.id)}>
                                  Completion баталгаажуулах
                                </ActionButton>
                              ) : (
                                <ActionButton className="min-h-11 rounded-xl px-4 text-[13px] font-semibold" onClick={() => router.push(withLocale(`/projects/${project.id}`))}>
                                  Төслийн дэлгэрэнгүй
                                </ActionButton>
                              )}
                              <button
                                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#bfd3e6] bg-white px-4 text-[13px] font-semibold text-[#1e4f78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e4f78]"
                                onClick={() => (["in_progress", "awaiting_client_review"].includes(project.status) ? setDisputeTarget(project.id) : router.push(withLocale(`/projects/${project.id}/payment`)))}
                              >
                                {["in_progress", "awaiting_client_review"].includes(project.status) ? "Маргаан нээх" : "Escrow хуудас"}
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div ref={proposalSectionRef} className="anim-rise anim-delay-3 rounded-2xl border border-[#dae4ef] bg-white p-6 shadow-card">
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
