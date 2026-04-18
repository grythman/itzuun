"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { RoleGuard } from "@/components/shared/role-guard";
import { useMe } from "@/lib/hooks";

export default function FreelancerSettingsPage() {
  const pathname = usePathname();
  const parts = (pathname || "").split("/").filter(Boolean);
  const locale = parts[0] === "mn" || parts[0] === "en" ? parts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;
  const me = useMe();

  return (
    <RoleGuard currentRole={me.data?.role} requiredRole="freelancer" fallbackPath={withLocale("/auth")}>
      <section className="space-y-6 pb-12">
        <div className="ui-surface ui-card-pad">
          <p className="ui-eyebrow">Фрилансер</p>
          <h1 className="mt-2 font-headline text-3xl font-black text-primary">Тохиргоо</h1>
          <p className="mt-2 text-[13px] text-on-surface/60">
            Данс, мэдэгдэл, ажлын урсгалын тохиргоогоо удирдана.
          </p>
        </div>
        <div className="ui-surface ui-card-pad">
          <p className="text-[13px] text-on-surface/70">Одоогоор профайл тохиргоо идэвхтэй байна.</p>
          <Link href={withLocale("/freelancer/profile")} className="ui-btn-primary mt-4">
            Профайл тохируулах
          </Link>
        </div>
      </section>
    </RoleGuard>
  );
}
