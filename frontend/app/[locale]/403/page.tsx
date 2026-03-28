import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function ForbiddenPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations("ErrorPages");
  return (
    <section className="mx-auto max-w-2xl space-y-4 py-10 text-center">
      <p className="text-[12px] font-semibold uppercase tracking-widest text-surface-400">403</p>
      <h1 className="font-headline text-4xl font-extrabold text-surface-900">{t("forbiddenTitle")}</h1>
      <p className="text-[14px] text-surface-600">{t("forbiddenText")}</p>
      <div className="pt-2">
        <Link href={`/${locale}`} className="rounded-full primary-gradient px-6 py-2 text-[13px] font-semibold text-white">{t("goHome")}</Link>
      </div>
    </section>
  );
}
