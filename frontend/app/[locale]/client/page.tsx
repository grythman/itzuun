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

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="client" fallbackPath={withLocale("/auth")}>
      <section className="space-y-6 pb-20">
        <div className="anim-rise rounded-[28px] border border-[#d7d5eb] bg-gradient-to-r from-[#f7f8ff] to-[#edf2ff] p-6 shadow-[0_14px_38px_rgba(42,36,84,0.14)] md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5b52a0]">{t("controlRoomLabel")}</p>
          <h1 className="mt-2 font-headline text-4xl font-extrabold tracking-tight text-surface-900 md:text-5xl">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm text-surface-600">{t("controlRoomSub")}</p>
        </div>

        <div className="flex gap-4">
          <RoleSidebar role="client" />

          <div className="flex-1 space-y-4">
            {me.data?.verification_status !== "verified" && <VerificationBanner user={me.data} />}

            <div className="anim-rise anim-delay-1 grid gap-4 md:grid-cols-3">
              <AppCard className="border-none bg-[#22144f] text-white shadow-[0_18px_40px_rgba(34,20,79,0.32)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#bcb6e9]">{t("securedVolumeLabel")}</p>
                <p className="mt-2 text-2xl font-extrabold">₮{totalEscrow.toLocaleString()}</p>
                <p className="mt-1 text-xs text-[#c8c5ec]">{t("securedVolumeSub")}</p>
              </AppCard>
              <AppCard className="border-none bg-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6a5cbc]">{t("activeProjectsLabel")}</p>
                <p className="mt-2 text-2xl font-extrabold text-surface-900">{activeCount}</p>
                <p className="mt-1 text-xs text-surface-500">{t("activeProjectsSub")}</p>
              </AppCard>
              <AppCard className="border-none bg-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6a5cbc]">{t("openBidsLabel")}</p>
                <p className="mt-2 text-2xl font-extrabold text-surface-900">{openCount}</p>
                <p className="mt-1 text-xs text-surface-500">{t("openBidsSub")}</p>
              </AppCard>
            </div>

            <TrustPanel />

            <AppCard className="border border-[#e8e5f4] bg-[#f7f7fc]">
              <p className="text-[13px] font-semibold text-surface-800">
                {t("profileCompleteness")}: {profileCompleteness}%
              </p>
              <div className="mt-2 h-2 w-full rounded-full bg-[#e2e4f0]">
                <div className="h-2 rounded-full bg-[#5132bf]" style={{ width: `${profileCompleteness}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-surface-500">
                {profileCompleteness < 100 ? (
                  <Link href={withLocale("/client/profile")} className="text-brand-600 hover:underline">
                    {t("completeProfile")} →
                  </Link>
                ) : (
                  t("profileDone")
                )}
              </p>
            </AppCard>

            <div className="anim-rise anim-delay-2 rounded-2xl bg-white p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="font-headline text-2xl font-bold text-surface-900">{t("myProjects")}</h2>
                <Link href={withLocale("/projects/new")} className="rounded-full bg-[#4a23c8] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white">
                  {t("postProject")}
                </Link>
              </div>

              {!myProjects.length ? (
                <EmptyState
                  label={t("noProjects")}
                  action={
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-surface-500">{t("noProjectsDesc")}</p>
                      <Link href={withLocale("/projects/new")} className="rounded-full bg-[#4a23c8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                        {t("postProject")}
                      </Link>
                    </div>
                  }
                />
              ) : (
                <ul className="grid gap-3 md:grid-cols-2">
                  {myProjects.map((project) => (
                    <li key={project.id} className="rounded-xl border border-[#eceaf6] bg-[#fcfcff] p-4 text-[13px] space-y-3">
                      <p className="font-semibold text-surface-900">{project.title}</p>
                      <p className="text-surface-500">{t("status")}: {project.status}</p>
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded-full border border-[#d5d1ea] px-3 py-1 text-xs font-semibold text-[#4b3db4]" onClick={() => setActiveProjectId(project.id)}>
                          {t("viewProposals")}
                        </button>
                        <button className="rounded-full bg-[#2a8f67] px-3 py-1 text-xs font-semibold text-white" onClick={() => router.push(withLocale(`/projects/${project.id}/payment`))}>
                          {t("openEscrowPayment")}
                        </button>
                        <button className="rounded-full bg-[#3659d4] px-3 py-1 text-xs font-semibold text-white" onClick={() => releaseMutation.mutate(project.id)}>
                          {t("releaseEscrow")}
                        </button>
                        <button className="rounded-full bg-[#be3d62] px-3 py-1 text-xs font-semibold text-white" onClick={() => disputeMutation.mutate(project.id)}>
                          {t("openDispute")}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="anim-rise anim-delay-3 rounded-2xl bg-white p-6 shadow-card">
              <h2 className="mb-3 font-headline text-2xl font-bold text-surface-900">{t("projectProposals")}</h2>
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
                    <li key={proposal.id} className="rounded-xl border border-surface-200/60 p-3 text-[13px]">
                      <p className="text-surface-700">{t("freelancer")} #{proposal.freelancer}</p>
                      <p className="text-surface-600">{t("price")}: {proposal.price}</p>
                      <p className="text-surface-600">
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
