"use client";

import Link from "next/link";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { AppCard, RatingStars, TrustPanel } from "@/components/ui-kit";
import { useProjects } from "@/lib/hooks";

export default function HomePage() {
  const projects = useProjects(1);

  if (projects.isLoading) return <LoadingState label="Loading projects..." />;
  if (projects.isError) return <ErrorState label="Could not load projects." />;

  const items = (projects.data?.results || []).slice(0, 3);

  return (
    <section className="space-y-6">
      <AppCard className="bg-gradient-to-br from-white to-blue-50">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">ITZuun MVP</p>
        <h1 className="mt-2 text-3xl font-semibold">Secure IT Freelance Marketplace in Mongolia</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Hire with escrow protection, verified talent, and transparent project delivery.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/projects/new" className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            Post Project
          </Link>
          <Link href="/freelancer" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Join as Freelancer
          </Link>
        </div>
      </AppCard>

      <div className="grid gap-4 md:grid-cols-3">
        <AppCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 1</p>
          <h3 className="mt-1 text-lg font-semibold">Post Your Project</h3>
          <p className="mt-1 text-sm text-slate-600">Define scope, budget, and timeline with guided forms.</p>
        </AppCard>
        <AppCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 2</p>
          <h3 className="mt-1 text-lg font-semibold">Pay to Escrow</h3>
          <p className="mt-1 text-sm text-slate-600">Funds stay protected until you approve delivered work.</p>
        </AppCard>
        <AppCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 3</p>
          <h3 className="mt-1 text-lg font-semibold">Get Work Delivered</h3>
          <p className="mt-1 text-sm text-slate-600">Track milestones, chat in-project, and review final output.</p>
        </AppCard>
      </div>

      <TrustPanel />

      <AppCard>
        <h2 className="text-xl font-semibold">Featured Freelancers</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {["Batzaya", "Anu", "Temuulen"].map((name, idx) => (
            <div key={name} className="rounded-xl border border-slate-200 p-3">
              <p className="font-semibold text-slate-900">{name}</p>
              <p className="text-xs text-slate-500">Verified Freelancer</p>
              <div className="mt-2"><RatingStars value={4.6 + idx * 0.1} /></div>
            </div>
          ))}
        </div>
      </AppCard>

      <h2 className="text-xl font-semibold">Latest Projects</h2>

      {!items.length ? (
        <EmptyState label="No projects found." />
      ) : (
        <ul className="grid gap-3">
          {items.map((project) => (
            <li key={project.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium">{project.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Status: {project.status}</p>
                </div>
                <Link href={`/projects/${project.id}`} className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <footer className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
        <p>© ITZuun • Escrow protected marketplace • Terms • Privacy • Dispute mediation by platform admin</p>
      </footer>
    </section>
  );
}
