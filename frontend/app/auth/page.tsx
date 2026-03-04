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
      <h1 className="text-2xl font-semibold">Auth & Session</h1>

      {meQuery.isLoading ? <LoadingState label="Checking current session..." /> : null}
      {meQuery.isError ? <ErrorState label="Unable to load current user." /> : null}

      {meQuery.data ? (
        <div className="rounded-md border border-slate-200 bg-white p-4 text-sm">
          <p className="font-medium">Signed in as: {meQuery.data.email}</p>
          <p className="text-slate-600">Role: {meQuery.data.role}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="bg-slate-900 text-white" onClick={() => roleMutation.mutate("client")}>Set Client</button>
            <button className="bg-slate-900 text-white" onClick={() => roleMutation.mutate("freelancer")}>Set Freelancer</button>
            <button className="bg-red-600 text-white" onClick={() => logoutMutation.mutate()}>Logout</button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <form
          className="space-y-3 rounded-md border border-slate-200 bg-white p-4"
          onSubmit={requestForm.handleSubmit((values) => requestMutation.mutate(values))}
        >
          <h2 className="text-lg font-medium">Request OTP</h2>
          <label className="block text-sm">
            Email
            <input type="email" {...requestForm.register("email")} aria-label="Request OTP email" />
          </label>
          {requestForm.formState.errors.email ? (
            <p className="text-xs text-red-700">{requestForm.formState.errors.email.message}</p>
          ) : null}
          <button className="bg-slate-900 text-white" type="submit" disabled={requestMutation.isPending}>
            {requestMutation.isPending ? "Requesting..." : "Request OTP"}
          </button>
        </form>

        <form
          className="space-y-3 rounded-md border border-slate-200 bg-white p-4"
          onSubmit={verifyForm.handleSubmit((values) => verifyMutation.mutate(values))}
        >
          <h2 className="text-lg font-medium">Verify OTP</h2>
          <label className="block text-sm">
            Email
            <input type="email" {...verifyForm.register("email")} aria-label="Verify OTP email" />
          </label>
          <label className="block text-sm">
            OTP Token
            <input {...verifyForm.register("otp_token")} aria-label="OTP token" />
          </label>
          <label className="block text-sm">
            OTP
            <input {...verifyForm.register("otp")} aria-label="OTP code" />
          </label>
          <button className="bg-slate-900 text-white" type="submit" disabled={verifyMutation.isPending}>
            {verifyMutation.isPending ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </section>
  );
}
