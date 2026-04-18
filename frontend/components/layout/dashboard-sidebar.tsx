"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type DashboardRole = "client" | "freelancer" | "admin";

type NavItem = {
  href: string;
  label: string;
  icon:
    | "dashboard"
    | "brief"
    | "folder"
    | "proposal"
    | "wallet"
    | "settings"
    | "search"
    | "support"
    | "shield"
    | "users"
    | "finance"
    | "chat"
    | "notifications";
  exact?: boolean;
};

function normalizeDashboardPath(pathname: string): string {
  const normalized = pathname.replace(/^\/proxy\/\d+(?=\/|$)/, "");
  const parts = normalized.split("/").filter(Boolean);
  return parts[0] === "mn" || parts[0] === "en"
    ? `/${parts.slice(1).join("/")}`
    : normalized;
}

function isActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function SidebarIcon({
  icon,
  className = "h-[18px] w-[18px]",
}: {
  icon: NavItem["icon"];
  className?: string;
}) {
  const common = { className, "aria-hidden": true };
  if (icon === "dashboard") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-10h8V3h-8v8Z" /></svg>;
  }
  if (icon === "brief") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M10 4V3h4v1h5a2 2 0 0 1 2 2v3H3V6a2 2 0 0 1 2-2h5Zm11 7H3v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8Z" /></svg>;
  }
  if (icon === "folder") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M10 4 12 6h7a2 2 0 0 1 2 2v8.5A3.5 3.5 0 0 1 17.5 20h-11A3.5 3.5 0 0 1 3 16.5V7a3 3 0 0 1 3-3h4Z" /></svg>;
  }
  if (icon === "proposal") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V7h3.5L13 3.5ZM8 11h8v1.5H8V11Zm0 3h8v1.5H8V14Zm0 3h5v1.5H8V17Z" /></svg>;
  }
  if (icon === "wallet" || icon === "finance") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3V6Zm0 4h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8Zm11 3a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3Z" /></svg>;
  }
  if (icon === "settings") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m19.4 13 .1-1-.1-1 2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-1.7-1L15 2h-6l-.3 2.9a7.5 7.5 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6-.1 1 .1 1-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 1.7 1L9 22h6l.3-2.9a7.5 7.5 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" /></svg>;
  }
  if (icon === "search") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m21 20-5.6-5.6a7 7 0 1 0-1 1L20 21l1-1ZM5 10a5 5 0 1 1 10 0 5 5 0 0 1-10 0Z" /></svg>;
  }
  if (icon === "shield") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m12 2 8 3v6c0 5-3.4 9.7-8 11-4.6-1.3-8-6-8-11V5l8-3Zm0 5a3 3 0 0 0-3 3v1h-1v2h1v4h2v-4h2v4h2v-4h1v-2h-1v-1a3 3 0 0 0-3-3Z" /></svg>;
  }
  if (icon === "users") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4ZM8 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4ZM8 14c-2.3 0-7 1.1-7 3.5V20h5v-2c0-1.2.7-2.2 2-3Z" /></svg>;
  }
  if (icon === "chat") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8l-4 3v-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 5v2h12V9H6Zm0 4v2h8v-2H6Z" /></svg>;
  }
  if (icon === "notifications") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7v4.6L3.7 15A1 1 0 0 0 4.4 17h15.2a1 1 0 0 0 .7-1.7L19 13.6V9a7 7 0 0 0-7-7Zm0 20a3 3 0 0 0 2.8-2H9.2A3 3 0 0 0 12 22Z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M11 18h2v-2h-2v2Zm1-16a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Zm0-14a3 3 0 0 0-3 3h2a1 1 0 1 1 1 1c-1.1 0-2 .9-2 2v1h2v-1a3 3 0 1 0-3-3h2a1 1 0 1 1 1-1Z" /></svg>;
}

const navByRole: Record<DashboardRole, NavItem[]> = {
  client: [
    { href: "/client", label: "Нүүр", icon: "dashboard", exact: true },
    { href: "/freelancers", label: "Фрилансер хайх", icon: "search" },
    { href: "/client/projects", label: "Миний төслүүд", icon: "folder" },
    { href: "/projects", label: "Санал хүлээх", icon: "proposal" },
    { href: "/messages", label: "Мессеж", icon: "chat" },
    { href: "/notifications", label: "Мэдэгдэл", icon: "notifications" },
    { href: "/client/escrow", label: "Санхүү", icon: "wallet" },
    { href: "/client/settings", label: "Тохиргоо", icon: "settings" },
  ],
  freelancer: [
    { href: "/freelancer", label: "Нүүр", icon: "dashboard", exact: true },
    { href: "/projects", label: "Ажил хайх", icon: "search" },
    { href: "/freelancer/proposals", label: "Миний саналууд", icon: "proposal" },
    { href: "/freelancer/projects", label: "Миний төслүүд", icon: "folder" },
    { href: "/messages", label: "Мессеж", icon: "chat" },
    { href: "/notifications", label: "Мэдэгдэл", icon: "notifications" },
    { href: "/freelancer/finance", label: "Санхүү", icon: "finance" },
    { href: "/freelancer/settings", label: "Тохиргоо", icon: "settings" },
  ],
  admin: [
    { href: "/admin", label: "Control Room", icon: "dashboard", exact: true },
    { href: "/admin/users", label: "Users", icon: "users" },
    { href: "/admin/projects", label: "Projects", icon: "folder" },
    { href: "/admin/disputes", label: "Disputes", icon: "shield" },
    { href: "/admin/escrow", label: "Escrow", icon: "wallet" },
  ],
};

const roleMeta: Record<
  DashboardRole,
  {
    kicker: string;
    title: string;
    ctaLabel: string;
    ctaHref: string;
    helperTitle: string;
    helperBody: string;
  }
> = {
  client: {
    kicker: "Enterprise Tier",
    title: "Project Console",
    ctaLabel: "Create New Brief",
    ctaHref: "/client/projects/new",
    helperTitle: "Тусламж хэрэгтэй юу?",
    helperBody: "Манай зөвлөхүүдтэй шууд холбогдож төсөл, escrow, rollout-аа хурдан шийд.",
  },
  freelancer: {
    kicker: "Professional Desk",
    title: "Talent Console",
    ctaLabel: "Төсөл хайх",
    ctaHref: "/projects",
    helperTitle: "Pipeline-аа өсгө",
    helperBody: "Шилдэг саналуудыг өдөр бүр хянаж, verification-аа сайжруулж орлогоо тогтвортой өсгө.",
  },
  admin: {
    kicker: "Operations Layer",
    title: "Command Deck",
    ctaLabel: "Users Review",
    ctaHref: "/admin/users",
    helperTitle: "Ops Pulse",
    helperBody: "Audit, disputes, escrow action-уудаа нэг төвөөс удирдах зориулалттай консол.",
  },
};

export function RoleSidebar({
  role,
  mobileOpen = false,
  onNavigate,
}: {
  role: DashboardRole;
  mobileOpen?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() || "/";
  const current = normalizeDashboardPath(pathname);
  const meta = roleMeta[role];
  const items = navByRole[role];

  return (
    <aside
      className={[
        "flex h-full w-full max-w-[292px] shrink-0 flex-col bg-surface-container px-4 py-5 text-on-surface shadow-[0_20px_50px_rgba(3,22,54,0.05)]",
        mobileOpen ? "rounded-[28px]" : "rounded-[32px]",
      ].join(" ")}
    >
      <div className="mb-8 px-3 pt-1">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-bold tracking-[0.12em] text-white shadow-[0_18px_35px_rgba(3,22,54,0.18)]">
            IZ
          </div>
          <div>
            <h2 className="font-headline text-[1.15rem] font-extrabold leading-none text-primary">{meta.title}</h2>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface/40">{meta.kicker}</p>
          </div>
        </div>

        <Link
          href={meta.ctaHref}
          onClick={onNavigate}
          className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-fixed shadow-[0_18px_38px_rgba(3,22,54,0.18)] transition-transform duration-200 hover:-translate-y-0.5"
        >
          <SidebarIcon icon={role === "client" ? "brief" : role === "admin" ? "users" : "search"} className="h-[18px] w-[18px]" />
          {meta.ctaLabel}
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 px-1" aria-label={`${role} navigation`}>
        {items.map((item) => {
          const active = isActive(current, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={[
                "group flex min-h-[52px] items-center gap-3 rounded-2xl px-4 py-3 text-[13px] font-medium transition-all duration-200",
                active
                  ? "bg-surface-container-lowest text-primary shadow-[0_12px_28px_rgba(3,22,54,0.08)]"
                  : "text-on-surface/58 hover:bg-surface-container-high hover:text-primary",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-surface-container text-primary" : "bg-transparent text-current",
                ].join(" ")}
              >
                <SidebarIcon icon={item.icon} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-2 pb-2">
        <div className="rounded-[24px] bg-primary-container/10 p-5 shadow-[0_12px_28px_rgba(3,22,54,0.04)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-container-lowest text-secondary shadow-[0_8px_22px_rgba(19,105,106,0.14)]">
            <SidebarIcon icon={role === "admin" ? "shield" : "support"} className="h-[18px] w-[18px]" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">{meta.helperTitle}</p>
          <p className="mt-2 text-sm leading-6 text-on-surface/68">{meta.helperBody}</p>
          <button
            type="button"
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-surface-container-lowest px-4 py-2 text-xs font-semibold text-primary shadow-[0_10px_24px_rgba(3,22,54,0.06)]"
          >
            <span>Contact Support</span>
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="currentColor" d="M12.3 5.3 11 6.6l3.2 3.2H4v1.9h10.2L11 14.9l1.3 1.3 5.4-5.4-5.4-5.5Z" /></svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
