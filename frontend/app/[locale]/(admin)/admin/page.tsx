"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { RoleGuard } from "@/components/shared/role-guard";
import { ActionButton, AppCard, StatusPill } from "@/components/ui";
import { adminApi, notificationsApi, toArray } from "@/lib/api/endpoints";
import { useAdminSnapshot, useMe, useMutation } from "@/lib/hooks";
import { useToastStore } from "@/lib/stores/toast-store";
import type { AdminUserDto, DisputeDto, EscrowDto, LedgerEntryDto } from "@/lib/api/types";
import { useQuery } from "@tanstack/react-query";

export default function AdminPage() {
  const toast = useToastStore((s) => s.push);
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;
  const me = useMe();
  const { users, projects, escrow, disputes, commission, ledger } = useAdminSnapshot();
  const newBriefs = useQuery({
    queryKey: ["notifications", "unread-count", "NEW_BRIEF"],
    queryFn: () => notificationsApi.unreadCount("NEW_BRIEF"),
  });

  const userItems = users.data ? toArray<AdminUserDto>(users.data) : [];
  const projectItems = projects.data ? toArray<Record<string, unknown>>(projects.data) : [];
  const escrowItems = escrow.data ? toArray<EscrowDto>(escrow.data) : [];
  const disputeItems = disputes.data ? toArray<DisputeDto>(disputes.data) : [];
  const ledgerItems = ledger.data ? toArray<LedgerEntryDto>(ledger.data) : [];

  const commissionMutation = useMutation({
    mutationFn: (pct: number) => adminApi.setCommission(pct),
    onSuccess: () => {
      commission.refetch();
      toast("success", "Шимтгэл шинэчлэгдлээ");
    },
  });

  const approveMutation = useMutation({
    mutationFn: (escrowId: number) => adminApi.approveEscrow(escrowId),
    onSuccess: () => {
      escrow.refetch();
      toast("success", "Escrow батлагдлаа");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const pendingUsers = userItems.filter((item) => item.verification_status === "pending");
  const suspendedUsers = userItems.filter((item) => item.verification_status === "suspended");
  const verifiedUsers = userItems.filter((item) => item.verification_status === "verified");
  const openDisputes = disputeItems.filter((item) => !item.resolved_at);
  const createdEscrow = escrowItems.filter((item) => item.status === "created");
  const heldEscrowAmount = escrowItems
    .filter((item) => item.status === "created" || item.status === "held")
    .reduce((total, item) => total + Number(item.amount || 0), 0);
  const recentLedger = [...ledgerItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  if (me.isLoading) return <LoadingState label="Админ эрхийг шалгаж байна..." />;
  if (me.isError || !me.data) return <ErrorState label="Эхлээд нэвтэрнэ үү." />;

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="admin" fallbackPath={withLocale("/auth")}>
      <section className="space-y-6 pb-10">
        <div className="ui-surface p-5">
          <p className="ui-eyebrow">Operations Console</p>
          <h1 className="mt-2 font-headline text-[2rem] font-black tracking-tight text-primary">Админ хянах самбар</h1>
          <p className="mt-2 text-sm text-on-surface/65">
            Эрсдэлийн queue, санхүүгийн урсгал, хэрэглэгчийн итгэлцлийн төлөвийг нэг дэлгэцээс хянаж шийдвэрлэнэ.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={withLocale("/admin/disputes")} className="ui-btn-secondary min-h-10 px-4 text-[11px]">
              Маргаан шийдвэрлэх
            </Link>
            <Link href={withLocale("/admin/escrow")} className="ui-btn-ghost min-h-10 px-4 text-[11px]">
              Escrow батлах
            </Link>
            <Link href={withLocale("/admin/users")} className="ui-btn-ghost min-h-10 px-4 text-[11px]">
              Хэрэглэгч удирдах
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <div className="ui-surface p-4">
            <p className="ui-eyebrow">Хэрэглэгч</p>
            <p className="ui-kpi-value mt-2">{userItems.length.toLocaleString()}</p>
            <p className="mt-2 text-[12px] text-on-surface/60">
              {pendingUsers.length} pending, {suspendedUsers.length} suspended, {verifiedUsers.length} verified
            </p>
          </div>
          <div className="ui-surface p-4">
            <p className="ui-eyebrow">Төсөл</p>
            <p className="ui-kpi-value mt-2">{projectItems.length.toLocaleString()}</p>
            <p className="mt-2 text-[12px] text-on-surface/60">Нийт төслийн pipeline хэмжээс</p>
          </div>
          <div className="ui-surface p-4">
            <p className="ui-eyebrow">Escrow дүн</p>
            <p className="ui-kpi-value mt-2">{heldEscrowAmount.toLocaleString()} ₮</p>
            <p className="mt-2 text-[12px] text-on-surface/60">{createdEscrow.length} батлах хүлээгдэж байна</p>
          </div>
          <div className="ui-surface p-4">
            <p className="ui-eyebrow">Нээлттэй маргаан</p>
            <p className="ui-kpi-value mt-2">{openDisputes.length.toLocaleString()}</p>
            <p className="mt-2 text-[12px] text-on-surface/60">Шийдвэр шаардаж буй эрсдэлийн кейс</p>
          </div>
          <Link href={withLocale("/admin/projects")} className="ui-surface p-4 hover:ring-2 hover:ring-primary/30 transition-shadow">
            <p className="ui-eyebrow">Шинэ brief</p>
            <p className="ui-kpi-value mt-2 flex items-center gap-2">
              {newBriefs.data?.count ?? 0}
              {(newBriefs.data?.count ?? 0) > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                  шинэ
                </span>
              )}
            </p>
            <p className="mt-2 text-[12px] text-on-surface/60">Уншаагүй захиалгын мэдэгдэл</p>
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <AppCard className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="ui-eyebrow">Priority Queue</p>
                <h2 className="mt-1 font-headline text-xl font-black tracking-tight text-primary">Яаралтай шийдэх зүйлс</h2>
              </div>
              <Link href={withLocale("/admin/disputes")} className="ui-btn-ghost min-h-10 px-4 text-[11px]">
                Бүгдийг харах
              </Link>
            </div>

            {openDisputes.length === 0 && createdEscrow.length === 0 ? (
              <EmptyState label="Одоогоор яаралтай queue алга." />
            ) : (
              <div className="space-y-2.5">
                {openDisputes.slice(0, 4).map((item) => (
                  <article key={`dispute-${item.id}`} className="rounded-xl bg-surface-container-low p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-primary">Маргаан #{item.id} • Төсөл #{item.project}</p>
                      <StatusPill label="Нээлттэй" tone="warning" />
                    </div>
                    <p className="mt-2 text-[13px] text-on-surface/65">{item.reason || "Шалтгаан оруулаагүй"}</p>
                    <div className="mt-3">
                      <Link href={withLocale("/admin/disputes")} className="ui-btn-secondary min-h-10 px-4 text-[11px]">
                        Шийдвэрлэх
                      </Link>
                    </div>
                  </article>
                ))}

                {createdEscrow.slice(0, 4).map((item) => (
                  <article key={`escrow-${item.id}`} className="rounded-xl bg-surface-container-low p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-primary">Escrow #{item.id} • Төсөл #{item.project}</p>
                      <StatusPill label="Үүссэн" tone="info" />
                    </div>
                    <p className="mt-2 text-[13px] text-on-surface/65">Дүн: {Number(item.amount || 0).toLocaleString()} ₮</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ActionButton
                        tone="success"
                        className="min-h-10 px-4 text-[11px]"
                        loading={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(item.id)}
                      >
                        Батлах
                      </ActionButton>
                      <Link href={withLocale("/admin/escrow")} className="ui-btn-ghost min-h-10 px-4 text-[11px]">
                        Дэлгэрэнгүй
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </AppCard>

          <div className="space-y-4">
            <AppCard>
              <p className="ui-eyebrow">Шимтгэлийн тохиргоо</p>
              <h2 className="mt-1 font-headline text-lg font-bold text-primary">Platform fee</h2>
              {commission.isLoading ? <LoadingState label="Шимтгэл ачааллаж байна..." /> : null}
              {commission.isError ? <ErrorState label="Шимтгэл ачааллах боломжгүй байна." /> : null}
              {commission.data ? (
                <p className="mt-2 text-sm text-on-surface/70">Одоогийн дүн: {commission.data.platform_fee_pct}%</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <ActionButton className="min-h-10 px-4 text-[11px]" loading={commissionMutation.isPending} onClick={() => commissionMutation.mutate(8)}>
                  8% болгох
                </ActionButton>
                <ActionButton className="min-h-10 px-4 text-[11px]" loading={commissionMutation.isPending} onClick={() => commissionMutation.mutate(10)}>
                  10% болгох
                </ActionButton>
              </div>
            </AppCard>

            <AppCard>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="ui-eyebrow">Verification Queue</p>
                  <h2 className="mt-1 font-headline text-lg font-bold text-primary">Хүлээгдэж буй хэрэглэгчид</h2>
                </div>
                <Link href={withLocale("/admin/users")} className="ui-btn-ghost min-h-10 px-4 text-[11px]">
                  Хэрэглэгчийн хуудас
                </Link>
              </div>
              {pendingUsers.length === 0 ? (
                <EmptyState label="Pending verification одоогоор алга." />
              ) : (
                <ul className="space-y-2">
                  {pendingUsers.slice(0, 5).map((item) => (
                    <li key={item.id} className="rounded-xl bg-surface-container-low p-3">
                      <p className="text-sm font-semibold text-primary">{item.email}</p>
                      <p className="mt-1 text-[12px] text-on-surface/60">Эрх: {item.role}</p>
                    </li>
                  ))}
                </ul>
              )}
            </AppCard>
          </div>
        </div>

        <AppCard>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="ui-eyebrow">Finance Ledger</p>
              <h2 className="mt-1 font-headline text-xl font-black tracking-tight text-primary">Сүүлийн санхүүгийн бүртгэл</h2>
            </div>
            <Link href={withLocale("/admin/escrow")} className="ui-btn-ghost min-h-10 px-4 text-[11px]">
              Escrow audit харах
            </Link>
          </div>
          {recentLedger.length === 0 ? (
            <EmptyState label="Ledger бичлэг алга." />
          ) : (
            <ul className="space-y-2">
              {recentLedger.map((entry) => (
                <li key={entry.id} className="rounded-xl bg-surface-container-low p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-primary">
                      Escrow #{entry.escrow} • {entry.amount.toLocaleString()} ₮
                    </p>
                    <StatusPill
                      label={entry.entry_type}
                      tone={
                        entry.entry_type === "deposit" || entry.entry_type === "release"
                          ? "success"
                          : entry.entry_type === "refund"
                            ? "warning"
                            : "neutral"
                      }
                    />
                  </div>
                  <p className="mt-1 text-[12px] text-on-surface/60">{new Date(entry.created_at).toLocaleString()}</p>
                  {entry.note ? <p className="mt-1 text-[12px] text-on-surface/55">{entry.note}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </AppCard>
      </section>
    </RoleGuard>
  );
}
