import type { Metadata } from "next";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }): Metadata {
  const meta = {
    mn: { title: "Төслүүд", description: "ITZuun дээрх нээлттэй IT төслүүд — website, дизайн, IT support захиалгууд." },
    en: { title: "Projects", description: "Open IT projects on ITZuun — website, design, and IT support orders." },
  };
  const { title, description } = meta[locale as keyof typeof meta] || meta.mn;
  return { title, description, openGraph: { title, description } };
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
