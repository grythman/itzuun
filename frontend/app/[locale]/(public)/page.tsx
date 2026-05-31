"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const categoryIcons = ["▣", "◩", "◐", "◇", "▤", "✦", "◧", "⌘"];
const serviceCount = 5;

export default function HomePage() {
  const t = useTranslations("Home");
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  return (
    <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-x-hidden bg-surface text-on-surface">
      <main>
        <section className="relative min-h-[820px] overflow-hidden px-6 pt-16 lg:px-10 xl:min-h-[870px]">
          <div className="mx-auto grid w-full max-w-[1680px] items-center gap-12 lg:grid-cols-12">
            <div className="z-10 lg:col-span-7">
              <span className="mb-6 block text-xs font-bold uppercase tracking-[0.2em] text-secondary">{t("platformBadge")}</span>
              <h1 className="mn-text mb-8 max-w-5xl text-5xl font-extrabold tracking-tight text-primary lg:text-7xl">
                {t("landingTitle")}
              </h1>
              <p className="mn-text mb-8 max-w-2xl text-xl leading-relaxed text-on-surface-variant opacity-90">
                {t("landingSubtitle")}
              </p>
              <div className="mb-10 flex flex-wrap gap-3">
                {categoryIcons.slice(0, 4).map((icon, index) => (
                  <span key={icon} className="inline-flex items-center gap-2 rounded-full border border-secondary/15 bg-secondary/5 px-4 py-2 text-sm font-semibold text-primary">
                    <span className="text-secondary">{icon}</span>
                    {t(`categoryTitle${index + 1}`)}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                <Link
                  href={withLocale("/client/projects/new")}
                  className="rounded-xl bg-gradient-to-br from-[#13696a] to-[#0e5254] px-10 py-5 text-lg font-bold text-white shadow-[0_16px_40px_rgba(19,105,106,0.28)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(19,105,106,0.35)] active:scale-95"
                >
                  {t("landingPrimaryCta")}
                </Link>
                <Link
                  href={withLocale("/support")}
                  className="rounded-xl border border-surface-200 bg-white/60 px-10 py-5 text-lg font-bold text-primary backdrop-blur-sm transition-all duration-150 hover:bg-white hover:shadow-[0_8px_24px_rgba(3,22,54,0.08)] active:scale-95"
                >
                  {t("landingSecondaryCta")}
                </Link>
              </div>
            </div>

            <div className="relative h-[520px] lg:col-span-5 lg:h-[600px]">
              <div className="absolute inset-0 scale-105 rotate-3 rounded-3xl bg-secondary/5" />
              <Image
                fill
                unoptimized
                sizes="(min-width: 1024px) 35vw, 100vw"
                className="relative z-10 h-full w-full rounded-3xl object-cover shadow-[0_20px_50px_rgba(3,22,54,0.1)]"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOT2zxw3JU8x2NoyJTfp6ypWiZE2vvWToLlMhfTwFXzTrQdq9Mgv1Pv19HleG_DfyvbepvSjp2hd19b5QJegn2titT_3DildMpk109034vpFMbwRPOgez_k5rS3FCOeLSagV-uZRtOwJqcER84HPV8iQAFCCOaPsPw2u17xe_kSq83jSHF-MP4_0liYUVKf86f3Im8l_Cu80aXEzmSNR9p_4tQmkolEBg1K366KodzLcM8yZ1m_3flr9ZZFGueFwPvJEonix68qWw"
                alt="Modern service workspace"
              />
              <div className="glass-panel absolute -bottom-8 -left-8 z-20 max-w-[280px] rounded-xl p-6 shadow-2xl">
                <div className="mb-2 flex gap-2">
                  <span className="text-secondary">✦</span>
                  <span className="text-xs font-bold uppercase text-primary">{t("heroBadge")}</span>
                </div>
                <p className="mb-4 text-sm font-medium">{t("floatingCardText")}</p>
                <Link href={withLocale("/support")} className="text-sm font-bold text-secondary hover:underline">
                  {t("heroSupportLink")}
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 -z-10 h-full w-1/3 translate-x-1/2 rounded-full bg-surface-container-low opacity-40 blur-[120px]" />
        </section>

        <section className="bg-surface-container-low py-20">
          <div className="mx-auto grid max-w-[1680px] grid-cols-1 gap-12 px-6 text-center md:grid-cols-3 lg:px-10">
            <div className="space-y-2">
              <div className="text-5xl font-black tracking-tighter text-primary">{t("statValue1")}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-secondary">{t("statLabel1")}</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-black tracking-tighter text-primary">{t("statValue2")}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-secondary">{t("statLabel2")}</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-black tracking-tighter text-primary">{t("statValue3")}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-secondary">{t("statLabel3")}</div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1680px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-secondary">{t("categorySectionEyebrow")}</span>
              <h2 className="max-w-3xl text-4xl font-bold text-primary md:text-5xl">{t("categorySectionTitle")}</h2>
              <p className="mt-4 max-w-2xl text-lg text-on-surface-variant">{t("categorySectionSubtitle")}</p>
            </div>
            <Link href={withLocale("/client/projects/new")} className="w-fit border-b border-primary/20 pb-1 font-bold text-primary transition-all hover:border-primary">
              {t("categorySectionLink")}
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoryIcons.map((icon, index) => (
              <Link
                key={icon}
                href={withLocale("/client/projects/new")}
                className="group flex min-h-48 flex-col justify-between rounded-2xl border border-surface-200 bg-surface-container-lowest p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-secondary/30 hover:shadow-xl"
              >
                <div>
                  <span className="text-3xl text-secondary transition-transform group-hover:scale-110">{icon}</span>
                  <h3 className="mn-text mt-8 text-xl font-bold text-primary">{t(`categoryTitle${index + 1}`)}</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-on-surface-variant">{t(`categoryDescription${index + 1}`)}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-surface-container-low px-6 py-24 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1680px]">
            <div className="mb-12 max-w-3xl">
              <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-secondary">{t("servicesEyebrow")}</span>
              <h2 className="text-4xl font-bold text-primary md:text-5xl">{t("servicesTitle")}</h2>
              <p className="mt-4 text-lg text-on-surface-variant">{t("servicesSubtitle")}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {Array.from({ length: serviceCount }, (_, index) => (
                <Link
                  key={index}
                  href={withLocale("/client/projects/new")}
                  className="flex min-h-64 flex-col justify-between rounded-3xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-secondary/30 hover:shadow-xl"
                >
                  <div>
                    <div className="mb-5 inline-flex rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-secondary">
                      {t(`serviceMeta${index + 1}`)}
                    </div>
                    <h3 className="mn-text text-2xl font-black text-primary">{t(`serviceTitle${index + 1}`)}</h3>
                    <p className="mt-4 text-sm leading-6 text-on-surface-variant">{t(`serviceDescription${index + 1}`)}</p>
                  </div>
                  <span className="mt-8 font-bold text-primary">{t("serviceCardCta")} →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-primary py-24 text-white lg:py-28">
          <div className="relative mx-auto max-w-[1680px] px-6 lg:px-10">
            <div className="mb-16 max-w-2xl lg:mb-20">
              <span className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-secondary">{t("processEyebrow")}</span>
              <h2 className="mb-6 text-5xl font-bold">{t("processTitle")}</h2>
              <p className="text-lg text-primary-fixed/60">{t("processSubtitle")}</p>
            </div>
            <div className="grid gap-16 md:grid-cols-2 lg:gap-20">
              <div className="relative space-y-16 lg:space-y-20">
                <div className="absolute bottom-0 left-[31px] top-0 z-0 w-[2px] bg-primary-container" />
                {[{
                  i: "1",
                  title: t("stepTitle1"),
                  text: t("stepText1"),
                  active: true,
                }, {
                  i: "2",
                  title: t("stepTitle2"),
                  text: t("stepText2"),
                  active: false,
                }, {
                  i: "3",
                  title: t("stepTitle3"),
                  text: t("stepText3"),
                  active: false,
                }].map((step) => (
                  <div key={step.i} className="relative z-10 flex gap-8 lg:gap-12">
                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ${step.active ? "bg-secondary text-white shadow-[0_0_30px_rgba(19,105,106,0.4)]" : "border border-outline/20 bg-primary-container text-white"}`}>
                      {step.i}
                    </div>
                    <div>
                      <h4 className="mb-3 text-2xl font-bold">{step.title}</h4>
                      <p className="max-w-sm text-primary-fixed/60">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative hidden md:block">
                <div className="sticky top-40 rounded-2xl border border-white/5 bg-primary-container/30 p-8 backdrop-blur-sm">
                  <div className="mb-8 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20 text-secondary">💬</div>
                    <div className="text-sm font-bold uppercase tracking-widest text-secondary">{t("adminCardEyebrow")}</div>
                  </div>
                  <div className="space-y-6">
                    <div className="rounded-2xl bg-white/5 p-5">
                      <div className="text-sm font-bold text-white">{t("adminCardTitle")}</div>
                      <p className="mt-2 text-sm leading-6 text-primary-fixed/60">{t("adminCardText")}</p>
                    </div>
                    <Link href={withLocale("/support")} className="inline-flex rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-white transition-all hover:bg-secondary/90">
                      {t("adminCardCta")}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24 lg:px-10 lg:py-28">
          <div className="relative mx-auto flex max-w-[1680px] flex-col items-center gap-12 overflow-hidden rounded-3xl bg-surface-container-lowest p-10 md:flex-row md:gap-16 md:p-16">
            <div className="z-10 flex-1">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-secondary">
                <span className="text-sm">🛡</span>
                <span className="text-xs font-bold uppercase tracking-widest">{t("trustEyebrow")}</span>
              </div>
              <h2 className="mb-8 text-4xl font-extrabold tracking-tight text-primary md:text-5xl">{t("trustTitle")}</h2>
              <p className="mb-10 max-w-xl text-lg leading-relaxed text-on-surface-variant">
                {t("trustSubtitle")}
              </p>
              <ul className="mb-10 space-y-4">
                <li className="flex items-center gap-3 font-semibold text-primary"><span className="text-secondary">●</span>{t("trustPoint1")}</li>
                <li className="flex items-center gap-3 font-semibold text-primary"><span className="text-secondary">●</span>{t("trustPoint2")}</li>
                <li className="flex items-center gap-3 font-semibold text-primary"><span className="text-secondary">●</span>{t("trustPoint3")}</li>
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link href={withLocale("/support")} className="rounded-xl bg-primary px-6 py-3 font-bold text-white transition-all hover:bg-primary/90">
                  {t("trustSupportCta")}
                </Link>
                <a href="mailto:support@itzuun.mn" className="rounded-xl border border-surface-200 px-6 py-3 font-bold text-primary transition-all hover:border-secondary/40">
                  support@itzuun.mn
                </a>
              </div>
            </div>
            <div className="relative flex-1">
              <Image
                unoptimized
                width={960}
                height={640}
                className="relative z-10 rounded-2xl shadow-2xl"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfcAiw6tU-cbRJpatGcubv-BuDeFAlPIPia8__yYL8TlMEgMGqFmhsQYREUPtNImFColMuRPyLYakoRrwkVAd7ma4ppVBjexCbBQk4kJ6c7NzbgxT3Tb-Ft-nRa4hqREb8gNY1q0_T-sa7Mz39Jjb5wptIQl8Dqwx62DpXK4pagtRislm9rmdHo0IossrRkRN1oqXq4nm7zbjR59k1L5UocL-CpAkgmb8higlir-0nzn8z1XoIlmnUaFnb25rTmYEIqdIW8gxSTIo"
                alt="Manual admin payment workspace"
              />
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-secondary/5 blur-3xl" />
            </div>
          </div>
        </section>

        <section className="px-6 py-24 text-center lg:px-10 lg:py-28">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-5xl font-black tracking-tighter text-primary md:text-6xl">{t("finalTitle")}</h2>
            <p className="mx-auto max-w-2xl text-lg text-on-surface-variant">{t("finalSubtitle")}</p>
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Link href={withLocale("/client/projects/new")} className="rounded-md bg-gradient-to-br from-[#031636] to-[#1a2b4c] px-16 py-6 text-xl font-bold text-white transition-all hover:shadow-[0_20px_50px_rgba(3,22,54,0.2)] active:scale-95">
                {t("finalPrimaryCta")}
              </Link>
              <Link href={withLocale("/support")} className="rounded-md border border-surface-200 px-16 py-6 text-xl font-bold text-primary transition-all hover:border-primary/30 hover:bg-surface-container-low">
                {t("finalSecondaryCta")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto bg-[#eceef0] px-6 py-16 text-[#031636] lg:px-10">
        <div className="mx-auto grid max-w-[1680px] grid-cols-2 gap-12 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 text-xl font-black text-[#031636]">ITZuun</div>
            <p className="mb-6 max-w-xs text-sm text-[#191c1e]/60">{t("footerIntro")}</p>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-widest opacity-40">{t("footerCol2")}</span>
            <Link className="text-sm text-[#191c1e]/60 transition-all duration-300 hover:text-[#031636] hover:underline" href={withLocale("/about")}>{t("footerLinkAbout")}</Link>
            <Link className="text-sm text-[#191c1e]/60 transition-all duration-300 hover:text-[#031636] hover:underline" href={withLocale("/support")}>{t("footerLinkSupport")}</Link>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-widest opacity-40">{t("footerCol3")}</span>
            <Link className="text-sm text-[#191c1e]/60 transition-all duration-300 hover:text-[#031636] hover:underline" href={withLocale("/terms")}>{t("footerLinkTerms")}</Link>
            <Link className="text-sm text-[#191c1e]/60 transition-all duration-300 hover:text-[#031636] hover:underline" href={withLocale("/privacy")}>{t("footerLinkPrivacy")}</Link>
            <Link className="text-sm text-[#191c1e]/60 transition-all duration-300 hover:text-[#031636] hover:underline" href={withLocale("/projects")}>{t("footerLinkBrowse")}</Link>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-widest opacity-40">{t("footerCol4")}</span>
            <div className="flex gap-4">
              <a href="mailto:support@itzuun.mn" aria-label="Email support" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#031636]/5 text-[#031636]/50 transition-colors hover:bg-[#031636] hover:text-white">
                @
              </a>
              <a href="https://facebook.com/itzuun.works" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#031636]/5 text-[#031636]/50 transition-colors hover:bg-[#1877F2] hover:text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.2-1.6 1.6-1.6h1.7V3.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.3V10H8v3h2.7v8h2.8Z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-20 flex max-w-[1680px] flex-col items-center justify-between gap-4 border-t border-[#031636]/5 pt-8 md:flex-row">
          <p className="text-xs font-medium tracking-tight text-[#191c1e]/40">{t("footerCopyright")}</p>
          <div className="flex gap-8">
            <span className="text-xs font-bold text-secondary">{t("footerLocale")}</span>
            <span className="text-xs font-bold opacity-20">EN</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
