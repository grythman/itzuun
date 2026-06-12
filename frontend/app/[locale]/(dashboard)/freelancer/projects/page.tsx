"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { RoleGuard } from "@/components/shared/role-guard";
import { StatusPill } from "@/components/ui";
import { useMe, useMyProjects } from "@/lib/hooks";
import { toArray } from "@/lib/api/endpoints";

function formatMnt(value: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} ₮`;
}

function statusLabel(status: string): { label: string; tone: "neutral" | "success" | "warning" | "info" | "danger" } {
  const map: Record<string, { label: string; tone: "neutral" | "success" | "warning" | "info" | "danger" }> = {
    open: { label: "Нээлттэй", tone: "neutral" },
    reviewing: { label: "Шалгаж байна", tone: "warning" },
    agreed: { label: "Зөвшөөрсөн", tone: "info" },
    paid: { label: "Төлсөн", tone: "info" },
    in_progress: { label: "Ажиллаж байна", tone: "warning" },
    delivered: { label: "Хүлээлгэсэн", tone: "info" },
    completed: { label: "Дууссан", tone: "success" },
    disputed: { label: "Маргаантай", tone: "danger" },
  };
  return map[status] || { label: status, tone: "neutral" };
}

export default function FreelancerProjectsPage() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const projects = useMyProjects("freelancer");

  if (me.isLoading || projects.isLoading) return <LoadingState label="Төслүүдийг ачааллаж байна..." />;
  if (me.isError || !me.data) return <ErrorState label="Эхлээд нэвтэрнэ үү." />;

  const items = projects.data ? toArray<any>(projects.data) : [];

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="freelancer" fallbackPath={withLocale("/auth")}>
      <section className="space-y-6 pb-10">
        <div className="ui-surface p-5">
          <p className="ui-eyebrow">Миний төслүүд</p>
          <h1 className="mt-2 font-headline text-[1.75rem] font-black tracking-tight text-primary">
            Ажиллаж буй төслүүд
          </h1>
          <p className="mt-1 text-sm text-on-surface/60">Таныг сонгосон болон ажиллаж буй төслүүд.</p>
        </div>

        {items.length === 0 ? (
          <EmptyState label="Одоогоор ажиллаж буй төсөл алга." />
        ) : (
          <div className="space-y-3">
            {items.map((project: any) => {
              const s = statusLabel(project.status);
              return (
                <Link key={project.id} href={withLocale(`/projects/${project.id}`)} className="ui-surface block p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-headline text-base font-bold text-primary truncate">{project.title}</h3>
                      <p className="mt-1 text-sm text-on-surface/60 line-clamp-1">{project.description}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-on-surface/50">
                        <span>{formatMnt(project.budget)}</span>
                        <span>{project.timeline_days} өдөр</span>
                        <span className="capitalize">{project.category}</span>
                      </div>
                    </div>
                    <StatusPill label={s.label} tone={s.tone} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </RoleGuard>
  );
}
