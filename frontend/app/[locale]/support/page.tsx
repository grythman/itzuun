import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function SupportPage() {
  const t = await getTranslations("SupportPage");
  return (
    <section className="space-y-12 pb-16">
      {/* Editorial Header */}
      <div className="rounded-[3rem] bg-surface-container-low px-8 py-16 md:px-16 md:py-24">
        <h1 className="max-w-[12ch] font-headline text-[48px] font-black leading-[0.9] tracking-tighter text-primary md:text-[88px]">
          {t("title")}
        </h1>
        <p className="mt-10 max-w-[42ch] text-[18px] font-medium leading-[1.6] text-surface-600 md:text-[22px]">
          {t("description")}
        </p>
      </div>

      {/* Tonal Support Cards */}
      <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
        <div className="rounded-[3rem] bg-surface-container-lowest p-10 shadow-sm border border-outline-variant/5">
          <h2 className="font-headline text-[24px] font-black tracking-tighter text-primary">
            Direct Contact
          </h2>
          <div className="mt-8 space-y-4">
            <div className="flex flex-col gap-1 p-6 rounded-2xl bg-surface-container-low">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-surface-400 font-headline">{t("emailLabel")}</p>
              <p className="text-[18px] font-black text-primary font-headline">support@itzuun.mn</p>
            </div>
            <p className="px-2 text-[15px] font-medium leading-relaxed text-surface-500">{t("response")}</p>
          </div>
          <div className="mt-10">
            <Link href="mailto:support@itzuun.mn" className="inline-flex rounded-2xl primary-gradient px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-primary-fixed shadow-ambient transition-all hover:-translate-y-1 active:scale-95 font-headline">
              {t("contact")}
            </Link>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-[3rem] bg-secondary p-12 text-white">
          <h2 className="font-headline text-[28px] font-black tracking-tighter leading-tight">
            Need Live Assistance?
          </h2>
          <p className="mt-6 text-[15px] font-medium leading-relaxed opacity-80">
            Our curators are available Monday-Friday to help you with project scope, escrow disputes, and platform navigation.
          </p>
          <div className="mt-8 h-[2px] w-12 bg-white/20" />
        </div>
      </div>
    </section>
  );
}
