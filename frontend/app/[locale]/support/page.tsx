import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function SupportPage() {
  const t = await getTranslations("SupportPage");
  return (
    <section className="space-y-4">
      <h1 className="font-headline text-3xl font-extrabold text-surface-900">{t("title")}</h1>
      <p className="max-w-3xl text-[14px] leading-relaxed text-surface-600">
        {t("description")}
      </p>
      <div className="rounded-2xl border border-surface-200/60 bg-white p-5 text-[14px] text-surface-600">
        <p>{t("emailLabel")}: support@itzuun.mn</p>
        <p className="mt-1">{t("response")}</p>
        <div className="mt-4">
          <Link href="mailto:support@itzuun.mn" className="rounded-full primary-gradient px-5 py-2 text-[13px] font-semibold text-white">
            {t("contact")}
          </Link>
        </div>
      </div>
    </section>
  );
}
