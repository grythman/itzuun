"use client";
export const dynamic = "force-dynamic";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { AppCard } from "@/components/ui-kit";
import { useAdminSnapshot, useMe } from "@/lib/hooks";
import { useMutation, useQueryClient } from "@/lib/hooks";
import { adminApi } from "@/lib/api/endpoints";
import { useToastStore } from "@/lib/toast-store";

export default function AdminUsersPage() {
  const t = useTranslations("AdminUsersPage");
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const admin = useAdminSnapshot();

  if (me.isLoading || admin.users.isLoading) return <LoadingState label={t("loading")} />;
  if (me.isError || !me.data) return <ErrorState label={t("signinRequired")} />;
  if (admin.users.isError) return <ErrorState label={t("loadError")} />;

  const users = Array.isArray(admin.users.data) ? admin.users.data : [];

  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.push);
  const unsuspendMutation = useMutation({
    mutationFn: (userId: number | string) => adminApi.verifyUser(userId, { action: "unsuspend" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      pushToast("success", "User unsuspended");
    },
    onError: (err: any) => {
      pushToast("error", "Unsuspend failed", err?.response?.data?.detail || "Could not unsuspend user");
    },
  });

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="admin" fallbackPath={withLocale("/auth")}>
      <section className="space-y-5">
        <h1 className="font-headline text-3xl font-extrabold text-surface-900">{t("title")}</h1>
        <AppCard>
          {!users.length ? (
            <EmptyState label={t("empty")} />
          ) : (
            <ul className="space-y-2">
              {users.slice(0, 20).map((item: any) => (
                <li key={item.id} className="rounded-xl border border-surface-200/60 p-3 text-[13px]">
                  <p className="font-semibold text-surface-900">{item.email}</p>
                  <p className="text-surface-500">{t("role")}: {item.role}</p>
                  <p className="text-surface-500">{t("verificationStatus")}: {item.verification_status}</p>
                  {item.verification_status === "suspended" && (
                    <div className="mt-2">
                      <button
                        className="rounded bg-green-600 px-3 py-1 text-white text-sm"
                        onClick={() => {
                          if (!confirm(t("confirmUnsuspend"))) return;
                          unsuspendMutation.mutate(item.id);
                        }}
                        disabled={unsuspendMutation.isLoading}
                      >
                        {unsuspendMutation.isLoading ? t("unsuspending") : t("unsuspend")}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </AppCard>
      </section>
    </RoleGuard>
  );
}
