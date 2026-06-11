import type { Metadata } from "next";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }): Metadata {
  const meta = {
    mn: { title: "Тусламж", description: "ITZuun платформын тусламж, холбоо барих мэдээлэл." },
    en: { title: "Support", description: "ITZuun platform support and contact information." },
  };
  const { title, description } = meta[locale as keyof typeof meta] || meta.mn;
  return { title, description };
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
