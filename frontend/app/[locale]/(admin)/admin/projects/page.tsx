"use client";
export const dynamic = "force-dynamic";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { RoleGuard } from "@/components/shared/role-guard";
import { AppCard, StatusPill } from "@/components/ui";
import { toArray } from "@/lib/api/endpoints";
import { useAdminSnapshot, useMe } from "@/lib/hooks";

export default function AdminProjectsPage() {
  const t = useTranslations("AdminProjectsPage");
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const admin = useAdminSnapshot();
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "progress" | "completed">("all");
  const [search, setSearch] = useState("");

  const projects = toArray<any>(admin.projects.data as any);
  const openCount = projects.filter((item) => (item.status || "").toLowerCase().includes("open")).length;
  const activeCount = projects.filter((item) => (item.status || "").toLowerCase().includes("progress")).length;
  const completedCount = projects.filter((item) => (item.status || "").toLowerCase().includes("complete")).length;
  const disputedCount = projects.filter((item) => (item.status || "").toLowerCase().includes("dispute")).length;

  const filteredProjects = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return projects.filter((item) => {
      const status = String(item.status || "").toLowerCase();
      if (statusFilter !== "all" && !status.includes(statusFilter)) return false;
      if (!keyword) return true;
      const title = String(item.title || "").toLowerCase();
      const id = String(item.id || "");
      return title.includes(keyword) || id.includes(keyword);
    });
  }, [projects, search, statusFilter]);

  if (me.isLoading || admin.projects.isLoading) return <LoadingState label={t("loading")} />;
  if (me.isError || !me.data) return <ErrorState label={t("signinRequired")} />;
  if (admin.projects.isError) return <ErrorState label={t("loadError")} />;

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="admin" fallbackPath={withLocale("/auth")}>
      <section className="space-y-5 pb-10">
        <div className="ui-surface p-5">
          <p className="ui-eyebrow">Project Oversight</p>
          <h1 className="mt-2 font-headline text-[2rem] font-black tracking-tight text-primary">{t("title")}</h1>
          <p className="mt-2 text-sm text-on-surface/65">
            Нийт {projects.length} төсөл байна. Open: {openCount}, In progress: {activeCount}.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface/45">Open</p>
            <p className="mt-1 font-headline text-3xl font-black tracking-tight text-primary">{openCount}</p>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface/45">In progress</p>
            <p className="mt-1 font-headline text-3xl font-black tracking-tight text-primary">{activeCount}</p>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface/45">Completed</p>
            <p className="mt-1 font-headline text-3xl font-black tracking-tight text-primary">{completedCount}</p>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface/45">Disputed</p>
            <p className="mt-1 font-headline text-3xl font-black tracking-tight text-primary">{disputedCount}</p>
          </div>
        </div>

        <AppCard>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {[
              { key: "all", label: "Бүгд" },
              { key: "open", label: "Open" },
              { key: "progress", label: "Progress" },
              { key: "completed", label: "Completed" },
            ].map((filter) => {
              const active = statusFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setStatusFilter(filter.key as typeof statusFilter)}
                  className={[
                    "inline-flex min-h-10 items-center rounded-xl px-4 text-xs font-black uppercase tracking-[0.14em] transition-all",
                    active
                      ? "bg-primary text-primary-fixed shadow-[0_10px_24px_rgba(3,22,54,0.14)]"
                      : "bg-surface-container-low text-on-surface/65 hover:bg-surface-container",
                  ].join(" ")}
                >
                  {filter.label}
                </button>
              );
            })}
            <div className="ml-auto min-w-[220px] rounded-xl bg-surface-container-low px-3 py-2">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Project title / ID..."
                className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface/45 focus:ring-0"
              />
            </div>
          </div>

          {!filteredProjects.length ? (
            <EmptyState label={t("empty")} />
          ) : (
            <ul className="space-y-2">
              {filteredProjects.slice(0, 60).map((item: any) => (
                <li key={item.id} className="rounded-xl bg-surface-container-low p-4 text-[13px]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-primary">{item.title || `Project #${item.id}`}</p>
                    <StatusPill
                      label={item.status || "unknown"}
                      tone={
                        String(item.status || "").toLowerCase().includes("complete")
                          ? "success"
                          : String(item.status || "").toLowerCase().includes("open")
                            ? "info"
                            : String(item.status || "").toLowerCase().includes("progress")
                              ? "warning"
                              : "neutral"
                      }
                    />
                  </div>
                  <p className="mt-2 text-on-surface/60">
                    {t("status")}: {item.status || "-"} · ID: {item.id}
                  </p>
                  <p className="mt-1 text-on-surface/55">
                    Budget: {item.budget_min?.toLocaleString?.() ?? "-"} - {item.budget_max?.toLocaleString?.() ?? "-"} ₮
                  </p>
                </li>
              ))}
            </ul>
          )}
        </AppCard>
      </section>
    </RoleGuard>
  );
}
