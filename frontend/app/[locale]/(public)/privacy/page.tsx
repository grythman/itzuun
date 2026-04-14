import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("PrivacyPage");
  return (
    <section className="space-y-4">
      <h1 className="font-headline text-3xl font-extrabold text-surface-900">{t("title")}</h1>
      <div className="space-y-3 text-[14px] text-surface-600">
        <p>{t("p1")}</p>
        <p>{t("p2")}</p>
        <p>{t("p3")}</p>
      </div>
    </section>
  );
}
