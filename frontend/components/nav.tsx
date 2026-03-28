"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { authApi } from "@/lib/api/endpoints";
import { useMe } from "@/lib/hooks";

const publicLinks = [
  { href: "/projects", labelKey: "browseProjects", icon: "projects" },
  { href: "/freelancers", labelKey: "findFreelancers", icon: "search" },
];

function dashboardPath(role?: string) {
  if (role === "admin") return "/admin";
  if (role === "freelancer") return "/freelancer";
  return "/client";
}

export function Nav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathParts = pathname.split("/").filter(Boolean);
  const activeLocale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withoutLocale = pathParts[0] === "en" || pathParts[0] === "mn"
    ? `/${pathParts.slice(1).join("/")}`
    : pathname;
  const normalizePath = withoutLocale === "/" ? "" : withoutLocale;
  const withLocale = (href: string) => `/${activeLocale}${href}`;
  const switchLocalePath = (locale: "mn" | "en") => `/${locale}${normalizePath}`;
  const pathForChecks = normalizePath || "/";
  const needsSessionCheck = ["/client", "/freelancer", "/admin"].some((prefix) => pathForChecks.startsWith(prefix));
  const me = useMe({ enabled: needsSessionCheck, retryOnAuth: needsSessionCheck });
  const user = me.data;
  const [mobileOpen, setMobileOpen] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.clear();
      router.push("/");
    },
  });

  const iconClass = "h-4 w-4 text-surface-500";

  const navLinks = user
    ? [
        ...publicLinks,
        { href: dashboardPath(user.role), label: t("dashboard"), icon: "dashboard" },
      ]
    : publicLinks.map((link) => ({ ...link, label: t(link.labelKey as "browseProjects" | "findFreelancers") }));

  const resolvedNavLinks = navLinks.map((link) => ({
    ...link,
    href: withLocale(link.href),
    label: ("label" in link && link.label) || t(link.labelKey as "browseProjects" | "findFreelancers"),
  }));

  return (
    <header className="sticky top-0 z-30 border-b border-surface-300/35 glass-panel">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5" aria-label="Main">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg primary-gradient text-xs font-bold text-white shadow-card">IZ</span>
            <span className="text-[24px] font-extrabold tracking-tighter text-brand-700 font-headline">ITZuun</span>
          </Link>

          <div className="hidden items-center gap-0.5 md:flex">
            {resolvedNavLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all ${
                    active ? "bg-brand-100 text-brand-700" : "text-surface-600 hover:bg-surface-100 hover:text-surface-900"
                  }`}
                >
                  {link.icon === "projects" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="M8 5V3m8 2V3m-5 8h2" />
                    </svg>
                  ) : link.icon === "search" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
                      <circle cx="11" cy="11" r="6" />
                      <path d="m20 20-4-4" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  )}
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-surface-500 hover:bg-surface-100 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {user ? (
            <>
              <span className="hidden text-[13px] text-surface-500 sm:inline">{user.email}</span>
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-brand-700">
                {user.role}
              </span>
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="rounded-lg px-3 py-1.5 text-[13px] text-surface-500 hover:bg-surface-100 hover:text-surface-800"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <Link href={switchLocalePath("mn")} className="font-semibold text-[13px] text-slate-400 hover:text-slate-800">MN</Link>
              <span className="text-slate-300">|</span>
              <Link href={switchLocalePath("en")} className="font-semibold text-[13px] text-slate-400 hover:text-slate-800">EN</Link>
              <Link href={`${withLocale("/auth")}?tab=signin`} className="ml-2 rounded-lg px-3 py-1.5 text-[13px] font-medium text-surface-600 hover:bg-surface-100">
                {t("login")}
              </Link>
              <Link href={`${withLocale("/auth")}?tab=register`} className="rounded-full primary-gradient px-5 py-2 text-[13px] font-semibold text-white shadow-card hover:opacity-95 transition-colors">
                {t("postProject")}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="border-t border-surface-100 bg-white px-4 py-3 md:hidden">
          <div className="space-y-0.5">
            {resolvedNavLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-[13px] ${
                    active ? "bg-brand-50 text-brand-700 font-medium" : "text-surface-600 hover:bg-surface-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
