"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { AppCard, DashboardBottomBar, RoleSidebar, TrustPanel } from "@/components/ui-kit";
import { VerificationBanner } from "@/components/verification-banner";
import { projectsApi, toArray } from "@/lib/api/endpoints";
import { useMe, useMutation, useMyProfile, useProjectProposals, useProjects } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";

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

  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const proposals = useProjectProposals(activeProjectId || "");
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
      toast("success", "Escrow released");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const disputeMutation = useMutation({
    mutationFn: (projectId: number) => projectsApi.createDispute(projectId, { reason: "Client raised dispute" }),
    onSuccess: () => {
      projects.refetch();
      toast("warning", "Dispute opened");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  if (me.isLoading || projects.isLoading || profile.isLoading) return <LoadingState label="Loading client dashboard..." />;
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
  const proposalItems = proposals.data ? toArray(proposals.data) : [];

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

  const statusTone: Record<string, string> = {
    open: "bg-sky-50 text-sky-700 border border-sky-100",
    in_progress: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    awaiting_client_review: "bg-amber-50 text-amber-700 border border-amber-100",
    completed: "bg-violet-50 text-violet-700 border border-violet-100",
    disputed: "bg-rose-50 text-rose-700 border border-rose-100",
    closed_refunded: "bg-slate-100 text-slate-700 border border-slate-200",
  };

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="client" fallbackPath={withLocale("/auth")}>
      <section className="space-y-6 pb-20">
        <div className="relative overflow-hidden rounded-[28px] border border-[#dae4f0] bg-gradient-to-br from-[#f7fbff] via-[#f3f8ff] to-[#eef7f5] p-6 shadow-[0_20px_48px_rgba(13,39,80,0.12)] md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#44b39c]/12 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-20 h-56 w-56 rounded-full bg-[#5b8dff]/12 blur-3xl" />
          <div className="relative grid gap-6 md:grid-cols-[1.5fr_1fr] md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1f5f96]">{t("controlRoomLabel")}</p>
              <h1 className="mt-2 font-headline text-4xl font-extrabold tracking-tight text-[#12243a] md:text-5xl">{t("title")}</h1>
              <p className="mt-2 max-w-3xl text-sm text-[#355067]">{t("controlRoomSub")}</p>
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
                <p className="mt-2 text-2xl font-extrabold">₮{totalEscrow.toLocaleString()}</p>
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
                <Link href={withLocale("/projects/new")} className="rounded-full bg-[#17618f] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white">
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
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-[#122740]">{project.title}</p>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone[project.status] || "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-[#4f6782]">Budget: ₮{Number(project.budget || 0).toLocaleString()}</p>
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded-full border border-[#c7d8e8] px-3 py-1 text-xs font-semibold text-[#2a5f8f]" onClick={() => setActiveProjectId(project.id)}>
                          {t("viewProposals")}
                        </button>
                        <button className="rounded-full bg-[#1f8f73] px-3 py-1 text-xs font-semibold text-white" onClick={() => router.push(withLocale(`/projects/${project.id}/payment`))}>
                          {t("openEscrowPayment")}
                        </button>
                        <button className="rounded-full bg-[#2a6cc2] px-3 py-1 text-xs font-semibold text-white" onClick={() => releaseMutation.mutate(project.id)}>
                          {t("releaseEscrow")}
                        </button>
                        <button className="rounded-full bg-[#bf4d61] px-3 py-1 text-xs font-semibold text-white" onClick={() => disputeMutation.mutate(project.id)}>
                          {t("openDispute")}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="anim-rise anim-delay-3 rounded-2xl border border-[#dae4ef] bg-white p-6 shadow-card">
              <h2 className="mb-3 font-headline text-2xl font-bold text-[#10243f]">{t("projectProposals")}</h2>
              {!activeProjectId ? (
                <EmptyState label={t("selectProject")} />
              ) : proposals.isLoading ? (
                <LoadingState label={t("loadingProposals")} />
              ) : proposals.isError ? (
                <ErrorState
                  label={t("proposalError")}
                  action={
                    <button className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700" onClick={() => proposals.refetch()}>
                      Retry
                    </button>
                  }
                />
              ) : !proposalItems.length ? (
                <EmptyState label={t("noProposals")} />
              ) : (
                <ul className="space-y-2">
                  {proposalItems.map((proposal) => (
                    <li key={proposal.id} className="rounded-xl border border-[#dce6ef] bg-[#f9fcff] p-3 text-[13px]">
                      <p className="font-semibold text-[#17304e]">{t("freelancer")} #{proposal.freelancer}</p>
                      <p className="text-[#4f6782]">{t("price")}: ₮{Number(proposal.price || 0).toLocaleString()}</p>
                      <p className="text-[#4f6782]">
                        {t("timeline")}: {proposal.timeline_days} {t("days")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <DashboardBottomBar role="client" />
      </section>
    </RoleGuard>
  );
}
