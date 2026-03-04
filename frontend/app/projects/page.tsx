"use client";

import Link from "next/link";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useProjects } from "@/lib/hooks";

export default function ProjectsPage() {
  const projects = useProjects(1);

  if (projects.isLoading) return <LoadingState label="Loading projects..." />;
  if (projects.isError) return <ErrorState label="Could not load projects." />;

  const items = projects.data?.results || [];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link href="/projects/new" className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white">
          Create Project
        </Link>
      </div>

      {!items.length ? (
        <EmptyState label="No projects found." />
      ) : (
        <ul className="grid gap-3">
          {items.map((project) => (
            <li key={project.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium">{project.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Status: {project.status}</p>
                </div>
                <Link href={`/projects/${project.id}`} className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white">
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