import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
  const t = await getTranslations("AboutPage");
  
  return (
    <section className="space-y-12 pb-16">
      {/* Hero Header */}
      <div className="rounded-[3rem] bg-surface-container-low px-8 py-16 md:px-16 md:py-24">
        <h1 className="max-w-[12ch] font-headline text-[48px] font-black leading-[0.9] tracking-tighter text-primary md:text-[88px]">
          {t("title")}
        </h1>
        <p className="mt-10 max-w-[48ch] text-[18px] font-medium leading-[1.6] text-surface-600 md:text-[22px]">
          {t("description")}
        </p>
      </div>

      {/* Decorative Surface Panels */}
      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-[3rem] bg-secondary p-12 text-white">
          <h2 className="font-headline text-[32px] font-black tracking-tighter leading-none">
            Бидний зорилго
          </h2>
          <p className="mt-8 text-[16px] font-medium leading-relaxed opacity-80">
            Бид дижитал инновацийг төгс гүйцэтгэлтэй хослуулсан, төсөл бүрийг чанартай хүргэхэд зориулагдсан платформыг бүтээж байна.
          </p>
        </div>
        <div className="rounded-[3rem] bg-surface-container-lowest p-12 shadow-sm">
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
