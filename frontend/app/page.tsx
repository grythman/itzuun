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
    <section className="space-y-14 py-4">
      <div className="grid items-center gap-10 rounded-3xl bg-white p-8 shadow-[0_20px_48px_-24px_rgba(15,23,42,0.4)] lg:grid-cols-2 lg:p-12">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">IT Freelance Platform</p>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">Build digital products with verified IT freelancers.</h1>
          <p className="max-w-xl text-base text-slate-600">From web apps to AI tools, hire trusted specialists with escrow-backed payments and transparent milestones.</p>

          <div className="flex flex-wrap gap-3">
            <Link href="/projects/new" className="rounded-xl bg-blue-800 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900">
              Post a Project
            </Link>
            <Link href="/projects" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
              Explore Talent
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-900 to-blue-700 p-6 text-white">
          <p className="text-sm font-semibold text-blue-100">Tech Delivery Snapshot</p>
          <div className="mt-4 rounded-xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-blue-100">Stack</p>
            <p className="mt-1 text-sm">Next.js • Django • PostgreSQL • Redis</p>
          </div>
          <div className="mt-3 rounded-xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-blue-100">Workflow</p>
            <p className="mt-1 text-sm">Scope → Milestones → Escrow → Delivery → Review</p>
          </div>
          <div className="mt-3 rounded-xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-blue-100">Outcomes</p>
            <p className="mt-1 text-sm">Fast matching, secure payments, and quality assurance.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <AppCard>
          <h3 className="text-lg font-semibold text-slate-900">Verified Specialists</h3>
          <p className="mt-2 text-sm text-slate-600">Work with vetted developers, designers, and QA engineers for production-ready delivery.</p>
        </AppCard>
        <AppCard>
          <h3 className="text-lg font-semibold text-slate-900">Escrow Protection</h3>
          <p className="mt-2 text-sm text-slate-600">Funds remain secure until each milestone is reviewed and approved by the client.</p>
        </AppCard>
        <AppCard>
          <h3 className="text-lg font-semibold text-slate-900">Transparent Progress</h3>
          <p className="mt-2 text-sm text-slate-600">Track proposals, project updates, and communication in a single clean workflow.</p>
        </AppCard>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Latest Projects</h2>
        {!items.length ? (
          <EmptyState label="No projects found." />
        ) : (
          <ul className="grid gap-3">
            {items.map((project) => (
              <li key={project.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{project.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                  </div>
                  <Link href={`/projects/${project.id}`} className="rounded-xl bg-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900">
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
