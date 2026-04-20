"use client";

import { usePathname } from "next/navigation";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PublicNav } from "@/components/layout/public-nav";
import { useMe } from "@/lib/hooks";

function getPathWithoutLocale(pathname: string): string {
  const normalized = pathname.replace(/^\/proxy\/\d+(?=\/|$)/, "");
  const parts = normalized.split("/").filter(Boolean);
  return parts[0] === "mn" || parts[0] === "en" ? `/${parts.slice(1).join("/")}` : normalized || "/";
}

function isAuthRoute(pathname: string): boolean {
  const path = getPathWithoutLocale(pathname);
  return path === "/auth" || path.startsWith("/auth/");
}

function isDashboardRoute(pathname: string): boolean {
  const path = getPathWithoutLocale(pathname);
  
  // Exclude public freelancer profile pages which look like /freelancer/123
  // They should be hybrid routes so they are viewable without auth
  const isFreelancerProfile = path.startsWith("/freelancer/") && 
    !["/freelancer/profile", "/freelancer/settings", "/freelancer/proposals"].includes(path);
  if (isFreelancerProfile) return false;

  return ["/client", "/freelancer", "/admin", "/messages", "/notifications"].some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

function isHybridMarketplaceRoute(pathname: string): boolean {
  if (isAuthRoute(pathname)) return false;
  if (isDashboardRoute(pathname)) return false;
  
  // Anything that is not an Auth route and not a strictly guarded Dashboard route
  // is considered a "Hybrid" route. Example: /, /projects, /support, /pro, /freelancer/[id]
  // Logged-in users will see the Dashboard Layout, logged-out users see the Public layout.
  return true;
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
