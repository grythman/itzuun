"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { ErrorState, LoadingState } from "@/components/states";
import { useProjects } from "@/lib/hooks";

const TRUST_ITEMS = [
  { icon: "✓", keyTitle: "f1Title", keyText: "f1Text" },
  { icon: "₮", keyTitle: "f2Title", keyText: "f2Text" },
  { icon: "↗", keyTitle: "f3Title", keyText: "f3Text" },
] as const;

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

  const items = (projects.data?.results || []).slice(0, 4);

  return (
    <section className="space-y-16 pb-8 md:space-y-20">
      <div className="anim-rise relative overflow-hidden rounded-[34px] border border-[#dddaf0] bg-gradient-to-br from-white via-[#f9f7ff] to-[#eef2ff] p-7 shadow-[0_20px_80px_rgba(70,45,160,0.14)] md:p-12">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[#d7cbff]/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[#b9ecff]/45 blur-3xl" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-[#cfc8f3] bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#5436be]">
              {home("platformBadge")}
            </p>
            <h1 className="font-headline text-[42px] font-extrabold leading-[1.04] tracking-tight text-surface-900 sm:text-[58px]">
              {t("title")}
            </h1>
            <p className="max-w-2xl text-[17px] leading-relaxed text-surface-600">{t("subtitle")}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={withLocale("/projects/new")}
                className="anim-glow rounded-full bg-[#4a23c8] px-8 py-3 text-[13px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_12px_30px_rgba(74,35,200,0.35)] hover:bg-[#3e1ca8]"
              >
                {t("ctaClient")}
              </Link>
              <Link
                href={withLocale("/projects")}
                className="rounded-full bg-[#e5e8f8] px-8 py-3 text-[13px] font-bold uppercase tracking-[0.08em] text-[#404b78] hover:bg-[#dbe0f5]"
              >
                {t("ctaFreelancer")}
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-[13px] font-semibold text-[#5d617d]">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#dcd2ff] text-[#4a23c8]">2.5k+</span>
              <span>{home("f1Title")}</span>
            </div>
          </div>

          <div className="relative rounded-3xl bg-[#1f1445] p-7 text-white shadow-[0_24px_55px_rgba(25,14,68,0.38)] md:p-8">
            <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
              {home("workflowTitle")}
            </p>
            <div className="space-y-5">
              <div>
                <p className="text-sm font-bold">{home("w1Title")}</p>
                <p className="mt-1 text-[13px] text-[#cfd2ff]">{home("w1Text")}</p>
              </div>
              <div>
                <p className="text-sm font-bold">{home("w2Title")}</p>
                <p className="mt-1 text-[13px] text-[#cfd2ff]">{home("w2Text")}</p>
              </div>
              <div>
                <p className="text-sm font-bold">{home("w3Title")}</p>
                <p className="mt-1 text-[13px] text-[#cfd2ff]">{home("w3Text")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="anim-rise anim-delay-1 grid gap-4 md:grid-cols-3">
        {TRUST_ITEMS.map((item) => (
          <article key={item.keyTitle} className="rounded-2xl border border-[#e4e2f2] bg-white p-6 shadow-[0_10px_32px_rgba(48,36,109,0.08)]">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ece8ff] text-lg font-bold text-[#4a23c8]">{item.icon}</div>
            <h3 className="mt-4 font-headline text-2xl font-bold text-surface-900">{home(item.keyTitle)}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-surface-600">{home(item.keyText)}</p>
          </article>
        ))}
      </div>

      <div className="anim-rise anim-delay-2 space-y-5">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-headline text-[38px] font-extrabold tracking-tight text-surface-900 md:text-[48px]">{home("featuredProjects")}</h2>
          <Link href={withLocale("/projects")} className="text-[14px] font-bold uppercase tracking-[0.08em] text-[#5333c2] hover:underline">
            {home("viewAllProjects")}
          </Link>
        </div>

        {!items.length ? (
          <div className="rounded-2xl border border-dashed border-[#d4d0e9] bg-[#f8f8fc] px-6 py-8 text-[14px] text-surface-500">{home("noProjects")}</div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {items.map((project, idx) => (
              <li
                key={project.id}
                className={
                  idx === 0
                    ? "rounded-2xl bg-[#291760] p-6 text-white shadow-[0_16px_36px_rgba(41,23,96,0.34)] md:col-span-2"
                    : "rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(41,23,96,0.12)]"
                }
              >
                <h3 className="font-headline text-xl font-bold leading-tight">{project.title}</h3>
                <p className={idx === 0 ? "mt-2 line-clamp-3 text-[13px] text-[#d7d5f6]" : "mt-2 line-clamp-3 text-[13px] text-surface-600"}>
                  {project.description}
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <span className={idx === 0 ? "text-sm font-bold text-[#bcaeff]" : "text-sm font-bold text-[#5234bf]"}>
                    ₮{Number(project.budget || 0).toLocaleString()}
                  </span>
                  <Link
                    href={withLocale(`/projects/${project.id}`)}
                    className={
                      idx === 0
                        ? "rounded-full border border-white/30 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white"
                        : "rounded-full bg-[#ece8ff] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5030be]"
                    }
                  >
                    {home("viewDetails")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="anim-rise anim-delay-3 rounded-[30px] border border-[#d8d1f5] bg-gradient-to-r from-[#2a1762] to-[#4b27b4] px-7 py-12 text-center text-white shadow-[0_22px_52px_rgba(42,23,98,0.35)] md:px-12">
        <h2 className="font-headline text-[38px] font-extrabold tracking-tight md:text-[52px]">{home("ctaTitle")}</h2>
        <p className="mx-auto mt-3 max-w-3xl text-[17px] text-[#d6d0ff]">{home("ctaSubtitle")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href={`${withLocale("/auth")}?tab=register`} className="rounded-full bg-white px-8 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-[#4928b2]">
            {home("ctaJoin")}
          </Link>
          <Link href={withLocale("/projects")} className="rounded-full border border-white/45 px-8 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-white">
            {home("ctaTalk")}
          </Link>
        </div>
      </div>
    </section>
  );
}
