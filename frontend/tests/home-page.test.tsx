import { render, screen } from "@testing-library/react";
import React from "react";
import { NextIntlClientProvider } from 'next-intl';

import HomePage from "@/app/[locale]/(public)/page";

const messages = {
  "Home": {
    "platformBadge": "IT ФРИЙЛАНС ПЛАТФОРМ",
    "heroBadge": "Монголын IT marketplace",
    "landingTitle": "Монголын хамгийн том нэгдсэн технологийн мэргэжилтнүүдийн талбар.",
    "landingSubtitle": "Төсөл оруулах, freelancer сонгох, escrow хамгаалалттайгаар ажлаа гүйцэтгүүлэх бүх урсгалыг нэг цэвэр, ойлгомжтой платформд төвлөрүүллээ.",
    "landingPrimaryCta": "Ажил хайх",
    "landingSecondaryCta": "Төсөл нийтлэх",
    "floatingCardEyebrow": "Escrow volume",
    "floatingCardText": "Сүүлийн 30 хоногийн хамгаалагдсан гүйлгээ",
    "statValue1": "500+",
    "statLabel1": "Баталгаажсан хөгжүүлэгч, дизайнер, QA мэргэжилтэн",
    "statValue2": "110+",
    "statLabel2": "Escrow хамгаалалттай идэвхтэй төсөл",
    "statValue3": "2000+",
    "statLabel3": "Платформоор шийдэгдсэн нийлмэл ажлын урсгал",
    "categorySectionEyebrow": "Чиглэлүүд",
    "categorySectionTitle": "Хамгийн эрэлттэй дижитал чиглэлүүд",
    "categorySectionLink": "Бүх чиглэлийг харах",
    "categoryEyebrow1": "Engineering",
    "categoryTitle1": "Web Development",
    "categoryEyebrow2": "Product",
    "categoryTitle2": "Mobile Dev",
    "categoryEyebrow3": "Design",
    "categoryTitle3": "UI/UX Strategy",
    "categoryEyebrow4": "Growth",
    "categoryTitle4": "Data Services",
    "processEyebrow": "Хэрхэн ажилладаг вэ?",
    "processTitle": "Энгийн урсгал. Ил тод хамгаалалт. Хурдан гүйцэтгэл.",
    "processSubtitle": "Клиент болон freelancer хоёрын хоорондох хамгийн эрсдэлтэй хэсгийг escrow болон тодорхой milestone урсгалаар аюулгүй болгодог.",
    "stepTitle1": "Төслийн зорилгоо тодорхойл",
    "stepText1": "Товч, шаардлага, төсөв, хугацаагаа оруулмагц тохирох мэргэжилтнүүд санал илгээнэ.",
    "stepTitle2": "Мэргэжилтнээ харьцуулж сонго",
    "stepText2": "Үнэ, хугацаа, туршлага, rating-ийг нэг дор харж хамгийн зөв сонголтоо хийнэ.",
    "stepTitle3": "Escrow-оор эрсдлээ бууруул",
    "stepText3": "Төлбөрийг шууд бус, хамгаалалттай урсгалаар барьж ажлын чанарыг баталгаажуулна.",
    "trustEyebrow": "Escrow хамгаалалт",
    "trustTitle": "ITZuun Escrow төлбөрийг 100% баталгаажуулна.",
    "trustSubtitle": "Ажил эхлэхээс өмнө төлбөр хамгаалагдсан дансанд байрлаж, milestone биелсний дараа л чөлөөлөгдөнө. Ингэснээр client, freelancer хоёр тал хоёулаа итгэлтэй ажиллана.",
    "trustPoint1": "Төлбөр урьдчилж хамгаалагдана",
    "trustPoint2": "Milestone бүр дээр ил тод баталгаажуулалт хийнэ",
    "trustPoint3": "Маргаан гарвал audit trail болон шийдвэрлэх урсгал бэлэн",
    "finalTitle": "Монголын дижитал ирээдүйг хамтдаа бүтээцгээе.",
    "finalSubtitle": "Шилдэг мэргэжилтнүүд, тодорхой workflow, аюулгүй төлбөрийн хамгаалалт гурвыг нэг дороос ав.",
    "finalPrimaryCta": "Эхлэх",
    "footerIntro": "Төсөл, freelancer, escrow урсгалыг нэг цэгт төвлөрүүлсэн Монголын IT freelance marketplace.",
    "footerCol1": "Платформ",
    "footerCol2": "Компани",
    "footerCol3": "Эрх зүй",
    "footerCol4": "Шинэчлэлт",
    "footerLinkBrowse": "Төслүүд",
    "footerLinkTalent": "Фрийлансер хайх",
    "footerLinkAbout": "Бидний тухай",
    "footerLinkSupport": "Тусламж",
    "footerLinkPrivacy": "Нууцлалын бодлого",
    "footerLinkTerms": "Үйлчилгээний нөхцөл",
    "footerInput": "Имэйл хаяг",
    "footerCopyright": "© 2026 ITZuun. Бүх эрх хуулиар хамгаалагдсан.",
    "footerLocale": "Монгол",
    "workflowTitle": "ТӨСЛИЙН УРСГАЛ",
    "w1Title": "1. Нийтлэх ба тохирох мэргэжилтэн олох",
    "w1Text": "Клиент төсөл нийтэлж, баталгаажсан фрийлансерүүд санал илгээдэг.",
    "w2Title": "2. Escrow хамгаалалт",
    "w2Text": "Ажил эхлэхээс өмнө төлбөр найдвартайгаар escrow-д хадгалагдана.",
    "w3Title": "3. Хүлээлгэн өгөх ба төлбөр гаргах",
    "w3Text": "Үр дүнг баталгаажуулсны дараа төлбөр хамгаалалттайгаар шилжинэ.",
    "f1Title": "Баталгаажсан мэргэжилтнүүд",
    "f1Text": "Бодит шалгуур давсан хөгжүүлэгч, дизайнер, QA мэргэжилтнүүдтэй ажилла.",
    "f2Title": "QPay Escrow хамгаалалт",
    "f2Text": "Ажил хүлээн авсны дараа л төлбөр гардаг найдвартай урсгал.",
    "f3Title": "Ил тод явц",
    "f3Text": "Санал, явц, харилцааг нэг дор ойлгомжтой хянах боломж.",
    "featuredProjects": "Онцлох төслүүд",
    "viewAllProjects": "Бүх төсөл харах",
    "viewDetails": "Дэлгэрэнгүй",
    "openProject": "Төсөл нээх",
    "noProjects": "Төсөл олдсонгүй.",
    "ctaTitle": "Дараагийн том төслөө эхлүүлэх үү?",
    "ctaSubtitle": "Монголын топ IT мэргэжилтнүүдтэй хамт хурдан, аюулгүй хэрэгжүүл.",
    "ctaJoin": "ITZuun-д нэгдэх",
    "ctaTalk": "Зөвлөхтэй холбогдох"
  }
};

vi.mock("@/lib/hooks", () => ({
  useProjects: () => ({
    isLoading: false,
    isError: false,
    data: {
      results: [
        { id: 10, title: "Landing page build", description: "Need freelancer", status: "open" },
      ],
    },
  }),
}));

describe("HomePage", () => {
  it("renders landing and latest projects", () => {
    render(
      <NextIntlClientProvider messages={messages} locale="mn">
        <HomePage />
      </NextIntlClientProvider>
    );

    expect(screen.getByRole("heading", { level: 1, name: messages.Home.landingTitle })).toBeInTheDocument();
    expect(screen.getByText(messages.Home.platformBadge)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: messages.Home.categorySectionTitle })).toBeInTheDocument();
  });
});
