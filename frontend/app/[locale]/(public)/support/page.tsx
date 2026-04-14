"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type FaqItem = { q: string; a: string };

const FAQS: FaqItem[] = [
  {
    q: "Хэрхэн төсөл нийтлэх вэ?",
    a: "Төсөл нийтлэхийн тулд та ITZuun-д бүртгэлтэй байх шаардлагатай. 'Төсөл эхлүүлэх' товчийг дарж, ажлын тайлбар, төсөв болон шаардлагатай чадваруудыг оруулна уу. Бид таны төслийг 24 цагийн дотор хянаж, нийтлэх болно.",
  },
  {
    q: "Эскроу төлбөр хэрхэн ажилладаг вэ?",
    a: "Эскроу систем нь захиалагч болон гүйцэтгэгч талуудын аюулгүй байдлыг хангах зорилготой. Захиалагч төлбөрийг ITZuun-ийн хамгаалалтын дансанд байршуулж, гүйцэтгэгч ажлаа хүлээлгэн өгч, захиалагч баталгаажуулсны дараа төлбөр гүйцэтгэгч рүү шилжинэ.",
  },
  {
    q: "Дансны мэдээллээ яаж шинэчлэх вэ?",
    a: "Та өөрийн 'Профайл' цэс рүү орж 'Тохиргоо' хэсгийг сонгоно уу. Эндээс та холбоо барих мэдээлэл, нууц үг болон төлбөрийн хэрэгслүүдээ шинэчлэх боломжтой. Аюулгүй байдлын үүднээс зарим мэдээллийг өөрчлөхөд имэйл баталгаажуулалт шаардагдана.",
  },
  {
    q: "Маргаан үүссэн тохиолдолд яах вэ?",
    a: "Ажлын явцад маргаан үүсвэл манай 'Resolution Center' буюу Маргаан шийдвэрлэх төвд хандах боломжтой. Манай мэргэжилтнүүд хоёр талын баримт болон ажлын гүйцэтгэлийг хянаж, шударга шийдвэр гаргахад тусална.",
  },
];

const CATEGORIES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden>
        <path d="M14 3c3.9 0 7 3.1 7 7 0 2.1-.9 4.1-2.4 5.4l-2.2 2.2-3.2-3.2 2.2-2.2A5.4 5.4 0 0 0 14 3Zm-3.3 8.1L3 18.8V21h2.2l7.7-7.7-2.2-2.2Zm-5 8.9H4v-1.7l5.8-5.8 1.7 1.7L5.7 20Z" />
      </svg>
    ),
    label: "Getting Started",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden>
        <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3V6Zm0 4h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8Zm11 3a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3Z" />
      </svg>
    ),
    label: "Payments",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden>
        <path d="M12 2 4 5v6c0 5.6 3.8 10.8 8 12 4.2-1.2 8-6.4 8-12V5l-8-3Zm-1 13-3-3 1.4-1.4L11 12.2l3.6-3.6L16 10l-5 5Z" />
      </svg>
    ),
    label: "Escrow",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden>
        <path d="m23 12-2.4-2.8.3-3.7-3.6-.8L15.4 1 12 2.5 8.6 1 6.7 4.7l-3.6.8.3 3.7L1 12l2.4 2.8-.3 3.7 3.6.8L8.6 23l3.4-1.5 3.4 1.5 1.9-3.7 3.6-.8-.3-3.7L23 12Zm-12 4-4-4 1.4-1.4 2.6 2.6 5.6-5.6L18 8l-7 8Z" />
      </svg>
    ),
    label: "Trust & Safety",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden>
        <path d="M12 2a8 8 0 0 0-8 8v3a3 3 0 0 0 3 3h1v-6H6v-1a6 6 0 1 1 12 0v1h-2v6h1a3 3 0 0 0 3-3v-3a8 8 0 0 0-8-8Zm-3 9h6v7H9v-7Zm1 8h4v1a2 2 0 1 1-4 0v-1Z" />
      </svg>
    ),
    label: "Support",
  },
];

const SIDEBAR_LINKS = [
  { icon: "🚀", label: "Getting Started" },
  { icon: "💳", label: "Payments & Escrow" },
  { icon: "📋", label: "Project Management" },
  { icon: "🔒", label: "Account Security" },
  { icon: "🛠", label: "Technical Support" },
];

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-sm transition-all">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between px-8 py-7 text-left group"
          >
            <span className="font-headline text-lg font-bold text-primary md:text-xl">{item.q}</span>
            <span
              className={`ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-secondary transition-transform duration-300 ${open === i ? "rotate-180" : ""}`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="m7 10 5 5 5-5H7Z" />
              </svg>
            </span>
          </button>
          {open === i && (
            <div className="px-8 pb-8 text-[15px] font-medium leading-relaxed text-surface-500">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SupportPage() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);

  const filteredFaqs = FAQS.filter(
    (f) =>
      !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-container-low px-8 py-16 text-center md:py-24">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-secondary/5 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative mx-auto max-w-3xl">
          <h1 className="font-headline text-[44px] font-extrabold leading-tight tracking-tighter text-primary md:text-[64px]">
            Бид танд хэрхэн туслах вэ?
          </h1>
          <div className="relative mt-10 flex items-center">
            <span className="pointer-events-none absolute left-6 text-surface-400">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Түлхүүр үгээр хайх..."
              className="w-full rounded-2xl border-none bg-surface-container-lowest py-6 pl-16 pr-8 text-lg font-medium text-on-surface shadow-sm transition-all placeholder:text-surface-400 focus:ring-2 focus:ring-secondary/20 focus:shadow-ambient"
            />
          </div>
          <p className="mt-6 text-[15px] font-medium text-surface-500">
            Түгээмэл асуултууд болон заавар зөвлөмжүүд
          </p>
        </div>
      </section>

      {/* Category Tiles */}
      <section className="relative -mt-8 z-10 mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {CATEGORIES.map((cat, i) => (
            <button
              key={i}
              onClick={() => setActiveCategory(i)}
              className={`group flex flex-col items-center rounded-[2rem] p-8 text-center transition-all ${
                activeCategory === i
                  ? "bg-primary text-primary-fixed shadow-ambient"
                  : "bg-surface-container-lowest text-surface-500 shadow-sm hover:bg-surface-container-low hover:text-primary"
              }`}
            >
              <div
                className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors ${
                  activeCategory === i ? "bg-white/15" : "bg-surface-container text-secondary group-hover:bg-secondary/10"
                }`}
              >
                {cat.icon}
              </div>
              <span className="font-headline text-sm font-bold tracking-tight md:text-[15px]">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Main content: sidebar + FAQ */}
      <section className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-16 md:flex-row md:px-8 md:py-24">
        {/* Sidebar */}
        <aside className="w-full shrink-0 md:w-64">
          <div className="sticky top-24 rounded-[2rem] bg-surface-container-low p-6">
            <div className="mb-6">
              <h4 className="font-headline text-xl font-extrabold text-primary">Ангилал</h4>
              <p className="mt-1 text-sm font-medium text-surface-500">Хайлтаа нарийвчлах</p>
            </div>
            <nav className="space-y-1">
              {SIDEBAR_LINKS.map((link, i) => (
                <button
                  key={i}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition-all font-headline ${
                    i === activeCategory
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-surface-500 hover:bg-surface-container hover:text-primary"
                  }`}
                  onClick={() => setActiveCategory(i)}
                >
                  <span className="text-base">{link.icon}</span>
                  {link.label}
                </button>
              ))}
            </nav>
            {/* Expert card */}
            <div className="mt-8 overflow-hidden rounded-2xl bg-primary p-6 text-center text-white">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12Zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8Z" />
                </svg>
              </div>
              <p className="text-sm font-bold">Expert Guidance</p>
              <Link
                href={`mailto:support@itzuun.mn`}
                className="mt-4 flex w-full items-center justify-center rounded-xl bg-secondary py-2.5 text-xs font-bold text-white transition-all hover:brightness-110"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </aside>

        {/* FAQ section */}
        <div className="flex-1 space-y-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-surface-400 font-headline">
              Тусламж
            </p>
            <h2 className="mt-3 font-headline text-[32px] font-extrabold tracking-tighter text-primary md:text-[40px]">
              Түгээмэл асуултууд
            </h2>
            <p className="mt-2 text-[15px] font-medium text-surface-500">
              Шинэ хэрэглэгчдэд зориулсан үндсэн мэдээллүүд
            </p>
          </div>

          {filteredFaqs.length > 0 ? (
            <FaqAccordion items={filteredFaqs} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[2.5rem] bg-surface-container-lowest py-20 text-center shadow-sm">
              <p className="font-headline text-lg font-black text-primary">
                &ldquo;{search}&rdquo; — хайлтын үр дүн олдсонгүй
              </p>
              <p className="mt-2 text-sm font-medium text-surface-500">
                Өөр түлхүүр үг ашиглана уу эсвэл бидэнтэй холбогдоно уу.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24 md:px-8">
        <div className="relative overflow-hidden rounded-[3rem] bg-primary-container p-12 md:p-16 lg:p-20">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
          <div className="relative z-10 flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
            <div className="max-w-lg">
              <h2 className="font-headline text-[36px] font-extrabold leading-tight tracking-tighter text-white md:text-[44px]">
                Хайсан зүйлээ олсонгүй юу?
              </h2>
              <p className="mt-5 text-[16px] font-medium leading-relaxed text-white/70">
                Манай туслах ажилтнууд танд 24/7 туслахад бэлэн байна. Бидэнд хүсэлтээ илгээгээрэй.
              </p>
            </div>
            <Link
              href="mailto:support@itzuun.mn"
              className="inline-flex min-h-14 shrink-0 items-center rounded-2xl bg-secondary px-10 font-headline text-[15px] font-extrabold uppercase tracking-[0.14em] text-white shadow-ambient transition-all hover:-translate-y-0.5 hover:brightness-110"
            >
              Бидэнтэй холбогдох
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
