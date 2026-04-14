"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { RoleGuard } from "@/components/shared/role-guard";
import { useMe, useMyProposals } from "@/lib/hooks";
import type { ProposalDto } from "@/lib/api/types";

function formatMnt(value: number): string {
  return `₮${new Intl.NumberFormat("mn-MN").format(value)}`;
}

function proposalAgeLabel(createdAt?: string): string {
  if (!createdAt) return "";
  const diff = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Саяхан";
  if (hours < 24) return `${hours}ц өмнө`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}х өмнө`;
  return `${Math.floor(days / 7)}д өмнө`;
}

type StatusMeta = { label: string; bg: string; text: string };

function statusMeta(status: string): StatusMeta {
  if (status === "accepted") return { label: "Зөвшөөрөгдсөн", bg: "bg-green-50", text: "text-green-700" };
  if (status === "rejected") return { label: "Татгалзсан", bg: "bg-red-50", text: "text-red-700" };
  if (status === "withdrawn") return { label: "Цуцалсан", bg: "bg-surface-container-low", text: "text-surface-500" };
  return { label: "Хүлээгдэж байна", bg: "bg-secondary-fixed/30", text: "text-secondary" };
}

const TABS = [
  { key: "all", label: "Бүгд" },
  { key: "pending", label: "Хүлээгдэж байна" },
  { key: "accepted", label: "Зөвшөөрөгдсөн" },
  { key: "rejected", label: "Татгалзсан" },
];

export default function FreelancerProposalsPage() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const proposals = useMyProposals();

  if (me.isLoading || proposals.isLoading) return <LoadingState label="Саналуудыг ачааллаж байна..." />;
  if (me.isError || !me.data) {
    return (
      <ErrorState
        label="Саналуудыг харахын тулд нэвтэрнэ үү."
        action={
          <Link href={withLocale("/auth?tab=signin")} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-xs font-bold text-primary-fixed">
            Нэвтрэх
          </Link>
        }
      />
    );
  }
  if (proposals.isError) {
    return (
      <ErrorState
        label="Саналуудыг ачааллахад алдаа гарлаа."
        action={
          <button className="min-h-11 rounded-xl bg-surface-container-lowest px-4 text-xs font-bold text-primary" onClick={() => proposals.refetch()}>
            Дахин оролдох
          </button>
        }
      />
    );
  }

  const items: ProposalDto[] = Array.isArray(proposals.data) ? proposals.data : [];

  const pending = items.filter((p) => (p.status || "pending") === "pending").length;
  const accepted = items.filter((p) => p.status === "accepted").length;

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="freelancer" fallbackPath={withLocale("/auth")}>
      <section className="space-y-8 pb-20">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-surface-400 font-headline">
              Фрилансер
            </p>
            <h1 className="mt-3 font-headline text-[36px] font-black leading-none tracking-tighter text-primary md:text-[44px]">
              Миний саналууд
            </h1>
            <p className="mt-3 text-[15px] font-medium text-surface-500">
              {pending > 0 ? `${pending} санал хүлээгдэж байна` : "Идэвхтэй санал байхгүй байна."}
              {accepted > 0 && ` · ${accepted} зөвшөөрөгдсөн`}
            </p>
          </div>
          <Link
            href={withLocale("/projects")}
            className="hidden min-h-11 shrink-0 items-center rounded-2xl primary-gradient px-6 text-[11px] font-black uppercase tracking-[0.18em] text-primary-fixed shadow-ambient transition-all hover:-translate-y-0.5 md:inline-flex font-headline"
          >
            Ажил хайх
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Нийт санал", value: items.length },
            { label: "Хүлээгдэж байна", value: pending },
            { label: "Зөвшөөрөгдсөн", value: accepted },
            { label: "Татгалзсан", value: items.filter((p) => p.status === "rejected").length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[2rem] bg-surface-container-lowest p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-surface-400 font-headline">
                {stat.label}
              </p>
              <p className="mt-3 font-headline text-3xl font-black text-primary">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Proposal List */}
        {!items.length ? (
          <div className="flex flex-col items-center justify-center rounded-[2.5rem] bg-surface-container-lowest py-24 shadow-sm text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low text-surface-300">
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor" aria-hidden>
                <path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V7h3.5L13 3.5ZM8 11h8v1.5H8V11Zm0 3h8v1.5H8V14Zm0 3h5v1.5H8V17Z" />
              </svg>
            </div>
            <p className="mt-6 font-headline text-lg font-black text-primary">Санал байхгүй байна</p>
            <p className="mt-2 text-sm font-medium text-surface-400">Төсөл хайж санал оруулаарай.</p>
            <Link
              href={withLocale("/projects")}
              className="mt-8 inline-flex min-h-12 items-center rounded-2xl primary-gradient px-8 text-[11px] font-black uppercase tracking-[0.18em] text-primary-fixed shadow-ambient"
            >
              Ажил хайх
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[2.5rem] bg-surface-container-lowest shadow-sm">
            {/* Table header */}
            <div className="border-b border-outline-variant/10 px-8 py-6">
              <h2 className="font-headline text-lg font-extrabold text-primary">Саналуудын жагсаалт</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low/50">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.18em] text-surface-400 font-headline">Төсөл</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.18em] text-surface-400 font-headline">Үнэ</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.18em] text-surface-400 font-headline">Хугацаа</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.18em] text-surface-400 font-headline">Илгээсэн</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.18em] text-surface-400 font-headline">Төлөв</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {items.map((proposal) => {
                    const meta = statusMeta(proposal.status || "pending");
                    return (
                      <tr key={proposal.id} className="group transition-colors hover:bg-surface-container-low/30">
                        <td className="px-8 py-6">
                          <Link href={withLocale(`/projects/${proposal.project}`)} className="group/link">
                            <p className="font-headline text-sm font-bold text-on-surface group-hover/link:text-primary transition-colors">
                              Төсөл #{proposal.project}
                            </p>
                            {proposal.message && (
                              <p className="mt-1 line-clamp-1 text-[11px] font-medium text-surface-400">
                                {proposal.message}
                              </p>
                            )}
                          </Link>
                        </td>
                        <td className="px-8 py-6">
                          <span className="font-headline text-[15px] font-black text-primary">
                            {formatMnt(Number(proposal.price || 0))}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-sm font-medium text-surface-500">
                          {proposal.timeline_days ? `${proposal.timeline_days} хоног` : "—"}
                        </td>
                        <td className="px-8 py-6 text-[11px] font-bold uppercase tracking-widest text-surface-400 font-headline">
                          {proposalAgeLabel(proposal.created_at)}
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] font-headline ${meta.bg} ${meta.text}`}>
                            {meta.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mobile CTA */}
        <div className="flex justify-center md:hidden">
          <Link
            href={withLocale("/projects")}
            className="inline-flex min-h-11 items-center rounded-2xl primary-gradient px-6 text-[11px] font-black uppercase tracking-[0.18em] text-primary-fixed shadow-ambient font-headline"
          >
            Ажил хайх
          </Link>
        </div>
      </section>
    </RoleGuard>
  );
}
