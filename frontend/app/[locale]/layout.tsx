import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/shared/providers";
import { ToastCenter } from "@/components/shared/toast-center";
import { locales } from '../../i18n';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

const BASE_URL = "https://itzuun.works";

const seo: Record<string, { title: string; description: string }> = {
  mn: {
    title: "ITZuun — Монголын IT фрийланс платформ",
    description: "Жижиг бизнесүүдэд website, дизайн, IT үйлчилгээг найдвартай escrow төлбөрийн хамгаалалттай авах платформ.",
  },
  en: {
    title: "ITZuun — Mongolia's IT Freelance Platform",
    description: "Secure IT freelance marketplace for small businesses. Get websites, design, and IT services with escrow payment protection.",
  },
};

export function generateMetadata({ params: { locale } }: { params: { locale: string } }): Metadata {
  const loc = locales.includes(locale as any) ? locale : "mn";
  const { title, description } = seo[loc];
  return {
    metadataBase: new URL(BASE_URL),
    title: { default: title, template: `%s | ITZuun` },
    description,
    icons: {
      icon: "/images/logo-icon.svg?v=20260410",
      shortcut: "/favicon.ico?v=20260410",
    },
    openGraph: {
      type: "website",
      siteName: "ITZuun",
      locale: loc === "mn" ? "mn_MN" : "en_US",
      title,
      description,
      url: `${BASE_URL}/${loc}`,
      images: [{ url: `${BASE_URL}/images/logo-icon.svg`, width: 512, height: 512, alt: "ITZuun" }],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `${BASE_URL}/${loc}`,
      languages: { mn: `${BASE_URL}/mn`, en: `${BASE_URL}/en` },
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ 
  children,
  params: { locale }
}: { 
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages({ locale });
  const cookieStore = cookies();
  const hasAuthCookies = Boolean(cookieStore.get("access_token")?.value || cookieStore.get("refresh_token")?.value);
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <Providers>
        <AppShell hasAuthCookies={hasAuthCookies}>{children}</AppShell>
        <ToastCenter />
      </Providers>
    </NextIntlClientProvider>
  );
}
