"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { ActionButton, StatusPill } from "@/components/ui-kit";
import { ErrorState, LoadingState } from "@/components/states";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/endpoints";
import { useToastStore } from "@/lib/toast-store";
import { loginSchema, otpRequestSchema, otpVerifySchema, registerSchema } from "@/lib/validators";

import type { z } from "zod";

type OtpRequestForm = z.infer<typeof otpRequestSchema>;
type OtpVerifyForm = z.infer<typeof otpVerifySchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type LoginForm = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const toast = useToastStore((s) => s.push);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
    retry: false,
  });

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
      await meQuery.refetch();
      toast("success", "Account created and logged in");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginForm) => authApi.login(values),
    onSuccess: async () => {
      await meQuery.refetch();
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
      toast("success", "OTP token requested.");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ email, otp, otp_token }: OtpVerifyForm) => authApi.verifyOtp(email, otp, otp_token),
    onSuccess: async () => {
      await meQuery.refetch();
      toast("success", "OTP verified. Session started.");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: async () => {
      await meQuery.refetch();
      toast("info", "Logged out");
    },
  });

  const roleMutation = useMutation({
    mutationFn: authApi.updateRole,
    onSuccess: async () => {
      await meQuery.refetch();
      toast("success", "Role updated");
    },
  });

  const meError = meQuery.error as ApiError | null;
  const hasNonAuthSessionError = Boolean(meError && meError.status !== 401);

  return (
    <section className="relative mx-auto max-w-6xl space-y-8 overflow-hidden rounded-3xl bg-slate-100/40 p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 -top-20 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-indigo-200/20 blur-3xl" />
        <svg className="h-full w-full" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g opacity="0.16" stroke="#1E3A8A" strokeWidth="1.2">
            <path d="M80 120L220 170L330 110L470 180L620 130L740 190" />
            <path d="M60 250L170 290L290 245L420 300L560 260L700 320" />
            <path d="M100 390L240 430L360 385L500 445L640 400L760 460" />
            <circle cx="80" cy="120" r="5" fill="#1E3A8A" />
            <circle cx="330" cy="110" r="5" fill="#1E3A8A" />
            <circle cx="620" cy="130" r="5" fill="#1E3A8A" />
            <circle cx="170" cy="290" r="5" fill="#1E3A8A" />
            <circle cx="420" cy="300" r="5" fill="#1E3A8A" />
            <circle cx="700" cy="320" r="5" fill="#1E3A8A" />
            <circle cx="240" cy="430" r="5" fill="#1E3A8A" />
            <circle cx="500" cy="445" r="5" fill="#1E3A8A" />
            <circle cx="760" cy="460" r="5" fill="#1E3A8A" />
          </g>
        </svg>
      </div>

      <div className="relative">
      <div className="space-y-2 text-center">
        <p className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">Secure Access</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Sign in to ITZuun</h1>
        <p className="text-sm text-slate-600">Manage projects, proposals, and escrow with a secure account session.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7 text-blue-600">
              <path d="M12 3 5 6v6c0 4.5 3 7 7 9 4-2 7-4.5 7-9V6l-7-3Z" />
              <path d="m9.5 12 1.8 1.8 3.2-3.6" />
            </svg>
          </div>
          <h2 className="text-center text-4xl font-bold tracking-tight text-slate-900">Welcome back</h2>
          <p className="mt-2 text-center text-sm text-slate-600">Login to your ITZuun account to continue your work.</p>

          <form className="mt-6 space-y-4" onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))}>
            <label className="block text-sm font-medium text-slate-800">
              Email
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <path d="M4 7h16v10H4z" />
                    <path d="m4 8 8 6 8-6" />
                  </svg>
                </span>
                <input className="pl-10" type="email" placeholder="name@example.com" {...loginForm.register("email")} />
              </div>
            </label>
            <label className="block text-sm font-medium text-slate-800">
              Password
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                  </svg>
                </span>
                <input className="pl-10" type="password" placeholder="••••••••" {...loginForm.register("password")} />
              </div>
            </label>
            <ActionButton className="w-full py-3 text-base font-semibold" type="submit" loading={loginMutation.isPending}>Sign In</ActionButton>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Don&apos;t have an account? <span className="font-semibold text-blue-700">Register below</span>
          </p>
        </div>

        <form
          className="space-y-4 rounded-3xl border border-slate-100 bg-white p-7 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)]"
          onSubmit={registerForm.handleSubmit((values) => registerMutation.mutate(values))}
        >
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">Create Account</h2>
            <p className="mt-1 text-sm text-slate-600">Create a client or freelancer account.</p>
          </div>
          <label className="block text-sm font-medium">
            Email
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <path d="M4 7h16v10H4z" />
                  <path d="m4 8 8 6 8-6" />
                </svg>
              </span>
              <input className="pl-10" type="email" placeholder="name@example.com" {...registerForm.register("email")} />
            </div>
          </label>
          <label className="block text-sm font-medium">
            Password
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                </svg>
              </span>
              <input className="pl-10" type="password" placeholder="At least 8 characters" {...registerForm.register("password")} />
            </div>
          </label>
          <label className="block text-sm font-medium">
            Role
            <select className="mt-1" {...registerForm.register("role")}>
              <option value="client">Client</option>
              <option value="freelancer">Freelancer</option>
            </select>
          </label>
          <ActionButton className="w-full py-3 text-base font-semibold" type="submit" loading={registerMutation.isPending}>Join ITZuun</ActionButton>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
            Password login is the primary method. OTP flow remains available below.
          </div>
        </form>
      </div>

      {meQuery.isLoading ? <LoadingState label="Checking current session..." /> : null}
      {hasNonAuthSessionError ? <ErrorState label="Unable to load current user." /> : null}

      {meQuery.data ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-emerald-900">Signed in as: {meQuery.data.email}</p>
              <p className="text-emerald-800">Role: {meQuery.data.role}</p>
            </div>
            <StatusPill label="Active Session" tone="success" />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton
              onClick={() => roleMutation.mutate("client")}
              disabled={roleMutation.isPending || meQuery.data.role === "client"}
              loading={roleMutation.isPending}
            >
              Set Client
            </ActionButton>
            <ActionButton
              onClick={() => roleMutation.mutate("freelancer")}
              disabled={roleMutation.isPending || meQuery.data.role === "freelancer"}
              loading={roleMutation.isPending}
            >
              Set Freelancer
            </ActionButton>
            <ActionButton
              tone="danger"
              onClick={() => logoutMutation.mutate()}
              loading={logoutMutation.isPending}
            >
              Logout
            </ActionButton>
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900">Alternative Sign-in: OTP</h3>
          <p className="text-sm text-slate-600">Use one-time password flow if you prefer email verification.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
        <form
          className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.35)]"
          onSubmit={requestForm.handleSubmit((values) => requestMutation.mutate(values))}
        >
          <div>
            <h2 className="text-lg font-medium">1) Request OTP</h2>
            <p className="mt-1 text-sm text-slate-600">Enter your email to receive an OTP token for verification.</p>
          </div>

          <label className="block text-sm font-medium">
            Email Address
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <path d="M4 7h16v10H4z" />
                  <path d="m4 8 8 6 8-6" />
                </svg>
              </span>
              <input className="pl-10" type="email" {...requestForm.register("email")} aria-label="Request OTP email" />
            </div>
          </label>
          {requestForm.formState.errors.email ? (
            <p className="text-xs text-red-700">{requestForm.formState.errors.email.message}</p>
          ) : null}

          <ActionButton className="w-full" type="submit" loading={requestMutation.isPending}>Request OTP</ActionButton>
        </form>

        <form
          className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.35)]"
          onSubmit={verifyForm.handleSubmit((values) => verifyMutation.mutate(values))}
        >
          <div>
            <h2 className="text-lg font-medium">2) Verify OTP</h2>
            <p className="mt-1 text-sm text-slate-600">Use the same email plus OTP token and OTP code to sign in.</p>
          </div>

          <label className="block text-sm font-medium">
            Email Address
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <path d="M4 7h16v10H4z" />
                  <path d="m4 8 8 6 8-6" />
                </svg>
              </span>
              <input className="pl-10" type="email" {...verifyForm.register("email")} aria-label="Verify OTP email" />
            </div>
          </label>
          {verifyForm.formState.errors.email ? (
            <p className="text-xs text-red-700">{verifyForm.formState.errors.email.message}</p>
          ) : null}

          <label className="block text-sm font-medium">
            OTP Token
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <path d="M12 3v3" />
                  <rect x="5" y="8" width="14" height="13" rx="2" />
                  <path d="M9 13h6" />
                </svg>
              </span>
              <input className="pl-10" {...verifyForm.register("otp_token")} aria-label="OTP token" />
            </div>
          </label>
          {verifyForm.formState.errors.otp_token ? (
            <p className="text-xs text-red-700">{verifyForm.formState.errors.otp_token.message}</p>
          ) : null}

          <label className="block text-sm font-medium">
            OTP
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <path d="M9 12h6" />
                  <path d="M12 9v6" />
                  <rect x="4" y="4" width="16" height="16" rx="3" />
                </svg>
              </span>
              <input className="pl-10" {...verifyForm.register("otp")} aria-label="OTP code" />
            </div>
          </label>
          {verifyForm.formState.errors.otp ? (
            <p className="text-xs text-red-700">{verifyForm.formState.errors.otp.message}</p>
          ) : null}

          <ActionButton className="w-full" type="submit" loading={verifyMutation.isPending}>Verify OTP</ActionButton>
        </form>
        </div>
      </div>
      </div>
    </section>
  );
}
