import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITZuun",
  description: "Secure IT freelance marketplace with escrow protection",
  icons: {
    icon: "/images/logo-icon.svg",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
