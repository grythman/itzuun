"use client";
export const dynamic = "force-dynamic";

import Script from "next/script";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useRef } from "react";

import { ActionButton } from "@/components/ui-kit";
import { authApi } from "@/lib/api/endpoints";
import { useMe } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";
import { loginSchema, otpRequestSchema, otpVerifySchema, registerSchema } from "@/lib/validators";

import type { z } from "zod";

type AuthTab = "signin" | "register";
type OtpRequestForm = z.infer<typeof otpRequestSchema>;
type OtpVerifyForm = z.infer<typeof otpVerifySchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type LoginForm = z.infer<typeof loginSchema>;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              shape?: "rectangular" | "pill" | "circle" | "square";
              text?: string;
              width?: number;
            },
          ) => void;
        };
      };
    };
  }
}

function roleDashboard(role?: string) {
  if (role === "admin") return "/admin";
  if (role === "freelancer") return "/freelancer";
  return "/client";
}

function AuthCard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const me = useMe();
  const initialTab = useMemo<AuthTab>(() => (searchParams.get("tab") === "register" ? "register" : "signin"), [searchParams]);

  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [showPasswordless, setShowPasswordless] = useState(false);
  const [googleScriptReady, setGoogleScriptReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const queryClient = useQueryClient();
  const toast = useToastStore((s) => s.push);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (me.data) router.replace(roleDashboard(me.data.role));
  }, [me.data, router]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!googleClientId) return;
    if (window.google) {
      setGoogleScriptReady(true);
      return;
    }

    const intervalId = window.setInterval(() => {
      if (window.google) {
        setGoogleScriptReady(true);
        window.clearInterval(intervalId);
      }
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [googleClientId]);

  const requestForm = useForm<OtpRequestForm>({
    resolver: zodResolver(otpRequestSchema),
    defaultValues: { email: "" },
  });

  const verifyForm = useForm<OtpVerifyForm>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { email: "", code: "" },
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
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast("success", "Account created and logged in");
      router.push(roleDashboard(data?.role));
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginForm) => authApi.login(values),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast("success", "Logged in");
      router.push(roleDashboard(data?.role));
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const googleMutation = useMutation({
    mutationFn: (payload: { credential: string; role?: "client" | "freelancer" }) => authApi.google(payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast("success", "Google login амжилттай");
      router.push(roleDashboard(data?.role));
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const requestMutation = useMutation({
    mutationFn: ({ email }: OtpRequestForm) => authApi.requestOtp(email),
    onSuccess: (data, vars) => {
      if (data.otp_token) {
        verifyForm.setValue("otp_token", data.otp_token);
      }
      if (data.dev_otp) {
        verifyForm.setValue("otp", data.dev_otp);
      }
      verifyForm.setValue("email", vars.email);
      toast("success", data.dev_otp ? `OTP ready for dev: ${data.dev_otp}` : "OTP token requested");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ email, otp, otp_token }: OtpVerifyForm) => authApi.verifyOtp(email, otp, otp_token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast("success", "OTP verified. Session started");
      const user = await queryClient.fetchQuery({ queryKey: ["me", true], queryFn: () => authApi.me(true) });
      router.push(roleDashboard(user.role));
    },
    onError: (error: Error) => toast("error", error.message),
  });

  useEffect(() => {
    if (!googleClientId || !googleScriptReady || !googleButtonRef.current || !window.google) {
      return;
    }

    const buttonContainer = googleButtonRef.current;
    buttonContainer.innerHTML = "";

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: ({ credential }) => {
        if (!credential) {
          toast("error", "Google credential олдсонгүй");
          return;
        }
        googleMutation.mutate({
          credential,
          role: activeTab === "register" ? registerForm.getValues("role") : undefined,
        });
      },
    });

    window.google.accounts.id.renderButton(buttonContainer, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: activeTab === "register" ? "signup_with" : "signin_with",
      width: 380,
    });
  }, [activeTab, googleClientId, googleMutation, googleScriptReady, registerForm, toast]);

  return (
    <section className="mx-auto flex min-h-[80vh] w-full max-w-6xl items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px] rounded-2xl border border-surface-200/60 bg-white p-6 shadow-hero sm:p-8">
        <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-brand-600">Secure Access</p>
        <h1 className="mt-3 text-center text-2xl font-semibold tracking-tight text-surface-900">Welcome to ITZuun</h1>
        <p className="mt-1.5 text-center text-[13px] text-surface-500">Manage projects, proposals, and escrow in one secure account.</p>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-surface-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("signin")}
            className={activeTab === "signin" ? "bg-white text-surface-900 shadow-sm font-medium" : "text-surface-500 hover:text-surface-700"}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            className={activeTab === "register" ? "bg-white text-surface-900 shadow-sm font-medium" : "text-surface-500 hover:text-surface-700"}
          >
            Register
          </button>
        </div>

        {googleClientId ? (
          <div className="mt-5 space-y-3">
            <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-surface-400">Passwordless with Google</p>
            <div className="flex justify-center">
              <div ref={googleButtonRef} className="min-h-[44px]" />
            </div>
          </div>
        ) : null}

        {activeTab === "signin" ? (
          <form className="mt-6 space-y-4" onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))}>
            <label className="block text-[13px] font-medium text-surface-700">
              Email
              <input className="mt-1.5" type="email" placeholder="name@example.com" {...loginForm.register("email")} />
            </label>
            {loginForm.formState.errors.email ? <p className="-mt-2 text-[11px] text-red-600">{loginForm.formState.errors.email.message}</p> : null}

            <label className="block text-[13px] font-medium text-surface-700">
              Password
              <input className="mt-1.5" type="password" placeholder="••••••••" {...loginForm.register("password")} />
            </label>
            {loginForm.formState.errors.password ? <p className="-mt-2 text-[11px] text-red-600">{loginForm.formState.errors.password.message}</p> : null}

            <ActionButton className="w-full py-2.5 text-sm font-semibold" type="submit" loading={loginMutation.isPending}>
              Sign In
            </ActionButton>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={registerForm.handleSubmit((values) => registerMutation.mutate(values))}>
            <label className="block text-[13px] font-medium text-surface-700">
              Email
              <input className="mt-1.5" type="email" placeholder="name@example.com" {...registerForm.register("email")} />
            </label>
            {registerForm.formState.errors.email ? <p className="-mt-2 text-[11px] text-red-600">{registerForm.formState.errors.email.message}</p> : null}

            <label className="block text-[13px] font-medium text-surface-700">
              Password
              <input className="mt-1.5" type="password" placeholder="At least 8 characters" {...registerForm.register("password")} />
            </label>
            {registerForm.formState.errors.password ? <p className="-mt-2 text-[11px] text-red-600">{registerForm.formState.errors.password.message}</p> : null}

            <label className="block text-[13px] font-medium text-surface-700">
              Role
              <select className="mt-1.5" {...registerForm.register("role")}>
                <option value="client">Client</option>
                <option value="freelancer">Freelancer</option>
              </select>
            </label>

            <ActionButton className="w-full py-2.5 text-sm font-semibold" type="submit" loading={registerMutation.isPending}>
              Create Account
            </ActionButton>
          </form>
        )}

        <button
          type="button"
          onClick={() => setShowPasswordless((prev) => !prev)}
          className="mt-5 w-full text-center text-[13px] font-medium text-brand-600 hover:text-brand-700"
        >
          Use email OTP instead
        </button>

        {showPasswordless ? (
          <div className="mt-4 space-y-4 rounded-xl border border-surface-200/60 bg-surface-50 p-4">
            <form className="space-y-3" onSubmit={requestForm.handleSubmit((values) => requestMutation.mutate(values))}>
              <p className="text-[13px] font-semibold text-surface-800">1) Request OTP</p>
              <label className="block text-[13px] font-medium text-surface-600">
                Email
                <input className="mt-1" type="email" {...requestForm.register("email")} />
              </label>
              {requestForm.formState.errors.email ? <p className="text-[11px] text-red-600">{requestForm.formState.errors.email.message}</p> : null}
              <ActionButton className="w-full" type="submit" loading={requestMutation.isPending}>Request OTP</ActionButton>
            </form>

            <form className="space-y-3" onSubmit={verifyForm.handleSubmit((values) => verifyMutation.mutate(values))}>
              <p className="text-[13px] font-semibold text-surface-800">2) Verify OTP</p>
              <label className="block text-[13px] font-medium text-surface-600">
                Email
                <input className="mt-1" type="email" {...verifyForm.register("email")} />
              </label>
              <label className="block text-[13px] font-medium text-surface-600">
                OTP Token
                <input className="mt-1" {...verifyForm.register("otp_token")} />
              </label>
              <label className="block text-[13px] font-medium text-surface-600">
                OTP
                <input className="mt-1" {...verifyForm.register("otp")} />
              </label>
              {(verifyForm.formState.errors.email || verifyForm.formState.errors.otp_token || verifyForm.formState.errors.otp) ? (
                <p className="text-[11px] text-red-600">
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
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <Suspense
        fallback={
          <section className="mx-auto flex min-h-[80vh] w-full max-w-6xl items-center justify-center px-4 py-12">
            <div className="w-full max-w-[440px] rounded-2xl border border-surface-200/60 bg-white p-8 shadow-hero">
              <p className="text-center text-[13px] text-surface-500">Loading authentication...</p>
            </div>
          </section>
        }
      >
        <AuthCard />
      </Suspense>
    </>
  );
}
