"use client";
export const dynamic = "force-dynamic";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { RoleGuard } from "@/components/shared/role-guard";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { StatusPill } from "@/components/ui";
import { escrowApi } from "@/lib/api/endpoints";
import { useMe, useProjects } from "@/lib/hooks";
import type { ProjectDto } from "@/lib/api/types";

function formatMnt(amount: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(amount)} ₮`;
}

type EscrowTone = "neutral" | "success" | "warning" | "danger" | "info";

function statusTone(status: string): EscrowTone {
  if (status === "held") return "success";
  if (status === "released") return "info";
  if (status === "disputed" || status === "refunded") return "danger";
  if (status === "pending_admin") return "warning";
  return "neutral";
}

export default function ClientEscrowPage() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const projects = useProjects(1);

  if (me.isLoading || projects.isLoading)
    return <LoadingState label="Эскроу мэдээлэл ачааллаж байна..." />;
  if (me.isError || !me.data) return <ErrorState label="Эхлээд нэвтэрнэ үү." />;
  if (projects.isError || !projects.data)
    return <ErrorState label="Төслүүдийг ачааллаж чадсангүй." />;

  const myProjects: ProjectDto[] = projects.data.results.filter(
    (p: ProjectDto) => p.owner === me.data?.id,
  );
  const activeProjects = myProjects.filter(
    (p) => p.status === "in_progress" || p.status === "awaiting_client_review",
  );

  return (
    <RoleGuard
      currentRole={me.data.role}
      requiredRole="client"
      fallbackPath={withLocale("/auth")}
    >
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-bold">Санхүү &amp; Эскроу</h1>
        <p className="text-on-surface-variant">
          Таны төслүүдийн эскроу төлөв болон санхүүгийн мэдээлэл.
        </p>

        {activeProjects.length === 0 ? (
          <EmptyState
            label="Идэвхтэй эскроу байхгүй"
            description="Одоогоор эскроу түгжээтэй төсөл байхгүй байна."
          />
        ) : (
          <div className="space-y-4">
            {activeProjects.map((project) => (
              <EscrowCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

function EscrowCard({ project }: { project: ProjectDto }) {
  const escrowQuery = useQuery({
    queryKey: ["escrow", "project", project.id],
    queryFn: () => escrowApi.getForProject(project.id),
  });

  const escrow = escrowQuery.data as { status?: string; amount?: number } | undefined;
  const statusLabel = escrow?.status || "pending";
  const lockedAmount = typeof escrow?.amount === "number" ? escrow.amount : null;

  return (
    <div className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-on-surface">{project.title}</h3>
        <StatusPill label={statusLabel} tone={statusTone(statusLabel)} />
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-on-surface-variant">Төсвийн дүн:</span>
          <p className="font-medium">{formatMnt(project.budget || 0)}</p>
        </div>
        <div>
          <span className="text-on-surface-variant">Эскроу статус:</span>
          <p className="font-medium capitalize">{statusLabel}</p>
        </div>
      </div>
      {lockedAmount !== null && (
        <div className="rounded-xl bg-surface-container p-3">
          <span className="text-xs text-on-surface-variant">Түгжигдсэн дүн:</span>
          <p className="text-lg font-bold text-primary">{formatMnt(lockedAmount)}</p>
        </div>
      )}
    </div>
  );
}
