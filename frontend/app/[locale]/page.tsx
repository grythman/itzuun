"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/logo";

function StatCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <article className="rounded-[2.5rem] bg-surface-container-low px-8 py-10 shadow-sm transition-all hover:shadow-ambient">
      <div className="font-headline text-[42px] font-black leading-none tracking-tighter text-primary md:text-[52px]">
        {value}
      </div>
      <p className="mt-4 text-[13px] font-bold uppercase tracking-widest text-surface-400 font-headline">{label}</p>
    </article>
  );
}

function CategoryCard({
  eyebrow,
  title,
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  tone?: "light" | "navy" | "teal";
}) {
  const toneClass =
    tone === "navy"
      ? "primary-gradient text-primary-fixed"
      : tone === "teal"
        ? "bg-secondary text-white"
        : "bg-surface-container-lowest text-primary";

  return (
    <article
      className={`flex h-full min-h-[260px] flex-col rounded-[2.5rem] p-8 shadow-sm transition-all hover:shadow-ambient xl:p-10 ${toneClass}`}
    >
      <p
        className={`text-[10px] font-black uppercase tracking-[0.2em] font-headline ${
          tone === "light" ? "text-surface-400" : "opacity-60"
        }`}
      >
        {eyebrow}
      </p>
      <h3 className="mt-auto max-w-[12ch] pt-12 font-headline text-[28px] font-black leading-[1.1] tracking-tighter xl:text-[32px]">
        {title}
      </h3>
    </article>
  );
}

function StepCard({
  index,
  title,
  text,
}: {
  index: string;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-[2.5rem] bg-white/5 p-8 backdrop-blur-md shadow-sm border border-white/5 transition-all hover:bg-white/10">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-fixed text-[13px] font-black text-secondary shadow-sm font-headline">
        {index}
      </div>
      <h3 className="mt-8 font-headline text-[24px] font-black tracking-tighter text-white">
        {title}
      </h3>
      <p className="mt-4 max-w-[34ch] text-[15px] font-medium leading-relaxed text-surface-200">{text}</p>
    </article>
  );
}

export default function HomePage() {
  const t = useTranslations("Home");
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const stats = [
    { value: t("statValue1"), label: t("statLabel1") },
    { value: t("statValue2"), label: t("statLabel2") },
    { value: t("statValue3"), label: t("statLabel3") },
  ];

  const categories = [
    { eyebrow: t("categoryEyebrow1"), title: t("categoryTitle1"), tone: "light" as const },
    { eyebrow: t("categoryEyebrow2"), title: t("categoryTitle2"), tone: "navy" as const },
    { eyebrow: t("categoryEyebrow3"), title: t("categoryTitle3"), tone: "teal" as const },
    { eyebrow: t("categoryEyebrow4"), title: t("categoryTitle4"), tone: "light" as const },
  ];

  const steps = [
    { index: "01", title: t("stepTitle1"), text: t("stepText1") },
    { index: "02", title: t("stepTitle2"), text: t("stepText2") },
    { index: "03", title: t("stepTitle3"), text: t("stepText3") },
  ];

  return (
    <section className="space-y-8 pb-4 md:space-y-12 xl:space-y-16">
      <div className="rounded-[44px] bg-[#f7f9fb] px-5 py-8 md:px-10 md:py-12 xl:px-16 xl:py-16">
        <div className="grid items-center gap-10 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,620px)] xl:gap-16">
          <div className="max-w-[860px]">
            <span className="inline-flex rounded-full bg-[#eaf0ff] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#3557a1]">
              {t("heroBadge")}
            </span>
            <h1 className="mt-6 max-w-[8.7ch] font-headline text-[42px] font-extrabold leading-[0.96] tracking-[-0.07em] text-[#031636] md:text-[68px] xl:text-[88px]">
              {t("landingTitle")}
            </h1>
            <p className="mt-6 max-w-[54ch] text-[16px] leading-8 text-surface-600 md:text-[18px]">
              {t("landingSubtitle")}
            </p>
            <div className="mt-10 flex flex-wrap gap-5">
              <Link
                href={withLocale("/projects")}
                className="rounded-2xl primary-gradient px-10 py-4.5 text-[11px] font-black uppercase tracking-[0.2em] text-primary-fixed shadow-ambient transition-all hover:-translate-y-1 active:scale-95 font-headline"
              >
                {t("landingPrimaryCta")}
              </Link>
              <Link
                href={withLocale("/projects/new")}
                className="rounded-2xl bg-surface-container-lowest px-10 py-4.5 text-[11px] font-black uppercase tracking-[0.2em] text-primary shadow-sm transition-all hover:bg-white hover:shadow-ambient active:scale-95 font-headline"
              >
                {t("landingSecondaryCta")}
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px]">
            <div className="relative min-h-[440px] overflow-hidden rounded-[3rem] bg-primary shadow-ambient md:min-h-[560px] xl:min-h-[640px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(178,213,255,0.32),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(7,26,63,0.16)_42%,rgba(3,10,25,0.78)_100%),linear-gradient(135deg,#111926_0%,#0a1424_42%,#071a3f_100%)]" />
              <div className="absolute inset-x-[8%] top-[8%] bottom-[10%] rounded-[2.5rem] border border-white/5 bg-white/[0.01]" />
              <div className="absolute inset-y-[10%] left-[19%] w-[1px] bg-white/5" />
              <div className="absolute inset-y-[10%] left-[40%] w-[1px] bg-white/5" />
              <div className="absolute inset-y-[10%] left-[59%] w-[1px] bg-white/5" />
              <div className="absolute inset-x-[10%] top-[17%] h-[1px] bg-white/5" />
              <div className="absolute inset-x-[10%] top-[39%] h-[1px] bg-white/5" />
              <div className="absolute bottom-[12%] left-[15%] h-[58%] w-[14%] rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))]" />
              <div className="absolute bottom-[12%] left-[34%] h-[70%] w-[14%] rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04))]" />
              <div className="absolute bottom-[12%] left-[54%] h-[76%] w-[13%] rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.04))]" />
              <div className="absolute bottom-[12%] right-[16%] h-[52%] w-[14%] rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02))]" />
              <div className="absolute inset-x-0 bottom-0 h-[40%] bg-[linear-gradient(180deg,transparent,rgba(3,10,25,0.95))]" />
            </div>

            <div className="absolute -bottom-6 left-6 right-6 rounded-[2.5rem] bg-surface-container-lowest/90 p-6 shadow-ambient backdrop-blur-xl md:left-8 md:right-auto md:w-[320px]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 font-headline">
                {t("floatingCardEyebrow")}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="font-headline text-[32px] font-black leading-none tracking-tighter text-primary">
                    ₮12.4M
                  </p>
                  <p className="mt-2 text-[13px] font-medium text-surface-500">{t("floatingCardText")}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-secondary-fixed text-secondary shadow-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6">
                    <path d="M5 12h14" />
                    <path d="m13 5 7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:gap-6">
        {stats.map((item) => (
          <StatCard key={item.label} value={item.value} label={item.label} />
        ))}
      </div>

      <section className="space-y-8">
        <div className="flex items-end justify-between gap-6 px-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 font-headline">{t("categorySectionEyebrow")}</p>
            <h2 className="mt-4 font-headline text-[38px] font-black tracking-tighter text-primary md:text-[54px] leading-none">
              {t("categorySectionTitle")}
            </h2>
          </div>
          <Link href={withLocale("/projects")} className="hidden items-center gap-2 text-[11px] font-black uppercase tracking-[.18em] text-primary transition-all hover:opacity-70 md:inline-flex font-headline">
            {t("categorySectionLink")}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-[1.16fr_0.84fr_0.84fr] xl:grid-rows-[260px_260px] xl:gap-8">
          <div className="xl:row-span-2">
            <CategoryCard {...categories[0]} />
          </div>
          <CategoryCard {...categories[1]} />
          <CategoryCard {...categories[2]} />
          <div className="md:col-span-2 xl:col-span-2">
            <CategoryCard {...categories[3]} />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[3rem] bg-primary px-8 py-16 text-white md:px-16 md:py-24">
        <div className="absolute left-0 top-0 h-full w-full opacity-20 [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="relative grid gap-12 xl:grid-cols-[0.8fr_1.2fr] xl:gap-20">
          <div className="max-w-[480px]">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-secondary font-headline">{t("processEyebrow")}</p>
            <h2 className="mt-6 font-headline text-[38px] font-black tracking-tighter md:text-[54px] leading-tight text-white">
              {t("processTitle")}
            </h2>
            <p className="mt-6 text-[16px] font-medium leading-relaxed text-surface-300">{t("processSubtitle")}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {steps.map((step) => (
              <StepCard key={step.index} {...step} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid items-center gap-12 rounded-[3rem] bg-surface-container-low px-8 py-16 border border-outline-variant/5 md:px-16 md:py-24 xl:grid-cols-[0.9fr_1.1fr] xl:gap-20">
        <div className="max-w-[560px]">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 font-headline">{t("trustEyebrow")}</p>
          <h2 className="mt-6 font-headline text-[38px] font-black tracking-tighter text-primary md:text-[54px] leading-tight">
            {t("trustTitle")}
          </h2>
          <p className="mt-6 text-[16px] font-medium leading-relaxed text-surface-500">{t("trustSubtitle")}</p>

          <div className="mt-10 space-y-5">
            {[t("trustPoint1"), t("trustPoint2"), t("trustPoint3")].map((point) => (
              <div key={point} className="flex items-start gap-4 rounded-3xl bg-surface-container-lowest p-5 shadow-sm transition-all hover:shadow-ambient">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary-fixed text-secondary shadow-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <p className="text-[15px] font-bold leading-relaxed text-primary font-headline py-1.5">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[300px] overflow-hidden rounded-[3rem] primary-gradient shadow-ambient md:min-h-[480px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(137,211,212,0.28),_transparent_32%)]" />
          <div className="absolute bottom-10 left-10 right-10 top-10 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-md" />
          <div className="absolute inset-x-[18%] bottom-[20%] h-[3px] rounded-full bg-secondary/60 shadow-[0_0_20px_rgba(137,211,212,0.4)]" />
          <div className="absolute inset-x-[22%] bottom-[32%] h-[3px] rounded-full bg-white/20" />
        </div>
      </section>
      <section className="rounded-[3rem] bg-surface-container-low px-8 py-16 text-center md:px-16 md:py-24 shadow-sm border border-outline-variant/5">
        <h2 className="mx-auto max-w-[18ch] font-headline text-[38px] font-black tracking-tighter text-primary md:text-[54px] leading-tight">
          {t("finalTitle")}
        </h2>
        <p className="mx-auto mt-6 max-w-[56ch] text-[16px] font-medium leading-relaxed text-surface-500">{t("finalSubtitle")}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-5">
          <Link
            href={withLocale("/projects/new")}
            className="rounded-2xl primary-gradient px-12 py-5 text-[11px] font-black uppercase tracking-[0.25em] text-primary-fixed shadow-ambient transition-all hover:-translate-y-1 active:scale-95 font-headline"
          >
            {t("finalPrimaryCta")}
          </Link>
        </div>
      </section>

      <footer className="rounded-[3rem] bg-surface-container-lowest px-8 py-12 shadow-sm border border-outline-variant/5 md:px-12 xl:px-16">
        <div className="grid gap-12 xl:grid-cols-[1.4fr_0.8fr_0.8fr_1fr] xl:items-start">
          <div className="max-w-[360px]">
            <Logo variant="horizontal" theme="light" href={withLocale("/")} className="w-[140px]" />
            <p className="mt-6 text-[14px] font-medium leading-relaxed text-surface-400">{t("footerIntro")}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 xl:col-span-2 xl:grid-cols-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary font-headline">{t("footerCol1")}</p>
              <div className="mt-6 space-y-4 text-[13px] font-bold text-surface-500 font-headline uppercase tracking-widest leading-none">
                <Link href={withLocale("/projects")} className="block hover:text-primary transition-colors">{t("footerLinkBrowse")}</Link>
                <Link href={withLocale("/freelancers")} className="block hover:text-primary transition-colors">{t("footerLinkTalent")}</Link>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary font-headline">{t("footerCol2")}</p>
              <div className="mt-6 space-y-4 text-[13px] font-bold text-surface-500 font-headline uppercase tracking-widest leading-none">
                <Link href={withLocale("/about")} className="block hover:text-primary transition-colors">{t("footerLinkAbout")}</Link>
                <Link href={withLocale("/support")} className="block hover:text-primary transition-colors">{t("footerLinkSupport")}</Link>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary font-headline">{t("footerCol3")}</p>
              <div className="mt-6 space-y-4 text-[13px] font-bold text-surface-500 font-headline uppercase tracking-widest leading-none">
                <Link href={withLocale("/privacy")} className="block hover:text-primary transition-colors">{t("footerLinkPrivacy")}</Link>
                <Link href={withLocale("/terms")} className="block hover:text-primary transition-colors">{t("footerLinkTerms")}</Link>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary font-headline">{t("footerCol4")}</p>
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-surface-container-low p-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-outline-variant/10">
              <input
                type="email"
                placeholder={t("footerInput")}
                className="w-full bg-transparent px-4 py-2.5 text-[14px] font-medium text-primary outline-none placeholder:text-surface-300"
              />
              <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl primary-gradient text-primary-fixed shadow-sm transition-all hover:shadow-ambient active:scale-95">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-outline-variant/10 pt-8 text-[11px] font-bold uppercase tracking-widest text-surface-400 font-headline md:flex-row md:items-center md:justify-between">
          <p>{t("footerCopyright")}</p>
          <div className="flex gap-8">
            <p>{t("footerLocale")}</p>
            <p className="text-secondary opacity-60">Architectural Curator v1.0</p>
          </div>
        </div>
      </footer>
    </section>
  );
}
