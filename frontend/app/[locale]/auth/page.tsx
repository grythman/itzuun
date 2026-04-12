"use client";
export const dynamic = "force-dynamic";

import Script from "next/script";
import Link from "next/link";
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
    await new Promise((resolve) => setTimeout(resolve, 220 + i * 150));
  }

  return null;
}

function AuthVisual({ activeTab }: { activeTab: AuthTab }) {
  const isRegister = activeTab === "register";

  return (
    <aside className="relative hidden min-h-[760px] overflow-hidden rounded-l-2xl bg-[#041a44] px-8 py-10 text-white lg:flex lg:w-[46%] lg:flex-col lg:justify-between">
      <img
        alt=""
        src={
          isRegister
            ? "https://lh3.googleusercontent.com/aida-public/AB6AXuCe0W8Kp4Oq9Qsmj1BpdfSSbprFkT8ILW8qPyCgkqcz_qNIOornqpTvFoB-crKiPrn24aKRSZlGdIJUeekpJYniiOOc1AEmNMUjtS0rmydYlgvruqm2oZZjwXe0Q9bS0CNiNTtBW9SbRFCvoBTdEQICkNlVr-cyW76wZVBUAqJycO0IgydqfBzQqFgxnY-HBbgYkKe7gsf8-drahgFztJ-m2N1ncxWnAXH28yM0cbEPCUf8jEiAYxL0w4moEj2NMz-zjoKxi5ZZF_Y"
            : "https://lh3.googleusercontent.com/aida-public/AB6AXuBsBZ6rm3MFZOSQGIoPrVAKmKNeK0QVRbLFDSxLdYleeg4WHVk2yoVCrgISFCt-UUncpZIZ85qTUFVwSgblSo3FSSKvza4IrIjdAy1IfN6HBh-EU2NYZWDEIl2JMk_pnEQs0ashs9g-3pxMrCsZ4dWI9SFIcmhfmz9ym_jFLk7Vbkv4ArfYO-nKEmltJtRvtadTGQfTea2jvbAMK27A5YR1zjD3Ja9U20X0k0IyCHDpxc6orKWSeXD4oBjZBeN-w5BIo6__HicJU7A"
        }
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#021334]/80 to-[#02102f]/95" />

      <div className="relative z-10">
        <p className="text-4xl font-black tracking-tight">ITZuun</p>
        {!isRegister ? <div className="mt-2 h-1 w-12 rounded-full bg-cyan-400" /> : null}
      </div>

      <div className="relative z-10 max-w-md space-y-5">
        {isRegister ? (
          <>
            <h2 className="font-headline text-5xl font-extrabold leading-tight tracking-tight">
              Монголын шилдэг
              <br />
              авьяастнуудын
              <br />
              нэгдэл
            </h2>
            <p className="text-lg leading-8 text-blue-100/85">
              Бид төслийн удирдлага, санхүүгийн аюулгүй байдал болон мэргэжлийн
              фрилансерүүдийг нэг дор цогцлоосон платформ юм.
            </p>
          </>
        ) : (
          <>
            <h2 className="font-headline text-5xl font-extrabold leading-tight tracking-tight">
              Мэргэжлийн түвшинд
              <br />
              төслөө удирдах шинэ
              <br />
              боломж.
            </h2>
            <p className="text-lg leading-8 text-blue-100/85">
              Дэлхийн жишигт нийцсэн технологийн шийдлүүдийг Монгол инженерүүдээс.
            </p>
          </>
        )}
      </div>

      <div className="relative z-10">
        {isRegister ? (
          <p className="text-sm text-blue-100/80">350+ Мэргэжилтнүүд нэгдсэн</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">Аюулгүй Гүйлгээ</div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">Шилдэг Архитектур</div>
          </div>
        )}
      </div>
    </aside>
  );
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

  const initialTab = useMemo<AuthTab>(
    () => (searchParams.get("tab") === "register" ? "register" : "signin"),
    [searchParams],
  );

  const expectedRole = searchParams.get("role");
  const nextPath = searchParams.get("next");

  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [showPasswordless, setShowPasswordless] = useState(false);
  const [googleScriptReady, setGoogleScriptReady] = useState(false);
  const [authStage, setAuthStage] = useState<AuthStage>("idle");
  const [authMessage, setAuthMessage] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
      shape: "rectangular",
      text: activeTab === "register" ? "signup_with" : "signin_with",
      width: 360,
    });
  }, [activeTab, googleClientId, googleMutation, googleScriptReady, registerForm, toast]);

  const isRegister = activeTab === "register";

  if (authStage !== "idle") {
    return (
      <main className="mx-auto flex min-h-[86vh] w-full max-w-6xl items-center justify-center px-4 py-8">
        <section className="w-full max-w-[480px] rounded-2xl bg-white p-8 shadow-hero">
          <h1 className="text-center font-headline text-3xl font-extrabold text-[#031636]">{authMessage}</h1>
          <p className="mt-3 text-center text-sm text-surface-600">Хэрэв удааширвал session шалгах товчийг дарна уу.</p>
          <div className="mt-6 flex justify-center">
            <ActionButton
              className="min-h-11 rounded-xl bg-[#031636] px-5 py-3 text-white"
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
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-4 lg:py-8">
      <section className="overflow-hidden rounded-2xl border border-surface-200/80 bg-white shadow-hero lg:flex">
        <AuthVisual activeTab={activeTab} />

        <div className="w-full bg-[#f6f7fb] px-6 py-8 sm:px-10 lg:w-[54%] lg:px-14 lg:py-12">
          <div className="mx-auto w-full max-w-[430px]">
            <div className="mb-8 lg:hidden">
              <p className="text-3xl font-black tracking-tight text-[#031636]">ITZuun</p>
            </div>

            <header className="mb-8">
              <h1 className="font-headline text-4xl font-extrabold tracking-tight text-[#031636]">
                {isRegister ? "Бүртгүүлэх" : "Нэвтрэх"}
              </h1>
              <p className="mt-2 text-[15px] text-surface-600">
                {isRegister ? "Таны үүрэг юу вэ?" : "Тавтай морил. Системд нэвтэрч ажлаа үргэлжлүүлнэ үү."}
              </p>
            </header>

            {expectedRole ? (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs text-amber-800">Сонгосон эрх: <strong>{expectedRole}</strong></p>
                <StatusPill label="Role check" tone="warning" />
              </div>
            ) : null}

            {authError ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <p className="font-semibold">Алдаа</p>
                <p className="mt-1">{authError}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className="min-h-11 rounded-lg bg-white px-3 text-xs font-semibold" onClick={() => setAuthError("")}>Ойлголоо</button>
                  <Link href={withLocale("/support")} className="inline-flex min-h-11 items-center rounded-lg bg-white px-3 text-xs font-semibold">Support</Link>
                  {expectedRole ? (
                    <button className="min-h-11 rounded-lg bg-white px-3 text-xs font-semibold" onClick={logoutAndReset}>Role солих</button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {isRegister ? (
              <form
                className="space-y-5"
                onSubmit={registerForm.handleSubmit((values) => {
                  if (!acceptedTerms) {
                    setAuthError("Үйлчилгээний нөхцөл болон нууцлалын бодлогыг зөвшөөрнө үү.");
                    return;
                  }
                  registerMutation.mutate(values);
                })}
              >
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => registerForm.setValue("role", "client")}
                    className={`rounded-xl border-2 px-4 py-5 text-center ${
                      registerForm.watch("role") === "client"
                        ? "border-[#1f8c99] bg-[#eef8fa]"
                        : "border-transparent bg-white"
                    }`}
                  >
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 text-lg">💼</div>
                    <p className="font-semibold text-surface-800">Захиалагч</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => registerForm.setValue("role", "freelancer")}
                    className={`rounded-xl border-2 px-4 py-5 text-center ${
                      registerForm.watch("role") === "freelancer"
                        ? "border-[#1f8c99] bg-[#eef8fa]"
                        : "border-transparent bg-white"
                    }`}
                  >
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 text-lg">🖥️</div>
                    <p className="font-semibold text-surface-800">Фрилансер</p>
                  </button>
                </div>

                <label className="block text-sm font-semibold text-surface-700">
                  Овог нэр
                  <input className="mt-2 rounded-xl bg-white" type="text" placeholder="Жишээ: Бат-Эрдэнэ" autoComplete="name" />
                </label>

                <label className="block text-sm font-semibold text-surface-700">
                  {t("email")}
                  <input className="mt-2 rounded-xl bg-white" type="email" placeholder="email@domain.mn" autoComplete="email" {...registerForm.register("email")} />
                </label>
                {registerForm.formState.errors.email ? <p className="-mt-3 text-xs text-red-600">{registerForm.formState.errors.email.message}</p> : null}

                <label className="block text-sm font-semibold text-surface-700">
                  {t("password")}
                  <div className="relative mt-2">
                    <input
                      className="rounded-xl bg-white pr-12"
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...registerForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword((v) => !v)}
                      className="absolute right-3 top-1/2 h-8 -translate-y-1/2 rounded-lg px-2 text-xs text-surface-600"
                    >
                      {showRegisterPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>
                {registerForm.formState.errors.password ? <p className="-mt-3 text-xs text-red-600">{registerForm.formState.errors.password.message}</p> : null}

                <label className="flex items-start gap-3 text-sm text-surface-700">
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 rounded border-surface-300"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <span>
                    Би ITZuun-ий <Link href={withLocale("/terms")} className="font-semibold text-[#1f8c99]">Үйлчилгээний нөхцөл</Link> болон{" "}
                    <Link href={withLocale("/privacy")} className="font-semibold text-[#1f8c99]">Нууцлалын бодлогыг</Link> зөвшөөрч байна.
                  </span>
                </label>

                <ActionButton
                  className="w-full min-h-12 rounded-xl bg-[#031636] py-3 text-base font-semibold text-white"
                  type="submit"
                  loading={registerMutation.isPending}
                >
                  {t("register")}
                </ActionButton>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))}>
                <label className="block text-sm font-semibold text-surface-700">
                  {t("email")}
                  <input className="mt-2 rounded-xl bg-white" type="email" placeholder="example@itzuun.mn" autoComplete="email" {...loginForm.register("email")} />
                </label>
                {loginForm.formState.errors.email ? <p className="-mt-3 text-xs text-red-600">{loginForm.formState.errors.email.message}</p> : null}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-surface-700">{t("password")}</label>
                    <Link href={withLocale("/support")} className="text-xs font-semibold text-[#1f8c99]">Нууц үг мартсан?</Link>
                  </div>
                  <div className="relative">
                    <input
                      className="rounded-xl bg-white pr-12"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...loginForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="absolute right-3 top-1/2 h-8 -translate-y-1/2 rounded-lg px-2 text-xs text-surface-600"
                    >
                      {showLoginPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                {loginForm.formState.errors.password ? <p className="-mt-3 text-xs text-red-600">{loginForm.formState.errors.password.message}</p> : null}

                <label className="flex items-center gap-2 text-sm text-surface-700">
                  <input type="checkbox" className="h-5 w-5 rounded border-surface-300" />
                  Намайг санах
                </label>

                <ActionButton
                  className="w-full min-h-12 rounded-xl bg-[#031636] py-3 text-base font-semibold text-white"
                  type="submit"
                  loading={loginMutation.isPending}
                >
                  {t("signIn")}
                </ActionButton>
              </form>
            )}

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-surface-300" />
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">эсвэл</p>
              <div className="h-px flex-1 bg-surface-300" />
            </div>

            <div className="space-y-3">
              {googleClientId ? (
                <div className="flex justify-center rounded-xl bg-white p-2">
                  <div ref={googleButtonRef} className="min-h-[44px]" />
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setShowPasswordless((prev) => !prev)}
                className="w-full rounded-xl border border-surface-300 bg-white py-3 text-sm font-semibold text-surface-700"
              >
                {t("useOtp")}
              </button>
            </div>

            {showPasswordless ? (
              <div className="mt-4 space-y-4 rounded-xl bg-white p-4">
                <form className="space-y-3" onSubmit={requestForm.handleSubmit((values) => requestMutation.mutate(values))}>
                  <p className="text-sm font-semibold text-surface-800">{t("otpStep1")}</p>
                  <label className="block text-xs font-medium text-surface-600">
                    {t("email")}
                    <input className="mt-1 rounded-lg bg-surface-50" type="email" {...requestForm.register("email")} />
                  </label>
                  {requestForm.formState.errors.email ? <p className="text-xs text-red-600">{requestForm.formState.errors.email.message}</p> : null}
                  <ActionButton className="w-full min-h-11 rounded-xl bg-[#031636] text-white" type="submit" loading={requestMutation.isPending}>{t("requestOtp")}</ActionButton>
                </form>

                <form className="space-y-3" onSubmit={verifyForm.handleSubmit((values) => verifyMutation.mutate(values))}>
                  <p className="text-sm font-semibold text-surface-800">{t("otpStep2")}</p>
                  <label className="block text-xs font-medium text-surface-600">
                    {t("email")}
                    <input className="mt-1 rounded-lg bg-surface-50" type="email" {...verifyForm.register("email")} />
                  </label>
                  <label className="block text-xs font-medium text-surface-600">
                    {t("otpToken")}
                    <input className="mt-1 rounded-lg bg-surface-50" {...verifyForm.register("otp_token")} />
                  </label>
                  <label className="block text-xs font-medium text-surface-600">
                    {t("otp")}
                    <input className="mt-1 rounded-lg bg-surface-50" {...verifyForm.register("otp")} />
                  </label>
                  {(verifyForm.formState.errors.email || verifyForm.formState.errors.otp_token || verifyForm.formState.errors.otp) ? (
                    <p className="text-xs text-red-600">
                      {verifyForm.formState.errors.email?.message || verifyForm.formState.errors.otp_token?.message || verifyForm.formState.errors.otp?.message}
                    </p>
                  ) : null}
                  <ActionButton className="w-full min-h-11 rounded-xl bg-[#031636] text-white" type="submit" loading={verifyMutation.isPending}>{t("verifyOtp")}</ActionButton>
                </form>
              </div>
            ) : null}

            <div className="mt-9 text-center text-sm text-surface-600">
              {isRegister ? (
                <>
                  Аль хэдийн бүртгэлтэй юу?{" "}
                  <button type="button" className="font-bold text-[#031636]" onClick={() => setActiveTab("signin")}>Нэвтрэх</button>
                </>
              ) : (
                <>
                  Бүртгэлгүй юу?{" "}
                  <button type="button" className="font-bold text-[#031636]" onClick={() => setActiveTab("register")}>Бүртгүүлэх</button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-4 flex flex-col gap-3 rounded-xl bg-surface-200/70 px-6 py-4 text-sm text-surface-600 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-6">
          <Link href={withLocale("/about")}>Бидний тухай</Link>
          <Link href={withLocale("/support")}>Тусламж</Link>
          <Link href={withLocale("/privacy")}>Нууцлалын бодлого</Link>
        </div>
        <p>© 2024 ITZuun. Бүх эрх хуулиар хамгаалагдсан.</p>
      </footer>
    </main>
  );
}

export default function AuthPage() {
  const t = useTranslations("Auth");

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <Suspense
        fallback={
          <main className="mx-auto flex min-h-[80vh] w-full max-w-6xl items-center justify-center px-4 py-12">
            <section className="w-full max-w-[440px] rounded-2xl border border-surface-200/60 bg-white p-8 shadow-hero">
              <p className="text-center text-sm text-surface-500">{t("loading")}</p>
            </section>
          </main>
        }
      >
        <AuthCard />
      </Suspense>
    </>
  );
}
