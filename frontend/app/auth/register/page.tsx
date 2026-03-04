"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { ActionButton } from "@/components/ui-kit";
import { authApi } from "@/lib/api/endpoints";
import { useToastStore } from "@/lib/toast-store";
import { registerSchema } from "@/lib/validators";

import type { z } from "zod";

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const queryClient = useQueryClient();
  const toast = useToastStore((s) => s.push);

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", role: "client" },
  });

  const registerMutation = useMutation({
    mutationFn: (values: RegisterForm) => authApi.register(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast("success", "Account created and logged in");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center px-2">
      <div className="w-full max-w-[460px] rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_24px_-12px_rgba(15,23,42,0.35)] sm:p-8">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8 text-blue-600">
            <path d="M12 3 5 6v6c0 4.5 3 7 7 9 4-2 7-4.5 7-9V6l-7-3Z" />
            <path d="m9.5 12 1.8 1.8 3.2-3.6" />
          </svg>
        </div>

        <h1 className="text-center text-4xl font-bold tracking-tight text-slate-900">Create account</h1>
        <p className="mt-2 text-center text-sm text-slate-600">Join ITZuun as a client or freelancer</p>

        <form className="mt-7 space-y-4" onSubmit={registerForm.handleSubmit((values) => registerMutation.mutate(values))}>
          <label className="block text-sm font-semibold text-slate-800">
            Email
            <input className="mt-2" type="email" placeholder="name@example.com" {...registerForm.register("email")} />
          </label>
          {registerForm.formState.errors.email ? <p className="-mt-2 text-xs text-red-700">{registerForm.formState.errors.email.message}</p> : null}

          <label className="block text-sm font-semibold text-slate-800">
            Password
            <input className="mt-2" type="password" placeholder="At least 8 characters" {...registerForm.register("password")} />
          </label>
          {registerForm.formState.errors.password ? <p className="-mt-2 text-xs text-red-700">{registerForm.formState.errors.password.message}</p> : null}

          <label className="block text-sm font-semibold text-slate-800">
            Role
            <select className="mt-2" {...registerForm.register("role")}>
              <option value="client">Client</option>
              <option value="freelancer">Freelancer</option>
            </select>
          </label>
          {registerForm.formState.errors.role ? <p className="-mt-2 text-xs text-red-700">{registerForm.formState.errors.role.message}</p> : null}

          <ActionButton className="w-full py-3 text-base font-semibold" type="submit" loading={registerMutation.isPending}>
            Join ITZuun
          </ActionButton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-blue-700 hover:text-blue-800">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
