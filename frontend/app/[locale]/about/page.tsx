import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
  const t = await getTranslations("AboutPage");
  return (
    <section className="space-y-4">
      <h1 className="font-headline text-3xl font-extrabold text-surface-900">{t("title")}</h1>
      <p className="max-w-3xl text-[14px] leading-relaxed text-surface-600">
        {t("description")}
      </p>
    </section>
  );
}
