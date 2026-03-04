"use client";

import { PropsWithChildren, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/endpoints";
import { isAdmin } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function AdminGuard({ children }: PropsWithChildren) {
  const router = useRouter();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: authApi.me, retry: false });

  useEffect(() => {
    if (meQuery.isError) {
      router.replace("/auth");
      return;
    }
    if (meQuery.data && !isAdmin(meQuery.data)) {
      router.replace("/");
    }
  }, [meQuery.data, meQuery.isError, router]);

  if (meQuery.isPending) {
    return <p className="text-sm text-slate-600">Checking permissions...</p>;
  }

  if (!meQuery.data || !isAdmin(meQuery.data)) {
    return null;
  }

  return <>{children}</>;
}
