"use client";
export const dynamic = "force-dynamic";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

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

  if (me.isLoading || admin.users.isLoading) return <LoadingState label={t("loading")} />;
  if (me.isError || !me.data) return <ErrorState label={t("signinRequired")} />;
  if (admin.users.isError) return <ErrorState label={t("loadError")} />;

  const users = toArray<any>(admin.users.data as any);
  const suspendedCount = users.filter((item) => item.verification_status === "suspended").length;

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

        <AppCard className="space-y-3">
          {!users.length ? (
            <EmptyState label={t("empty")} />
          ) : (
            users.slice(0, 40).map((item: any) => (
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
