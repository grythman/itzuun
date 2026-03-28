"use client";
export const dynamic = "force-dynamic";

import { usePathname } from "next/navigation";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { AppCard } from "@/components/ui-kit";
import { useMe, useMyProposals } from "@/lib/hooks";

export default function FreelancerProposalsPage() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const proposals = useMyProposals();

  if (me.isLoading || proposals.isLoading) return <LoadingState label="Loading proposals..." />;
  if (me.isError || !me.data) return <ErrorState label="Please sign in first." />;
  if (proposals.isError) return <ErrorState label="Could not load proposals." />;

  const items = Array.isArray(proposals.data) ? proposals.data : [];

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="freelancer" fallbackPath={withLocale("/auth")}>
      <section className="space-y-5">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-surface-900">Freelancer Proposals</h1>
          <p className="mt-1 text-[14px] text-surface-500">Track proposal statuses and follow up on opportunities.</p>
        </div>

        <AppCard>
          {!items.length ? (
            <EmptyState label="No proposals yet." />
          ) : (
            <ul className="space-y-3">
              {items.map((item: any) => (
                <li key={item.id} className="rounded-xl border border-surface-200/60 p-3 text-[13px]">
                  <p className="font-semibold text-surface-900">Project #{item.project}</p>
                  <p className="text-surface-500">Status: {item.status || "pending"}</p>
                </li>
              ))}
            </ul>
          )}
        </AppCard>
      </section>
    </RoleGuard>
  );
}
