"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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
  const searchParams = useSearchParams();
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
  const pathForChecks = normalizePath || "/";
  const withLocale = useCallback((href: string) => `/${activeLocale}${href}`, [activeLocale]);
  const switchLocalePath = (locale: "mn" | "en") => `/${locale}${normalizePath}`;

  const isAuthRoute = pathForChecks === "/auth" || pathForChecks.startsWith("/auth/");
  const needsSessionCheck = ["/client", "/freelancer", "/admin"].some((p) => pathForChecks.startsWith(p));
  const me = useMe({ enabled: needsSessionCheck, retryOnAuth: needsSessionCheck });
  const user = me.data;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  useEffect(() => {
    setSearchInput(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.clear();
      router.push(withLocale("/"));
    },
  });

  const links = useMemo(() => {
    const base = [
      { href: withLocale("/projects"), label: t("browseProjects") },
      { href: withLocale("/freelancers"), label: t("findFreelancers") },
    ];
    if (!user) return base;
    return [...base, { href: withLocale(dashboardPath(user.role)), label: t("dashboard") }];
  }, [user, t, withLocale]);

  if (isAuthRoute) return null;

  const isActive = (href: string) =>
    normalizedPathname === href || normalizedPathname.startsWith(`${href}/`);
  const avatarInitial = (user?.email || "U")[0].toUpperCase();

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (!searchInput.trim()) params.delete("search");
    else params.set("search", searchInput.trim());
    params.delete("page");
    router.push(`${withLocale("/projects")}?${params.toString()}`);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-md shadow-[0_10px_28px_rgba(3,22,54,0.07)]">
      <nav className="app-frame flex min-h-[64px] items-center justify-between gap-4 py-2.5" aria-label="Main">
        <div className="flex items-center gap-5 lg:gap-8">
          <Logo variant="horizontal" theme="light" href={withLocale("/")} className="w-[126px] lg:w-[140px]" />
          <div className="hidden items-center gap-1.5 lg:flex">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center rounded-xl px-3.5 py-2 text-[13px] font-black transition-all font-headline ${
                    active
                      ? "bg-primary-fixed text-primary shadow-[0_8px_20px_rgba(3,22,54,0.08)]"
                      : "text-on-surface/65 hover:bg-surface-container-low hover:text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={submitSearch}
          className="hidden min-w-[320px] flex-1 items-center justify-center px-2 md:flex"
          aria-label="Project search"
        >
          <div className="flex w-full max-w-[520px] items-center rounded-2xl bg-surface-container-low px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4 text-on-surface/45"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-transparent py-1.5 pl-3 pr-2 text-[13px] text-on-surface placeholder:text-on-surface/45 focus:outline-none"
              placeholder="Төслийн нэр, ур чадвар, эсвэл нэрээр хай..."
              aria-label="Search projects"
            />
            <button type="submit" className="ui-btn-ghost min-h-9 px-3.5 text-[10px]">
              Хайх
            </button>
          </div>
        </form>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <div className="hidden items-center gap-1 sm:flex">
            <Link href={switchLocalePath("mn")} className="rounded-lg px-2 py-1 text-[12px] font-bold text-on-surface/50 hover:text-primary">MN</Link>
            <span className="text-on-surface/25">|</span>
            <Link href={switchLocalePath("en")} className="rounded-lg px-2 py-1 text-[12px] font-bold text-on-surface/50 hover:text-primary">EN</Link>
          </div>

          {!user ? (
            <>
              <Link
                href={`${withLocale("/auth")}?tab=signin`}
                className="hidden rounded-xl px-3 py-2 text-[13px] font-bold text-on-surface/65 transition-colors hover:bg-surface-container-low hover:text-primary sm:inline-flex"
              >
                {t("login")}
              </Link>
              <Link
                href={`${withLocale("/auth")}?tab=register`}
                className="hidden rounded-xl bg-primary-gradient px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-primary-fixed shadow-ambient transition-all hover:-translate-y-0.5 sm:inline-flex"
              >
                {t("postProject")}
              </Link>
            </>
          ) : (
            <>
              <Link
                href={withLocale("/notifications")}
                className="hidden items-center justify-center rounded-xl p-2.5 text-on-surface/60 transition-all hover:bg-surface-container-low hover:text-primary md:inline-flex"
                aria-label="Notifications"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <path d="M12 2a7 7 0 0 0-7 7v4.6L3.7 15A1 1 0 0 0 4.4 17h15.2a1 1 0 0 0 .7-1.7L19 13.6V9a7 7 0 0 0-7-7Zm0 20a3 3 0 0 0 2.8-2H9.2A3 3 0 0 0 12 22Z" />
                </svg>
              </Link>
              <Link
                href={withLocale("/messages")}
                className="hidden items-center justify-center rounded-xl p-2.5 text-on-surface/60 transition-all hover:bg-surface-container-low hover:text-primary md:inline-flex"
                aria-label="Messages"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
                </svg>
              </Link>
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-2xl bg-surface-container-low px-2.5 py-1.5 shadow-[0_8px_20px_rgba(3,22,54,0.08)]"
                  aria-label="Account menu"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-gradient text-[13px] font-black text-primary-fixed font-headline">
                    {avatarInitial}
                  </div>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-on-surface/45" fill="currentColor" aria-hidden>
                    <path d="m7 10 5 5 5-5H7Z" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setUserMenuOpen(false)}
                      aria-label="Close account menu"
                    />
                    <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl bg-surface-container-lowest p-2 shadow-[0_24px_48px_rgba(3,22,54,0.18)]">
                      <div className="px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface/45 font-headline">
                          {roleLabel(user.role, activeLocale)}
                        </p>
                        <p className="mt-1 truncate text-[12px] text-on-surface/60">{user.email}</p>
                      </div>
                      <div className="ui-divider-soft my-1" />
                      <div className="space-y-1">
                        <Link
                          href={withLocale(dashboardPath(user.role))}
                          onClick={() => setUserMenuOpen(false)}
                          className="block rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface/80 hover:bg-surface-container-low"
                        >
                          {t("dashboard")}
                        </Link>
                        <Link
                          href={withLocale(user.role === "freelancer" ? "/freelancer/profile" : "/client/profile")}
                          onClick={() => setUserMenuOpen(false)}
                          className="block rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface/80 hover:bg-surface-container-low"
                        >
                          Профайл
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            logoutMutation.mutate();
                            setUserMenuOpen(false);
                          }}
                          disabled={logoutMutation.isPending}
                          className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[#b42318] hover:bg-[#fff1ef] disabled:opacity-60"
                        >
                          {logoutMutation.isPending ? "Гарч байна..." : t("logout")}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl bg-surface-container-low p-2 text-on-surface/70 shadow-[0_8px_18px_rgba(3,22,54,0.08)] lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-public-nav"
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
        <div
          id="mobile-public-nav"
          className="app-frame pb-5 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          <div className="ui-surface-soft p-4">
            <form onSubmit={submitSearch} className="mb-4">
              <div className="flex items-center rounded-xl bg-surface-container-low px-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-on-surface/45">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Төслийн нэр, ур чадвараар хайх..."
                  className="w-full bg-transparent px-3 py-3 text-sm focus:outline-none"
                />
              </div>
            </form>

            <div className="space-y-1.5">
              {links.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-xl px-4 py-3 text-[14px] font-bold ${
                      active ? "bg-primary-fixed text-primary" : "bg-surface-container-low text-on-surface/70"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {!user && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Link href={`${withLocale("/auth")}?tab=signin`} onClick={() => setMobileOpen(false)} className="ui-btn-ghost w-full">
                  {t("login")}
                </Link>
                <Link href={`${withLocale("/auth")}?tab=register`} onClick={() => setMobileOpen(false)} className="ui-btn-primary w-full">
                  {t("postProject")}
                </Link>
              </div>
            )}

            {user && (
              <button
                type="button"
                onClick={() => {
                  logoutMutation.mutate();
                  setMobileOpen(false);
                }}
                className="mt-4 block w-full rounded-xl bg-[#fff1ef] px-4 py-3 text-left text-sm font-bold text-[#b42318]"
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
