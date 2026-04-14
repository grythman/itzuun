"use client";

import Link from "next/link";

export function RoleSidebar({ role }: { role: "client" | "freelancer" | "admin" }) {
  const linksByRole: Record<string, Array<{ href: string; label: string }>> = {
    client: [
      { href: "/client", label: "Client Dashboard" },
      { href: "/client/profile", label: "Company Profile" },
      { href: "/projects", label: "Browse Projects" },
      { href: "/projects/new", label: "Post Project" },
    ],
    freelancer: [
      { href: "/freelancer", label: "Freelancer Dashboard" },
      { href: "/freelancer/profile", label: "My Profile" },
      { href: "/projects", label: "Find Projects" },
      { href: "/pro", label: "Go PRO" },
    ],
    admin: [
      { href: "/admin", label: "Admin Control" },
      { href: "/projects", label: "All Projects" },
      { href: "/auth", label: "Account" },
    ],
  };

  return (
    <aside className="hidden w-56 shrink-0 rounded-2xl border border-[#d9e4ef] bg-gradient-to-b from-[#ffffff] to-[#f8fbff] p-4 shadow-card lg:block">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#587392]">{role} panel</p>
      <ul className="space-y-0.5">
        {linksByRole[role].map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="block rounded-lg px-3 py-2 text-[13px] font-medium text-[#3c5f84] hover:bg-[#edf5ff] hover:text-[#173a61] transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
