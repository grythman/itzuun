"use client";

import { usePathname } from "next/navigation";

import { Nav } from "@/components/nav";

function isDashboardRoute(pathname: string): boolean {
  const normalized = pathname.replace(/^\/proxy\/\d+(?=\/|$)/, "");
  const parts = normalized.split("/").filter(Boolean);
  const pathWithoutLocale =
    parts[0] === "mn" || parts[0] === "en" ? `/${parts.slice(1).join("/")}` : normalized;

  return ["/client", "/freelancer", "/admin"].some(
    (prefix) => pathWithoutLocale === prefix || pathWithoutLocale.startsWith(`${prefix}/`),
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const dashboardRoute = isDashboardRoute(pathname);

  if (dashboardRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Nav />
      <main className="content-frame section-y">{children}</main>
    </>
  );
}
