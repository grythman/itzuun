"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { ActionButton } from "@/components/ui-kit";
import { authApi } from "@/lib/api/endpoints";
import { useToastStore } from "@/lib/toast-store";
import { loginSchema, otpRequestSchema, otpVerifySchema, registerSchema } from "@/lib/validators";

import type { z } from "zod";

type AuthTab = "signin" | "register";
type OtpRequestForm = z.infer<typeof otpRequestSchema>;
type OtpVerifyForm = z.infer<typeof otpVerifySchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type LoginForm = z.infer<typeof loginSchema>;

function AuthCard() {
  const searchParams = useSearchParams();
  const initialTab = useMemo<AuthTab>(() => (searchParams.get("tab") === "register" ? "register" : "signin"), [searchParams]);

  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [showPasswordless, setShowPasswordless] = useState(false);

  const queryClient = useQueryClient();
  const toast = useToastStore((s) => s.push);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const requestForm = useForm<OtpRequestForm>({
    resolver: zodResolver(otpRequestSchema),
    defaultValues: { email: "" },
  });

  const verifyForm = useForm<OtpVerifyForm>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { email: "", otp: "", otp_token: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", role: "client" },
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerMutation = useMutation({
    mutationFn: (values: RegisterForm) => authApi.register(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast("success", "Account created and logged in");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginForm) => authApi.login(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast("success", "Logged in");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const requestMutation = useMutation({
    mutationFn: ({ email }: OtpRequestForm) => authApi.requestOtp(email),
    onSuccess: (data, vars) => {
      if (data.otp_token) {
        verifyForm.setValue("otp_token", data.otp_token);
      }
      verifyForm.setValue("email", vars.email);
      toast("success", "OTP token requested");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ email, otp, otp_token }: OtpVerifyForm) => authApi.verifyOtp(email, otp, otp_token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast("success", "OTP verified. Session started");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  return (
    <section className="mx-auto flex min-h-[80vh] w-full max-w-6xl items-center justify-center px-4 py-12">
      <div className="w-full max-w-[480px] rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_48px_-24px_rgba(15,23,42,0.45)] sm:p-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Secure Access</p>
        <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight text-slate-900">Welcome to ITZuun</h1>
        <p className="mt-2 text-center text-sm text-slate-600">Manage projects, proposals, and escrow in one secure account.</p>

        <div className="mt-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("signin")}
            className={activeTab === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-800"}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            className={activeTab === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-800"}
          >
            Register
          </button>
        </div>

        {activeTab === "signin" ? (
          <form className="mt-6 space-y-4" onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))}>
            <label className="block text-sm font-semibold text-slate-800">
              Email
              <input className="mt-2" type="email" placeholder="name@example.com" {...loginForm.register("email")} />
            </label>
            {loginForm.formState.errors.email ? <p className="-mt-2 text-xs text-red-700">{loginForm.formState.errors.email.message}</p> : null}

            <label className="block text-sm font-semibold text-slate-800">
              Password
              <input className="mt-2" type="password" placeholder="••••••••" {...loginForm.register("password")} />
            </label>
            {loginForm.formState.errors.password ? <p className="-mt-2 text-xs text-red-700">{loginForm.formState.errors.password.message}</p> : null}

            <ActionButton className="w-full py-3 text-base font-semibold" type="submit" loading={loginMutation.isPending}>
              Sign In
            </ActionButton>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={registerForm.handleSubmit((values) => registerMutation.mutate(values))}>
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

            <ActionButton className="w-full py-3 text-base font-semibold" type="submit" loading={registerMutation.isPending}>
              Create Account
            </ActionButton>
          </form>
        )}

        <button
          type="button"
          onClick={() => setShowPasswordless((prev) => !prev)}
          className="mt-5 w-full text-center text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          Passwordless login
        </button>

        {showPasswordless ? (
          <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <form className="space-y-3" onSubmit={requestForm.handleSubmit((values) => requestMutation.mutate(values))}>
              <p className="text-sm font-semibold text-slate-900">1) Request OTP</p>
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input className="mt-1" type="email" {...requestForm.register("email")} />
              </label>
              {requestForm.formState.errors.email ? <p className="text-xs text-red-700">{requestForm.formState.errors.email.message}</p> : null}
              <ActionButton className="w-full" type="submit" loading={requestMutation.isPending}>Request OTP</ActionButton>
            </form>

            <form className="space-y-3" onSubmit={verifyForm.handleSubmit((values) => verifyMutation.mutate(values))}>
              <p className="text-sm font-semibold text-slate-900">2) Verify OTP</p>
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input className="mt-1" type="email" {...verifyForm.register("email")} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                OTP Token
                <input className="mt-1" {...verifyForm.register("otp_token")} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                OTP
                <input className="mt-1" {...verifyForm.register("otp")} />
              </label>
              {(verifyForm.formState.errors.email || verifyForm.formState.errors.otp_token || verifyForm.formState.errors.otp) ? (
                <p className="text-xs text-red-700">
                  {verifyForm.formState.errors.email?.message || verifyForm.formState.errors.otp_token?.message || verifyForm.formState.errors.otp?.message}
                </p>
              ) : null}
              <ActionButton className="w-full" type="submit" loading={verifyMutation.isPending}>Verify OTP</ActionButton>
            </form>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto flex min-h-[80vh] w-full max-w-6xl items-center justify-center px-4 py-12">
          <div className="w-full max-w-[480px] rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_48px_-24px_rgba(15,23,42,0.45)]">
            <p className="text-center text-sm text-slate-600">Loading authentication...</p>
          </div>
        </section>
      }
    >
      <AuthCard />
    </Suspense>
  );
}
