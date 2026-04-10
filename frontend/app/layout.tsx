import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITZuun MVP",
  description: "MVP frontend for IT freelance marketplace",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
