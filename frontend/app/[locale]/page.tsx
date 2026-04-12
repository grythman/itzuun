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
    <article className="rounded-[28px] bg-white px-6 py-7 shadow-[0_20px_50px_rgba(3,22,54,0.06)]">
      <div className="font-headline text-[34px] font-extrabold leading-none tracking-[-0.04em] text-[#031636] md:text-[42px]">
        {value}
      </div>
      <p className="mt-3 text-[14px] leading-6 text-surface-600">{label}</p>
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
      ? "bg-[#071a3f] text-white"
      : tone === "teal"
        ? "bg-[#157173] text-white"
        : "bg-white text-[#031636]";

  return (
    <article
      className={`flex h-full min-h-[236px] flex-col rounded-[30px] p-7 shadow-[0_20px_50px_rgba(3,22,54,0.06)] xl:p-8 ${toneClass}`}
    >
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
          tone === "light" ? "text-surface-400" : "text-white/60"
        }`}
      >
        {eyebrow}
      </p>
      <h3 className="mt-auto max-w-[12ch] pt-12 font-headline text-[24px] font-extrabold leading-[1.06] tracking-[-0.04em] xl:text-[26px]">
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
    <article className="rounded-[28px] bg-white/6 p-6 backdrop-blur-sm">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f2555] text-[13px] font-bold text-[#89d3d4]">
        {index}
      </div>
      <h3 className="mt-6 font-headline text-[22px] font-bold tracking-[-0.03em] text-white">
        {title}
      </h3>
      <p className="mt-3 max-w-[34ch] text-[15px] leading-7 text-[#b8c3d8]">{text}</p>
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
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={withLocale("/projects")}
                className="rounded-full bg-[#071a3f] px-7 py-3 text-[14px] font-semibold text-white shadow-[0_16px_36px_rgba(3,22,54,0.18)] transition hover:opacity-95"
              >
                {t("landingPrimaryCta")}
              </Link>
              <Link
                href={withLocale("/projects/new")}
                className="rounded-full bg-white px-7 py-3 text-[14px] font-semibold text-[#031636] shadow-[0_16px_36px_rgba(3,22,54,0.08)] transition hover:bg-surface-100"
              >
                {t("landingSecondaryCta")}
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px]">
            <div className="relative min-h-[440px] overflow-hidden rounded-[42px] bg-[#081a3a] shadow-[0_28px_70px_rgba(3,22,54,0.16)] md:min-h-[560px] xl:min-h-[640px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(178,213,255,0.32),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(7,26,63,0.16)_42%,rgba(3,10,25,0.78)_100%),linear-gradient(135deg,#111926_0%,#0a1424_42%,#071a3f_100%)]" />
              <div className="absolute inset-x-[8%] top-[8%] bottom-[10%] rounded-[34px] border border-white/6 bg-white/[0.02]" />
              <div className="absolute inset-y-[10%] left-[19%] w-[2px] bg-white/10" />
              <div className="absolute inset-y-[10%] left-[40%] w-[2px] bg-white/10" />
              <div className="absolute inset-y-[10%] left-[59%] w-[2px] bg-white/8" />
              <div className="absolute inset-y-[10%] left-[76%] w-[2px] bg-white/7" />
              <div className="absolute inset-x-[10%] top-[17%] h-[2px] bg-white/9" />
              <div className="absolute inset-x-[10%] top-[39%] h-[2px] bg-white/8" />
              <div className="absolute inset-x-[10%] top-[64%] h-[2px] bg-white/7" />
              <div className="absolute bottom-[12%] left-[15%] h-[58%] w-[14%] rounded-[10px] bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04))]" />
              <div className="absolute bottom-[12%] left-[34%] h-[70%] w-[14%] rounded-[10px] bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(255,255,255,0.05))]" />
              <div className="absolute bottom-[12%] left-[54%] h-[76%] w-[13%] rounded-[10px] bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(255,255,255,0.05))]" />
              <div className="absolute bottom-[12%] right-[16%] h-[52%] w-[14%] rounded-[10px] bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04))]" />
              <div className="absolute bottom-[12%] left-[13%] right-[13%] h-[16%] bg-[linear-gradient(180deg,rgba(122,174,255,0.14),rgba(255,255,255,0.02))] blur-[1px]" />
              <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[linear-gradient(180deg,transparent,rgba(3,10,25,0.92))]" />
            </div>

            <div className="absolute -bottom-5 left-6 right-6 rounded-[26px] bg-white/90 p-4 shadow-[0_22px_46px_rgba(3,22,54,0.12)] backdrop-blur-md md:left-8 md:right-auto md:w-[288px] md:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-400">
                {t("floatingCardEyebrow")}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="font-headline text-[28px] font-extrabold leading-none tracking-[-0.05em] text-[#031636]">
                    ₮12.4M
                  </p>
                  <p className="mt-1 text-[13px] text-surface-500">{t("floatingCardText")}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dff5f0] text-[#13696a]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
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

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-surface-400">{t("categorySectionEyebrow")}</p>
            <h2 className="mt-2 font-headline text-[34px] font-extrabold tracking-[-0.05em] text-[#031636] md:text-[48px]">
              {t("categorySectionTitle")}
            </h2>
          </div>
          <Link href={withLocale("/projects")} className="hidden text-[14px] font-semibold text-[#3557a1] hover:underline md:inline-flex">
            {t("categorySectionLink")}
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.16fr_0.84fr_0.84fr] xl:grid-rows-[236px_236px] xl:gap-6">
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

      <section className="overflow-hidden rounded-[40px] bg-[#071a3f] px-5 py-10 text-white shadow-[0_24px_60px_rgba(3,22,54,0.14)] md:px-10 md:py-14 xl:px-16 xl:py-16">
        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr] xl:gap-12">
          <div className="max-w-[560px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#89d3d4]">{t("processEyebrow")}</p>
            <h2 className="mt-3 font-headline text-[34px] font-extrabold tracking-[-0.05em] md:text-[48px]">
              {t("processTitle")}
            </h2>
            <p className="mt-4 text-[16px] leading-8 text-[#b8c3d8]">{t("processSubtitle")}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 md:gap-5">
            {steps.map((step) => (
              <StepCard key={step.index} {...step} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid items-center gap-8 rounded-[40px] bg-white px-5 py-8 shadow-[0_20px_50px_rgba(3,22,54,0.06)] md:px-10 md:py-12 xl:grid-cols-[0.94fr_1.06fr] xl:gap-12 xl:px-16 xl:py-16">
        <div className="max-w-[560px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-surface-400">{t("trustEyebrow")}</p>
          <h2 className="mt-3 font-headline text-[34px] font-extrabold tracking-[-0.05em] text-[#031636] md:text-[46px]">
            {t("trustTitle")}
          </h2>
          <p className="mt-4 text-[16px] leading-8 text-surface-600">{t("trustSubtitle")}</p>

          <div className="mt-8 space-y-4">
            {[t("trustPoint1"), t("trustPoint2"), t("trustPoint3")].map((point) => (
              <div key={point} className="flex items-start gap-3 rounded-[22px] bg-[#f7f9fb] px-4 py-4">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#dff5f0] text-[#13696a]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <p className="text-[15px] leading-7 text-[#031636]">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[300px] overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#123865_0%,#0a1937_38%,#071a3f_100%)] shadow-[0_22px_52px_rgba(3,22,54,0.12)] md:min-h-[420px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(137,211,212,0.28),_transparent_32%)]" />
          <div className="absolute bottom-10 left-10 right-10 top-10 rounded-[28px] bg-white/5 backdrop-blur-sm" />
          <div className="absolute bottom-[22%] left-[12%] h-[42%] w-[26%] rounded-[20px] bg-white/10" />
          <div className="absolute bottom-[14%] left-[42%] h-[56%] w-[22%] rounded-[20px] bg-white/12" />
          <div className="absolute bottom-[18%] right-[10%] h-[34%] w-[18%] rounded-[20px] bg-white/10" />
          <div className="absolute inset-x-[18%] bottom-[20%] h-[3px] bg-[#89d3d4]/80" />
          <div className="absolute inset-x-[22%] bottom-[28%] h-[3px] bg-white/25" />
        </div>
      </section>

      <section className="rounded-[40px] bg-[#f7f9fb] px-5 py-10 text-center md:px-10 md:py-14 xl:px-16 xl:py-16">
        <h2 className="mx-auto max-w-[18ch] font-headline text-[34px] font-extrabold tracking-[-0.05em] text-[#031636] md:text-[48px]">
          {t("finalTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-[56ch] text-[16px] leading-8 text-surface-600">{t("finalSubtitle")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href={withLocale("/projects/new")}
            className="rounded-full bg-[#071a3f] px-8 py-3 text-[14px] font-semibold text-white shadow-[0_16px_36px_rgba(3,22,54,0.18)] transition hover:opacity-95"
          >
            {t("finalPrimaryCta")}
          </Link>
        </div>
      </section>

      <footer className="rounded-[36px] bg-white px-5 py-8 shadow-[0_20px_50px_rgba(3,22,54,0.04)] md:px-10 xl:px-16">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.9fr] xl:items-start">
          <div className="max-w-[320px]">
            <Logo variant="horizontal" theme="light" href={withLocale("/")} className="w-[132px]" />
            <p className="mt-4 text-[14px] leading-7 text-surface-500">{t("footerIntro")}</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-400">{t("footerCol1")}</p>
            <div className="mt-4 space-y-3 text-[14px] text-surface-600">
              <Link href={withLocale("/projects")} className="block hover:text-[#031636]">{t("footerLinkBrowse")}</Link>
              <Link href={withLocale("/freelancers")} className="block hover:text-[#031636]">{t("footerLinkTalent")}</Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-400">{t("footerCol2")}</p>
            <div className="mt-4 space-y-3 text-[14px] text-surface-600">
              <Link href={withLocale("/about")} className="block hover:text-[#031636]">{t("footerLinkAbout")}</Link>
              <Link href={withLocale("/support")} className="block hover:text-[#031636]">{t("footerLinkSupport")}</Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-400">{t("footerCol3")}</p>
            <div className="mt-4 space-y-3 text-[14px] text-surface-600">
              <Link href={withLocale("/privacy")} className="block hover:text-[#031636]">{t("footerLinkPrivacy")}</Link>
              <Link href={withLocale("/terms")} className="block hover:text-[#031636]">{t("footerLinkTerms")}</Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-400">{t("footerCol4")}</p>
            <div className="mt-4 flex items-center gap-2 rounded-full bg-[#f7f9fb] p-2 shadow-[inset_0_0_0_1px_rgba(197,198,207,0.2)]">
              <input
                type="email"
                placeholder={t("footerInput")}
                className="w-full bg-transparent px-3 py-2 text-[14px] text-[#031636] outline-none placeholder:text-surface-400"
              />
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#071a3f] text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <path d="M5 12h14" />
                  <path d="m13 5 7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[#eef1f4] pt-5 text-[13px] text-surface-400 md:flex-row md:items-center md:justify-between">
          <p>{t("footerCopyright")}</p>
          <p>{t("footerLocale")}</p>
        </div>
      </footer>
    </section>
  );
}
