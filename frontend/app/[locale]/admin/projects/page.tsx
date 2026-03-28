"use client";
export const dynamic = "force-dynamic";

import { usePathname } from "next/navigation";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { AppCard } from "@/components/ui-kit";
import { useAdminSnapshot, useMe } from "@/lib/hooks";

export default function AdminProjectsPage() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const admin = useAdminSnapshot();

  if (me.isLoading || admin.projects.isLoading) return <LoadingState label="Loading projects..." />;
  if (me.isError || !me.data) return <ErrorState label="Please sign in first." />;
  if (admin.projects.isError) return <ErrorState label="Could not load projects." />;

  const projects = Array.isArray(admin.projects.data) ? admin.projects.data : [];

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="admin" fallbackPath={withLocale("/auth")}>
      <section className="space-y-5">
        <h1 className="font-headline text-3xl font-extrabold text-surface-900">Admin Projects</h1>
        <AppCard>
          {!projects.length ? (
            <EmptyState label="No projects found." />
          ) : (
            <ul className="space-y-2">
              {projects.slice(0, 20).map((item: any) => (
                <li key={item.id} className="rounded-xl border border-surface-200/60 p-3 text-[13px]">
                  <p className="font-semibold text-surface-900">{item.title}</p>
                  <p className="text-surface-500">Status: {item.status}</p>
                </li>
              ))}
            </ul>
          )}
        </AppCard>
      </section>
    </RoleGuard>
  );
}
