import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";
import { ToastCenter } from "@/components/toast-center";
import { locales } from '../../i18n';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export const metadata: Metadata = {
  title: "ITZuun",
  description: "Secure IT freelance marketplace with escrow protection",
  icons: {
    icon: "/images/logo-icon.svg?v=20260410",
    shortcut: "/favicon.ico?v=20260410",
  },
};

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
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <Providers>
        <AppShell>{children}</AppShell>
        <ToastCenter />
      </Providers>
    </NextIntlClientProvider>
  );
}
