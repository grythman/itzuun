import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";
import AppShell from "@/components/app-shell";
import { ToastViewport } from "@/components/toast";

export const metadata: Metadata = {
  title: "ITZuun Frontend MVP",
  description: "MVP frontend for ITZuun Django API",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
          <ToastViewport />
        </Providers>
      </body>
    </html>
  );
}
