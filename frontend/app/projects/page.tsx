"use client";

import Link from "next/link";
import { useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useProjects } from "@/lib/hooks";

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "awaiting_client_review", label: "Awaiting Review" },
  { value: "completed", label: "Completed" },
  { value: "disputed", label: "Disputed" },
];

const categoryOptions = [
  { value: "", label: "All Categories" },
  { value: "web", label: "Web" },
  { value: "mobile", label: "Mobile" },
  { value: "backend", label: "Backend" },
  { value: "design", label: "Design" },
  { value: "data", label: "Data" },
  { value: "devops", label: "DevOps" },
];

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const filters = {
    ...(statusFilter && { status: statusFilter }),
    ...(categoryFilter && { category: categoryFilter }),
    ...(search && { search }),
  };

  const projects = useProjects(page, Object.keys(filters).length ? filters : undefined);

  const items = projects.data?.results || [];
  const hasNext = !!projects.data?.next;
  const hasPrev = page > 1;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function handleFilterChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      setter(e.target.value);
      setPage(1);
    };
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link href="/projects/new" className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          Create Project
        </Link>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            Search
          </button>
        </form>

        <select value={statusFilter} onChange={handleFilterChange(setStatusFilter)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select value={categoryFilter} onChange={handleFilterChange(setCategoryFilter)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {projects.isLoading ? (
        <LoadingState label="Loading projects..." />
      ) : projects.isError ? (
        <ErrorState label="Could not load projects." />
      ) : !items.length ? (
        <EmptyState label="No projects found." />
      ) : (
        <>
          <ul className="grid gap-3">
            {items.map((project) => (
              <li key={project.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-medium">{project.title}</h2>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">
                        {project.category}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{project.description}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>Budget: {Number(project.budget).toLocaleString()}₮</span>
                      <span>Timeline: {project.timeline_days} days</span>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium capitalize text-blue-700">
                        {project.status?.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  <Link href={`/projects/${project.id}`} className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}