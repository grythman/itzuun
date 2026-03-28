"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { AppCard } from "@/components/ui-kit";
import { useMe, useProjects } from "@/lib/hooks";

export default function ClientProjectsPage() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const projects = useProjects(1);

  if (me.isLoading || projects.isLoading) return <LoadingState label="Loading client projects..." />;
  if (me.isError || !me.data) return <ErrorState label="Please sign in first." />;
  if (projects.isError || !projects.data) return <ErrorState label="Could not load projects." />;

  const myProjects = projects.data.results.filter((item: any) => item.owner === me.data?.id);

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="client" fallbackPath={withLocale("/auth")}>
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-3xl font-extrabold text-surface-900">Client Project Management</h1>
            <p className="mt-1 text-[14px] text-surface-500">Manage project statuses, proposals, and payment actions from one place.</p>
          </div>
          <Link href={withLocale("/projects/new")} className="rounded-full primary-gradient px-5 py-2 text-[13px] font-semibold text-white">New Project</Link>
        </div>

        <AppCard>
          {!myProjects.length ? (
            <EmptyState label="No client projects yet." />
          ) : (
            <ul className="space-y-3">
              {myProjects.map((item: any) => (
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
