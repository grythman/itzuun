"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authApi } from "@/lib/api/endpoints";

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
  icon:
    | "search"
    | "notifications"
    | "settings"
    | "menu"
    | "close"
    | "profile"
    | "trend"
    | "health"
    | "membership"
    | "connects"
    | "moon"
    | "chevronDown"
    | "logout";
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
  if (icon === "profile") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 12c5 0 9 2.2 9 5v3H3v-3c0-2.8 4-5 9-5Zm0 2c-4 0-7 1.5-7 3v1h14v-1c0-1.5-3-3-7-3Z" /></svg>;
  }
  if (icon === "trend") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m4 17 6-6 4 4 6-7v3h2V4h-7v2h3.2l-4.2 5-4-4-7 7 1.4 1.4ZM4 20h16v-2H4v2Z" /></svg>;
  }
  if (icon === "health") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 5v4.2l3 1.8-1 1.7-4-2.3V7h2Z" /></svg>;
  }
  if (icon === "membership") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M20 6h-4l-2-3-2 3H8l-2-3-2 3H2v14h20V6Zm-8 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm-6 9h12v-1c0-2-4-3.1-6-3.1S6 15 6 17v1Z" /></svg>;
  }
  if (icon === "connects") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M10.6 13.4a5 5 0 0 1 0-7.1l2.1-2.1a5 5 0 1 1 7.1 7.1l-1.7 1.7-1.4-1.4 1.7-1.7a3 3 0 1 0-4.2-4.2l-2.1 2.1a3 3 0 0 0 0 4.2l-1.4 1.4Zm2.8 4.9-2.1 2.1a5 5 0 0 1-7.1-7.1l1.7-1.7 1.4 1.4-1.7 1.7a3 3 0 0 0 4.2 4.2l2.1-2.1a3 3 0 0 0 0-4.2l1.4-1.4a5 5 0 0 1 0 7.1Z" /></svg>;
  }
  if (icon === "moon") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M14.8 3.2A9 9 0 1 0 20.8 17a8 8 0 1 1-6-13.8Z" /></svg>;
  }
  if (icon === "chevronDown") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m7 10 5 5 5-5H7Z" /></svg>;
  }
  if (icon === "logout") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M13 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5v-2h5V5h-5V3Zm-1 4-1.4 1.4 2.6 2.6H4v2h9.2l-2.6 2.6L12 17l5-5-5-5Z" /></svg>;
  }
  if (icon === "close") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m18.3 5.7-1-1L12 10l-5.3-5.3-1 1L11 11l-5.3 5.3 1 1L12 12l5.3 5.3 1-1L13 11l5.3-5.3Z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M4 7h16v2H4V7Zm0 4h16v2H4v-2Zm0 4h10v2H4v-2Z" /></svg>;
}

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const localePrefix = normalizedLocalePrefix(pathname);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [onlineForMessages, setOnlineForMessages] = useState(true);
  const initials = userName.trim().slice(0, 1).toUpperCase() || "I";
  const searchAction = role === "client" ? `${localePrefix}/freelancers` : `${localePrefix}/projects`;
  const homeHref =
    role === "admin" ? `${localePrefix}/admin` : role === "freelancer" ? `${localePrefix}/freelancer` : `${localePrefix}/client`;
  const profileHref = role === "freelancer" ? "/freelancer/profile" : role === "client" ? "/client/profile" : "/admin";
  const settingsHref = role === "freelancer" ? "/freelancer/settings" : role === "client" ? "/client/settings" : "/admin";
  const membershipHref = role === "freelancer" ? "/pro" : "/support";
  const connectsHref = role === "client" ? "/freelancers" : role === "freelancer" ? "/projects" : "/admin/users";

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.clear();
      router.push(`${localePrefix || ""}/`);
    },
  });

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const accountMenuItems = useMemo(
    () => [
      { href: profileHref, label: "Профайл", icon: "profile" as const },
      { href: role === "admin" ? "/admin" : `/${role}`, label: "Статистик", icon: "trend" as const },
      { href: "/support", label: "Дансны эрүүл байдал", icon: "health" as const },
      { href: membershipHref, label: "Эрхийн төлөвлөгөө", icon: "membership" as const },
      { href: connectsHref, label: "Холболт", icon: "connects" as const },
    ],
    [connectsHref, membershipHref, profileHref, role],
  );

  return (
    <header className="sticky top-0 z-30 mb-6">
      <div className="rounded-[28px] bg-[rgba(247,249,251,0.82)] px-4 py-4 shadow-[0_18px_40px_rgba(3,22,54,0.05)] backdrop-blur-xl sm:px-5 lg:px-6">
        <div className="flex items-center gap-3 lg:gap-6">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-low text-primary shadow-[0_12px_28px_rgba(3,22,54,0.05)] lg:hidden"
            aria-label={sidebarOpen ? "Цэс хаах" : "Цэс нээх"}
            aria-expanded={sidebarOpen}
          >
            <HeaderIcon icon={sidebarOpen ? "close" : "menu"} />
          </button>

          <Link
            href={homeHref}
            className="inline-flex h-11 items-center rounded-2xl bg-surface-container-low px-4 font-headline text-sm font-extrabold tracking-tight text-primary shadow-[0_10px_24px_rgba(3,22,54,0.05)]"
            aria-label="Самбарын нүүр рүү орох"
          >
            ITZuun
          </Link>

          <form
            className="relative min-w-0 flex-1"
            action={searchAction}
            onSubmit={(event) => {
              event.preventDefault();
              const q = query.trim();
              if (!q) {
                router.push(searchAction);
                return;
              }
              router.push(`${searchAction}?search=${encodeURIComponent(q)}`);
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

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="hidden min-h-11 rounded-full px-3 text-[12px] font-semibold text-on-surface/56 transition-colors hover:text-primary sm:inline-flex sm:items-center"
              aria-label="Хэл солих"
            >
              MN/EN
            </button>
            <button
              type="button"
              onClick={() => router.push(`${localePrefix}/notifications`)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-low text-on-surface/56 shadow-[0_10px_24px_rgba(3,22,54,0.05)] transition-colors hover:text-primary"
              aria-label="Мэдэгдэл"
            >
              <HeaderIcon icon="notifications" />
            </button>

            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                className="flex h-11 items-center gap-3 rounded-[22px] bg-surface-container-lowest px-3 shadow-[0_14px_28px_rgba(3,22,54,0.06)]"
                aria-label="Дансны цэс"
                aria-expanded={menuOpen}
              >
                <div className="text-right leading-tight">
                  <p className="font-headline text-sm font-extrabold text-primary">{userName}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface/38">{roleLabel}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed text-xs font-bold text-primary">
                  {initials}
                </div>
              </button>

              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Дансны цэс хаах"
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[308px] overflow-hidden rounded-2xl bg-primary p-2 text-primary-fixed shadow-[0_30px_60px_rgba(3,22,54,0.45)]">
                    <div className="rounded-xl bg-white/5 px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-sm font-black text-white">
                          {initials}
                        </div>
                        <div>
                          <p className="font-headline text-[17px] font-bold leading-tight text-white">{userName}</p>
                          <p className="mt-1 text-[11px] font-semibold text-white/65">{roleLabel}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between rounded-xl px-3 py-3 text-[14px] text-white/90">
                      <span>Мессеж хүлээн авч байна</span>
                      <button
                        type="button"
                        onClick={() => setOnlineForMessages((value) => !value)}
                        className={[
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                          onlineForMessages ? "bg-secondary" : "bg-white/15",
                        ].join(" ")}
                        aria-label="Мессежийн онлайн төлөв солих"
                        aria-pressed={onlineForMessages}
                      >
                        <span
                          className={[
                            "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                            onlineForMessages ? "translate-x-5" : "translate-x-1",
                          ].join(" ")}
                        />
                      </button>
                    </div>

                    <div className="my-1 h-px bg-white/10" />

                    <div className="space-y-0.5 px-1 py-1">
                      {accountMenuItems.map((item) => (
                        <Link
                          key={item.label}
                          href={`${localePrefix}${item.href}`}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[15px] font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <span className="text-white/85">
                            <HeaderIcon icon={item.icon} />
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      ))}

                      <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[15px] font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <span className="text-white/85">
                          <HeaderIcon icon="moon" />
                        </span>
                        <span className="flex flex-1 items-center justify-between">
                          <span>Харанхуй горим</span>
                          <HeaderIcon icon="chevronDown" className="h-4 w-4 text-white/65" />
                        </span>
                      </button>

                      <Link
                        href={`${localePrefix}${settingsHref}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[15px] font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <span className="text-white/85">
                          <HeaderIcon icon="settings" />
                        </span>
                        <span>Тохиргоо</span>
                      </Link>
                    </div>

                    <div className="my-1 h-px bg-white/10" />

                    <div className="px-1 pb-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          logoutMutation.mutate();
                          setMenuOpen(false);
                        }}
                        disabled={logoutMutation.isPending}
                        className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[15px] font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-55"
                      >
                        <HeaderIcon icon="logout" />
                        <span>{logoutMutation.isPending ? "Гарч байна..." : "Гарах"}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
