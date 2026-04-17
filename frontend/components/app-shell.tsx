"use client";

import { usePathname } from "next/navigation";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PublicNav } from "@/components/layout/public-nav";

function isDashboardRoute(pathname: string): boolean {
  const normalized = pathname.replace(/^\/proxy\/\d+(?=\/|$)/, "");
  const parts = normalized.split("/").filter(Boolean);
  const pathWithoutLocale =
    parts[0] === "mn" || parts[0] === "en" ? `/${parts.slice(1).join("/")}` : normalized;

  return ["/client", "/freelancer", "/admin", "/client/projects/new", "/messages", "/notifications"].some(
    (prefix) => pathWithoutLocale === prefix || pathWithoutLocale.startsWith(`${prefix}/`),
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const dashboardRoute = isDashboardRoute(pathname);

  if (dashboardRoute) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return (
    <>
      <PublicNav />
      <main className="content-frame section-y">{children}</main>
    </>
  );
}
