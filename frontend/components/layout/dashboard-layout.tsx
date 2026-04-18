"use client";

import { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";

import { DashboardTopHeader } from "@/components/layout/dashboard-header";
import { RoleSidebar } from "@/components/layout/dashboard-sidebar";
import { useMe } from "@/lib/hooks";

const DashboardLayoutContext = createContext<boolean>(false);

export function useDashboardLayout() {
  return useContext(DashboardLayoutContext);
}

function dashboardRole(pathname: string): "client" | "freelancer" | "admin" {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/freelancer")) return "freelancer";
  return "client";
}

function normalizeDashboardPath(pathname: string): string {
  const normalized = pathname.replace(/^\/proxy\/\d+(?=\/|$)/, "");
  const parts = normalized.split("/").filter(Boolean);
  return parts[0] === "mn" || parts[0] === "en"
    ? `/${parts.slice(1).join("/")}`
    : normalized;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const pathWithoutLocale = normalizeDashboardPath(pathname);
  const me = useMe({ enabled: true, retryOnAuth: true });
  const role = (me.data?.role as "client" | "freelancer" | "admin" | undefined) || dashboardRole(pathWithoutLocale);
  const [mobileOpen, setMobileOpen] = useState(false);

  const rawName =
    me.data?.first_name?.trim() ||
    me.data?.last_name?.trim() ||
    me.data?.email?.split("@")[0] ||
    "ITZuun";

  const userName =
    me.data?.first_name && me.data?.last_name
      ? `${me.data.first_name} ${me.data.last_name}`.trim()
      : rawName;

  const searchPlaceholder =
    role === "admin"
      ? "User, project, dispute хайх..."
      : role === "freelancer"
        ? "Ажил, proposal, payout хайх..."
        : "Төсөл, freelancer, escrow хайх...";

  const roleLabel =
    role === "admin"
      ? "Operations"
      : role === "freelancer"
        ? "Talent Desk"
        : "Client Admin";

  return (
    <DashboardLayoutContext.Provider value={true}>
      <div className="min-h-screen bg-surface">
        <div className="mx-auto w-full max-w-[1920px] px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5">
          <div className="flex min-h-[calc(100vh-24px)] gap-4 xl:gap-5">
            <div className="hidden xl:flex xl:w-[292px] xl:shrink-0">
              <RoleSidebar role={role} />
            </div>

            <div className="min-w-0 flex-1 rounded-[34px] bg-surface-container-low px-3 py-3 shadow-[0_24px_55px_rgba(3,22,54,0.05)] sm:px-4 sm:py-4 lg:px-5 lg:py-5">
              <DashboardTopHeader
                userName={userName}
                role={role}
                roleLabel={roleLabel}
                searchPlaceholder={searchPlaceholder}
                sidebarOpen={mobileOpen}
                onOpenSidebar={() => setMobileOpen((value) => !value)}
              />
              <div className="content-narrow w-full max-w-none px-0 lg:px-0">{children}</div>
            </div>
          </div>
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 xl:hidden" aria-modal="true" role="dialog">
            <button
              type="button"
              className="absolute inset-0 bg-[rgba(3,22,54,0.22)] backdrop-blur-sm"
              aria-label="Close sidebar overlay"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-3 left-3 w-[min(86vw,320px)]">
              <RoleSidebar role={role} mobileOpen onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayoutContext.Provider>
  );
}
