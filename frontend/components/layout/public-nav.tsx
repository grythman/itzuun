"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { Logo } from "@/components/shared/logo";
import { authApi } from "@/lib/api/endpoints";
import { useMe } from "@/lib/hooks";

function dashboardPath(role?: string) {
  if (role === "admin") return "/admin";
  if (role === "freelancer") return "/freelancer";
  return "/client";
}

function roleLabel(role: string, locale: string) {
  if (locale === "mn") {
    if (role === "freelancer") return "Фрилансер";
    if (role === "client") return "Захиалагч";
    if (role === "admin") return "Админ";
  }
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function PublicNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const safePathname = pathname || "/";
  const normalizedPathname = safePathname.replace(/^\/proxy\/\d+(?=\/|$)/, "") || "/";
  const pathParts = normalizedPathname.split("/").filter(Boolean);
  const activeLocale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withoutLocale =
    pathParts[0] === "en" || pathParts[0] === "mn"
      ? `/${pathParts.slice(1).join("/")}`
      : normalizedPathname;
  const normalizePath = withoutLocale === "/" ? "" : withoutLocale;
  const withLocale = (href: string) => `/${activeLocale}${href}`;
  const switchLocalePath = (locale: "mn" | "en") => `/${locale}${normalizePath}`;
  const pathForChecks = normalizePath || "/";
  const isHomeRoute = pathForChecks === "/";
  const isAuthRoute = pathForChecks === "/auth" || pathForChecks.startsWith("/auth/");
  const needsSessionCheck = ["/client", "/freelancer", "/admin"].some((p) => pathForChecks.startsWith(p));
  const me = useMe({ enabled: needsSessionCheck, retryOnAuth: needsSessionCheck });
  const user = me.data;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.clear();
      router.push("/");
    },
  });

  // Build nav links depending on auth state
  const publicLinks = [
    { href: withLocale("/projects"), label: t("browseProjects") },
    { href: withLocale("/freelancers"), label: t("findFreelancers") },
  ];

  const authedLinks = user
    ? [
        ...publicLinks,
        { href: withLocale(dashboardPath(user.role)), label: t("dashboard") },
      ]
    : publicLinks;

  if (isAuthRoute) return null;

  function isActive(href: string) {
    return normalizedPathname === href || normalizedPathname.startsWith(href + "/");
  }

  const avatarInitial = (user?.email || "U")[0].toUpperCase();

  if (isHomeRoute && !user) {
    return (
      <>
        <header className="sticky top-0 z-40 bg-[#f7f9fb]/90 backdrop-blur-md shadow-[0_20px_50px_rgba(3,22,54,0.06)]">
          <nav className="app-frame flex h-14 items-center justify-between md:h-16" aria-label="Main">
            <Link href={withLocale("/")} aria-label="ITZuun homepage" className="inline-flex items-center">
              <img src="/images/logo-horizontal-light.svg?v=20260414" alt="ITZuun" className="h-6 w-auto md:h-7" />
            </Link>

            <div className="hidden items-center gap-8 md:flex">
              <Link href={withLocale("/freelancers")} className="border-b-2 border-[#13696a] pb-1 text-sm font-semibold text-[#031636]">
                Find Talent
              </Link>
              <Link href={withLocale("/projects")} className="text-sm font-medium text-[#191c1e]/70 hover:text-[#031636]">
                Browse Projects
              </Link>
              <Link href={withLocale("/support")} className="text-sm font-medium text-[#191c1e]/70 hover:text-[#031636]">
                Solutions
              </Link>
              <Link href={withLocale("/pro")} className="text-sm font-medium text-[#191c1e]/70 hover:text-[#031636]">
                Pricing
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`${withLocale("/auth")}?tab=signin`} className="hidden rounded-md px-4 py-2 text-sm font-medium text-[#031636] hover:bg-[#eceef0]/50 md:inline-flex">
                Log In
              </Link>
              <Link href={`${withLocale("/auth")}?tab=register`} className="hidden rounded-md bg-gradient-to-br from-[#031636] to-[#1a2b4c] px-6 py-2.5 text-sm font-semibold text-white md:inline-flex">
                Join as Freelancer
              </Link>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl p-2 text-surface-500 hover:bg-surface-container-low md:hidden"
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
            </div>
          </nav>
          {mobileOpen && (
            <div className="border-t border-surface-100 bg-white px-4 py-3 md:hidden">
              <div className="space-y-1">
                <Link href={withLocale("/freelancers")} onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-surface-700 hover:bg-surface-100">Find Talent</Link>
                <Link href={withLocale("/projects")} onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-surface-700 hover:bg-surface-100">Browse Projects</Link>
                <Link href={withLocale("/support")} onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-surface-700 hover:bg-surface-100">Solutions</Link>
                <Link href={withLocale("/pro")} onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-surface-700 hover:bg-surface-100">Pricing</Link>
                <div className="my-2 h-px bg-outline-variant/20" />
                <Link href={`${withLocale("/auth")}?tab=signin`} onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-surface-700 hover:bg-surface-100">Log In</Link>
                <Link href={`${withLocale("/auth")}?tab=register`} onClick={() => setMobileOpen(false)} className="block rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white">Join as Freelancer</Link>
              </div>
            </div>
          )}
        </header>
      </>
    );
  }

  return (
    <header className={`sticky top-0 z-40 bg-surface/90 backdrop-blur-md shadow-[0_1px_0_0_rgba(3,22,54,0.06)]`}>
      <nav
        className={`app-frame flex items-center justify-between gap-4 ${isHomeRoute ? "py-5" : "py-3"}`}
        aria-label="Main"
      >
        {/* Left: logo + links */}
        <div className={`flex items-center ${isHomeRoute ? "gap-8 xl:gap-10" : "gap-6"}`}>
          <Logo
            variant="horizontal"
            theme="light"
            href={withLocale("/")}
            className={isHomeRoute ? "w-[128px]" : "w-[140px]"}
          />

          <div className={`hidden items-center md:flex ${isHomeRoute ? "gap-1" : "gap-0.5"}`}>
            {authedLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center rounded-xl px-3.5 py-2 text-[14px] font-bold transition-all font-headline ${
                    active
                      ? "bg-primary-fixed text-primary"
                      : "text-surface-500 hover:bg-surface-container-low hover:text-on-surface"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: actions */}
        <div className={`flex items-center ${isHomeRoute ? "gap-3" : "gap-2"}`}>
          {/* Mobile hamburger */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl p-2 text-surface-500 hover:bg-surface-container-low md:hidden"
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
              {/* Notifications */}
              <Link
                href={withLocale("/notifications")}
                className="relative hidden items-center justify-center rounded-xl p-2.5 text-surface-500 transition-all hover:bg-surface-container-low hover:text-primary md:inline-flex"
                aria-label="Notifications"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <path d="M12 2a7 7 0 0 0-7 7v4.6L3.7 15A1 1 0 0 0 4.4 17h15.2a1 1 0 0 0 .7-1.7L19 13.6V9a7 7 0 0 0-7-7Zm0 20a3 3 0 0 0 2.8-2H9.2A3 3 0 0 0 12 22Z" />
                </svg>
              </Link>

              {/* Messages */}
              <Link
                href={withLocale("/messages")}
                className="relative hidden items-center justify-center rounded-xl p-2.5 text-surface-500 transition-all hover:bg-surface-container-low hover:text-primary md:inline-flex"
                aria-label="Messages"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
                </svg>
              </Link>

              {/* User avatar + dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 rounded-2xl bg-surface-container-lowest px-3 py-2 shadow-sm transition-all hover:shadow-ambient"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl primary-gradient text-[13px] font-black text-primary-fixed font-headline">
                    {avatarInitial}
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary font-headline leading-none">
                      {roleLabel(user.role, activeLocale)}
                    </p>
                  </div>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-surface-400" fill="currentColor" aria-hidden>
                    <path d="m7 10 5 5 5-5H7Z" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl bg-surface-container-lowest shadow-ambient">
                      <div className="border-b border-outline-variant/10 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-surface-400 font-headline">
                          {user.email}
                        </p>
                      </div>
                      <div className="p-2">
                        <Link
                          href={withLocale(dashboardPath(user.role))}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors"
                        >
                          Dashboard
                        </Link>
                        <Link
                          href={withLocale(user.role === "freelancer" ? "/freelancer/profile" : "/client/profile")}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors"
                        >
                          Профайл
                        </Link>
                        <Link
                          href={withLocale("/notifications")}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors"
                        >
                          Мэдэгдлүүд
                        </Link>
                        <div className="my-1 h-px bg-outline-variant/10" />
                        <button
                          type="button"
                          onClick={() => { logoutMutation.mutate(); setUserMenuOpen(false); }}
                          disabled={logoutMutation.isPending}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                          {logoutMutation.isPending ? "Гарч байна..." : t("logout")}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Locale switcher */}
              <div className="hidden items-center gap-1 sm:flex">
                <Link href={switchLocalePath("mn")} className="rounded-lg px-2 py-1 text-[13px] font-bold text-surface-400 hover:text-primary transition-colors font-headline">MN</Link>
                <span className="text-surface-200">|</span>
                <Link href={switchLocalePath("en")} className="rounded-lg px-2 py-1 text-[13px] font-bold text-surface-400 hover:text-primary transition-colors font-headline">EN</Link>
              </div>

              <Link
                href={`${withLocale("/auth")}?tab=signin`}
                className={`rounded-xl text-[14px] font-bold text-surface-600 hover:bg-surface-container-low transition-all font-headline ${
                  isHomeRoute ? "px-3.5 py-2" : "px-3 py-1.5"
                }`}
              >
                {t("login")}
              </Link>
              <Link
                href={`${withLocale("/auth")}?tab=register`}
                className={`rounded-xl primary-gradient text-[13px] font-headline font-black text-primary-fixed shadow-ambient hover:-translate-y-0.5 transition-all ${
                  isHomeRoute ? "px-6 py-2.5" : "px-5 py-2"
                }`}
              >
                {t("postProject")}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-outline-variant/10 bg-surface-container-lowest px-4 py-3 md:hidden">
          <div className="space-y-1">
            {authedLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-xl px-4 py-3 text-[14px] font-bold transition-colors font-headline ${
                    active ? "bg-primary-fixed text-primary" : "text-surface-600 hover:bg-surface-container-low"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {user && (
              <button
                type="button"
                onClick={() => { logoutMutation.mutate(); setMobileOpen(false); }}
                className="block w-full rounded-xl px-4 py-3 text-left text-[14px] font-bold text-red-600 hover:bg-red-50 transition-colors font-headline"
              >
                {t("logout")}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
