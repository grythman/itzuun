"use client";
export const dynamic = "force-dynamic";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { RoleGuard } from "@/components/shared/role-guard";
import { AppCard, StatusPill } from "@/components/ui";
import { adminApi, toArray } from "@/lib/api/endpoints";
import { useAdminSnapshot, useMe } from "@/lib/hooks";
import { useMutation, useQueryClient } from "@/lib/hooks";
import { useToastStore } from "@/lib/stores/toast-store";

export default function AdminUsersPage() {
  const t = useTranslations("AdminUsersPage");
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const admin = useAdminSnapshot();
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.push);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "verified" | "suspended">("all");
  const [search, setSearch] = useState("");

  const unsuspendMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: number | string; reason?: string }) =>
      adminApi.unsuspendUser(userId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      pushToast("success", t("unsuspendSuccess"));
    },
    onError: (err: any) => {
      pushToast("error", t("unsuspendFailed"), err?.response?.data?.detail || t("unsuspendFailedDetail"));
    },
  });

  const users = toArray<any>(admin.users.data as any);
  const suspendedCount = users.filter((item) => item.verification_status === "suspended").length;
  const pendingCount = users.filter((item) => item.verification_status === "pending").length;
  const verifiedCount = users.filter((item) => item.verification_status === "verified").length;

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users.filter((item) => {
      if (statusFilter !== "all" && (item.verification_status || "unverified") !== statusFilter) {
        return false;
      }
      if (!keyword) return true;
      const email = String(item.email || "").toLowerCase();
      const role = String(item.role || "").toLowerCase();
      return email.includes(keyword) || role.includes(keyword);
    });
  }, [users, search, statusFilter]);

  if (me.isLoading || admin.users.isLoading) return <LoadingState label={t("loading")} />;
  if (me.isError || !me.data) return <ErrorState label={t("signinRequired")} />;
  if (admin.users.isError) return <ErrorState label={t("loadError")} />;

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="admin" fallbackPath={withLocale("/auth")}>
      <section className="space-y-5 pb-10">
        <div className="ui-surface p-5">
          <p className="ui-eyebrow">Operations</p>
          <h1 className="mt-2 font-headline text-[2rem] font-black tracking-tight text-primary">{t("title")}</h1>
          <p className="mt-2 text-sm text-on-surface/65">
            Нийт {users.length} хэрэглэгчээс {suspendedCount} нь suspended төлөвтэй байна.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface/45">Нийт</p>
            <p className="mt-1 font-headline text-3xl font-black tracking-tight text-primary">{users.length}</p>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface/45">Pending</p>
            <p className="mt-1 font-headline text-3xl font-black tracking-tight text-primary">{pendingCount}</p>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface/45">Verified</p>
            <p className="mt-1 font-headline text-3xl font-black tracking-tight text-primary">{verifiedCount}</p>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface/45">Suspended</p>
            <p className="mt-1 font-headline text-3xl font-black tracking-tight text-primary">{suspendedCount}</p>
          </div>
        </div>

        <AppCard className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "all", label: "Бүгд" },
              { key: "pending", label: "Pending" },
              { key: "verified", label: "Verified" },
              { key: "suspended", label: "Suspended" },
            ].map((filter) => {
              const active = statusFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setStatusFilter(filter.key as typeof statusFilter)}
                  className={[
                    "inline-flex min-h-10 items-center rounded-xl px-4 text-xs font-black uppercase tracking-[0.14em] transition-all",
                    active
                      ? "bg-primary text-primary-fixed shadow-[0_10px_24px_rgba(3,22,54,0.14)]"
                      : "bg-surface-container-low text-on-surface/65 hover:bg-surface-container",
                  ].join(" ")}
                >
                  {filter.label}
                </button>
              );
            })}
            <div className="ml-auto min-w-[220px] rounded-xl bg-surface-container-low px-3 py-2">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Имэйл эсвэл role..."
                className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface/45 focus:ring-0"
              />
            </div>
          </div>

          {!filteredUsers.length ? (
            <EmptyState label={t("empty")} />
          ) : (
            filteredUsers.slice(0, 50).map((item: any) => (
              <article key={item.id} className="rounded-xl bg-surface-container-low p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-primary">{item.email}</p>
                    <p className="text-xs text-on-surface/60">
                      {t("role")}: {item.role}
                    </p>
                  </div>
                  <StatusPill
                    label={item.verification_status || "unverified"}
                    tone={
                      item.verification_status === "verified"
                        ? "success"
                        : item.verification_status === "pending"
                          ? "warning"
                          : item.verification_status === "suspended"
                            ? "danger"
                            : "neutral"
                    }
                  />
                </div>

                {item.verification_status === "suspended" && (
                  <div className="mt-3">
                    <button
                      className="ui-btn-secondary"
                      onClick={() => {
                        if (!confirm(t("confirmUnsuspend"))) return;
                        const reason = (window.prompt(t("unsuspendNotePrompt")) || "").trim();
                        unsuspendMutation.mutate({ userId: item.id, reason: reason || undefined });
                      }}
                      disabled={unsuspendMutation.isPending}
                    >
                      {unsuspendMutation.isPending ? t("unsuspending") : t("unsuspend")}
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </AppCard>
      </section>
    </RoleGuard>
  );
}
