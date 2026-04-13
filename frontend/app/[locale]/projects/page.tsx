"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useCategories, useProjects } from "@/lib/hooks";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function FilterIcon({ type }: { type: "category" | "project" | "budget" | "experience" }) {
  if (type === "category") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M4 6h7v5H4zM13 6h7v5h-7zM4 13h7v5H4zM13 13h7v5h-7z" />
      </svg>
    );
  }
  if (type === "project") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M4 7h16M7 4v6m10-6v6M5 10h14v10H5z" />
      </svg>
    );
  }
  if (type === "budget") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M4 7h16v10H4z" />
        <path d="M8 12h8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M12 3v18M6 8h12M8 16h8" />
    </svg>
  );
}

function statusTone(status?: string) {
  if (status === "open") return "bg-secondary-fixed text-secondary";
  if (status === "in_progress") return "bg-primary-fixed text-primary";
  if (status === "awaiting_client_review") return "bg-yellow-50 text-yellow-700";
  if (status === "completed") return "bg-green-50 text-green-700";
  if (status === "disputed") return "bg-red-50 text-red-700";
  return "bg-surface-container text-surface-500";
}

export default function ProjectsPage() {
  const t = useTranslations("Projects");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get("page") || "1") || 1));
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") || "");
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get("category") || "");
  const [skillsFilter, setSkillsFilter] = useState(() => searchParams.get("skills") || "");
  const [budgetMin, setBudgetMin] = useState(() => searchParams.get("budget_min") || "");
  const [budgetMax, setBudgetMax] = useState(() => searchParams.get("budget_max") || "");
  const [experienceFilter, setExperienceFilter] = useState(
    () => searchParams.get("experience") || "",
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categories = useCategories();
  const categoryList = Array.isArray(categories.data) ? categories.data : [];

  const filters = {
    ...(statusFilter && { status: statusFilter }),
    ...(categoryFilter && { category: categoryFilter }),
    ...(search && { search }),
    ...(skillsFilter && { skills: skillsFilter }),
    ...(budgetMin && { budget_min: budgetMin }),
    ...(budgetMax && { budget_max: budgetMax }),
    ...(experienceFilter && { experience: experienceFilter }),
  };

  const projects = useProjects(page, Object.keys(filters).length ? filters : undefined);
  const items = projects.data?.results || [];
  const totalCount = projects.data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 10));
  const hasNext = !!projects.data?.next;
  const hasPrev = page > 1;

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (skillsFilter) params.set("skills", skillsFilter);
    if (budgetMin) params.set("budget_min", budgetMin);
    if (budgetMax) params.set("budget_max", budgetMax);
    if (experienceFilter) params.set("experience", experienceFilter);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [
    page,
    search,
    statusFilter,
    categoryFilter,
    skillsFilter,
    budgetMin,
    budgetMax,
    experienceFilter,
    pathname,
    router,
  ]);

  const visiblePages = useMemo(() => {
    const values: Array<number | string> = [];
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, page + 2);
    if (start > 1) values.push(1);
    if (start > 2) values.push("...");
    for (let p = start; p <= end; p += 1) values.push(p);
    if (end < totalPages - 1) values.push("...");
    if (end < totalPages) values.push(totalPages);
    return values;
  }, [page, totalPages]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function formatCategoryName(cat: any) {
    return locale === "en"
      ? cat.name_en || cat.name_mn || cat.name
      : cat.name_mn || cat.name_en || cat.name;
  }

  function formatPrice(project: any) {
    const budget = Number(project.budget || 0);
    const floor = Math.round(budget * 0.8);
    return `₮${floor.toLocaleString()} - ₮${budget.toLocaleString()}`;
  }

  function normalizeSkills(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 4);
    }
    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 4);
    }
    return [];
  }

  return (
    <section className="space-y-4 xl:grid xl:grid-cols-[286px_minmax(0,1fr)] xl:gap-6 xl:space-y-0">
      <div className="xl:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-2xl primary-gradient px-5 py-3 text-[11px] font-black uppercase tracking-widest text-primary-fixed shadow-ambient font-headline"
        >
          <FilterIcon type="category" />
          {mobileFiltersOpen ? t("hideFilters") : t("showFilters")}
        </button>
      </div>

      <aside
        className={`${mobileFiltersOpen ? "block" : "hidden"} h-fit rounded-[2.5rem] bg-surface-container-low p-6 shadow-sm xl:sticky xl:top-24 xl:block xl:p-8`}
      >
        <div>
          <p className="font-headline text-[28px] font-black tracking-tighter text-primary">{t("filtersTitle")}</p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 font-headline">
            {t("filtersSubtitle")}
          </p>
        </div>

        <div className="mt-10 space-y-10">
          <div>
            <div className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 font-headline">
              <FilterIcon type="category" />
              {t("filterCategory")}
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[14px] font-medium text-surface-600">
                <input
                  type="radio"
                  checked={categoryFilter === ""}
                  onChange={() => { setCategoryFilter(""); setPage(1); }}
                  className="h-4 w-4 text-secondary focus:ring-secondary"
                />
                {t("allCategories")}
              </label>
              {categoryList.slice(0, 4).map((cat) => (
                <label key={cat.id} className="flex items-center gap-3 text-[14px] font-medium text-surface-600">
                  <input
                    type="radio"
                    checked={categoryFilter === cat.slug}
                    onChange={() => { setCategoryFilter(cat.slug || ""); setPage(1); }}
                    className="h-4 w-4 text-secondary focus:ring-secondary"
                  />
                  {formatCategoryName(cat)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 font-headline">
              <FilterIcon type="project" />
              {t("filterProjectType")}
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[14px] font-medium text-surface-600">
                <input
                  type="radio"
                  checked={statusFilter === "open" || statusFilter === ""}
                  onChange={() => { setStatusFilter("open"); setPage(1); }}
                  className="h-4 w-4 text-secondary focus:ring-secondary"
                />
                {t("open")}
              </label>
              <label className="flex items-center gap-3 text-[14px] font-medium text-surface-600">
                <input
                  type="radio"
                  checked={statusFilter === "in_progress"}
                  onChange={() => { setStatusFilter("in_progress"); setPage(1); }}
                  className="h-4 w-4 text-secondary focus:ring-secondary"
                />
                {t("inProgress")}
              </label>
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 font-headline">
              <FilterIcon type="budget" />
              {t("filterBudget")}
            </div>
            <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={0}
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder={t("budgetMin")}
                  className="w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-[12px] font-bold text-primary outline-none"
                />
                <input
                  type="number"
                  min={0}
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder={t("budgetMax")}
                  className="w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-[12px] font-bold text-primary outline-none"
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] font-black tracking-widest text-surface-400 font-headline">
                <span>₮500K</span>
                <span>₮50M+</span>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 font-headline">
              <FilterIcon type="experience" />
              {t("filterExperience")}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "entry", label: t("experienceEntry") },
                { key: "intermediate", label: t("experienceIntermediate") },
                { key: "expert", label: t("experienceExpert") },
              ].map((level) => (
                <button
                  key={level.key}
                  type="button"
                  onClick={() => { setExperienceFilter(level.key); setPage(1); }}
                  className={`rounded-2xl px-4 py-2 text-[11px] font-black font-headline uppercase tracking-widest transition-all ${
                    level.key === experienceFilter
                      ? "bg-secondary-fixed text-secondary"
                      : "bg-surface-container-lowest text-surface-500 shadow-sm hover:bg-white"
                  }`}
                >
                  {level.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setExperienceFilter(""); setPage(1); }}
                className={`rounded-2xl px-4 py-2 text-[11px] font-black font-headline uppercase tracking-widest transition-all ${
                  experienceFilter === ""
                    ? "bg-surface-container text-on-surface"
                    : "bg-surface-container-lowest text-surface-500 shadow-sm hover:bg-white"
                }`}
              >
                {t("allExperience")}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setPage(1); setSearch(searchInput); setMobileFiltersOpen(false); }}
            className="w-full rounded-2xl primary-gradient px-5 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-primary-fixed shadow-ambient hover:shadow-sm active:scale-95 transition-all font-headline"
          >
            {t("applyFilters")}
          </button>
        </div>
      </aside>

      <div className="space-y-4 md:space-y-6">
        <div className="rounded-[2.5rem] bg-surface-container-low p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <form onSubmit={handleSearch} className="relative flex-1">
              <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-surface-400">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-2xl bg-surface-container-lowest py-4 pl-14 pr-4 text-[14px] font-medium text-primary shadow-sm outline-none placeholder:text-surface-300 focus:shadow-ambient"
              />
            </form>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={withLocale("/projects/new")}
                className="rounded-2xl primary-gradient px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-primary-fixed shadow-ambient transition-all hover:-translate-y-0.5 active:scale-95 font-headline"
              >
                {t("create")}
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-headline text-[38px] font-black tracking-tighter text-primary md:text-[48px]">
              {t("title")}
            </h1>
            <p className="mt-2 text-[15px] font-medium text-surface-400">
              {t("resultsCount", { count: totalCount })}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-5 py-3 text-[11px] shadow-sm">
            <span className="font-black uppercase tracking-widest text-surface-400 font-headline">{t("sortBy")}</span>
            <div className="font-black text-primary font-headline">{t("sortNewest")}</div>
          </div>
        </div>

        {projects.isLoading ? (
          <LoadingState label={t("loading")} />
        ) : projects.isError ? (
          <ErrorState label={t("loadError")} />
        ) : !items.length ? (
          <EmptyState label={t("empty")} />
        ) : (
          <>
            <ul className="space-y-4 md:space-y-5">
              {items.map((project) => {
                const categoryName = project.category_obj
                  ? locale === "en"
                    ? project.category_obj.name_en || project.category_obj.name_mn || project.category_obj.name
                    : project.category_obj.name_mn || project.category_obj.name_en || project.category_obj.name
                  : project.category;

                const realSkills = normalizeSkills(project.required_skills);

                return (
                  <li
                    key={project.id}
                    className="rounded-[2.5rem] bg-surface-container-lowest p-6 shadow-sm transition-all hover:shadow-ambient md:p-8"
                  >
                    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_200px] md:items-start md:gap-8">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-xl bg-secondary-fixed px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-secondary font-headline">
                            {categoryName}
                          </span>
                          <span className="text-[12px] font-medium text-surface-400">{t("postedRecently")}</span>
                        </div>

                        <h2 className="mt-4 font-headline text-[26px] font-black leading-tight tracking-tighter text-primary md:text-[30px]">
                          {project.title}
                        </h2>

                        <p className="mt-4 max-w-[70ch] line-clamp-2 text-[15px] font-medium leading-relaxed text-surface-500">
                          {project.description}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2 md:mt-6">
                          {realSkills.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-xl bg-surface-container-low px-3 py-1.5 text-[12px] font-bold text-surface-400 font-headline"
                            >
                              {tag}
                            </span>
                          ))}
                          {realSkills.length === 0 && (
                            <span className="rounded-xl bg-surface-container-low px-3 py-1.5 text-[12px] font-bold text-surface-400 font-headline">
                              {t("noSkillTags")}
                            </span>
                          )}
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          <div className="rounded-2xl bg-surface-container-low px-4 py-2 text-[12px] font-bold text-surface-500 font-headline">
                            {t("timeline")}: {project.timeline_days} {t("days")}
                          </div>
                          <div className={`rounded-2xl px-4 py-2 text-[12px] font-black capitalize font-headline ${statusTone(project.status)}`}>
                            {(project.status || "").replace(/_/g, " ")}
                          </div>
                        </div>
                      </div>

                      <div className="flex h-full flex-col justify-between gap-5 md:items-end">
                        <div className="text-left md:text-right">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 font-headline">
                            {t("budget")}
                          </p>
                          <p className="mt-2 font-headline text-[26px] font-black leading-none tracking-tighter text-secondary md:text-[30px]">
                            {formatPrice(project)}
                          </p>
                        </div>

                        <Link
                          href={withLocale(`/projects/${project.id}`)}
                          className="inline-flex items-center justify-center rounded-2xl bg-secondary px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-white shadow-sm transition-all hover:shadow-ambient hover:-translate-y-0.5 active:scale-95 md:px-7 font-headline"
                        >
                          {t("applyNow")}
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                type="button"
                disabled={!hasPrev}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-lowest text-surface-500 shadow-sm disabled:opacity-30 hover:shadow-ambient transition-all"
              >
                ‹
              </button>
              {visiblePages.map((value, index) =>
                typeof value === "number" ? (
                  <button
                    key={`${value}-${index}`}
                    type="button"
                    onClick={() => setPage(value)}
                    className={`flex h-11 min-w-11 items-center justify-center rounded-2xl px-3 text-[13px] font-black font-headline transition-all ${
                      page === value
                        ? "primary-gradient text-primary-fixed shadow-ambient"
                        : "bg-surface-container-lowest text-surface-500 shadow-sm hover:bg-white"
                    }`}
                  >
                    {value}
                  </button>
                ) : (
                  <span key={`${value}-${index}`} className="px-2 text-surface-400">
                    {value}
                  </span>
                ),
              )}
              <button
                type="button"
                disabled={!hasNext}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-lowest text-surface-500 shadow-sm disabled:opacity-30 hover:shadow-ambient transition-all"
              >
                ›
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
