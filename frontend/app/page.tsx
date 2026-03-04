"use client";

import Link from "next/link";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useProjects } from "@/lib/hooks";

export default function HomePage() {
  const projects = useProjects(1);

  if (projects.isLoading) return <LoadingState label="Loading projects..." />;
  if (projects.isError) return <ErrorState label="Could not load projects." />;

  const items = (projects.data?.results || []).slice(0, 3);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">ITZuun MVP</h1>
        <p className="mt-2 text-sm text-slate-600">Mongolia-focused IT freelance marketplace with escrow and role-based operations.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/projects" className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            Browse Projects
          </Link>
          <Link href="/auth" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-300">
            Sign in
          </Link>
        </div>
      </div>

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
    </section>
  );
}
