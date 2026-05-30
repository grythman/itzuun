"use client";
export const dynamic = "force-dynamic";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { RoleGuard } from "@/components/shared/role-guard";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { AppCard, StatusPill } from "@/components/ui";
import { escrowApi, projectsApi, toArray } from "@/lib/api/endpoints";
import { useMe, useProjects } from "@/lib/hooks";
import { useQuery } from "@tanstack/react-query";

function formatMnt(amount: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(amount)} ₮`;
}

export default function ClientEscrowPage() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] || "mn";
  const me = useMe();

  const projectsQuery = useProjects("client");
  const projects = toArray(projectsQuery.data);

  const isLoading = projectsQuery.isLoading;

  if (isLoading) return <LoadingState />;

  const activeProjects = projects.filter(
    (p: any) => p.status === "in_progress" || p.status === "awaiting_client_review"
  );

  return (
    <RoleGuard allowed={["client"]}>
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-bold">Санхүү & Эскроу</h1>
        <p className="text-on-surface-variant">
          Таны төслүүдийн эскроу төлөв болон санхүүгийн мэдээлэл.
        </p>

        {activeProjects.length === 0 ? (
          <EmptyState
            title="Идэвхтэй эскроу байхгүй"
            description="Одоогоор эскроу түгжээтэй төсөл байхгүй байна."
          />
        ) : (
          <div className="space-y-4">
            {activeProjects.map((project: any) => (
              <EscrowCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

function EscrowCard({ project }: { project: any }) {
  const escrowQuery = useQuery({
    queryKey: ["escrow", "project", project.id],
    queryFn: () => escrowApi.getForProject(project.id),
  });

  const escrow = escrowQuery.data;
  const statusLabel = escrow?.status || "pending";

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-on-surface">{project.title}</h3>
        <StatusPill status={statusLabel} />
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
      {escrow && escrow.amount && (
        <div className="rounded-xl bg-surface-container p-3">
          <span className="text-xs text-on-surface-variant">Түгжигдсэн дүн:</span>
          <p className="text-lg font-bold text-primary">{formatMnt(escrow.amount)}</p>
        </div>
      )}
    </div>
  );
}
