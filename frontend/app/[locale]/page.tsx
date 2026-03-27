"use client";
"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { AppCard } from "@/components/ui-kit";
import { useProjects } from "@/lib/hooks";

export default function HomePage() {
  const t = useTranslations("Hero");
  const projects = useProjects(1);

  if (projects.isLoading) return <LoadingState label="Loading projects..." />;
  if (projects.isError) return <ErrorState label="Could not load projects." />;

  const items = (projects.data?.results || []).slice(0, 3);

  return (
    <section className="space-y-20 py-6">
      <div className="grid items-center gap-10 rounded-[2rem] bg-surface-100 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
        <div className="space-y-7">
          <p className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">IT FREELANCE PLATFORM</p>
          <h1 className="font-headline text-5xl font-extrabold leading-[1.05] tracking-tight text-surface-900 sm:text-6xl">
            {t("title")}
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-surface-600">{t("subtitle")}</p>

          <div className="flex flex-wrap gap-3">
            <Link href="/projects/new" className="primary-gradient rounded-full px-7 py-3 text-sm font-semibold text-white shadow-card hover:opacity-95">
              {t("ctaClient")}
            </Link>
            <Link href="/projects" className="rounded-full bg-surface-300 px-7 py-3 text-sm font-semibold text-surface-800 hover:bg-surface-400/70">
              {t("ctaFreelancer")}
            </Link>
          </div>
        </div>

        <div className="rounded-2xl primary-gradient p-7 text-white shadow-hero">
          <p className="mb-5 text-[11px] font-semibold tracking-[0.2em] text-brand-100">PROJECT WORKFLOW</p>
          <div className="space-y-4 text-[13px]">
            <div>
              <p className="font-semibold">1. Post & Match</p>
              <p className="mt-1 text-brand-100">Clients post projects, verified freelancers submit proposals.</p>
            </div>
            <div>
              <p className="font-semibold">2. Secure Escrow Lock</p>
              <p className="mt-1 text-brand-100">Funds are secured before work starts, reducing delivery risk.</p>
            </div>
            <div>
              <p className="font-semibold">3. Deliver & Release</p>
              <p className="mt-1 text-brand-100">Approve deliverables and release funds through protected flow.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <AppCard className="border-none bg-white">
          <h3 className="font-headline text-lg font-bold text-surface-900">Verified Specialists</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-surface-600">Work with vetted developers, designers, and QA engineers for production-ready delivery.</p>
        </AppCard>
        <AppCard className="border-none bg-white">
          <h3 className="font-headline text-lg font-bold text-surface-900">QPay Escrow Protection</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-surface-600">Funds remain secure until each milestone is reviewed and approved by the client.</p>
        </AppCard>
        <AppCard className="border-none bg-white">
          <h3 className="font-headline text-lg font-bold text-surface-900">Transparent Progress</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-surface-600">Track proposals, project updates, and communication in a single clean workflow.</p>
        </AppCard>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-surface-900">Featured Projects</h2>
          <Link href="/projects" className="text-sm font-semibold text-brand-700">View All Projects</Link>
        </div>
        {!items.length ? (
          <EmptyState label="No projects found." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <li className="rounded-2xl bg-white p-6 shadow-card">
              <h3 className="font-headline text-2xl font-bold text-surface-900">{items[0].title}</h3>
              <p className="mt-2 max-w-xl text-[13px] text-surface-600">{items[0].description}</p>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-700">₮{Number(items[0].budget || 0).toLocaleString()}</span>
                <Link href={`/projects/${items[0].id}`} className="rounded-full bg-brand-100 px-4 py-2 text-xs font-semibold text-brand-700">View Details</Link>
              </div>
            </li>
            <div className="grid gap-4">
              {items.slice(1).map((project) => (
                <li key={project.id} className="rounded-2xl bg-white p-5 shadow-card">
                  <h3 className="font-headline text-lg font-bold text-surface-900">{project.title}</h3>
                  <p className="mt-2 line-clamp-2 text-[12px] text-surface-600">{project.description}</p>
                  <Link href={`/projects/${project.id}`} className="mt-3 inline-block text-xs font-semibold text-brand-700">Open Project →</Link>
                </li>
              ))}
            </div>
          </ul>
        )}
      </div>

      <div className="rounded-[2rem] primary-gradient px-8 py-14 text-center text-white">
        <h2 className="font-headline text-4xl font-extrabold tracking-tight">Ready to build something great?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-[14px] text-brand-100">Join the fastest-growing community of elite IT professionals in Mongolia.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/auth?tab=register" className="rounded-full bg-white px-7 py-3 text-xs font-bold uppercase tracking-wider text-brand-700">Join ITZuun Today</Link>
          <Link href="/projects" className="rounded-full border border-white/40 px-7 py-3 text-xs font-bold uppercase tracking-wider text-white">Talk to an Expert</Link>
        </div>
      </div>
    </section>
  );
}
