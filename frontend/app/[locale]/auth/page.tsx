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
  const backgroundImage = isRegister
    ? "https://lh3.googleusercontent.com/aida-public/AB6AXuCe0W8Kp4Oq9Qsmj1BpdfSSbprFkT8ILW8qPyCgkqcz_qNIOornqpTvFoB-crKiPrn24aKRSZlGdIJUeekpJYniiOOc1AEmNMUjtS0rmydYlgvruqm2oZZjwXe0Q9bS0CNiNTtBW9SbRFCvoBTdEQICkNlVr-cyW76wZVBUAqJycO0IgydqfBzQqFgxnY-HBbgYkKe7gsf8-drahgFztJ-m2N1ncxWnAXH28yM0cbEPCUf8jEiAYxL0w4moEj2NMz-zjoKxi5ZZF_Y"
    : "https://lh3.googleusercontent.com/aida-public/AB6AXuBsBZ6rm3MFZOSQGIoPrVAKmKNeK0QVRbLFDSxLdYleeg4WHVk2yoVCrgISFCt-UUncpZIZ85qTUFVwSgblSo3FSSKvza4IrIjdAy1IfN6HBh-EU2NYZWDEIl2JMk_pnEQs0ashs9g-3pxMrCsZ4dWI9SFIcmhfmz9ym_jFLk7Vbkv4ArfYO-nKEmltJtRvtadTGQfTea2jvbAMK27A5YR1zjD3Ja9U20X0k0IyCHDpxc6orKWSeXD4oBjZBeN-w5BIo6__HicJU7A";
  const registerAvatars = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBEERQGXuVJhJ24iEw2SOZotiYueKQba3DSTNA04pOGn_Y5ej4LFWyuimNOCclLVtIs3vqeO8wL1PFoKjuQ4_xQN8X6hYjwBXII2fSs9bR3da7wLH2F0Ik3kSwrYhHGJPubSBCo9dknYrWZ1FKjKUwGCw1bUxx5k426MAqm12eu2nmNmGsNnANzhY3INRpbq7Khfq3q276s8Hzz44CcOffRGczGuxD4LvsaFS5ZZuYSad8s321jnTJ3XoF6zFLo2vPVsPTH4HY6BbQ",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCZOAORhV6OIjUN8_aKJzhSXgOGk3PaVy_gs1fhlvIijuBEBa_rhayTtqqJjXHlLiJmAyG_Q9zPuplaGlxM-K68b2D9XJLx1JgtRfus4fh-bQH68qu8RcbZxzynXqtS2m84SF3PXKJxIdEBS4U_6mKSjrJO7k-1zrmCDIvxupTT1lUtjO16O96OQtFrZmN87QeFnyeQLfObwLlSnHAUTt8k3RpsZuiTAxnSOW6kBA_Mud6CifDVL9jtNrg3j5q2eFCO_LEtjkdTJEk",
  ];

  return (
    <aside className="relative hidden overflow-hidden bg-[#031636] text-white lg:flex lg:w-[48%] 2xl:w-1/2">
      <img
        src={backgroundImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-overlay"
      />
      <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-14 2xl:p-16">
        <div>
          <p className="text-[30px] font-extrabold tracking-tight text-white 2xl:text-3xl">ITZuun</p>
          {!isRegister ? <div className="mt-2 h-1 w-12 rounded-full bg-cyan-400" /> : null}
        </div>

        <div className="max-w-[420px] xl:max-w-[460px] 2xl:max-w-md">
          {isRegister ? (
            <>
              <h2 className="mb-5 font-headline text-[52px] font-bold leading-[1.08] tracking-tight text-white xl:text-[56px] 2xl:mb-6 2xl:text-5xl">
                Монголын шилдэг
                <br />
                авьяастнуудын нэгдэл
              </h2>
              <p className="text-[18px] leading-8 text-[#d8e2ff] opacity-80">
                Бид төслийн удирдлага, санхүүгийн аюулгүй байдал болон мэргэжлийн
                фрилансерүүдийг нэг дор цогцлоосон платформ юм.
              </p>
            </>
          ) : (
            <>
              <h2 className="mb-5 font-headline text-[52px] font-bold leading-[1.08] tracking-tight text-white xl:text-[56px] 2xl:mb-6 2xl:text-5xl">
                Мэргэжлийн түвшинд
                <br />
                төслөө удирдах шинэ
                <br />
                боломж.
              </h2>
              <p className="text-[18px] leading-8 text-[#d8e2ff] opacity-80">
                Дэлхийн жишигт нийцсэн технологийн шийдлүүдийг Монгол инженерүүдээс.
              </p>
            </>
          )}
        </div>

        <div>
        {isRegister ? (
          <div className="flex items-center gap-4 text-sm text-[#8293ba]">
            <div className="flex -space-x-2">
              {registerAvatars.map((src) => (
                <span key={src} className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-[#031636] bg-white/10">
                  <img src={src} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                </span>
              ))}
            </div>
            <span>350+ Мэргэжилтнүүд нэгдсэн</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
            <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <svg viewBox="0 0 24 24" className="mb-2 h-5 w-5 fill-current text-[#a5eff0]" aria-hidden="true">
                <path d="M12 2 4 5v6c0 5.6 3.8 10.8 8 12 4.2-1.2 8-6.4 8-12V5l-8-3Zm-1 13-3-3 1.4-1.4L11 12.2l3.6-3.6L16 10l-5 5Z" />
              </svg>
              <div className="text-sm font-semibold text-white">Аюулгүй Гүйлгээ</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <svg viewBox="0 0 24 24" className="mb-2 h-5 w-5 fill-current text-[#a5eff0]" aria-hidden="true">
                <path d="M12 2a2 2 0 0 1 2 2v6.17l4.24 7.35a1 1 0 0 1-.87 1.48h-2.4l-1.43-2.47H10.5L9.07 19h-2.4a1 1 0 0 1-.87-1.48L10 10.17V4a2 2 0 0 1 2-2Zm0 2v6h.01a1 1 0 0 1 .86.5L15.27 17h.37L12 10.75 8.36 17h.37l2.4-6.5a1 1 0 0 1 .87-.5H12Zm-.77 10.53L12 16l.77-1.47h-1.54Z" />
              </svg>
              <div className="text-sm font-semibold text-white">Шилдэг Архитектур</div>
            </div>
          </div>
        )}
        </div>
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

  const googleInitializedRef = useRef(false);
  const activeTabRef = useRef<AuthTab>(initialTab);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const queryClient = useQueryClient();
  const toast = useToastStore((s) => s.push);

  const setTab = useCallback(
    (tab: AuthTab) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`${withLocale("/auth")}?${params.toString()}`);
    },
    [router, searchParams, withLocale],
  );

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
    activeTabRef.current = activeTab;
  }, [activeTab]);

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
  const selectedRegisterRole = registerForm.watch("role");

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
    if (!googleClientId || !googleScriptReady || !window.google || googleInitializedRef.current) return;
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
          role: activeTabRef.current === "register" ? registerForm.getValues("role") : undefined,
        });
      },
    });
    googleInitializedRef.current = true;
  }, [activeTab, googleClientId, googleMutation, googleScriptReady, registerForm, toast]);

  const triggerGoogleAuth = useCallback(() => {
    if (!googleScriptReady || !window.google) {
      const msg = "Google нэвтрэлт одоогоор бэлэн биш байна. Дахин оролдоно уу.";
      setAuthError(msg);
      toast("error", msg);
      return;
    }
    window.google.accounts.id.prompt();
  }, [googleScriptReady, toast]);

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
    <main className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 px-0 py-0">
      <section className="min-h-[100dvh] overflow-hidden border-y border-surface-200/80 bg-white shadow-hero lg:mx-auto lg:my-2 lg:flex lg:min-h-[870px] lg:max-w-[1360px] lg:rounded-xl lg:border xl:max-w-[1520px] 2xl:max-w-[1680px]">
        <AuthVisual activeTab={activeTab} />

        <div className="w-full bg-[#f7f9fb] px-8 py-12 md:px-16 lg:w-[52%] lg:px-16 xl:px-20 2xl:px-24">
          <div className="mx-auto w-full max-w-[420px] xl:max-w-[460px]">
            <div className="mb-8 lg:hidden">
              <p className="text-3xl font-black tracking-tight text-[#031636]">ITZuun</p>
            </div>

            <header className="mb-10">
              <h1 className="font-headline text-3xl font-extrabold tracking-tight text-[#031636]">
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
                className="space-y-6"
                onSubmit={registerForm.handleSubmit((values) => {
                  if (!acceptedTerms) {
                    setAuthError("Үйлчилгээний нөхцөл болон нууцлалын бодлогыг зөвшөөрнө үү.");
                    return;
                  }
                  registerMutation.mutate(values);
                })}
              >
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => registerForm.setValue("role", "client")}
                    className={`group rounded-xl border-2 px-4 py-6 text-center transition-all duration-300 ${
                      registerForm.watch("role") === "client"
                        ? "border-[#13696a] bg-[#f7fcfc] shadow-[0_20px_50px_rgba(3,22,54,0.06)]"
                        : "border-transparent bg-white hover:shadow-[0_20px_50px_rgba(3,22,54,0.06)]"
                    }`}
                  >
                    <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                      registerForm.watch("role") === "client" ? "bg-[#e7f6f6] text-[#13696a]" : "bg-[#eceef0] text-surface-600"
                    }`}>
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2h3a2 2 0 0 1 2 2v3H4V8a2 2 0 0 1 2-2h3Zm2 0h2V5h-2v1Zm9 7H4v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6Z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-surface-800">Захиалагч</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => registerForm.setValue("role", "freelancer")}
                    className={`group rounded-xl border-2 px-4 py-6 text-center transition-all duration-300 ${
                      registerForm.watch("role") === "freelancer"
                        ? "border-[#13696a] bg-[#f7fcfc] shadow-[0_20px_50px_rgba(3,22,54,0.06)]"
                        : "border-transparent bg-white hover:shadow-[0_20px_50px_rgba(3,22,54,0.06)]"
                    }`}
                  >
                    <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                      registerForm.watch("role") === "freelancer" ? "bg-[#e7f6f6] text-[#13696a]" : "bg-[#eceef0] text-surface-600"
                    }`}>
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                        <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Zm4.7 4.3a1 1 0 0 0-1.4 1.4l1.3 1.3-1.3 1.3a1 1 0 1 0 1.4 1.4l2-2a1 1 0 0 0 0-1.4l-2-2ZM11 15a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-6Z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-surface-800">Фрилансер</p>
                  </button>
                </div>

                <label className="block space-y-1.5">
                  <span className="ml-1 text-sm font-semibold text-surface-600">Овог нэр</span>
                  <input className="w-full rounded-xl border-0 bg-white px-4 py-3.5 text-surface-900 placeholder:text-surface-400 focus:ring-2 focus:ring-[#031636]/15" type="text" placeholder="Жишээ: Бат-Эрдэнэ" autoComplete="name" />
                </label>

                <label className="block space-y-1.5">
                  <span className="ml-1 text-sm font-semibold text-surface-600">{t("email")}</span>
                  <input className="w-full rounded-xl border-0 bg-white px-4 py-3.5 text-surface-900 placeholder:text-surface-400 focus:ring-2 focus:ring-[#031636]/15" type="email" placeholder="email@domain.mn" autoComplete="email" {...registerForm.register("email")} />
                </label>
                {registerForm.formState.errors.email ? <p className="-mt-3 text-xs text-red-600">{registerForm.formState.errors.email.message}</p> : null}

                <label className="block space-y-1.5">
                  <span className="ml-1 text-sm font-semibold text-surface-600">{t("password")}</span>
                  <div className="relative">
                    <input
                      className="w-full rounded-xl border-0 bg-white px-4 py-3.5 pr-12 text-surface-900 placeholder:text-surface-400 focus:ring-2 focus:ring-[#031636]/15"
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...registerForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword((v) => !v)}
                      className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center p-0 text-[#75777f] hover:text-[#031636] focus-visible:ring-0"
                    >
                      {showRegisterPassword ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 3l18 18" />
                          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                          <path d="M9.9 5.1A10.9 10.9 0 0 1 12 5c5 0 9.3 3.1 11 7a11.6 11.6 0 0 1-4.1 5.2" />
                          <path d="M6 6.3A11.6 11.6 0 0 0 1 12c1.7 3.9 6 7 11 7 1.4 0 2.8-.3 4-.8" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>
                {registerForm.formState.errors.password ? <p className="-mt-3 text-xs text-red-600">{registerForm.formState.errors.password.message}</p> : null}

                <label className="flex items-start gap-3 py-2 text-sm text-surface-600">
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 rounded border-surface-300 bg-white text-[#13696a] focus:ring-[#13696a]"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <span>
                    Би ITZuun-ий <Link href={withLocale("/terms")} className="font-semibold text-[#1f8c99]">Үйлчилгээний нөхцөл</Link> болон{" "}
                    <Link href={withLocale("/privacy")} className="font-semibold text-[#1f8c99]">Нууцлалын бодлогыг</Link> зөвшөөрч байна.
                  </span>
                </label>

                <ActionButton
                  className="w-full min-h-12 rounded-xl bg-gradient-to-br from-[#031636] to-[#1a2b4c] py-4 text-base font-bold text-[#d8e2ff] shadow-xl shadow-[#031636]/10"
                  type="submit"
                  loading={registerMutation.isPending}
                >
                  {t("register")}
                </ActionButton>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))}>
                <label className="block text-sm font-semibold text-surface-700">
                  {t("email")}
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                        <path d="M4 6a2 2 0 0 0-2 2v.35l10 5.71L22 8.35V8a2 2 0 0 0-2-2H4Zm18 4.65-9.5 5.43a1 1 0 0 1-1 0L2 10.65V16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.35Z" />
                      </svg>
                    </span>
                    <input className="rounded-xl border-0 bg-surface-100 px-11 py-3.5" type="email" placeholder="example@itzuun.mn" autoComplete="email" {...loginForm.register("email")} />
                  </div>
                </label>
                {loginForm.formState.errors.email ? <p className="-mt-3 text-xs text-red-600">{loginForm.formState.errors.email.message}</p> : null}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-surface-700">{t("password")}</label>
                    <Link href={withLocale("/support")} className="text-xs font-semibold text-[#1f8c99]">Нууц үг мартсан?</Link>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                        <path d="M17 8h-1V6a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4V6Z" />
                      </svg>
                    </span>
                    <input
                      className="rounded-xl border-0 bg-surface-100 px-11 py-3.5 pr-12"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...loginForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center p-0 text-[#7b8091] hover:text-[#4e5e82] focus-visible:ring-0"
                    >
                      {showLoginPassword ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 3l18 18" />
                          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                          <path d="M9.9 5.1A10.9 10.9 0 0 1 12 5c5 0 9.3 3.1 11 7a11.6 11.6 0 0 1-4.1 5.2" />
                          <path d="M6 6.3A11.6 11.6 0 0 0 1 12c1.7 3.9 6 7 11 7 1.4 0 2.8-.3 4-.8" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {loginForm.formState.errors.password ? <p className="-mt-3 text-xs text-red-600">{loginForm.formState.errors.password.message}</p> : null}

                <label className="flex items-center gap-2 text-sm text-surface-700">
                  <input type="checkbox" className="h-5 w-5 rounded border-surface-300" />
                  Намайг санах
                </label>

                <ActionButton
                  className="w-full min-h-12 rounded-xl bg-gradient-to-br from-[#031636] to-[#1a2b4c] py-3 text-base font-semibold text-[#d8e2ff] shadow-[0_12px_26px_rgba(3,22,54,0.16)]"
                  type="submit"
                  loading={loginMutation.isPending}
                >
                  {t("signIn")}
                </ActionButton>
              </form>
            )}

            <div className={`flex items-center gap-3 ${isRegister ? "py-4" : "my-9"}`}>
              <div className="h-px flex-1 bg-surface-300" />
              <p className={`font-semibold text-surface-500 ${isRegister ? "text-xs uppercase tracking-[0.25em]" : "text-xs uppercase tracking-wider"}`}>
                {isRegister ? "эсвэл" : "Эсвэл дараах хаягаар нэвтрэх"}
              </p>
              <div className="h-px flex-1 bg-surface-300" />
            </div>

            <div className="space-y-3">
              <div className={`grid grid-cols-2 ${isRegister ? "gap-4" : "gap-3"}`}>
                <button
                  type="button"
                  onClick={triggerGoogleAuth}
                  className={`flex items-center justify-center rounded-xl py-3 text-sm font-semibold transition-colors ${
                    isRegister
                      ? "gap-3 border-0 bg-white px-4 text-surface-800 hover:bg-surface-200"
                      : "gap-2 border border-surface-200 bg-surface-100 text-surface-700 hover:bg-surface-200"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8a6 6 0 1 1 0-12c2.2 0 3.7.9 4.6 1.7l3.1-3A10.7 10.7 0 1 0 22.7 12c0-.7-.1-1.2-.2-1.8H12Z"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className={`flex items-center justify-center rounded-xl py-3 text-sm font-semibold transition-colors ${
                    isRegister
                      ? "gap-3 border-0 bg-white px-4 text-surface-800 hover:bg-surface-200"
                      : "gap-2 border border-surface-200 bg-surface-100 text-surface-700 hover:bg-surface-200"
                  }`}
                  onClick={() => {
                    if (!isRegister) setShowPasswordless((prev) => !prev);
                  }}
                >
                  {isRegister ? (
                    <>
                      {selectedRegisterRole === "freelancer" ? (
                        <>
                          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                            <path fill="#0A66C2" d="M20.45 20.45h-3.56v-5.58c0-1.33-.03-3.03-1.84-3.03-1.84 0-2.12 1.45-2.12 2.94v5.67H9.37V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.26 2.37 4.26 5.45v6.29ZM5.35 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.13 20.45H3.56V9h3.57v11.45Z" />
                          </svg>
                          LinkedIn
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                            <path fill="#1877F2" d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.2-1.6 1.6-1.6h1.7V3.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.3V10H8v3h2.7v8h2.8Z" />
                          </svg>
                          Facebook
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                        <path fill="#0A66C2" d="M20.45 20.45h-3.56v-5.58c0-1.33-.03-3.03-1.84-3.03-1.84 0-2.12 1.45-2.12 2.94v5.67H9.37V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.26 2.37 4.26 5.45v6.29ZM5.35 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.13 20.45H3.56V9h3.57v11.45Z" />
                      </svg>
                      LinkedIn
                    </>
                  )}
                </button>
              </div>
              {isRegister ? null : (
                <button
                  type="button"
                  onClick={() => setShowPasswordless((prev) => !prev)}
                  className="w-full rounded-xl border border-surface-300 bg-white py-3 text-sm font-semibold text-surface-700"
                >
                  {t("useOtp")}
                </button>
              )}
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
                  <button type="button" className="font-bold text-[#031636]" onClick={() => setTab("signin")}>Нэвтрэх</button>
                </>
              ) : (
                <>
                  Бүртгэлгүй юу?{" "}
                  <button type="button" className="font-bold text-[#031636]" onClick={() => setTab("register")}>Бүртгүүлэх</button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-0 flex flex-col gap-4 bg-[#eceef0] px-6 py-6 text-sm text-surface-600 md:flex-row md:items-center md:justify-between lg:mx-auto lg:max-w-[1360px] lg:rounded-b-xl xl:max-w-[1520px] 2xl:max-w-[1680px]">
        <div className="flex items-center gap-2">
          <span className="font-black text-[#031636]">ITZuun</span>
          <span className="text-xs">© 2024 ITZuun. Бүх эрх хуулиар хамгаалагдсан.</span>
        </div>
        <div className="flex flex-wrap gap-6">
          <Link href={withLocale("/about")}>Бидний тухай</Link>
          <Link href={withLocale("/terms")}>Үйлчилгээний нөхцөл</Link>
          <Link href={withLocale("/privacy")}>Нууцлалын бодлого</Link>
          <Link href={withLocale("/support")}>Тусламж</Link>
        </div>
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
