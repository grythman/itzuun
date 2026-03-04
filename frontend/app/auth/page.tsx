"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { ErrorState, LoadingState } from "@/components/states";
import { authApi } from "@/lib/api/endpoints";
import { useToastStore } from "@/lib/toast-store";
import { otpRequestSchema, otpVerifySchema } from "@/lib/validators";

import type { z } from "zod";

type OtpRequestForm = z.infer<typeof otpRequestSchema>;
type OtpVerifyForm = z.infer<typeof otpVerifySchema>;

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
    <section className="space-y-6">
      <div className="rounded-md border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-semibold">Auth & Session</h1>
        <p className="mt-2 text-sm text-slate-600">
          Login flow: request OTP with your email, then verify the OTP token and code to start a secure session.
        </p>
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
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-900">Active Session</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="bg-slate-900 text-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => roleMutation.mutate("client")}
              disabled={roleMutation.isPending || meQuery.data.role === "client"}
            >
              Set Client
            </button>
            <button
              className="bg-slate-900 text-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => roleMutation.mutate("freelancer")}
              disabled={roleMutation.isPending || meQuery.data.role === "freelancer"}
            >
              Set Freelancer
            </button>
            <button
              className="bg-red-600 text-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <form
          className="space-y-4 rounded-md border border-slate-200 bg-white p-5"
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

          <button
            className="w-full bg-slate-900 text-white disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={requestMutation.isPending}
          >
            {requestMutation.isPending ? "Requesting..." : "Request OTP"}
          </button>
        </form>

        <form
          className="space-y-4 rounded-md border border-slate-200 bg-white p-5"
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

          <button
            className="w-full bg-slate-900 text-white disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={verifyMutation.isPending}
          >
            {verifyMutation.isPending ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </section>
  );
}
