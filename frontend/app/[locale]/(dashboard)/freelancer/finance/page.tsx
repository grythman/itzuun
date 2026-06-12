"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { RoleGuard } from "@/components/shared/role-guard";
import { StatusPill } from "@/components/ui";
import { useMe, useMyProjects } from "@/lib/hooks";
import { toArray } from "@/lib/api/endpoints";

function formatMnt(value: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} ₮`;
}

export default function FreelancerFinancePage() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const projects = useMyProjects("freelancer");

  if (me.isLoading || projects.isLoading) return <LoadingState label="Санхүүгийн мэдээлэл ачааллаж байна..." />;
  if (me.isError || !me.data) return <ErrorState label="Эхлээд нэвтэрнэ үү." />;

  const items = projects.data ? toArray<any>(projects.data) : [];
  const completed = items.filter((p: any) => p.status === "completed");
  const inProgress = items.filter((p: any) => ["in_progress", "delivered", "paid"].includes(p.status));
  const totalEarned = completed.reduce((sum: number, p: any) => sum + Math.round(Number(p.budget) * 0.9), 0);
  const pendingAmount = inProgress.reduce((sum: number, p: any) => sum + Math.round(Number(p.budget) * 0.9), 0);

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="freelancer" fallbackPath={withLocale("/auth")}>
      <section className="space-y-6 pb-10">
        <div className="ui-surface p-5">
          <p className="ui-eyebrow">Санхүү</p>
          <h1 className="mt-2 font-headline text-[1.75rem] font-black tracking-tight text-primary">
            Орлого & Төлбөр
          </h1>
          <p className="mt-1 text-sm text-on-surface/60">Таны орлогын тойм болон төлбөрийн түүх.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="ui-surface p-5">
            <p className="ui-eyebrow">Нийт орлого</p>
            <p className="mt-2 font-headline text-2xl font-black text-primary">{formatMnt(totalEarned)}</p>
            <p className="mt-1 text-xs text-on-surface/50">{completed.length} дууссан төсөл</p>
          </div>
          <div className="ui-surface p-5">
            <p className="ui-eyebrow">Хүлээгдэж буй</p>
            <p className="mt-2 font-headline text-2xl font-black text-secondary">{formatMnt(pendingAmount)}</p>
            <p className="mt-1 text-xs text-on-surface/50">{inProgress.length} идэвхтэй төсөл</p>
          </div>
          <div className="ui-surface p-5">
            <p className="ui-eyebrow">Платформ шимтгэл</p>
            <p className="mt-2 font-headline text-2xl font-black text-on-surface/70">10%</p>
            <p className="mt-1 text-xs text-on-surface/50">Төсөл бүрээс суутгагдана</p>
          </div>
        </div>

        <div className="ui-surface p-5">
          <h2 className="font-headline text-lg font-bold text-primary">Төлбөрийн түүх</h2>
          {completed.length === 0 ? (
            <EmptyState label="Одоогоор төлбөрийн түүх алга." />
          ) : (
            <div className="mt-4 space-y-3">
              {completed.map((project: any) => (
                <Link key={project.id} href={withLocale(`/projects/${project.id}`)} className="flex items-center justify-between rounded-xl bg-surface-container-low p-4 transition-shadow hover:shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-primary">{project.title}</p>
                    <p className="mt-0.5 text-xs text-on-surface/50">{project.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-headline text-sm font-bold text-primary">{formatMnt(Math.round(Number(project.budget) * 0.9))}</p>
                    <StatusPill label="Хүлээн авсан" tone="success" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </RoleGuard>
  );
}
