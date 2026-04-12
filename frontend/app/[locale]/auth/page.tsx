"use client";
export const dynamic = "force-dynamic";

import Script from "next/script";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { ActionButton, StatusPill } from "@/components/ui-kit";
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

type AuthStage = "idle" | "establishing" | "redirecting";

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

function defaultRoleDashboard(role?: string) {
  if (role === "admin") return "/admin";
  if (role === "freelancer") return "/freelancer";
  return "/client";
}

function onboardingFirstPath(user: any) {
  const role = user?.role;
  if (role === "freelancer") {
    if (user?.verification_status !== "verified") return "/freelancer/profile";
    return "/projects";
  }
  if (role === "client") {
    if (!user?.is_verified || user?.verification_status !== "verified") return "/client/profile";
    return "/projects/new";
  }
  return defaultRoleDashboard(role);
}

async function waitForAuthenticatedUser(
  queryClient: ReturnType<typeof useQueryClient>,
  fallbackUser?: any,
  retries = 8,
) {
  if (fallbackUser?.role) {
    queryClient.setQueryData(["auth", "me"], fallbackUser);
    return fallbackUser;
  }

  for (let i = 0; i < retries; i += 1) {
    const user = await authApi.me(true).catch(() => null);
    if (user?.role) {
      queryClient.setQueryData(["auth", "me"], user);
      return user;
    }
    await new Promise((resolve) => setTimeout(resolve, 200 + i * 150));
  }

  return null;
}

function AuthCard() {
  const t = useTranslations("Auth");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const me = useMe();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = useCallback((href: string) => `/${locale}${href}`, [locale]);
  const initialTab = useMemo<AuthTab>(() => (searchParams.get("tab") === "register" ? "register" : "signin"), [searchParams]);
  const expectedRole = searchParams.get("role");
  const nextPath = searchParams.get("next");

  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [showPasswordless, setShowPasswordless] = useState(false);
  const [googleScriptReady, setGoogleScriptReady] = useState(false);
  const [authStage, setAuthStage] = useState<AuthStage>("idle");
  const [authMessage, setAuthMessage] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const queryClient = useQueryClient();
  const toast = useToastStore((s) => s.push);

  const handleSuccessfulAuth = async (payload?: any) => {
    setAuthError("");
    setAuthStage("establishing");
    setAuthMessage("Амжилттай нэвтэрлээ. Session бэлдэж байна...");
    const user = await waitForAuthenticatedUser(queryClient, payload?.user ?? payload, 8);
    if (!user?.role) {
      setAuthStage("idle");
      setAuthError("Session баталгаажуулалт удааширлаа. Дахин оролдоно уу.");
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });

    if (expectedRole && user.role !== expectedRole) {
      setAuthStage("idle");
      setAuthError(`Та ${user.role} эрхтэй байна. ${expectedRole} эрх сонгохын тулд өөр акаунтаар нэвтэрнэ үү.`);
      return;
    }

    setAuthStage("redirecting");
    setAuthMessage("Амжилттай нэвтэрлээ. Таны самбар руу шилжиж байна...");

    const target = nextPath ? nextPath : onboardingFirstPath(user);
    router.push(withLocale(target.startsWith("/") ? target : `/${target}`));
  };

  useEffect(() => {
    if (me.data?.role && authStage === "idle") {
      const target = nextPath ? nextPath : defaultRoleDashboard(me.data.role);
      router.replace(withLocale(target.startsWith("/") ? target : `/${target}`));
    }
  }, [authStage, me.data, nextPath, router, withLocale]);

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
    defaultValues: { email: "", otp: "" },
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
      toast("success", "Бүртгэл амжилттай.");
      await handleSuccessfulAuth(data);
    },
    onError: (error: Error) => {
      const msg = error.message || "Бүртгэл амжилтгүй. Имэйлээ шалгаад дахин оролдоно уу.";
      setAuthError(msg);
      toast("error", msg);
    },
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginForm) => authApi.login(values),
    onSuccess: async (data) => {
      toast("success", "Нэвтрэлт амжилттай.");
      await handleSuccessfulAuth(data);
    },
    onError: (error: Error) => {
      const msg = error.message || "Нэвтрэхэд алдаа гарлаа. Нууц үг эсвэл имэйлээ шалгана уу.";
      setAuthError(msg);
      toast("error", msg);
    },
  });

  const googleMutation = useMutation({
    mutationFn: (payload: { credential: string; role?: "client" | "freelancer" }) => authApi.google(payload),
    onSuccess: async (data) => {
      toast("success", "Google нэвтрэлт амжилттай.");
      await handleSuccessfulAuth(data);
    },
    onError: (error: Error) => {
      const msg = error.message || "Google нэвтрэлт амжилтгүй. Дахин оролдоно уу.";
      setAuthError(msg);
      toast("error", msg);
    },
  });

  const requestMutation = useMutation({
    mutationFn: ({ email }: OtpRequestForm) => authApi.requestOtp(email),
    onSuccess: (data, vars) => {
      if (data.otp_token) verifyForm.setValue("otp_token", data.otp_token);
      if (data.dev_otp) verifyForm.setValue("otp", data.dev_otp);
      verifyForm.setValue("email", vars.email);
      toast("success", data.dev_otp ? `OTP ready for dev: ${data.dev_otp}` : "OTP код илгээгдлээ.");
    },
    onError: (error: Error) => {
      const msg = error.message || "OTP хүсэлт амжилтгүй. Имэйлээ шалгаад дахин оролдоно уу.";
      setAuthError(msg);
      toast("error", msg);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ email, otp, otp_token }: OtpVerifyForm) => authApi.verifyOtp(email, otp, otp_token),
    onSuccess: async (data) => {
      toast("success", "OTP баталгаажлаа.");
      await handleSuccessfulAuth(data);
    },
    onError: (error: Error) => {
      const msg = error.message || "OTP баталгаажуулалт амжилтгүй. Кодоо шалгаад дахин оролдоно уу.";
      setAuthError(msg);
      toast("error", msg);
    },
  });

  const logoutAndReset = async () => {
    await authApi.logout().catch(() => null);
    await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    setAuthError("");
    setAuthStage("idle");
    router.replace(withLocale("/auth?tab=register"));
  };

  useEffect(() => {
    if (!googleClientId || !googleScriptReady || !googleButtonRef.current || !window.google) return;

    const buttonContainer = googleButtonRef.current;
    buttonContainer.innerHTML = "";

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: ({ credential }) => {
        if (!credential) {
          const msg = "Google credential олдсонгүй";
          setAuthError(msg);
          toast("error", msg);
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

  if (authStage !== "idle") {
    return (
      <section className="mx-auto flex min-h-[80vh] w-full max-w-6xl items-center justify-center px-4 py-12">
        <div className="w-full max-w-[460px] rounded-3xl bg-white/90 p-6 shadow-hero sm:p-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">{t("badge")}</p>
          <h1 className="mt-3 text-center font-headline text-2xl font-extrabold tracking-tight text-surface-900">{authMessage}</h1>
          <p className="mt-2 text-center text-[13px] text-surface-600">Хэрэв удааширвал session шалгах товчийг дарна уу.</p>
          <div className="mt-5 flex justify-center">
            <ActionButton
              className="min-h-11 rounded-xl px-4 text-[13px] font-semibold"
              onClick={async () => {
                const user = await waitForAuthenticatedUser(queryClient, undefined, 4);
                if (!user?.role) {
                  setAuthError("Session хараахан бэлэн болоогүй байна. 2-3 сек хүлээгээд дахин оролдоно уу.");
                  setAuthStage("idle");
                  return;
                }
                router.push(withLocale(onboardingFirstPath(user)));
              }}
            >
              Session дахин шалгах
            </ActionButton>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-[80vh] w-full max-w-6xl items-center justify-center px-4 py-12">
      <div className="w-full max-w-[460px] rounded-3xl bg-white/90 p-6 shadow-hero sm:p-8">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">{t("badge")}</p>
        <h1 className="mt-3 text-center font-headline text-4xl font-extrabold tracking-tight text-surface-900">{t("title")}</h1>
        <p className="mt-1.5 text-center text-[13px] text-surface-600">{t("subtitle")}</p>

        <div className="mt-3 rounded-xl border border-surface-200/70 bg-surface-50 p-3 text-[12px] text-surface-700">
          <p className="font-semibold">Яагаад ITZuun?</p>
          <ul className="mt-1 space-y-1">
            <li>• Escrow хамгаалалттай төлбөр</li>
            <li>• Role-д таарсан самбар руу автоматаар чиглүүлнэ</li>
            <li>• Нэвтрэлтийн асуудал гарвал support руу шууд холбогдоно</li>
          </ul>
        </div>

        {expectedRole ? (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-[12px] text-amber-800">Сонгосон эрх: <strong>{expectedRole}</strong></p>
            <StatusPill label="Role check" tone="warning" />
          </div>
        ) : null}

        {authError ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] text-red-700">
            <p className="font-semibold">Алдаа</p>
            <p className="mt-1">{authError}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button className="min-h-11 rounded-lg bg-white px-3 text-[12px] font-semibold" onClick={() => setAuthError("")}>Ойлголоо</button>
              <a href={withLocale("/support")} className="inline-flex min-h-11 items-center rounded-lg bg-white px-3 text-[12px] font-semibold">Support</a>
              {expectedRole ? (
                <button className="min-h-11 rounded-lg bg-white px-3 text-[12px] font-semibold" onClick={logoutAndReset}>Role солих</button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 rounded-full bg-surface-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("signin")}
            className={activeTab === "signin" ? "rounded-full bg-white text-surface-900 shadow-card font-medium" : "text-surface-500 hover:text-surface-700"}
          >
            {t("signIn")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            className={activeTab === "register" ? "rounded-full bg-white text-surface-900 shadow-card font-medium" : "text-surface-500 hover:text-surface-700"}
          >
            {t("register")}
          </button>
        </div>

        {googleClientId ? (
          <div className="mt-5 space-y-3">
            <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-surface-400">{t("passwordlessGoogle")}</p>
            <div className="flex justify-center">
              <div ref={googleButtonRef} className="min-h-[44px]" />
            </div>
          </div>
        ) : null}

        {activeTab === "signin" ? (
          <form className="mt-6 space-y-4" onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))}>
            <label className="block text-[13px] font-medium text-surface-700">
              {t("email")}
              <input className="mt-1.5" type="email" placeholder="name@example.com" {...loginForm.register("email")} />
            </label>
            {loginForm.formState.errors.email ? <p className="-mt-2 text-[11px] text-red-600">{loginForm.formState.errors.email.message}</p> : null}

            <label className="block text-[13px] font-medium text-surface-700">
              {t("password")}
              <input className="mt-1.5" type="password" placeholder="••••••••" {...loginForm.register("password")} />
            </label>
            {loginForm.formState.errors.password ? <p className="-mt-2 text-[11px] text-red-600">{loginForm.formState.errors.password.message}</p> : null}

            <ActionButton className="w-full min-h-11 primary-gradient py-3 text-sm font-semibold text-white" type="submit" loading={loginMutation.isPending}>
              {t("signIn")}
            </ActionButton>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={registerForm.handleSubmit((values) => registerMutation.mutate(values))}>
            <label className="block text-[13px] font-medium text-surface-700">
              {t("email")}
              <input className="mt-1.5" type="email" placeholder="name@example.com" {...registerForm.register("email")} />
            </label>
            {registerForm.formState.errors.email ? <p className="-mt-2 text-[11px] text-red-600">{registerForm.formState.errors.email.message}</p> : null}

            <label className="block text-[13px] font-medium text-surface-700">
              {t("password")}
              <input className="mt-1.5" type="password" placeholder={t("passwordPlaceholder")} {...registerForm.register("password")} />
            </label>
            {registerForm.formState.errors.password ? <p className="-mt-2 text-[11px] text-red-600">{registerForm.formState.errors.password.message}</p> : null}

            <label className="block text-[13px] font-medium text-surface-700">
              {t("role")}
              <select className="mt-1.5" {...registerForm.register("role")}>
                <option value="client">{t("roleClient")}</option>
                <option value="freelancer">{t("roleFreelancer")}</option>
              </select>
            </label>

            <ActionButton className="w-full min-h-11 primary-gradient py-3 text-sm font-semibold text-white" type="submit" loading={registerMutation.isPending}>
              {t("createAccount")}
            </ActionButton>
          </form>
        )}

        <button type="button" onClick={() => setShowPasswordless((prev) => !prev)} className="mt-5 w-full text-center text-[13px] font-medium text-brand-600 hover:text-brand-700">
          {t("useOtp")}
        </button>

        {showPasswordless ? (
          <div className="mt-4 space-y-4 rounded-2xl bg-surface-100 p-4">
            <form className="space-y-3" onSubmit={requestForm.handleSubmit((values) => requestMutation.mutate(values))}>
              <p className="text-[13px] font-semibold text-surface-800">{t("otpStep1")}</p>
              <label className="block text-[13px] font-medium text-surface-600">
                {t("email")}
                <input className="mt-1" type="email" {...requestForm.register("email")} />
              </label>
              {requestForm.formState.errors.email ? <p className="text-[11px] text-red-600">{requestForm.formState.errors.email.message}</p> : null}
              <ActionButton className="w-full min-h-11 primary-gradient text-white" type="submit" loading={requestMutation.isPending}>{t("requestOtp")}</ActionButton>
            </form>

            <form className="space-y-3" onSubmit={verifyForm.handleSubmit((values) => verifyMutation.mutate(values))}>
              <p className="text-[13px] font-semibold text-surface-800">{t("otpStep2")}</p>
              <label className="block text-[13px] font-medium text-surface-600">
                {t("email")}
                <input className="mt-1" type="email" {...verifyForm.register("email")} />
              </label>
              <label className="block text-[13px] font-medium text-surface-600">
                {t("otpToken")}
                <input className="mt-1" {...verifyForm.register("otp_token")} />
              </label>
              <label className="block text-[13px] font-medium text-surface-600">
                {t("otp")}
                <input className="mt-1" {...verifyForm.register("otp")} />
              </label>
              {(verifyForm.formState.errors.email || verifyForm.formState.errors.otp_token || verifyForm.formState.errors.otp) ? (
                <p className="text-[11px] text-red-600">
                  {verifyForm.formState.errors.email?.message || verifyForm.formState.errors.otp_token?.message || verifyForm.formState.errors.otp?.message}
                </p>
              ) : null}
              <ActionButton className="w-full min-h-11 primary-gradient text-white" type="submit" loading={verifyMutation.isPending}>{t("verifyOtp")}</ActionButton>
            </form>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between text-[11px] text-surface-500">
          <span>Secure auth • Privacy first</span>
          <a href={withLocale("/support")} className="font-semibold text-brand-600">Support</a>
        </div>
      </div>
    </section>
  );
}

export default function AuthPage() {
  const t = useTranslations("Auth");
  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <Suspense
        fallback={
          <section className="mx-auto flex min-h-[80vh] w-full max-w-6xl items-center justify-center px-4 py-12">
            <div className="w-full max-w-[440px] rounded-2xl border border-surface-200/60 bg-white p-8 shadow-hero">
              <p className="text-center text-[13px] text-surface-500">{t("loading")}</p>
            </div>
          </section>
        }
      >
        <AuthCard />
      </Suspense>
    </>
  );
}
