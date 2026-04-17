"use client";

import Link from "next/link";

export function DashboardBottomBar({ role = "client" }: { role?: "client" | "freelancer" | "admin" }) {
  const mobileLinksByRole: Record<"client" | "freelancer" | "admin", Array<{ href: string; label: string; primary?: boolean }>> = {
    client: [
      { href: "/projects", label: "Projects" },
      { href: "/client/projects/new", label: "Post Project", primary: true },
      { href: "/client/profile", label: "Profile" },
    ],
    freelancer: [
      { href: "/projects", label: "Projects" },
      { href: "/freelancer", label: "Dashboard", primary: true },
      { href: "/freelancer/profile", label: "Profile" },
    ],
    admin: [
      { href: "/admin", label: "Admin", primary: true },
      { href: "/projects", label: "Projects" },
      { href: "/auth", label: "Account" },
    ],
  };

  const links = mobileLinksByRole[role];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-200/60 bg-white/90 px-4 py-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between text-xs">
        {links.map((link) => (
          <Link
            key={`${role}-${link.href}`}
            href={link.href}
            className={link.primary ? "rounded-lg bg-brand-600 px-3 py-2 font-semibold text-white shadow-sm" : "rounded-lg px-3 py-2 text-surface-600 hover:bg-surface-100"}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
