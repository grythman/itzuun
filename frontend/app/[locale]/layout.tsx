import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "../globals.css";
import { Nav } from "@/components/nav";
import { Providers } from "@/components/providers";
import { ToastCenter } from "@/components/toast-center";
import { locales } from '../../i18n';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export const metadata: Metadata = {
  title: "ITZuun MVP",
  description: "MVP frontend for IT freelance marketplace",
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
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            <Nav />
            <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">{children}</main>
            <ToastCenter />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
