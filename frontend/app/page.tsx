"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { projectApi } from "@/lib/api/endpoints";
import { Card, EmptyState, ErrorState, SectionTitle } from "@/components/ui";

export default function HomePage() {
  const [page, setPage] = useState(1);
  const projectsQuery = useQuery({
    queryKey: ["projects", page],
    queryFn: () => projectApi.list(page),
  });

  return (
    <div className="space-y-4">
      <SectionTitle title="Project Feed" subtitle="Public projects for clients and freelancers" />

      {projectsQuery.isLoading ? <p className="text-sm text-slate-600">Loading projects...</p> : null}
      {projectsQuery.isError ? <ErrorState message="Could not load projects" /> : null}

      {projectsQuery.data && projectsQuery.data.results.length === 0 ? <EmptyState message="No projects yet." /> : null}

      <div className="grid gap-3">
        {projectsQuery.data?.results.map((project) => (
          <Card key={project.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium">{project.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{project.description}</p>
              </div>
              <Link className="rounded border px-2 py-1 text-sm" href={`/projects/${project.id}`}>
                Open
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          className="rounded border px-2 py-1 text-sm disabled:opacity-50"
          disabled={page <= 1 || projectsQuery.isFetching}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        >
          Prev
        </button>
        <span className="text-sm">Page {page}</span>
        <button
          className="rounded border px-2 py-1 text-sm disabled:opacity-50"
          disabled={!projectsQuery.data?.next || projectsQuery.isFetching}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
