"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const me = useMe();
  const user = me.data;

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.clear();
      router.push("/");
    },
  });

  const iconClass = "h-4 w-4 text-slate-500";

  const navLinks = user
    ? [
        ...publicLinks,
        { href: dashboardPath(user.role), label: "Dashboard", icon: "dashboard" },
      ]
    : publicLinks;

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4" aria-label="Main">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-800 text-sm font-semibold text-white">IZ</span>
            <span className="text-base font-semibold text-slate-900">ITZuun</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                    active ? "bg-blue-50 text-blue-800" : "text-slate-700 hover:bg-slate-100"
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
          {user ? (
            <>
              <span className="hidden text-sm text-slate-600 sm:inline">{user.email}</span>
              <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-medium capitalize text-blue-700">
                {user.role}
              </span>
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="rounded-xl px-3 py-2 text-sm text-slate-800 hover:bg-slate-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth?tab=signin" className="rounded-xl px-3 py-2 text-sm text-slate-800 hover:bg-slate-100">
                Login
              </Link>
              <Link href="/auth?tab=register" className="rounded-xl bg-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
