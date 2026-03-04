"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { ActionButton } from "@/components/ui-kit";
import { authApi } from "@/lib/api/endpoints";
import { useToastStore } from "@/lib/toast-store";
import { loginSchema } from "@/lib/validators";

import type { z } from "zod";

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const queryClient = useQueryClient();
  const toast = useToastStore((s) => s.push);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginForm) => authApi.login(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast("success", "Logged in");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center px-2">
      <div className="w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_24px_-12px_rgba(15,23,42,0.35)] sm:p-8">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8 text-blue-600">
            <path d="M12 3 5 6v6c0 4.5 3 7 7 9 4-2 7-4.5 7-9V6l-7-3Z" />
            <path d="m9.5 12 1.8 1.8 3.2-3.6" />
          </svg>
        </div>

        <h1 className="text-center text-4xl font-bold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-2 text-center text-sm text-slate-600">Login to your ITZuun account to manage your projects</p>

        <form className="mt-7 space-y-4" onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))}>
          <label className="block text-sm font-semibold text-slate-800">
            Email
            <input className="mt-2" type="email" placeholder="name@example.com" {...loginForm.register("email")} />
          </label>
          {loginForm.formState.errors.email ? <p className="-mt-2 text-xs text-red-700">{loginForm.formState.errors.email.message}</p> : null}

          <label className="block text-sm font-semibold text-slate-800">
            <span className="flex items-center justify-between">
              <span>Password</span>
              <Link href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Forgot password?
              </Link>
            </span>
            <input className="mt-2" type="password" {...loginForm.register("password")} />
          </label>
          {loginForm.formState.errors.password ? <p className="-mt-2 text-xs text-red-700">{loginForm.formState.errors.password.message}</p> : null}

          <ActionButton className="w-full py-3 text-base font-semibold" type="submit" loading={loginMutation.isPending}>
            Sign In
          </ActionButton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="font-semibold text-blue-700 hover:text-blue-800">
            Register now
          </Link>
        </p>
      </div>
    </section>
  );
}
