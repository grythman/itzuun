"use client";

import { usePathname } from "next/navigation";

import { RoleSidebar, DashboardTopHeader } from "@/components/ui-kit";
import { useMe } from "@/lib/hooks";

import { createContext, useContext } from "react";

const DashboardLayoutContext = createContext<boolean>(false);

export function useDashboardLayout() {
  return useContext(DashboardLayoutContext);
}

function dashboardRole(pathname: string): "client" | "freelancer" | "admin" {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/freelancer")) return "freelancer";
  return "client";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const normalized = pathname.replace(/^\/proxy\/\d+(?=\/|$)/, "");
  const parts = normalized.split("/").filter(Boolean);
  const pathWithoutLocale =
    parts[0] === "mn" || parts[0] === "en" ? `/${parts.slice(1).join("/")}` : normalized;
  const role = dashboardRole(pathWithoutLocale);
  const me = useMe({ enabled: true, retryOnAuth: true });
  const userName = me.data?.first_name || me.data?.email?.split("@")[0] || "User";

  const searchPlaceholder =
    role === "admin"
      ? "User, project, dispute хайх..."
      : role === "freelancer"
        ? "Ажил, proposal, payout хайх..."
        : "Төсөл, freelancer, escrow хайх...";

  return (
    <DashboardLayoutContext.Provider value>
      <div className="grid gap-4 xl:grid-cols-[256px_minmax(0,1fr)]">
        <RoleSidebar role={role} />
        <div className="min-w-0">
          <DashboardTopHeader
            userName={userName}
            roleLabel={role === "admin" ? "Admin" : role === "freelancer" ? "Freelancer" : "Client"}
            searchPlaceholder={searchPlaceholder}
          />
          {children}
        </div>
      </div>
    </DashboardLayoutContext.Provider>
  );
}

