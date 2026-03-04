"use client";

import Link from "next/link";
import { PropsWithChildren } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/endpoints";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/lib/toast-store";

export default function AppShell({ children }: PropsWithChildren) {
  const router = useRouter();
  const pushToast = useToastStore((state) => state.push);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      pushToast("success", "Logged out");
      router.push("/auth");
      router.refresh();
    },
  });

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold">
            ITZuun MVP
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/">Projects</Link>
            <Link href="/projects/new">Create</Link>
            <Link href="/admin">Admin</Link>
            <Link href="/auth">Auth</Link>
            {meQuery.data ? (
              <button
                className="rounded border px-2 py-1"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                Logout ({meQuery.data.role})
              </button>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
