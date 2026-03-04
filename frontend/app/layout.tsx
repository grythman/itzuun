import type { Metadata } from "next";
import "./globals.css";

import { Nav } from "@/components/nav";
import { Providers } from "@/components/providers";
import { ToastCenter } from "@/components/toast-center";

export const metadata: Metadata = {
  title: "ITZuun MVP",
  description: "MVP frontend for IT freelance marketplace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          <ToastCenter />
        </Providers>
      </body>
    </html>
  );
}
