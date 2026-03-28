"use client";
export const dynamic = "force-dynamic";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { AppCard } from "@/components/ui-kit";
import { useAdminSnapshot, useMe } from "@/lib/hooks";

export default function AdminDisputesPage() {
  const t = useTranslations("AdminDisputesPage");
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const admin = useAdminSnapshot();

  if (me.isLoading || admin.disputes.isLoading) return <LoadingState label={t("loading")} />;
  if (me.isError || !me.data) return <ErrorState label={t("signinRequired")} />;
  if (admin.disputes.isError) return <ErrorState label={t("loadError")} />;

  const disputes = Array.isArray(admin.disputes.data) ? admin.disputes.data : [];

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="admin" fallbackPath={withLocale("/auth")}>
      <section className="space-y-5">
        <h1 className="font-headline text-3xl font-extrabold text-surface-900">{t("title")}</h1>
        <AppCard>
          {!disputes.length ? (
            <EmptyState label={t("empty")} />
          ) : (
            <ul className="space-y-2">
              {disputes.slice(0, 20).map((item: any) => (
                <li key={item.id} className="rounded-xl border border-surface-200/60 p-3 text-[13px]">
                  <p className="font-semibold text-surface-900">{t("dispute")} #{item.id}</p>
                  <p className="text-surface-500">{t("status")}: {item.status || t("open")}</p>
                </li>
              ))}
            </ul>
          )}
        </AppCard>
      </section>
    </RoleGuard>
  );
}
