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
    return <p className="rounded-md border border-slate-200 bg-white p-4 text-sm">Redirecting...</p>;
  }

  return <>{children}</>;
}
