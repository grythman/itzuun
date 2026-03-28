"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { AppCard } from "@/components/ui-kit";
import { useProjects } from "@/lib/hooks";

export default function HomePage() {
  const t = useTranslations("Hero");
  const home = useTranslations("Home");
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;
  const projects = useProjects(1);

  if (projects.isLoading) return <LoadingState label="Loading projects..." />;
  if (projects.isError) return <ErrorState label="Could not load projects." />;

  const items = (projects.data?.results || []).slice(0, 3);

  return (
    <section className="space-y-20 py-6">
      <div className="grid items-center gap-10 rounded-[2rem] bg-surface-100 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
        <div className="space-y-7">
          <p className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">{home("platformBadge")}</p>
          <h1 className="font-headline text-5xl font-extrabold leading-[1.05] tracking-tight text-surface-900 sm:text-6xl">
            {t("title")}
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-surface-600">{t("subtitle")}</p>

          <div className="flex flex-wrap gap-3">
            <Link href={withLocale("/projects/new")} className="primary-gradient rounded-full px-7 py-3 text-sm font-semibold text-white shadow-card hover:opacity-95">
              {t("ctaClient")}
            </Link>
            <Link href={withLocale("/projects")} className="rounded-full bg-surface-300 px-7 py-3 text-sm font-semibold text-surface-800 hover:bg-surface-400/70">
              {t("ctaFreelancer")}
            </Link>
          </div>
        </div>

        <div className="rounded-2xl primary-gradient p-7 text-white shadow-hero">
          <p className="mb-5 text-[11px] font-semibold tracking-[0.2em] text-brand-100">{home("workflowTitle")}</p>
          <div className="space-y-4 text-[13px]">
            <div>
              <p className="font-semibold">{home("w1Title")}</p>
              <p className="mt-1 text-brand-100">{home("w1Text")}</p>
            </div>
            <div>
              <p className="font-semibold">{home("w2Title")}</p>
              <p className="mt-1 text-brand-100">{home("w2Text")}</p>
            </div>
            <div>
              <p className="font-semibold">{home("w3Title")}</p>
              <p className="mt-1 text-brand-100">{home("w3Text")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <AppCard className="border-none bg-white">
          <h3 className="font-headline text-lg font-bold text-surface-900">{home("f1Title")}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-surface-600">{home("f1Text")}</p>
        </AppCard>
        <AppCard className="border-none bg-white">
          <h3 className="font-headline text-lg font-bold text-surface-900">{home("f2Title")}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-surface-600">{home("f2Text")}</p>
        </AppCard>
        <AppCard className="border-none bg-white">
          <h3 className="font-headline text-lg font-bold text-surface-900">{home("f3Title")}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-surface-600">{home("f3Text")}</p>
        </AppCard>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-surface-900">{home("featuredProjects")}</h2>
          <Link href={withLocale("/projects")} className="text-sm font-semibold text-brand-700">{home("viewAllProjects")}</Link>
        </div>
        {!items.length ? (
          <EmptyState label={home("noProjects")} />
        ) : (
          <ul className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <li className="rounded-2xl bg-white p-6 shadow-card">
              <h3 className="font-headline text-2xl font-bold text-surface-900">{items[0].title}</h3>
              <p className="mt-2 max-w-xl text-[13px] text-surface-600">{items[0].description}</p>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-700">₮{Number(items[0].budget || 0).toLocaleString()}</span>
                <Link href={withLocale(`/projects/${items[0].id}`)} className="rounded-full bg-brand-100 px-4 py-2 text-xs font-semibold text-brand-700">{home("viewDetails")}</Link>
              </div>
            </li>
            <div className="grid gap-4">
              {items.slice(1).map((project) => (
                <li key={project.id} className="rounded-2xl bg-white p-5 shadow-card">
                  <h3 className="font-headline text-lg font-bold text-surface-900">{project.title}</h3>
                  <p className="mt-2 line-clamp-2 text-[12px] text-surface-600">{project.description}</p>
                  <Link href={withLocale(`/projects/${project.id}`)} className="mt-3 inline-block text-xs font-semibold text-brand-700">{home("openProject")} →</Link>
                </li>
              ))}
            </div>
          </ul>
        )}
      </div>

      <div className="rounded-[2rem] primary-gradient px-8 py-14 text-center text-white">
        <h2 className="font-headline text-4xl font-extrabold tracking-tight">{home("ctaTitle")}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-[14px] text-brand-100">{home("ctaSubtitle")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={`${withLocale("/auth")}?tab=register`} className="rounded-full bg-white px-7 py-3 text-xs font-bold uppercase tracking-wider text-brand-700">{home("ctaJoin")}</Link>
          <Link href={withLocale("/projects")} className="rounded-full border border-white/40 px-7 py-3 text-xs font-bold uppercase tracking-wider text-white">{home("ctaTalk")}</Link>
        </div>
      </div>
    </section>
  );
}
