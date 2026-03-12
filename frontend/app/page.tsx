"use client";

import Link from "next/link";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { AppCard } from "@/components/ui-kit";
import { useProjects } from "@/lib/hooks";

export default function HomePage() {
  const projects = useProjects(1);

  if (projects.isLoading) return <LoadingState label="Loading projects..." />;
  if (projects.isError) return <ErrorState label="Could not load projects." />;

  const items = (projects.data?.results || []).slice(0, 3);

  return (
    <section className="space-y-16 py-6">
      {/* Hero */}
      <div className="grid items-center gap-10 rounded-3xl bg-white p-8 shadow-hero lg:grid-cols-2 lg:p-14">
        <div className="space-y-6">
          <p className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-brand-700">IT Freelance Platform</p>
          <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight text-surface-900 sm:text-5xl">
            Build digital products with verified IT freelancers.
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-surface-500">
            From web apps to AI tools, hire trusted specialists with escrow-backed payments and transparent milestones.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/projects/new" className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors">
              Post a Project
            </Link>
            <Link href="/projects" className="rounded-xl border border-surface-200 bg-white px-6 py-3 text-sm font-semibold text-surface-700 hover:bg-surface-50 transition-colors">
              Explore Talent
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 p-6 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-200">Tech Delivery Snapshot</p>
          <div className="mt-4 rounded-xl bg-white/[0.08] p-4 backdrop-blur">
            <p className="text-[11px] uppercase tracking-widest text-brand-300">Stack</p>
            <p className="mt-1 text-[13px] font-medium">Next.js · Django · PostgreSQL · Redis</p>
          </div>
          <div className="mt-2.5 rounded-xl bg-white/[0.08] p-4 backdrop-blur">
            <p className="text-[11px] uppercase tracking-widest text-brand-300">Workflow</p>
            <p className="mt-1 text-[13px] font-medium">Scope → Milestones → Escrow → Delivery → Review</p>
          </div>
          <div className="mt-2.5 rounded-xl bg-white/[0.08] p-4 backdrop-blur">
            <p className="text-[11px] uppercase tracking-widest text-brand-300">Outcomes</p>
            <p className="mt-1 text-[13px] font-medium">Fast matching, secure payments, and quality assurance.</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid gap-4 md:grid-cols-3">
        <AppCard>
          <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </div>
          <h3 className="text-[15px] font-semibold text-surface-900">Verified Specialists</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-surface-500">Work with vetted developers, designers, and QA engineers for production-ready delivery.</p>
        </AppCard>
        <AppCard>
          <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <h3 className="text-[15px] font-semibold text-surface-900">Escrow Protection</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-surface-500">Funds remain secure until each milestone is reviewed and approved by the client.</p>
        </AppCard>
        <AppCard>
          <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          </div>
          <h3 className="text-[15px] font-semibold text-surface-900">Transparent Progress</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-surface-500">Track proposals, project updates, and communication in a single clean workflow.</p>
        </AppCard>
      </div>

      {/* Latest Projects */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-surface-900">Latest Projects</h2>
        {!items.length ? (
          <EmptyState label="No projects found." />
        ) : (
          <ul className="grid gap-3">
            {items.map((project) => (
              <li key={project.id} className="group rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[15px] font-semibold text-surface-900">{project.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-surface-500">{project.description}</p>
                  </div>
                  <Link href={`/projects/${project.id}`} className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors">
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
