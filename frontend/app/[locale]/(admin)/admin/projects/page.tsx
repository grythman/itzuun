"use client";
export const dynamic = "force-dynamic";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

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

  if (me.isLoading || admin.projects.isLoading) return <LoadingState label={t("loading")} />;
  if (me.isError || !me.data) return <ErrorState label={t("signinRequired")} />;
  if (admin.projects.isError) return <ErrorState label={t("loadError")} />;

  const projects = toArray<any>(admin.projects.data as any);
  const openCount = projects.filter((item) => (item.status || "").toLowerCase().includes("open")).length;
  const activeCount = projects.filter((item) => (item.status || "").toLowerCase().includes("progress")).length;

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

        <AppCard>
          {!projects.length ? (
            <EmptyState label={t("empty")} />
          ) : (
            <ul className="space-y-2">
              {projects.slice(0, 40).map((item: any) => (
                <li key={item.id} className="rounded-xl bg-surface-container-low p-4 text-[13px]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-primary">{item.title || `Project #${item.id}`}</p>
                    <StatusPill label={item.status || "unknown"} tone="neutral" />
                  </div>
                  <p className="mt-2 text-on-surface/60">
                    {t("status")}: {item.status || "-"} · ID: {item.id}
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
