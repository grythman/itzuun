"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

import type { UserRole } from "@/lib/types";

interface RoleGuardProps {
  currentRole?: string;
  requiredRole: UserRole;
  fallbackPath?: string;
  children: ReactNode;
}

export function RoleGuard({
  currentRole,
  requiredRole,
  fallbackPath = "/auth",
  children,
}: RoleGuardProps) {
  const router = useRouter();
  const isAllowed = currentRole === requiredRole;

  useEffect(() => {
    if (!isAllowed) {
      router.replace(fallbackPath);
    }
  }, [fallbackPath, isAllowed, router]);

  if (!isAllowed) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-900">
        <p className="font-semibold">Role mismatch илэрлээ</p>
        <p className="mt-1">
          Одоогийн эрх: <strong>{currentRole || "unknown"}</strong> · Шаардлагатай эрх: <strong>{requiredRole}</strong>
        </p>
        <p className="mt-1">Зөв самбар руу шилжүүлж байна...</p>
      </div>
    );
  }

  return <>{children}</>;
}
