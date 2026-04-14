"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useCategories, useProjects } from "@/lib/hooks";

// ── helpers ──────────────────────────────────────────────
function fmnt(v: number) {
  return `₮${new Intl.NumberFormat("mn-MN").format(v)}`;
}
function ago(dateStr?: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "Саяхан";
  if (h < 24) return `${h} цагийн өмнө`;
  const d = Math.floor(h / 24);
  return `${d} өдрийн өмнө`;
}
function skills(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

// ── icons ─────────────────────────────────────────────────
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
  </svg>
);
const ChevronIcon = ({ down }: { down?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`h-3.5 w-3.5 transition-transform ${down ? "rotate-180" : ""}`}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// ── FilterSection ─────────────────────────────────────────
function FilterSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-secondary">{icon}</span>
          <span className="font-headline text-[9px] font-black uppercase tracking-[0.25em] text-surface-400">{title}</span>
        </div>
        <ChevronIcon down={open} />
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
}

// ── ProjectCard ───────────────────────────────────────────
function ProjectCard({ project, locale }: { project: any; locale: string }) {
  const budget = Number(project.budget || 0);
  const isHourly = project.project_type === "hourly";
  const tags = skills(project.required_skills).slice(0, 4);
  const clientName = project.client_name || project.owner_name || `Client #${project.owner}`;
  const clientRating = project.owner_rating ?? project.client_rating ?? 4.8;
  const clientVerified = project.owner_verified ?? project.client_verified ?? false;
  const postedAt = project.created_at || project.posted_at;

  return (
    <Link href={`/${locale}/projects/${project.id}`} className="group block rounded-[2rem] bg-surface-container-lowest p-8 shadow-sm transition-all hover:shadow-ambient hover:-translate-y-0.5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex rounded-xl px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] font-headline ${isHourly ? "bg-[#e8f4f4] text-secondary" : "bg-secondary-fixed text-secondary"}`}>
              {isHourly ? "Hourly" : "Fixed Price"}
            </span>
            {postedAt && <span className="text-[12px] font-medium text-surface-400">{ago(postedAt)}</span>}
          </div>
          <h2 className="mt-4 font-headline text-[22px] font-black leading-tight tracking-tight text-primary group-hover:text-secondary transition-colors">
            {project.title}
          </h2>
          <p className="mt-3 line-clamp-2 text-[14px] font-medium leading-relaxed text-surface-400">
            {project.description}
          </p>
          {tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="rounded-xl bg-surface-container-low px-3 py-1.5 text-[11px] font-bold text-surface-500 font-headline">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right — budget */}
        <div className="shrink-0 text-right">
          <p className="font-headline text-[9px] font-black uppercase tracking-[0.2em] text-surface-400">
            {isHourly ? "Үнэлгээ" : "Төсөв"}
          </p>
          {isHourly ? (
            <p className="mt-1 font-headline text-[22px] font-black text-secondary">{fmnt(budget)}<span className="text-[13px] font-bold opacity-60"> / цаг</span></p>
          ) : (
            <p className="mt-1 font-headline text-[20px] font-black leading-tight text-secondary">
              {fmnt(Math.round(budget * 0.8))} —<br />{fmnt(budget)}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary font-headline text-[13px] font-black text-primary-fixed">
            {clientVerified
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-secondary bg-secondary-fixed rounded-lg"><path d="M20 6 9 17l-5-5" /></svg>
              : <span>{String(clientName)[0]?.toUpperCase()}</span>}
          </div>
          <div>
            <p className="font-headline text-[12px] font-black text-primary">{clientName}</p>
            <div className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-amber-400"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              <span className="text-[11px] font-bold text-surface-400">({clientRating.toFixed(1)})</span>
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-2xl primary-gradient px-6 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-primary-fixed font-headline shadow-sm transition-all group-hover:shadow-ambient">
          Apply Now →
        </span>
      </div>
    </Link>
  );
}

// ── PAGE ──────────────────────────────────────────────────
export default function ProjectsPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";

  // Params
  const page = Number(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const categorySlug = searchParams.get("category") || "";
  const projectType = searchParams.get("project_type") || "";
  const budgetMax = searchParams.get("budget_max") || "";
  const expLevel = searchParams.get("experience_level") || "";
  const sortBy = searchParams.get("ordering") || "-created_at";

  // Local state for immediate UI
  const [searchInput, setSearchInput] = useState(search);
  const [budgetSlider, setBudgetSlider] = useState(Number(budgetMax) || 750_000);

  const categories = useCategories();
  const { data, isLoading, isError } = useProjects(page, {
    search: search || undefined,
    category: categorySlug || undefined,
    project_type: projectType || undefined,
    budget_max: budgetMax ? Number(budgetMax) : undefined,
    experience_level: expLevel || undefined,
    ordering: sortBy,
  });

  const projects = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
  const total = data?.count ?? projects.length;
  const totalPages = Math.max(1, Math.ceil(total / 10));

  function push(updates: Record<string, string | number | undefined>) {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === "") p.delete(k);
      else p.set(k, String(v));
    });
    p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  }

  useEffect(() => { setSearchInput(search); }, [search]);

  const expLevels = ["entry", "intermediate", "expert"];

  // ── RENDER ────────────────────────────────────────────
  return (
    <div className="flex min-h-screen gap-8 pb-24 lg:gap-12">

      {/* ── SIDEBAR ── */}
      <aside className="hidden w-56 shrink-0 space-y-7 lg:block">
        <div>
          <p className="font-headline text-[11px] font-black uppercase tracking-[0.25em] text-primary">Filters</p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.15em] text-surface-400">Refine your search</p>
        </div>

        {/* Category */}
        <FilterSection title="Category" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
            <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
          </svg>
        }>
          {(Array.isArray(categories.data) ? categories.data : []).map((cat: any) => {
            const name = cat.name_mn || cat.name_en || cat.name || cat.slug;
            const slug = cat.slug || String(cat.id);
            const active = categorySlug === slug;
            return (
              <label key={slug} className="flex cursor-pointer items-center gap-2.5">
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${active ? "bg-secondary" : "bg-surface-container-low border border-surface-200"}`}
                  onClick={() => push({ category: active ? "" : slug })}>
                  {active && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="h-2.5 w-2.5"><path d="M20 6 9 17l-5-5" /></svg>}
                </span>
                <span className={`text-[13px] font-medium leading-none ${active ? "font-bold text-primary" : "text-surface-500"}`}>{name}</span>
              </label>
            );
          })}
        </FilterSection>

        {/* Project Type */}
        <FilterSection title="Project Type" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path d="M4 7h16M7 4v6m10-6v6M5 10h14v10H5z" />
          </svg>
        }>
          {[{ val: "fixed", label: "Fixed Price" }, { val: "hourly", label: "Hourly Rate" }].map(({ val, label }) => (
            <label key={val} className="flex cursor-pointer items-center gap-2.5">
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${projectType === val ? "border-secondary bg-secondary" : "border-surface-300 bg-transparent"}`}
                onClick={() => push({ project_type: projectType === val ? "" : val })}>
                {projectType === val && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <span className={`text-[13px] font-medium ${projectType === val ? "font-bold text-primary" : "text-surface-500"}`}>{label}</span>
            </label>
          ))}
        </FilterSection>

        {/* Budget */}
        <FilterSection title="Budget Range" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        }>
          <input
            type="range" min={100_000} max={10_000_000} step={100_000}
            value={budgetSlider}
            onChange={(e) => setBudgetSlider(Number(e.target.value))}
            onMouseUp={() => push({ budget_max: budgetSlider })}
            onTouchEnd={() => push({ budget_max: budgetSlider })}
            className="w-full accent-secondary"
          />
          <div className="flex justify-between text-[10px] font-bold text-surface-400 font-headline">
            <span>₮500k</span>
            <span className="text-secondary">{fmnt(budgetSlider)}</span>
            <span>₮750m+</span>
          </div>
        </FilterSection>

        {/* Experience */}
        <FilterSection title="Experience Level" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path d="M12 3v18M6 8h12M8 16h8" />
          </svg>
        }>
          <div className="flex flex-wrap gap-1.5">
            {expLevels.map((lv) => {
              const active = expLevel === lv;
              const label = lv === "entry" ? "Entry" : lv === "intermediate" ? "Intermediate" : "Expert";
              return (
                <button key={lv} type="button"
                  onClick={() => push({ experience_level: active ? "" : lv })}
                  className={`rounded-xl px-3 py-1.5 text-[11px] font-black font-headline transition-all ${active ? "primary-gradient text-primary-fixed shadow-ambient" : "bg-surface-container-low text-surface-500 hover:bg-surface-container"}`}>
                  {label}
                </button>
              );
            })}
          </div>
        </FilterSection>

        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="w-full rounded-2xl primary-gradient py-4 text-[11px] font-black uppercase tracking-[0.2em] text-primary-fixed shadow-ambient font-headline transition-all hover:shadow-lg"
        >
          Apply Filters
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 min-w-0 space-y-8">

        {/* Header */}
        <div>
          <h1 className="font-headline text-[36px] font-black tracking-tighter text-primary">Ажил хайх</h1>
          {!isLoading && <p className="mt-2 text-[14px] font-medium text-surface-400">Нийт <span className="font-black text-primary">{total.toLocaleString()}</span> төсөл олдлоо</p>}
        </div>

        {/* Search + Sort */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-surface-400">
              <SearchIcon />
            </div>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && push({ search: searchInput })}
              placeholder="Төсөл хайх..."
              className="w-full rounded-2xl bg-surface-container-lowest py-4 pl-12 pr-5 text-[14px] font-medium text-primary outline-none shadow-sm placeholder:text-surface-300 focus:shadow-ambient"
            />
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => push({ ordering: e.target.value })}
              className="appearance-none rounded-2xl bg-surface-container-lowest py-4 pl-5 pr-10 text-[13px] font-bold text-primary outline-none shadow-sm focus:shadow-ambient"
            >
              <option value="-created_at">Newest</option>
              <option value="created_at">Oldest</option>
              <option value="budget">Budget ↑</option>
              <option value="-budget">Budget ↓</option>
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
              <ChevronIcon />
            </div>
          </div>
        </div>

        {/* Cards */}
        {isLoading && <LoadingState label="Төслүүд ачааллаж байна..." />}
        {isError && <ErrorState label="Алдаа гарлаа." />}
        {!isLoading && !isError && (
          projects.length === 0
            ? <EmptyState label="Тохирох төсөл олдсонгүй." />
            : (
              <div className="space-y-5">
                {projects.map((p: any) => <ProjectCard key={p.id} project={p} locale={locale} />)}
              </div>
            )
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => push({ page: page - 1 })}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-lowest shadow-sm transition-all hover:shadow-ambient disabled:opacity-30 font-headline font-black text-surface-400"
            >
              ‹
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p2 = i + 1;
              if (totalPages > 5) {
                const mid = Math.min(Math.max(page, 3), totalPages - 2);
                p2 = mid - 2 + i;
              }
              return (
                <button
                  key={p2}
                  type="button"
                  onClick={() => push({ page: p2 })}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-[13px] font-black font-headline transition-all ${p2 === page ? "primary-gradient text-primary-fixed shadow-ambient" : "bg-surface-container-lowest text-surface-400 shadow-sm hover:shadow-ambient"}`}
                >
                  {p2}
                </button>
              );
            })}

            {totalPages > 5 && page < totalPages - 2 && (
              <>
                <span className="text-surface-400">…</span>
                <button type="button" onClick={() => push({ page: totalPages })} className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-lowest text-[13px] font-black font-headline text-surface-400 shadow-sm hover:shadow-ambient">
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => push({ page: page + 1 })}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-lowest shadow-sm transition-all hover:shadow-ambient disabled:opacity-30 font-headline font-black text-surface-400"
            >
              ›
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
