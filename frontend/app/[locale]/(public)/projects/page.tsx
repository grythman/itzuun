"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useCategories, useMe, useProjects } from "@/lib/hooks";

type PushOptions = {
  resetPage?: boolean;
};

function formatMnt(value: number) {
  return `₮${new Intl.NumberFormat("mn-MN").format(value)}`;
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

function extractSkills(project: Record<string, unknown>): string[] {
  const buckets: unknown[] = [project.required_skills, project.skill_tags, project.skills];
  const merged = buckets.flatMap((entry) => {
    if (Array.isArray(entry)) return entry.map((v) => String(v).trim());
    if (typeof entry === "string") return entry.split(",").map((v) => v.trim());
    return [];
  });
  const unique = [...new Set(merged.filter(Boolean))];
  return unique.slice(0, 5);
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        <span className="ui-eyebrow">{title}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          className={`h-3.5 w-3.5 text-on-surface/55 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && <div className="space-y-2.5">{children}</div>}
    </section>
  );
}

function ProjectCard({ project, locale }: { project: Record<string, any>; locale: string }) {
  const budget = Number(project.budget || 0);
  const isHourly = project.project_type === "hourly";
  const tags = extractSkills(project);
  const clientName = project.client_name || project.owner_name || `Client #${project.owner}`;
  const clientRating = Number(project.owner_rating ?? project.client_rating ?? 0);
  const postedAt = project.created_at || project.posted_at;
  const timelineDays = Number(project.timeline_days || 14);

  return (
    <Link
      href={`/${locale}/projects/${project.id}`}
      className="ui-surface group block p-7 transition-all hover:-translate-y-0.5 hover:shadow-[0_26px_48px_rgba(3,22,54,0.12)] md:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] font-headline ${
                isHourly ? "bg-secondary-fixed text-secondary" : "bg-primary-fixed text-primary"
              }`}
            >
              {isHourly ? "Цагаар" : "Тогтмол үнэ"}
            </span>
            {postedAt && <span className="text-[12px] font-medium text-on-surface/50">{ago(postedAt)}</span>}
          </div>

          <h2 className="mt-4 font-headline text-[24px] font-black leading-tight tracking-tight text-primary transition-colors group-hover:text-secondary">
            {project.title}
          </h2>
          <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-on-surface/62">
            {project.description}
          </p>

          {tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="ui-chip">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="ui-eyebrow">{isHourly ? "Цагийн хөлс" : "Төсөв"}</p>
          {isHourly ? (
            <p className="mt-1 font-headline text-[24px] font-black text-secondary">
              {formatMnt(budget)}
              <span className="text-[13px] font-bold text-on-surface/50"> / цаг</span>
            </p>
          ) : (
            <p className="mt-1 font-headline text-[22px] font-black leading-tight text-secondary">
              {formatMnt(Math.round(budget * 0.8))}
              <br />
              {formatMnt(budget)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-gradient text-[13px] font-black text-primary-fixed">
            {String(clientName)[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-headline text-[13px] font-black text-primary">{clientName}</p>
            <p className="text-[12px] text-on-surface/52">{clientRating > 0 ? `⭐ ${clientRating.toFixed(1)} · ` : ""}{timelineDays} өдөр</p>
          </div>
        </div>
        <span className="ui-btn-primary min-h-10 px-4 text-[10px]">Дэлгэрэнгүй</span>
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const pt = useTranslations("Projects");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const me = useMe({ retryOnAuth: true });

  const page = Number(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const projectType = searchParams.get("project_type") || "";
  const budgetMax = searchParams.get("budget_max") || "";
  const experience = searchParams.get("experience_level") || "";
  const ordering = searchParams.get("ordering") || "-created_at";

  const [searchInput, setSearchInput] = useState(search);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [budgetSlider, setBudgetSlider] = useState(Number(budgetMax) || 3_000_000);

  useEffect(() => {
    if (me.data?.role === "client") {
      router.replace(`/${locale}/client/projects`);
    }
  }, [me.data?.role, locale, router]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (budgetMax) setBudgetSlider(Number(budgetMax));
  }, [budgetMax]);

  const categories = useCategories();
  const { data, isLoading, isError, refetch } = useProjects(page, {
    search: search || undefined,
    category: category || undefined,
    project_type: projectType || undefined,
    budget_max: budgetMax ? Number(budgetMax) : undefined,
    experience_level: experience || undefined,
    ordering,
  });

  const projects = useMemo(() => {
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);
  const total = data?.count ?? projects.length;
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function push(updates: Record<string, string | number | undefined>, opts: PushOptions = {}) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, String(value));
    });
    if (opts.resetPage !== false) params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const applySearch = () => push({ search: searchInput.trim() || undefined });
  const clearFilters = () => {
    router.push(pathname);
    setBudgetSlider(3_000_000);
    setSearchInput("");
    setMobileFiltersOpen(false);
  };

  const categoryList = Array.isArray(categories.data) ? categories.data : [];
  if (me.data?.role === "client") {
    return <LoadingState label="Таны төслүүд рүү шилжүүлж байна..." />;
  }
  const expOptions = [
    { value: "entry", label: pt("experienceEntry") },
    { value: "intermediate", label: pt("experienceIntermediate") },
    { value: "expert", label: pt("experienceExpert") },
  ];

  return (
    <div className="grid min-h-screen grid-cols-1 gap-6 pb-24 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
      <aside className="hidden lg:block">
        <div className="ui-page-shell sticky top-24 space-y-6">
          <div>
            <p className="ui-eyebrow">{pt("filtersTitle")}</p>
            <p className="mt-1 text-[12px] text-on-surface/56">{pt("filtersSubtitle")}</p>
          </div>

          <FilterSection title={pt("filterCategory")}>
            {categoryList.map((cat: any) => {
              const slug = cat.slug || String(cat.id);
              const name = cat.name_mn || cat.name_en || cat.name || slug;
              const active = category === slug;
              return (
                <label key={slug} className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => push({ category: active ? undefined : slug })}
                    className="sr-only"
                  />
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-md ${
                      active ? "bg-secondary" : "bg-surface-container"
                    }`}
                    aria-hidden
                  >
                    {active && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="h-2.5 w-2.5">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-[13px] ${active ? "font-bold text-primary" : "text-on-surface/65"}`}>
                    {name}
                  </span>
                </label>
              );
            })}
          </FilterSection>

          <FilterSection title={pt("filterProjectType")}>
            {[
              { value: "fixed", label: "Тогтмол үнэ" },
              { value: "hourly", label: "Цагаар" },
            ].map((item) => {
              const active = projectType === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => push({ project_type: active ? undefined : item.value })}
                  className={`mr-2 mt-2 rounded-xl px-3 py-2 text-[12px] font-black font-headline ${
                    active ? "bg-primary-gradient text-primary-fixed" : "bg-surface-container text-on-surface/65"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </FilterSection>

          <FilterSection title={pt("filterBudget")}>
            <input
              type="range"
              min={100_000}
              max={20_000_000}
              step={100_000}
              value={budgetSlider}
              onChange={(e) => setBudgetSlider(Number(e.target.value))}
              onMouseUp={() => push({ budget_max: budgetSlider })}
              onTouchEnd={() => push({ budget_max: budgetSlider })}
              className="w-full accent-secondary"
            />
            <div className="mt-2 flex items-center justify-between text-[11px] text-on-surface/55">
              <span>₮100k</span>
              <span className="font-headline font-black text-secondary">{formatMnt(budgetSlider)}</span>
              <span>₮20m</span>
            </div>
          </FilterSection>

          <FilterSection title={pt("filterExperience")}>
            <div className="flex flex-wrap gap-2">
              {expOptions.map((option) => {
                const active = experience === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => push({ experience_level: active ? undefined : option.value })}
                    className={`rounded-xl px-3 py-1.5 text-[11px] font-black ${
                      active ? "bg-secondary text-white" : "bg-surface-container text-on-surface/65"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          <div className="grid gap-2">
            <button type="button" onClick={() => applySearch()} className="ui-btn-primary w-full">
              {pt("applyFilters")}
            </button>
            <button type="button" onClick={clearFilters} className="ui-btn-ghost w-full">
              Цэвэрлэх
            </button>
          </div>
        </div>
      </aside>

      <main className="space-y-6">
        <header className="ui-page-shell">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="ui-heading">{pt("title")}</h1>
              {!isLoading && (
                <p className="ui-text-subtle mt-2">{pt("resultsCount", { count: total.toLocaleString() })}</p>
              )}
            </div>
            <button
              type="button"
              className="ui-btn-ghost lg:hidden"
              onClick={() => setMobileFiltersOpen((v) => !v)}
            >
              {mobileFiltersOpen ? pt("hideFilters") : pt("showFilters")}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface/45"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySearch()}
                placeholder={pt("searchPlaceholder")}
                className="w-full rounded-2xl bg-surface-container-lowest py-3 pl-10 pr-4 text-[14px] font-medium text-on-surface shadow-sm focus:shadow-ambient"
              />
            </div>
            <select
              value={ordering}
              onChange={(e) => push({ ordering: e.target.value })}
              className="rounded-2xl bg-surface-container-lowest py-3 pl-4 pr-10 text-[13px] font-bold text-primary shadow-sm focus:shadow-ambient"
            >
              <option value="-created_at">{pt("sortNewest")}</option>
              <option value="created_at">Хуучин нь эхэндээ</option>
              <option value="budget">Төсөв ↑</option>
              <option value="-budget">Төсөв ↓</option>
            </select>
          </div>

          {mobileFiltersOpen && (
            <div className="mt-5 grid gap-3 lg:hidden">
              <div className="ui-surface-soft p-4">
                <p className="ui-eyebrow">{pt("filterCategory")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categoryList.map((cat: any) => {
                    const slug = cat.slug || String(cat.id);
                    const name = cat.name_mn || cat.name_en || cat.name || slug;
                    const active = category === slug;
                    return (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => push({ category: active ? undefined : slug })}
                        className={`rounded-xl px-3 py-2 text-[11px] font-bold ${
                          active ? "bg-primary-gradient text-primary-fixed" : "bg-surface-container text-on-surface/65"
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="ui-surface-soft p-4">
                <p className="ui-eyebrow">{pt("filterExperience")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {expOptions.map((option) => {
                    const active = experience === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => push({ experience_level: active ? undefined : option.value })}
                        className={`rounded-xl px-3 py-2 text-[11px] font-bold ${
                          active ? "bg-secondary text-white" : "bg-surface-container text-on-surface/65"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </header>

        {isLoading && <LoadingState label={pt("loading")} />}
        {isError && <ErrorState label={pt("loadError")} action={<button onClick={() => refetch()} className="ui-btn-ghost min-h-9 px-3 text-[10px]">Retry</button>} />}

        {!isLoading && !isError && (
          <>
            {!projects.length ? (
              <EmptyState
                label={pt("empty")}
                description="Хайлтын нөхцлөө өргөтгөөд дахин шалгана уу."
                action={
                  <Link href={`/${locale}/client/projects/new`} className="ui-btn-primary">
                    {pt("create")}
                  </Link>
                }
              />
            ) : (
              <section className="space-y-4">
                {projects.map((project: any) => (
                  <ProjectCard key={project.id} project={project} locale={locale} />
                ))}
              </section>
            )}
          </>
        )}

        {totalPages > 1 && (
          <div className="ui-surface flex items-center justify-center gap-2 p-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => push({ page: page - 1 }, { resetPage: false })}
              className="ui-btn-ghost min-h-10 w-10 px-0 disabled:opacity-35"
              aria-label={pt("previous")}
            >
              ‹
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageValue = i + 1;
              if (totalPages > 5) {
                const center = Math.min(Math.max(page, 3), totalPages - 2);
                pageValue = center - 2 + i;
              }
              const active = pageValue === page;
              return (
                <button
                  key={pageValue}
                  type="button"
                  onClick={() => push({ page: pageValue }, { resetPage: false })}
                  className={`min-h-10 w-10 rounded-xl text-[13px] font-black ${
                    active ? "bg-primary-gradient text-primary-fixed shadow-ambient" : "bg-surface-container text-on-surface/60"
                  }`}
                >
                  {pageValue}
                </button>
              );
            })}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => push({ page: page + 1 }, { resetPage: false })}
              className="ui-btn-ghost min-h-10 w-10 px-0 disabled:opacity-35"
              aria-label={pt("next")}
            >
              ›
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
