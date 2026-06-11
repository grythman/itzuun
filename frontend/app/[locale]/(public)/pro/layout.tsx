import type { Metadata } from "next";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }): Metadata {
  const meta = {
    mn: { title: "ITZuun Pro", description: "ITZuun Pro — мэргэжлийн фрийлансерүүдэд зориулсан дээд зэрэглэлийн боломжууд." },
    en: { title: "ITZuun Pro", description: "ITZuun Pro — premium features for professional freelancers." },
  };
  const { title, description } = meta[locale as keyof typeof meta] || meta.mn;
  return { title, description };
}

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
