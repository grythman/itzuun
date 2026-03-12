"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authApi } from "@/lib/api/endpoints";
import { useMe } from "@/lib/hooks";

const publicLinks = [
  { href: "/projects", label: "Browse Projects", icon: "projects" },
  { href: "/freelancers", label: "Find Freelancers", icon: "search" },
];

function dashboardPath(role?: string) {
  if (role === "admin") return "/admin";
  if (role === "freelancer") return "/freelancer";
  return "/client";
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const needsSessionCheck = ["/client", "/freelancer", "/admin"].some((prefix) => pathname.startsWith(prefix));
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

  const iconClass = "h-4 w-4 text-surface-400";

  const navLinks = user
    ? [
        ...publicLinks,
        { href: dashboardPath(user.role), label: "Dashboard", icon: "dashboard" },
      ]
    : publicLinks;

  return (
    <header className="sticky top-0 z-30 border-b border-surface-200/80 bg-white/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3" aria-label="Main">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 text-xs font-bold text-white shadow-sm">IZ</span>
            <span className="text-[15px] font-semibold tracking-tight text-surface-900">ITZuun</span>
          </Link>

          <div className="hidden items-center gap-0.5 md:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all ${
                    active ? "bg-brand-50 text-brand-700" : "text-surface-500 hover:bg-surface-100 hover:text-surface-800"
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
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth?tab=signin" className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-surface-600 hover:bg-surface-100">
                Login
              </Link>
              <Link href="/auth?tab=register" className="rounded-lg bg-brand-600 px-4 py-1.5 text-[13px] font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="border-t border-surface-100 bg-white px-4 py-3 md:hidden">
          <div className="space-y-0.5">
            {navLinks.map((link) => {
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
