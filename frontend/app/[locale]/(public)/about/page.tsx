import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
  const t = await getTranslations("AboutPage");
  
  return (
    <section className="space-y-8 pb-16">
      {/* Hero Header */}
      <div className="ui-surface p-8 md:p-14">
        <p className="ui-eyebrow">About ITZuun</p>
        <h1 className="max-w-[12ch] font-headline text-[48px] font-black leading-[0.9] tracking-tighter text-primary md:text-[88px]">
          {t("title")}
        </h1>
        <p className="mt-10 max-w-[48ch] text-[18px] font-medium leading-[1.6] text-surface-600 md:text-[22px]">
          {t("description")}
        </p>
      </div>

      {/* Decorative Surface Panels */}
      <div className="grid gap-8 md:grid-cols-2">
        <div className="ui-surface p-10 md:p-12 bg-secondary text-white">
          <h2 className="font-headline text-[32px] font-black tracking-tighter leading-none">
            Бидний зорилго
          </h2>
          <p className="mt-8 text-[16px] font-medium leading-relaxed opacity-80">
            Бид дижитал инновацийг төгс гүйцэтгэлтэй хослуулсан, төсөл бүрийг чанартай хүргэхэд зориулагдсан платформыг бүтээж байна.
          </p>
        </div>
        <div className="ui-surface p-10 md:p-12">
          <h2 className="font-headline text-[32px] font-black tracking-tighter leading-none text-primary">
            Сонгосон чадварлаг мэргэжилтнүүд
          </h2>
          <p className="mt-8 text-[16px] font-medium leading-relaxed text-surface-500">
            Itzuun нь шилдэг ур чадвартай фрилансерүүдийг цуглуулж, харилцагчдад хамгийн найдвартай мэргэжлийн үйлчилгээ үзүүлэх боломжийг бүрдүүлдэг.
          </p>
        </div>
      </div>
    </section>
  );
}
