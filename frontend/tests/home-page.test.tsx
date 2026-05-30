import { render, screen } from "@testing-library/react";
import React from "react";
import { NextIntlClientProvider } from 'next-intl';

import HomePage from "@/app/[locale]/(public)/page";

const messages = {
  "Home": {
    "platformBadge": "WEBSITE • DESIGN • IT ҮЙЛЧИЛГЭЭ",
    "heroBadge": "Монголын IT үйлчилгээний платформ",
    "landingTitle": "ITZuun — website, design, IT үйлчилгээ авах Монгол platform",
    "landingSubtitle": "Жижиг бизнесүүдэд IT ажил хийлгэх хялбар газар",
    "landingPrimaryCta": "Захиалга өгөх",
    "landingSecondaryCta": "Ажил оруулах",
    "floatingCardEyebrow": "MVP төлбөр",
    "floatingCardText": "Төлбөрийг админтай холбогдож шийднэ",
    "statValue1": "500+",
    "statLabel1": "Баталгаажсан хөгжүүлэгч, дизайнер, QA мэргэжилтэн",
    "statValue2": "110+",
    "statLabel2": "Жижиг бизнесийн захиалгын төрөл",
    "statValue3": "2000+",
    "statLabel3": "Платформоор шийдэгдсэн нийлмэл ажлын урсгал",
    "categorySectionEyebrow": "Чиглэлүүд",
    "categorySectionTitle": "Эхний MVP үйлчилгээний ангиллууд",
    "categorySectionLink": "Захиалга өгөх",
    "categoryEyebrow1": "Engineering",
    "categoryTitle1": "Website хийх",
    "categoryEyebrow2": "Product",
    "categoryTitle2": "Landing page хийх",
    "categoryEyebrow3": "Design",
    "categoryTitle3": "Poster / social media design",
    "categoryEyebrow4": "Growth",
    "categoryTitle4": "Logo design",
    "processEyebrow": "Хэрхэн ажилладаг вэ?",
    "processTitle": "Захиалга өг. Тохирох хүнтэй холбогд. Ажлаа дуусгуул.",
    "processSubtitle": "MVP хувилбарт захиалгаа оруулсны дараа scope, хугацаа, төлбөрийн тохиролцоог админтай холбогдож энгийнээр шийднэ.",
    "stepTitle1": "Хийлгэх ажлаа оруул",
    "stepText1": "Website, design, document эсвэл support ажлын товч, төсөв, хугацаагаа бичнэ.",
    "stepTitle2": "Тохирох гүйцэтгэгчтэй холбогд",
    "stepText2": "Админ болон гүйцэтгэгчтэй шаардлагаа тодруулж, ажлын хүрээг баталгаажуулна.",
    "stepTitle3": "Төлбөрөө админтай тохир",
    "stepText3": "QPay/escrow автомат урсгалын оронд төлбөрийг админтай холбогдож шийднэ.",
    "trustEyebrow": "MVP төлбөрийн зохицуулалт",
    "trustTitle": "Төлбөрийг одоогоор админтай холбогдож шийднэ.",
    "trustSubtitle": "ITZuun-ийн эхний MVP дээр QPay/escrow автомат хамгаалалт идэвхтэй биш. Захиалга бүрийн төлбөр, баталгаажуулалт, дараагийн алхмыг админтай шууд тохиролцоно.",
    "trustPoint1": "Захиалгын дараа админ төлбөрийн мэдээллийг тодруулна",
    "trustPoint2": "Ажлын scope, үнэ, хугацааг гараар баталгаажуулна",
    "trustPoint3": "QPay/escrow автомат урсгал дараагийн хувилбарт нэмэгдэнэ",
    "finalTitle": "Жижиг бизнесийн IT ажлаа өнөөдөр оруулаарай.",
    "finalSubtitle": "Website, design, document, support ажлыг нэг газраас эхлүүл.",
    "finalPrimaryCta": "Ажил оруулах",
    "footerIntro": "Website, design, document болон IT support үйлчилгээ авах Монгол платформ.",
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
    "w2Title": "2. Админтай төлбөр тохирох",
    "w2Text": "MVP үед төлбөрийг автомат escrow-оор бус, админтай холбогдож шийднэ.",
    "w3Title": "3. Хүлээлгэн өгөх ба төлбөр гаргах",
    "w3Text": "Scope баталгаажсаны дараа гүйцэтгэлийг хянаж ажлаа хүлээн авна.",
    "f1Title": "Баталгаажсан мэргэжилтнүүд",
    "f1Text": "Бодит шалгуур давсан хөгжүүлэгч, дизайнер, QA мэргэжилтнүүдтэй ажилла.",
    "f2Title": "Manual MVP төлбөр",
    "f2Text": "QPay/escrow автомат биш; төлбөрийг админтай холбогдож шийднэ.",
    "f3Title": "Ил тод явц",
    "f3Text": "Санал, явц, харилцааг нэг дор ойлгомжтой хянах боломж.",
    "featuredProjects": "Онцлох төслүүд",
    "viewAllProjects": "Бүх төсөл харах",
    "viewDetails": "Дэлгэрэнгүй",
    "openProject": "Төсөл нээх",
    "noProjects": "Төсөл олдсонгүй.",
    "ctaTitle": "Дараагийн том төслөө эхлүүлэх үү?",
    "ctaSubtitle": "Website, design, document болон support ажлыг хялбар оруул.",
    "ctaJoin": "Захиалга өгөх",
    "ctaTalk": "Зөвлөхтэй холбогдох",
    "categoryTitle5": "Word / PDF янзлах",
    "categoryTitle6": "CV / бичиг баримт",
    "categoryTitle7": "Template customization",
    "categoryTitle8": "Computer / software support"
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
