"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { useMe, useProjects } from "@/lib/hooks";
import type { ProjectDto } from "@/lib/api/types";

function formatMnt(value: number): string {
  return `₮${new Intl.NumberFormat("mn-MN").format(value)}`;
}

type StatusMeta = { label: string; bg: string; text: string };

function projectStatusMeta(status: string): StatusMeta {
  if (status === "open") return { label: "Нээлттэй", bg: "bg-secondary-fixed/40", text: "text-secondary" };
  if (status === "in_progress") return { label: "Явагдаж байна", bg: "bg-primary-fixed", text: "text-primary" };
  if (status === "awaiting_client_review") return { label: "Шалгуулж байна", bg: "bg-amber-100", text: "text-amber-700" };
  if (status === "completed") return { label: "Дууссан", bg: "bg-green-50", text: "text-green-700" };
  if (status === "cancelled") return { label: "Цуцлагдсан", bg: "bg-red-50", text: "text-red-700" };
  if (status === "disputed") return { label: "Маргаан", bg: "bg-orange-50", text: "text-orange-700" };
  return { label: status, bg: "bg-surface-container-low", text: "text-surface-500" };
}

function progressForStatus(status: string): number {
  if (status === "open") return 10;
  if (status === "in_progress") return 60;
  if (status === "awaiting_client_review") return 90;
  if (status === "completed") return 100;
  if (status === "cancelled") return 0;
  return 30;
}

const STATUS_FILTERS = [
  { key: "all", label: "Бүгд" },
  { key: "open", label: "Нээлттэй" },
  { key: "in_progress", label: "Явагдаж байна" },
  { key: "awaiting_client_review", label: "Шалгуулж байна" },
  { key: "completed", label: "Дууссан" },
];

export default function ClientProjectsPage() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const projects = useProjects(1);
  const [activeFilter, setActiveFilter] = useState("all");

  if (me.isLoading || projects.isLoading) return <LoadingState label="Төслүүд ачааллаж байна..." />;
  if (me.isError || !me.data) return <ErrorState label="Эхлээд нэвтэрнэ үү." />;
  if (projects.isError || !projects.data) return <ErrorState label="Төслүүдийг ачааллаж чадсангүй." />;

  const allMyProjects: ProjectDto[] = projects.data.results.filter((p: ProjectDto) => p.owner === me.data?.id);
  const filtered =
    activeFilter === "all" ? allMyProjects : allMyProjects.filter((p) => p.status === activeFilter);

  const stats = {
    total: allMyProjects.length,
    active: allMyProjects.filter((p) => p.status === "in_progress").length,
    review: allMyProjects.filter((p) => p.status === "awaiting_client_review").length,
    done: allMyProjects.filter((p) => p.status === "completed").length,
  };

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="client" fallbackPath={withLocale("/auth")}>
      <section className="space-y-8 pb-20">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-surface-400 font-headline">
              Захиалагч
            </p>
            <h1 className="mt-3 font-headline text-[36px] font-black leading-none tracking-tighter text-primary md:text-[44px]">
              Миний төслүүд
            </h1>
            <p className="mt-3 text-[15px] font-medium text-surface-500">
              {stats.active > 0 && `${stats.active} идэвхтэй · `}
              {stats.review > 0 && `${stats.review} шалгуулж байна · `}
              Нийт {stats.total} төсөл
            </p>
          </div>
          <Link
            href={withLocale("/projects/new")}
            className="inline-flex min-h-12 items-center rounded-2xl primary-gradient px-6 text-[11px] font-black uppercase tracking-[0.18em] text-primary-fixed shadow-ambient transition-all hover:-translate-y-0.5 font-headline"
          >
            + Шинэ төсөл
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Нийт төсөл", value: stats.total, accent: false },
            { label: "Идэвхтэй", value: stats.active, accent: true },
            { label: "Хянуулж байна", value: stats.review, accent: false },
            { label: "Дууссан", value: stats.done, accent: false },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-[2rem] p-6 shadow-sm ${s.accent ? "primary-gradient text-primary-fixed" : "bg-surface-container-lowest"}`}
            >
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] font-headline ${s.accent ? "text-white/60" : "text-surface-400"}`}>
                {s.label}
              </p>
              <p className={`mt-3 font-headline text-3xl font-black ${s.accent ? "text-white" : "text-primary"}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((tab) => {
            const count = tab.key === "all" ? allMyProjects.length : allMyProjects.filter((p) => p.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all font-headline ${
                  activeFilter === tab.key
                    ? "bg-primary text-primary-fixed shadow-ambient"
                    : "bg-surface-container-lowest text-surface-500 shadow-sm hover:text-primary"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-black ${activeFilter === tab.key ? "bg-white/20" : "bg-surface-container-low"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Project table */}
        {!filtered.length ? (
          <div className="flex flex-col items-center justify-center rounded-[2.5rem] bg-surface-container-lowest py-24 shadow-sm text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low text-surface-300">
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor" aria-hidden>
                <path d="M10 4V3h4v1h5a2 2 0 0 1 2 2v3H3V6a2 2 0 0 1 2-2h5Zm11 7H3v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8Z" />
              </svg>
            </div>
            <p className="mt-6 font-headline text-lg font-black text-primary">Төсөл байхгүй байна</p>
            <p className="mt-2 text-sm font-medium text-surface-400">Эхний төслөө байршуулаарай.</p>
            <Link
              href={withLocale("/projects/new")}
              className="mt-8 inline-flex min-h-12 items-center rounded-2xl primary-gradient px-8 text-[11px] font-black uppercase tracking-[0.18em] text-primary-fixed shadow-ambient font-headline"
            >
              Төсөл байршуулах
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[2.5rem] bg-surface-container-lowest shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low/50">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.18em] text-surface-400 font-headline">Төслийн нэр</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.18em] text-surface-400 font-headline">Төсөв</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.18em] text-surface-400 font-headline">Явц</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.18em] text-surface-400 font-headline">Төлөв</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.18em] text-surface-400 font-headline" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {filtered.map((project) => {
                    const meta = projectStatusMeta(project.status);
                    const progress = progressForStatus(project.status);
                    return (
                      <tr key={project.id} className="transition-colors hover:bg-surface-container-low/30">
                        <td className="px-8 py-6">
                          <Link href={withLocale(`/projects/${project.id}`)}>
                            <p className="font-headline text-[15px] font-bold text-on-surface hover:text-primary transition-colors">
                              {project.title}
                            </p>
                            <p className="mt-1 text-[11px] font-bold text-surface-400 font-headline uppercase tracking-widest">
                              {project.category || "General"}
                            </p>
                          </Link>
                        </td>
                        <td className="px-8 py-6">
                          <span className="font-headline text-[15px] font-black text-primary">
                            {formatMnt(Number(project.budget || 0))}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-container-low">
                            <div
                              className="h-full rounded-full primary-gradient transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="mt-1.5 block text-[10px] font-black text-primary font-headline uppercase tracking-widest">
                            {progress}%
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] font-headline ${meta.bg} ${meta.text}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <Link
                            href={withLocale(`/projects/${project.id}`)}
                            className="text-[11px] font-black uppercase tracking-widest text-secondary transition-all hover:opacity-70 font-headline"
                          >
                            Харах →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </RoleGuard>
  );
}
