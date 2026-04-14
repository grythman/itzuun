"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ErrorState, LoadingState } from "@/components/states";
import { useMe } from "@/lib/hooks";

type NotificationKind = "all" | "projects" | "payments" | "system";

type Notification = {
  id: number;
  kind: "project" | "payment" | "system" | "proposal";
  title: string;
  body: string;
  time: string;
  read: boolean;
  action?: { label: string; href: string };
};

function NotifIcon({ kind }: { kind: Notification["kind"] }) {
  const base = "h-5 w-5";
  if (kind === "project") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="currentColor" aria-hidden>
        <path d="M10 4V3h4v1h5a2 2 0 0 1 2 2v3H3V6a2 2 0 0 1 2-2h5Zm11 7H3v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8Z" />
      </svg>
    );
  }
  if (kind === "payment") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="currentColor" aria-hidden>
        <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3V6Zm0 4h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8Zm11 3a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3Z" />
      </svg>
    );
  }
  if (kind === "proposal") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="currentColor" aria-hidden>
        <path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V7h3.5L13 3.5Zm-3 9h6v1.5H10V12Zm0 3h4v1.5h-4V15Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={base} fill="currentColor" aria-hidden>
      <path d="M12 2a7 7 0 0 0-7 7v4.6L3.7 15A1 1 0 0 0 4.4 17h15.2a1 1 0 0 0 .7-1.7L19 13.6V9a7 7 0 0 0-7-7Zm0 20a3 3 0 0 0 2.8-2H9.2A3 3 0 0 0 12 22Z" />
    </svg>
  );
}

function kindColor(kind: Notification["kind"]) {
  if (kind === "payment") return "bg-secondary-fixed text-secondary";
  if (kind === "project") return "bg-primary-fixed text-primary";
  if (kind === "proposal") return "bg-surface-container-high text-surface-600";
  return "bg-surface-container-low text-surface-500";
}

// Mock data – in production these come from the API
const MOCK: Notification[] = [
  {
    id: 1,
    kind: "proposal",
    title: "Шинэ санал ирлээ",
    body: "Дорж С. таны Mobile App UI Design төсөлд санал оруулсан. Үнэ: ₮3,200,000.",
    time: "Маргааш 14:22",
    read: false,
    action: { label: "Саналыг харах", href: "/client" },
  },
  {
    id: 2,
    kind: "payment",
    title: "Эскроу баталгаажлаа",
    body: "E-Commerce Platform Rebuild – ₮8,000,000 нь Escrow дансанд аюулгүй байршлаа.",
    time: "Өнөөдөр 09:14",
    read: false,
    action: { label: "Эскроу харах", href: "/client" },
  },
  {
    id: 3,
    kind: "project",
    title: "Ажил хянагдаж байна",
    body: "AI Recommendation Engine – Гүйцэтгэгч ажлаа бэлэн гэж илгэрэхлэй. Шалгаад баталгаажуулна уу.",
    time: "Өчигдөр 17:45",
    read: false,
    action: { label: "Шалгах", href: "/client" },
  },
  {
    id: 4,
    kind: "system",
    title: "Профайл баталгаажлаа",
    body: "Таны э-мэйл хаяг амжилттай баталгаажлаа. Одоо бүрэн эрхтэйгээр ажиллаж болно.",
    time: "Өчигдөр 08:00",
    read: true,
  },
  {
    id: 5,
    kind: "payment",
    title: "Төлбөр хүлээгдэж байна",
    body: "CRM Integration – Захиалагч нэхэмжлэлийг хүлээн авсан. Төлбөр 72 цагийн дотор шилжих болно.",
    time: "2 хоногийн өмнө",
    read: true,
  },
  {
    id: 6,
    kind: "proposal",
    title: "Санал зөвшөөрөгдлөө",
    body: "Blockchain Security Audit – Таны санал захиалагчаар зөвшөөрөгдлөө. Ажлаа эхлүүлж болно.",
    time: "3 хоногийн өмнө",
    read: true,
    action: { label: "Төслийг нээх", href: "/freelancer" },
  },
];

const FILTER_TABS: { key: NotificationKind; label: string }[] = [
  { key: "all", label: "Бүгд" },
  { key: "projects", label: "Төслүүд" },
  { key: "payments", label: "Төлбөр" },
  { key: "system", label: "Систем" },
];

export default function NotificationsPage() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const [filter, setFilter] = useState<NotificationKind>("all");
  const [items, setItems] = useState<Notification[]>(MOCK);

  if (me.isLoading) return <LoadingState label="Мэдэгдлүүд ачааллаж байна..." />;
  if (me.isError || !me.data) {
    return (
      <ErrorState
        label="Мэдэгдлүүдийг харахын тулд нэвтэрнэ үү."
        action={<Link href={withLocale("/auth?tab=signin")} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-fixed">Нэвтрэх</Link>}
      />
    );
  }

  const filtered = items.filter((n) => {
    if (filter === "all") return true;
    if (filter === "projects") return n.kind === "project" || n.kind === "proposal";
    if (filter === "payments") return n.kind === "payment";
    if (filter === "system") return n.kind === "system";
    return true;
  });

  const unreadCount = items.filter((n) => !n.read).length;

  function markAll() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markOne(id: number) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  const today = filtered.filter((n) => n.time.startsWith("Өнөөдөр") || n.time.startsWith("Маргааш"));
  const yesterday = filtered.filter((n) => n.time.startsWith("Өчигдөр"));
  const older = filtered.filter(
    (n) => !n.time.startsWith("Өнөөдөр") && !n.time.startsWith("Маргааш") && !n.time.startsWith("Өчигдөр"),
  );

  const groups = [
    { label: "Шинэ", items: today },
    { label: "Өчигдөр", items: yesterday },
    { label: "Эрт үе", items: older },
  ].filter((g) => g.items.length > 0);

  return (
    <section className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-surface-400 font-headline">
            Мэдэгдлийн төв
          </p>
          <h1 className="mt-3 font-headline text-[36px] font-black leading-none tracking-tighter text-primary md:text-[44px]">
            Мэдэгдлүүд
            {unreadCount > 0 && (
              <span className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-[11px] font-black text-white font-headline">
                {unreadCount}
              </span>
            )}
          </h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAll}
            className="hidden min-h-11 items-center rounded-2xl bg-surface-container-lowest px-6 text-[11px] font-bold uppercase tracking-[0.18em] text-primary shadow-sm transition-all hover:shadow-ambient md:inline-flex font-headline"
          >
            Бүгдийг уншсан гэж тэмдэглэх
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => {
          const active = tab.key === filter;
          const count =
            tab.key === "all"
              ? unreadCount
              : items.filter((n) => {
                  if (tab.key === "projects") return (n.kind === "project" || n.kind === "proposal") && !n.read;
                  if (tab.key === "payments") return n.kind === "payment" && !n.read;
                  if (tab.key === "system") return n.kind === "system" && !n.read;
                  return false;
                }).length;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all font-headline ${
                active
                  ? "bg-primary text-primary-fixed shadow-ambient"
                  : "bg-surface-container-lowest text-surface-500 hover:bg-surface-container-low hover:text-primary shadow-sm"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${active ? "bg-white/20 text-white" : "bg-red-100 text-red-600"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification Groups */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2.5rem] bg-surface-container-lowest py-24 shadow-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low text-surface-300">
            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor" aria-hidden>
              <path d="M12 2a7 7 0 0 0-7 7v4.6L3.7 15A1 1 0 0 0 4.4 17h15.2a1 1 0 0 0 .7-1.7L19 13.6V9a7 7 0 0 0-7-7Zm0 20a3 3 0 0 0 2.8-2H9.2A3 3 0 0 0 12 22Z" />
            </svg>
          </div>
          <p className="mt-6 font-headline text-lg font-black text-primary">Мэдэгдэл байхгүй</p>
          <p className="mt-2 text-sm font-medium text-surface-400">Шинэ үйл явдал гарах үед энд мэдэгдэх болно.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-4 ml-2 text-[10px] font-black uppercase tracking-[0.22em] text-surface-400 font-headline">
                {group.label}
              </p>
              <div className="overflow-hidden rounded-[2.5rem] bg-surface-container-lowest shadow-sm">
                {group.items.map((notif, i) => (
                  <div
                    key={notif.id}
                    onClick={() => markOne(notif.id)}
                    className={`group flex items-start gap-5 px-8 py-7 transition-all hover:bg-surface-container-low cursor-pointer ${
                      i > 0 ? "border-t border-outline-variant/10" : ""
                    } ${!notif.read ? "bg-primary-fixed/20" : ""}`}
                  >
                    {/* Icon */}
                    <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ${kindColor(notif.kind)}`}>
                      <NotifIcon kind={notif.kind} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <p className={`font-headline text-[15px] font-bold leading-tight tracking-tight ${!notif.read ? "text-primary" : "text-on-surface"}`}>
                          {notif.title}
                          {!notif.read && (
                            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-secondary align-middle" />
                          )}
                        </p>
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-surface-400 font-headline">
                          {notif.time}
                        </span>
                      </div>
                      <p className="mt-2 text-[13px] font-medium leading-relaxed text-surface-500">
                        {notif.body}
                      </p>
                      {notif.action && (
                        <Link
                          href={withLocale(notif.action.href)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-4 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-secondary transition-all hover:opacity-70 font-headline"
                        >
                          {notif.action.label}
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 12h14M13 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom CTA row */}
      {unreadCount > 0 && (
        <div className="flex justify-center md:hidden">
          <button
            onClick={markAll}
            className="min-h-11 rounded-2xl bg-surface-container-lowest px-6 text-[11px] font-bold uppercase tracking-[0.18em] text-primary shadow-sm transition-all hover:shadow-ambient font-headline"
          >
            Бүгдийг уншсан гэж тэмдэглэх
          </button>
        </div>
      )}
    </section>
  );
}
