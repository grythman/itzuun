"use client";
export const dynamic = "force-dynamic";

import { usePathname } from "next/navigation";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { AppCard } from "@/components/ui-kit";
import { useAdminSnapshot, useMe } from "@/lib/hooks";

export default function AdminDisputesPage() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const admin = useAdminSnapshot();

  if (me.isLoading || admin.disputes.isLoading) return <LoadingState label="Loading disputes..." />;
  if (me.isError || !me.data) return <ErrorState label="Please sign in first." />;
  if (admin.disputes.isError) return <ErrorState label="Could not load disputes." />;

  const disputes = Array.isArray(admin.disputes.data) ? admin.disputes.data : [];

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="admin" fallbackPath={withLocale("/auth")}>
      <section className="space-y-5">
        <h1 className="font-headline text-3xl font-extrabold text-surface-900">Admin Disputes</h1>
        <AppCard>
          {!disputes.length ? (
            <EmptyState label="No disputes found." />
          ) : (
            <ul className="space-y-2">
              {disputes.slice(0, 20).map((item: any) => (
                <li key={item.id} className="rounded-xl border border-surface-200/60 p-3 text-[13px]">
                  <p className="font-semibold text-surface-900">Dispute #{item.id}</p>
                  <p className="text-surface-500">Status: {item.status || "open"}</p>
                </li>
              ))}
            </ul>
          )}
        </AppCard>
      </section>
    </RoleGuard>
  );
}
