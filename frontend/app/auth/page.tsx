"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { ActionButton, StatusPill } from "@/components/ui-kit";
import { ErrorState, LoadingState } from "@/components/states";
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

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7 text-blue-600">
              <path d="M12 3 5 6v6c0 4.5 3 7 7 9 4-2 7-4.5 7-9V6l-7-3Z" />
              <path d="m9.5 12 1.8 1.8 3.2-3.6" />
            </svg>
          </div>
          <h1 className="text-center text-3xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-2 text-center text-sm text-slate-600">Login to your ITZuun account to manage your projects.</p>

          <form className="mt-6 space-y-4" onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))}>
            <label className="block text-sm font-medium text-slate-800">
              Email
              <input type="email" placeholder="name@example.com" {...loginForm.register("email")} />
            </label>
            <label className="block text-sm font-medium text-slate-800">
              Password
              <input type="password" placeholder="••••••••" {...loginForm.register("password")} />
            </label>
            <ActionButton className="w-full" type="submit" loading={loginMutation.isPending}>Sign In</ActionButton>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Don&apos;t have an account? <span className="font-semibold text-blue-700">Register below</span>
          </p>
        </div>

        <form
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={registerForm.handleSubmit((values) => registerMutation.mutate(values))}
        >
          <div>
            <h2 className="text-lg font-medium">Create Account</h2>
            <p className="mt-1 text-sm text-slate-600">Create a client or freelancer account.</p>
          </div>
          <label className="block text-sm font-medium">
            Email
            <input type="email" {...registerForm.register("email")} />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input type="password" {...registerForm.register("password")} />
          </label>
          <label className="block text-sm font-medium">
            Role
            <select {...registerForm.register("role")}>
              <option value="client">Client</option>
              <option value="freelancer">Freelancer</option>
            </select>
          </label>
          <ActionButton className="w-full" type="submit" loading={registerMutation.isPending}>Register</ActionButton>

          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            Password login is the primary method. OTP flow remains available below.
          </div>
        </form>
      </div>

      {meQuery.isLoading ? <LoadingState label="Checking current session..." /> : null}
      {meQuery.isError ? <ErrorState label="Unable to load current user." /> : null}

      {meQuery.data ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm">
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

      <div className="grid gap-6 md:grid-cols-2">
        <form
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={requestForm.handleSubmit((values) => requestMutation.mutate(values))}
        >
          <div>
            <h2 className="text-lg font-medium">1) Request OTP</h2>
            <p className="mt-1 text-sm text-slate-600">Enter your email to receive an OTP token for verification.</p>
          </div>

          <label className="block text-sm font-medium">
            Email Address
            <input type="email" {...requestForm.register("email")} aria-label="Request OTP email" />
          </label>
          {requestForm.formState.errors.email ? (
            <p className="text-xs text-red-700">{requestForm.formState.errors.email.message}</p>
          ) : null}

          <ActionButton className="w-full" type="submit" loading={requestMutation.isPending}>Request OTP</ActionButton>
        </form>

        <form
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={verifyForm.handleSubmit((values) => verifyMutation.mutate(values))}
        >
          <div>
            <h2 className="text-lg font-medium">2) Verify OTP</h2>
            <p className="mt-1 text-sm text-slate-600">Use the same email plus OTP token and OTP code to sign in.</p>
          </div>

          <label className="block text-sm font-medium">
            Email Address
            <input type="email" {...verifyForm.register("email")} aria-label="Verify OTP email" />
          </label>
          {verifyForm.formState.errors.email ? (
            <p className="text-xs text-red-700">{verifyForm.formState.errors.email.message}</p>
          ) : null}

          <label className="block text-sm font-medium">
            OTP Token
            <input {...verifyForm.register("otp_token")} aria-label="OTP token" />
          </label>
          {verifyForm.formState.errors.otp_token ? (
            <p className="text-xs text-red-700">{verifyForm.formState.errors.otp_token.message}</p>
          ) : null}

          <label className="block text-sm font-medium">
            OTP
            <input {...verifyForm.register("otp")} aria-label="OTP code" />
          </label>
          {verifyForm.formState.errors.otp ? (
            <p className="text-xs text-red-700">{verifyForm.formState.errors.otp.message}</p>
          ) : null}

          <ActionButton className="w-full" type="submit" loading={verifyMutation.isPending}>Verify OTP</ActionButton>
        </form>
      </div>
    </section>
  );
}
