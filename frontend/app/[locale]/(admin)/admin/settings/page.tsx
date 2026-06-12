"use client";
export const dynamic = "force-dynamic";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { RoleGuard } from "@/components/shared/role-guard";
import { LoadingState } from "@/components/shared/states";
import { ActionButton } from "@/components/ui";
import { useMe } from "@/lib/hooks";
import { useToastStore } from "@/lib/stores/toast-store";
import { authApi } from "@/lib/api/endpoints";

export default function AdminSettingsPage() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const toast = useToastStore((s) => s.push);
  const [darkMode, setDarkMode] = useState(() => typeof window !== "undefined" && document.documentElement.classList.contains("dark"));

  if (me.isLoading) return <LoadingState label="Тохиргоо ачааллаж байна..." />;
  if (!me.data) return null;

  const toggleDark = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setDarkMode(isDark);
  };

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="admin" fallbackPath={withLocale("/auth")}>
      <section className="space-y-6 pb-10">
        <div className="ui-surface p-5">
          <p className="ui-eyebrow">Тохиргоо</p>
          <h1 className="mt-2 font-headline text-[1.75rem] font-black tracking-tight text-primary">
            Админ тохиргоо
          </h1>
        </div>

        <div className="ui-surface p-5 space-y-4">
          <h2 className="font-headline text-lg font-bold text-primary">Бүртгэлийн мэдээлэл</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs text-on-surface/50">Имэйл</p>
              <p className="mt-1 text-sm font-medium">{me.data.email}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface/50">Эрх</p>
              <p className="mt-1 text-sm font-medium capitalize">{me.data.role}</p>
            </div>
          </div>
        </div>

        <div className="ui-surface p-5 space-y-4">
          <h2 className="font-headline text-lg font-bold text-primary">Харагдац</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Харанхуй горим</p>
              <p className="text-xs text-on-surface/50">Нүдэнд зөөлөн харанхуй дэвсгэр</p>
            </div>
            <button
              type="button"
              onClick={toggleDark}
              className={`relative h-7 w-12 rounded-full transition-colors ${darkMode ? "bg-primary" : "bg-surface-container-low"}`}
            >
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>

        <div className="ui-surface p-5 space-y-4">
          <h2 className="font-headline text-lg font-bold text-primary">Платформ</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs text-on-surface/50">Хувилбар</p>
              <p className="mt-1 text-sm font-medium">ITZuun MVP v1.0</p>
            </div>
            <div>
              <p className="text-xs text-on-surface/50">Домайн</p>
              <p className="mt-1 text-sm font-medium">itzuun.works</p>
            </div>
          </div>
        </div>
      </section>
    </RoleGuard>
  );
}
