"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type DashboardRole = "client" | "freelancer" | "admin";

function normalizedLocalePrefix(pathname: string): string {
  const normalized = pathname.replace(/^\/proxy\/\d+(?=\/|$)/, "");
  const parts = normalized.split("/").filter(Boolean);
  return parts[0] === "mn" || parts[0] === "en" ? `/${parts[0]}` : "";
}

function HeaderIcon({
  icon,
  className = "h-[18px] w-[18px]",
}: {
  icon: "search" | "notifications" | "settings" | "menu" | "close";
  className?: string;
}) {
  const common = { className, "aria-hidden": true };
  if (icon === "search") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m21 20-5.6-5.6a7 7 0 1 0-1 1L20 21l1-1ZM5 10a5 5 0 1 1 10 0 5 5 0 0 1-10 0Z" /></svg>;
  }
  if (icon === "notifications") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7v4.6L3.7 15A1 1 0 0 0 4.4 17h15.2a1 1 0 0 0 .7-1.7L19 13.6V9a7 7 0 0 0-7-7Zm0 20a3 3 0 0 0 2.8-2H9.2A3 3 0 0 0 12 22Z" /></svg>;
  }
  if (icon === "settings") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m19.4 13 .1-1-.1-1 2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-1.7-1L15 2h-6l-.3 2.9a7.5 7.5 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6-.1 1 .1 1-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 1.7 1L9 22h6l.3-2.9a7.5 7.5 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" /></svg>;
  }
  if (icon === "close") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m18.3 5.7-1-1L12 10l-5.3-5.3-1 1L11 11l-5.3 5.3 1 1L12 12l5.3 5.3 1-1L13 11l5.3-5.3Z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M4 7h16v2H4V7Zm0 4h16v2H4v-2Zm0 4h10v2H4v-2Z" /></svg>;
}

const navByRole: Record<DashboardRole, Array<{ href: string; label: string }>> = {
  client: [
    { href: "/projects", label: "Browse Projects" },
    { href: "/freelancers", label: "Talent" },
    { href: "/client/escrow", label: "Escrow" },
    { href: "/client", label: "Insights" },
  ],
  freelancer: [
    { href: "/projects", label: "Find Work" },
    { href: "/freelancer/projects", label: "My Projects" },
    { href: "/freelancer/finance", label: "Finance" },
    { href: "/messages", label: "Messages" },
  ],
  admin: [
    { href: "/admin/users", label: "Users" },
    { href: "/admin/projects", label: "Projects" },
    { href: "/admin/disputes", label: "Disputes" },
    { href: "/admin/escrow", label: "Escrow" },
  ],
};

export function DashboardTopHeader({
  userName,
  role,
  roleLabel = "User",
  searchPlaceholder = "Хайх...",
  onOpenSidebar,
  sidebarOpen = false,
}: {
  userName: string;
  role: DashboardRole;
  roleLabel?: string;
  searchPlaceholder?: string;
  onOpenSidebar?: () => void;
  sidebarOpen?: boolean;
}) {
  const pathname = usePathname() || "/";
  const localePrefix = normalizedLocalePrefix(pathname);
  const [query, setQuery] = useState("");
  const navItems = navByRole[role];
  const initials = userName.trim().slice(0, 1).toUpperCase() || "I";

  return (
    <header className="sticky top-0 z-30 mb-6">
      <div className="rounded-[28px] bg-[rgba(247,249,251,0.82)] px-4 py-4 shadow-[0_18px_40px_rgba(3,22,54,0.05)] backdrop-blur-xl sm:px-5 lg:px-6">
        <div className="flex items-center gap-3 lg:gap-6">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-low text-primary shadow-[0_12px_28px_rgba(3,22,54,0.05)] lg:hidden"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarOpen}
          >
            <HeaderIcon icon={sidebarOpen ? "close" : "menu"} />
          </button>

          <form
            className="relative min-w-0 flex-1"
            action={`${localePrefix}/projects`}
            onSubmit={(event) => {
              if (!query.trim()) return;
              event.currentTarget.submit();
            }}
          >
            <input type="hidden" name="search" value={query} />
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/35">
                <HeaderIcon icon="search" />
              </span>
              <input
                type="search"
                aria-label={searchPlaceholder}
                placeholder={searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-12 w-full rounded-full bg-surface-container pl-12 pr-5 text-sm text-on-surface placeholder:text-on-surface/38 shadow-none focus:bg-surface-container-lowest focus:shadow-[0_10px_28px_rgba(3,22,54,0.06)]"
              />
            </div>
          </form>

          <nav className="hidden items-center gap-7 xl:flex" aria-label="Dashboard top navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={`${localePrefix}${item.href}`}
                className="text-[13px] font-medium text-on-surface/58 transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="hidden min-h-11 rounded-full px-3 text-[12px] font-semibold text-on-surface/56 transition-colors hover:text-primary sm:inline-flex sm:items-center"
              aria-label="Switch language"
            >
              MN/EN
            </button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-low text-on-surface/56 shadow-[0_10px_24px_rgba(3,22,54,0.05)] transition-colors hover:text-primary"
              aria-label="Notifications"
            >
              <HeaderIcon icon="notifications" />
            </button>
            <button
              type="button"
              className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-low text-on-surface/56 shadow-[0_10px_24px_rgba(3,22,54,0.05)] transition-colors hover:text-primary sm:inline-flex"
              aria-label="Settings"
            >
              <HeaderIcon icon="settings" />
            </button>
            <div className="hidden h-11 items-center gap-3 rounded-[22px] bg-surface-container-lowest px-3 shadow-[0_14px_28px_rgba(3,22,54,0.06)] md:flex">
              <div className="text-right leading-tight">
                <p className="font-headline text-sm font-extrabold text-primary">{userName}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface/38">{roleLabel}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed text-xs font-bold text-primary">
                {initials}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
