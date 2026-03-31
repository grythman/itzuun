"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useCategories, useProjects } from "@/lib/hooks";

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

  const filters = {
    ...(statusFilter && { status: statusFilter }),
    ...(categoryFilter && { category: categoryFilter }),
    ...(search && { search }),
    ...(skillsFilter && { skills: skillsFilter }),
  };

  const projects = useProjects(page, Object.keys(filters).length ? filters : undefined);
  const categoryList = Array.isArray(categories.data) ? categories.data : [];

  const items = projects.data?.results || [];
  const hasNext = !!projects.data?.next;
  const hasPrev = page > 1;
  const statusOptions = [
    { value: "", label: t("allStatus") },
    { value: "open", label: t("open") },
    { value: "in_progress", label: t("inProgress") },
    { value: "awaiting_client_review", label: t("awaitingReview") },
    { value: "completed", label: t("completed") },
    { value: "disputed", label: t("disputed") },
  ];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

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

  function handleFilterChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      setter(e.target.value);
      setPage(1);
    };
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight">{t("title")}</h1>
        <Link href={withLocale("/projects/new")} className="rounded-full primary-gradient px-5 py-2 text-[13px] font-semibold text-white shadow-card hover:opacity-95">
          {t("create")}
        </Link>
      </div>

      {/* Search and filters */}
      <div className="rounded-2xl bg-surface-100 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 rounded-xl border border-surface-200/60 px-3 py-2 text-[13px]"
          />
          <button type="submit" className="rounded-full primary-gradient px-5 py-2 text-[13px] text-white">
            {t("search")}
          </button>
        </form>

        <select value={statusFilter} onChange={handleFilterChange(setStatusFilter)} className="rounded-xl border border-surface-200/60 px-3 py-2 text-[13px]">
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="mt-3">
        <input
          type="text"
          placeholder={t("skillsFilterPlaceholder")}
          value={skillsFilter}
          onChange={(e) => {
            setSkillsFilter(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-xl border border-surface-200/60 px-3 py-2 text-[13px]"
        />
      </div>
      </div>

      {categoryList.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1 pb-2">
          <button
            onClick={() => { setCategoryFilter(""); setPage(1); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              categoryFilter === "" 
                ? "bg-brand-600 text-white" 
                : "bg-surface-100 text-surface-700 hover:bg-surface-200"
            }`}
          >
            {t("allCategories")}
          </button>
          {categoryList.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCategoryFilter(cat.slug); setPage(1); }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition flex items-center gap-1 ${
                categoryFilter === cat.slug 
                  ? "bg-brand-600 text-white" 
                  : "bg-surface-100 text-surface-700 hover:bg-surface-200"
              }`}
            >
              {cat.icon && <span>{cat.icon}</span>}
              {locale === "en" ? (cat.name_en || cat.name_mn || cat.name) : (cat.name_mn || cat.name_en || cat.name)}
            </button>
          ))}
        </div>
      )}

      {projects.isLoading ? (
        <LoadingState label={t("loading")} />
      ) : projects.isError ? (
        <ErrorState label={t("loadError")} />
      ) : !items.length ? (
        <EmptyState label={t("empty")} />
      ) : (
        <>
          <ul className="grid gap-3">
            {items.map((project) => (
              <li key={project.id} className="rounded-2xl bg-white p-5 shadow-card transition hover:shadow-card-hover">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-headline text-2xl font-bold text-surface-900">{project.title}</h2>
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] text-brand-700">
                        {project.category_obj
                          ? (locale === "en"
                            ? (project.category_obj.name_en || project.category_obj.name_mn || project.category_obj.name)
                            : (project.category_obj.name_mn || project.category_obj.name_en || project.category_obj.name))
                          : project.category}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[13px] text-surface-600">{project.description}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-surface-500">
                      <span>{t("budget")}: {Number(project.budget).toLocaleString()}₮</span>
                      <span>{t("timeline")}: {project.timeline_days} {t("days")}</span>
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 font-medium capitalize text-brand-700">
                        {project.status?.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  <Link href={withLocale(`/projects/${project.id}`)} className="shrink-0 rounded-full primary-gradient px-5 py-2 text-[13px] text-white">
                    {t("view")}
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
              className="rounded-xl border border-surface-200/60 px-4 py-2 text-[13px] disabled:opacity-40"
            >
              {t("previous")}
            </button>
            <span className="text-[13px] text-surface-600">{t("page")} {page}</span>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-surface-200/60 px-4 py-2 text-[13px] disabled:opacity-40"
            >
              {t("next")}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
