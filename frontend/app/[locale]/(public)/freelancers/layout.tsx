import type { Metadata } from "next";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }): Metadata {
  const meta = {
    mn: { title: "Фрийлансерууд", description: "ITZuun-ийн баталгаажсан IT мэргэжилтнүүд — web developer, дизайнер, IT support." },
    en: { title: "Freelancers", description: "Verified IT professionals on ITZuun — web developers, designers, IT support." },
  };
  const { title, description } = meta[locale as keyof typeof meta] || meta.mn;
  return { title, description, openGraph: { title, description } };
}

export default function FreelancersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
