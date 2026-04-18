"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { RoleGuard } from "@/components/shared/role-guard";
import { StatusPill } from "@/components/ui";
import { proposalsApi, toArray } from "@/lib/api/endpoints";
import { useMe, useProjects } from "@/lib/hooks";
import type { ProposalDto } from "@/lib/api/types";

type ProposalRow = ProposalDto & { projectTitle: string };

function formatMnt(value: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} ₮`;
}

function relativeTime(iso?: string): string {
  if (!iso) return "Огноо алга";
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "Саяхан";
  if (diffMin < 60) return `${diffMin} минутын өмнө`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} цагийн өмнө`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} өдрийн өмнө`;
}

function statusMeta(status?: string): { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" } {
  if (status === "accepted") return { label: "Зөвшөөрөгдсөн", tone: "success" };
  if (status === "rejected") return { label: "Татгалзсан", tone: "danger" };
  if (status === "withdrawn") return { label: "Цуцалсан", tone: "neutral" };
  return { label: "Хүлээгдэж байна", tone: "warning" };
}

export default function ClientProposalsPage() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const projects = useProjects(1, { client: "me" });

  const proposalsQuery = useQuery({
    queryKey: ["client-proposals", me.data?.id, projects.data?.results?.map((p) => p.id).join(",")],
    enabled: !!me.data && !!projects.data?.results?.length,
    queryFn: async () => {
      const ownProjects = projects.data?.results || [];
      const rows = await Promise.all(
        ownProjects.map(async (project) => {
          const payload = await proposalsApi.listForProject(project.id);
          const proposals = toArray<ProposalDto>(payload);
          return proposals.map((proposal) => ({
            ...proposal,
            projectTitle: project.title,
          }));
        }),
      );
      return rows.flat();
    },
  });

  const sortedRows = useMemo(
    () =>
      [...((proposalsQuery.data || []) as ProposalRow[])].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      ),
    [proposalsQuery.data],
  );
  const pendingCount = sortedRows.filter((row) => (row.status || "pending") === "pending").length;

  if (me.isLoading || projects.isLoading || proposalsQuery.isLoading) {
    return <LoadingState label="Саналуудыг ачааллаж байна..." />;
  }

  if (me.isError || !me.data) {
    return (
      <ErrorState
        label="Нэвтэрч орно уу."
        action={
          <Link href={withLocale("/auth?tab=signin")} className="ui-btn-primary">
            Нэвтрэх
          </Link>
        }
      />
    );
  }

  if (projects.isError || proposalsQuery.isError) {
    return (
      <ErrorState
        label="Ирсэн саналуудыг ачаалж чадсангүй."
        action={
          <button type="button" onClick={() => { projects.refetch(); proposalsQuery.refetch(); }} className="ui-btn-ghost">
            Дахин оролдох
          </button>
        }
      />
    );
  }

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="client" fallbackPath={withLocale("/auth")}>
      <section className="space-y-8 pb-12">
        <div className="ui-surface ui-card-pad">
          <p className="ui-eyebrow">Захиалагч</p>
          <h1 className="mt-2 font-headline text-3xl font-black tracking-tight text-primary">Ирсэн саналууд</h1>
          <p className="mt-2 text-[13px] text-on-surface/60">
            {sortedRows.length} нийт санал • {pendingCount} хүлээгдэж байна
          </p>
        </div>

        {!sortedRows.length ? (
          <EmptyState
            label="Одоогоор шинэ санал алга."
            action={
              <div className="flex items-center gap-2">
                <Link href={withLocale("/client/projects")} className="ui-btn-ghost">
                  Миний төслүүд
                </Link>
                <Link href={withLocale("/client/projects/new")} className="ui-btn-primary">
                  Шинэ төсөл
                </Link>
              </div>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-sm">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface/55">Төсөл</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface/55">Фрилансер</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface/55">Үнэ</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface/55">Хугацаа</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface/55">Илгээсэн</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface/55">Төлөв</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface/55">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row) => {
                    const status = statusMeta(row.status);
                    return (
                      <tr key={row.id} className="odd:bg-surface-container-low/20 hover:bg-surface-container-low/30 transition-colors">
                        <td className="px-6 py-5">
                          <p className="font-headline text-[13px] font-bold text-on-surface">{row.projectTitle}</p>
                        </td>
                        <td className="px-6 py-5 text-[13px] text-on-surface/70">
                          Фрилансер #{typeof row.freelancer === "object" ? row.freelancer.id : row.freelancer}
                        </td>
                        <td className="px-6 py-5 text-[13px] font-semibold text-primary">{formatMnt(Number(row.price || 0))}</td>
                        <td className="px-6 py-5 text-[13px] text-on-surface/70">{row.timeline_days || 0} өдөр</td>
                        <td className="px-6 py-5 text-[13px] text-on-surface/60">{relativeTime(row.created_at)}</td>
                        <td className="px-6 py-5">
                          <StatusPill label={status.label} tone={status.tone} />
                        </td>
                        <td className="px-6 py-5">
                          <Link href={withLocale(`/projects/${row.project}`)} className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-fixed">
                            Төсөл харах
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="grid gap-3 p-4 md:hidden">
              {sortedRows.map((row) => {
                const status = statusMeta(row.status);
                return (
                  <li key={row.id} className="rounded-2xl bg-surface-container-low p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-headline text-[15px] font-bold text-primary">{row.projectTitle}</p>
                      <StatusPill label={status.label} tone={status.tone} />
                    </div>
                    <p className="mt-2 text-[13px] text-on-surface/70">
                      Фрилансер #{typeof row.freelancer === "object" ? row.freelancer.id : row.freelancer}
                    </p>
                    <p className="mt-1 text-[13px] text-primary font-semibold">{formatMnt(Number(row.price || 0))} • {row.timeline_days || 0} өдөр</p>
                    <p className="mt-1 text-[11px] text-on-surface/55">{relativeTime(row.created_at)}</p>
                    <Link href={withLocale(`/projects/${row.project}`)} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-[11px] font-bold text-primary-fixed">
                      Төсөл харах
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </RoleGuard>
  );
}
