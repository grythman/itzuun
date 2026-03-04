"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/endpoints";
import { Card, SectionTitle } from "@/components/ui";
import { useToastStore } from "@/lib/toast-store";
import { useRouter } from "next/navigation";

const requestSchema = z.object({ email: z.string().email() });
const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().min(4),
  otp_token: z.string().optional(),
});

type RequestInput = z.infer<typeof requestSchema>;
type VerifyInput = z.infer<typeof verifySchema>;

export default function AuthPage() {
  const pushToast = useToastStore((state) => state.push);
  const router = useRouter();
  const queryClient = useQueryClient();

  const requestForm = useForm<RequestInput>({ resolver: zodResolver(requestSchema), defaultValues: { email: "" } });
  const verifyForm = useForm<VerifyInput>({
    resolver: zodResolver(verifySchema),
    defaultValues: { email: "", otp: "", otp_token: "" },
  });

  const requestMutation = useMutation({
    mutationFn: (input: RequestInput) => authApi.requestOtp(input.email),
    onSuccess: (data, variables) => {
      verifyForm.setValue("email", variables.email);
      if (data.otp_token) {
        verifyForm.setValue("otp_token", data.otp_token);
      }
      pushToast("success", data.message ?? "OTP sent");
    },
    onError: () => pushToast("error", "OTP request failed"),
  });

  const verifyMutation = useMutation({
    mutationFn: (input: VerifyInput) => authApi.verifyOtp(input.email, input.otp, input.otp_token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      pushToast("success", "Login successful");
      router.push("/");
    },
    onError: () => pushToast("error", "OTP verification failed"),
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <SectionTitle title="Request OTP" subtitle="Step 1" />
        <form className="space-y-3" onSubmit={requestForm.handleSubmit((values) => requestMutation.mutate(values))}>
          <label className="block text-sm">
            Email
            <input className="mt-1 w-full rounded border px-3 py-2" {...requestForm.register("email")} />
          </label>
          <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" disabled={requestMutation.isPending}>
            {requestMutation.isPending ? "Sending..." : "Request OTP"}
          </button>
        </form>
      </Card>

      <Card>
        <SectionTitle title="Verify OTP" subtitle="Step 2" />
        <form className="space-y-3" onSubmit={verifyForm.handleSubmit((values) => verifyMutation.mutate(values))}>
          <label className="block text-sm">
            Email
            <input className="mt-1 w-full rounded border px-3 py-2" {...verifyForm.register("email")} />
          </label>
          <label className="block text-sm">
            OTP
            <input className="mt-1 w-full rounded border px-3 py-2" {...verifyForm.register("otp")} />
          </label>
          <label className="block text-sm">
            OTP Token (optional)
            <input className="mt-1 w-full rounded border px-3 py-2" {...verifyForm.register("otp_token")} />
          </label>
          <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" disabled={verifyMutation.isPending}>
            {verifyMutation.isPending ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </Card>
    </div>
  );
}
