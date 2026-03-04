"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/projects", label: "Browse Projects" },
  { href: "/freelancer", label: "Find Freelancers" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3" aria-label="Main">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white">IZ</span>
            <span className="text-3 font-semibold text-slate-900">ITZuun</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    active ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/auth" className="rounded-xl px-3 py-2 text-sm text-slate-800 hover:bg-slate-100">
            Login
          </Link>
          <Link href="/auth" className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            Join ITZuun
          </Link>
          <Link href="/projects/new" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-300">
            Post Project
          </Link>
        </div>
      </nav>
    </header>
  );
}
