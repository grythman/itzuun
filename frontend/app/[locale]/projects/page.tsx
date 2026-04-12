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
  if (status === "open") return "bg-[#dff5f0] text-[#157173]";
  if (status === "in_progress") return "bg-[#eef2ff] text-[#3557a1]";
  if (status === "awaiting_client_review") return "bg-[#fff5d8] text-[#a16c00]";
  if (status === "completed") return "bg-[#e9f6eb] text-[#238043]";
  if (status === "disputed") return "bg-[#ffe5e2] text-[#ba1a1a]";
  return "bg-[#eef1f4] text-surface-600";
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

  const categories = useCategories();
  const categoryList = Array.isArray(categories.data) ? categories.data : [];

  const filters = {
    ...(statusFilter && { status: statusFilter }),
    ...(categoryFilter && { category: categoryFilter }),
    ...(search && { search }),
    ...(skillsFilter && { skills: skillsFilter }),
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
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [page, search, statusFilter, categoryFilter, skillsFilter, pathname, router]);

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

  return (
    <section className="grid gap-6 xl:grid-cols-[286px_minmax(0,1fr)]">
      <aside className="h-fit rounded-[30px] bg-[#f7f9fb] p-6 shadow-[0_20px_50px_rgba(3,22,54,0.05)] xl:sticky xl:top-24">
        <div>
          <p className="text-[22px] font-bold tracking-[-0.03em] text-[#031636]">{t("filtersTitle")}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-400">
            {t("filtersSubtitle")}
          </p>
        </div>

        <div className="mt-8 space-y-8">
          <div>
            <div className="mb-4 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-surface-500">
              <FilterIcon type="category" />
              {t("filterCategory")}
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-[14px] text-surface-700">
                <input
                  type="radio"
                  checked={categoryFilter === ""}
                  onChange={() => {
                    setCategoryFilter("");
                    setPage(1);
                  }}
                  className="h-4 w-4 border-[#c5c6cf] text-[#157173] focus:ring-[#157173]"
                />
                {t("allCategories")}
              </label>
              {categoryList.slice(0, 4).map((cat) => (
                <label key={cat.id} className="flex items-center gap-3 text-[14px] text-surface-700">
                  <input
                    type="radio"
                    checked={categoryFilter === cat.slug}
                    onChange={() => {
                      setCategoryFilter(cat.slug || "");
                      setPage(1);
                    }}
                    className="h-4 w-4 border-[#c5c6cf] text-[#157173] focus:ring-[#157173]"
                  />
                  {formatCategoryName(cat)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-surface-500">
              <FilterIcon type="project" />
              {t("filterProjectType")}
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-[14px] text-surface-700">
                <input
                  type="radio"
                  checked={statusFilter === "open" || statusFilter === ""}
                  onChange={() => {
                    setStatusFilter("open");
                    setPage(1);
                  }}
                  className="h-4 w-4 border-[#c5c6cf] text-[#157173] focus:ring-[#157173]"
                />
                {t("open")}
              </label>
              <label className="flex items-center gap-3 text-[14px] text-surface-700">
                <input
                  type="radio"
                  checked={statusFilter === "in_progress"}
                  onChange={() => {
                    setStatusFilter("in_progress");
                    setPage(1);
                  }}
                  className="h-4 w-4 border-[#c5c6cf] text-[#157173] focus:ring-[#157173]"
                />
                {t("inProgress")}
              </label>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-surface-500">
              <FilterIcon type="budget" />
              {t("filterBudget")}
            </div>
            <div className="rounded-[18px] bg-white px-4 py-4 shadow-[inset_0_0_0_1px_rgba(197,198,207,0.18)]">
              <div className="h-2 rounded-full bg-[#e7edf1]">
                <div className="ml-[38%] h-2 w-[26%] rounded-full bg-[#157173]" />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-surface-400">
                <span>₮500K</span>
                <span>₮50M+</span>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-surface-500">
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
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                    level.key === "intermediate"
                      ? "bg-[#dff5f0] text-[#157173]"
                      : "bg-white text-surface-500 shadow-[inset_0_0_0_1px_rgba(197,198,207,0.22)]"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPage(1);
              setSearch(searchInput);
            }}
            className="w-full rounded-2xl bg-[#071a3f] px-5 py-4 text-[14px] font-semibold text-white shadow-[0_16px_36px_rgba(3,22,54,0.18)]"
          >
            {t("applyFilters")}
          </button>
        </div>
      </aside>

      <div className="space-y-6">
        <div className="rounded-[30px] bg-[#f7f9fb] p-4 shadow-[0_20px_50px_rgba(3,22,54,0.05)] md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <form onSubmit={handleSearch} className="relative flex-1">
              <SearchIcon />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-[18px] bg-white py-4 pl-12 pr-4 text-[14px] text-[#031636] shadow-[inset_0_0_0_1px_rgba(197,198,207,0.18)] outline-none placeholder:text-surface-400"
              />
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-surface-400">
                <SearchIcon />
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={withLocale("/projects/new")}
                className="rounded-2xl bg-[#071a3f] px-5 py-3 text-[14px] font-semibold text-white shadow-[0_14px_30px_rgba(3,22,54,0.16)]"
              >
                {t("create")}
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-headline text-[42px] font-extrabold tracking-[-0.05em] text-[#031636]">
              {t("title")}
            </h1>
            <p className="mt-2 text-[15px] text-surface-500">
              {t("resultsCount", { count: totalCount })}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-[18px] bg-[#f7f9fb] px-4 py-3 text-[13px] shadow-[0_18px_40px_rgba(3,22,54,0.05)]">
            <span className="font-semibold uppercase tracking-[0.12em] text-surface-400">{t("sortBy")}</span>
            <div className="font-semibold text-[#031636]">{t("sortNewest")}</div>
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
            <ul className="space-y-5">
              {items.map((project) => {
                const categoryName = project.category_obj
                  ? locale === "en"
                    ? project.category_obj.name_en || project.category_obj.name_mn || project.category_obj.name
                    : project.category_obj.name_mn || project.category_obj.name_en || project.category_obj.name
                  : project.category;

                return (
                  <li
                    key={project.id}
                    className="rounded-[28px] bg-white p-5 shadow-[0_20px_50px_rgba(3,22,54,0.06)] md:p-7"
                  >
                    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#dff5f0] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#157173]">
                            {categoryName}
                          </span>
                          <span className="text-[12px] text-surface-400">{t("postedRecently")}</span>
                        </div>

                        <h2 className="mt-3 font-headline text-[28px] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#031636]">
                          {project.title}
                        </h2>

                        <p className="mt-3 max-w-[70ch] line-clamp-2 text-[15px] leading-7 text-surface-600">
                          {project.description}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {(String(project.description || "")
                            .split(/[\s,]+/)
                            .filter(Boolean)
                            .slice(0, 3)).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-xl bg-[#f7f9fb] px-3 py-1.5 text-[12px] font-medium text-surface-500 shadow-[inset_0_0_0_1px_rgba(197,198,207,0.15)]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          <div className="rounded-full bg-[#f7f9fb] px-3 py-2 text-[12px] font-medium text-surface-600 shadow-[inset_0_0_0_1px_rgba(197,198,207,0.15)]">
                            {t("timeline")}: {project.timeline_days} {t("days")}
                          </div>
                          <div className={`rounded-full px-3 py-2 text-[12px] font-semibold capitalize ${statusTone(project.status)}`}>
                            {(project.status || "").replace(/_/g, " ")}
                          </div>
                        </div>
                      </div>

                      <div className="flex h-full flex-col justify-between gap-5 md:items-end">
                        <div className="text-left md:text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-surface-400">
                            {t("budget")}
                          </p>
                          <p className="mt-2 font-headline text-[28px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#157173]">
                            {formatPrice(project)}
                          </p>
                        </div>

                        <Link
                          href={withLocale(`/projects/${project.id}`)}
                          className="inline-flex items-center justify-center rounded-2xl bg-[#157173] px-6 py-3 text-[14px] font-semibold text-white shadow-[0_16px_36px_rgba(21,113,115,0.18)] transition hover:opacity-95"
                        >
                          {t("applyNow")}
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                disabled={!hasPrev}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-surface-500 shadow-[inset_0_0_0_1px_rgba(197,198,207,0.22)] disabled:opacity-40"
              >
                ‹
              </button>
              {visiblePages.map((value, index) =>
                typeof value === "number" ? (
                  <button
                    key={`${value}-${index}`}
                    type="button"
                    onClick={() => setPage(value)}
                    className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-[13px] font-semibold ${
                      page === value
                        ? "bg-[#071a3f] text-white"
                        : "bg-white text-surface-500 shadow-[inset_0_0_0_1px_rgba(197,198,207,0.22)]"
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
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-surface-500 shadow-[inset_0_0_0_1px_rgba(197,198,207,0.22)] disabled:opacity-40"
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
