import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function ForbiddenPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations("ErrorPages");
  return (
    <section className="mx-auto max-w-3xl space-y-6 py-12">
      <div className="ui-surface p-8 text-center md:p-12">
        <p className="ui-eyebrow">Access Control</p>
        <p className="mt-3 text-[12px] font-black uppercase tracking-[0.2em] text-surface-400">403</p>
        <h1 className="mt-3 font-headline text-4xl font-extrabold tracking-tight text-surface-900 md:text-5xl">
          {t("forbiddenTitle")}
        </h1>
        <p className="mx-auto mt-4 max-w-[48ch] text-[15px] font-medium text-surface-600">
          {t("forbiddenText")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href={`/${locale}`} className="ui-btn-primary">
            {t("goHome")}
          </Link>
          <Link href={`/${locale}/support`} className="ui-btn-ghost">
            Тусламж
          </Link>
        </div>
      </div>
    </section>
  );
}
