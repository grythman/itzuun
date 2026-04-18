"use client";

import { usePathname } from "next/navigation";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PublicNav } from "@/components/layout/public-nav";
import { useMe } from "@/lib/hooks";

function isDashboardRoute(pathname: string): boolean {
  const normalized = pathname.replace(/^\/proxy\/\d+(?=\/|$)/, "");
  const parts = normalized.split("/").filter(Boolean);
  const pathWithoutLocale =
    parts[0] === "mn" || parts[0] === "en" ? `/${parts.slice(1).join("/")}` : normalized;

  return ["/client", "/freelancer", "/admin", "/client/projects/new", "/messages", "/notifications"].some(
    (prefix) => pathWithoutLocale === prefix || pathWithoutLocale.startsWith(`${prefix}/`),
  );
}

function isHybridMarketplaceRoute(pathname: string): boolean {
  const normalized = pathname.replace(/^\/proxy\/\d+(?=\/|$)/, "");
  const parts = normalized.split("/").filter(Boolean);
  const pathWithoutLocale =
    parts[0] === "mn" || parts[0] === "en" ? `/${parts.slice(1).join("/")}` : normalized;

  return ["/projects", "/freelancers"].some(
    (prefix) => pathWithoutLocale === prefix || pathWithoutLocale.startsWith(`${prefix}/`),
  );
}

export function AppShell({
  children,
  hasAuthCookies = false,
}: {
  children: React.ReactNode;
  hasAuthCookies?: boolean;
}) {
  const pathname = usePathname() || "/";
  const dashboardRoute = isDashboardRoute(pathname);
  const hybridRoute = isHybridMarketplaceRoute(pathname);
  const me = useMe({ enabled: hybridRoute, retryOnAuth: true });
  const authedOnHybridRoute = hybridRoute && (Boolean(me.data) || (hasAuthCookies && me.isLoading));

  if (dashboardRoute || authedOnHybridRoute) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return (
    <>
      <PublicNav />
      <main className="content-frame section-y">{children}</main>
    </>
  );
}
