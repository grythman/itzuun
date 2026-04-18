"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ErrorState, LoadingState } from "@/components/shared/states";
import { notificationsApi, toArray } from "@/lib/api/endpoints";
import { useMe } from "@/lib/hooks";

type NotificationKind = "all" | "projects" | "payments" | "system";

type NotificationApi = {
  id: number;
  type: string;
  title: string;
  description: string;
  is_read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
};

type NotificationItem = {
  id: number;
  kind: "project" | "payment" | "system" | "proposal";
  title: string;
  body: string;
  read: boolean;
  timeLabel: string;
  dayBucket: "today" | "yesterday" | "earlier";
  action?: { label: string; href: string };
};

function normalizeKind(rawType: string): NotificationItem["kind"] {
  const value = rawType.toLowerCase();
  if (value.includes("proposal")) return "proposal";
  if (value.includes("payment") || value.includes("escrow")) return "payment";
  if (value.includes("project")) return "project";
  return "system";
}

function normalizeAction(metadata?: Record<string, unknown>) {
  const action = (metadata?.action || null) as { label?: unknown; href?: unknown } | null;
  if (!action || typeof action.href !== "string") return undefined;
  const label = typeof action.label === "string" && action.label.trim() ? action.label : "Нээх";
  return { label, href: action.href };
}

function toTimeLabel(createdAt: string) {
  const current = new Date();
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return { dayBucket: "earlier" as const, timeLabel: "" };
  }

  const today = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  const target = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const diff = Math.round((today.getTime() - target.getTime()) / 86400000);
  const hhmm = parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (diff === 0) return { dayBucket: "today" as const, timeLabel: `Өнөөдөр ${hhmm}` };
  if (diff === 1) return { dayBucket: "yesterday" as const, timeLabel: `Өчигдөр ${hhmm}` };
  return { dayBucket: "earlier" as const, timeLabel: `${parsed.toLocaleDateString()} ${hhmm}` };
}

function NotifIcon({ kind }: { kind: NotificationItem["kind"] }) {
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

function kindColor(kind: NotificationItem["kind"]) {
  if (kind === "payment") return "bg-secondary-fixed text-secondary";
  if (kind === "project") return "bg-primary-fixed text-primary";
  if (kind === "proposal") return "bg-surface-container-high text-on-surface/70";
  return "bg-surface-container-low text-on-surface/60";
}

const FILTER_TABS: { key: NotificationKind; label: string }[] = [
  { key: "all", label: "Бүгд" },
  { key: "projects", label: "Төслүүд" },
  { key: "payments", label: "Төлбөр" },
  { key: "system", label: "Систем" },
];

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const [filter, setFilter] = useState<NotificationKind>("all");

  const notifQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(),
    enabled: !!me.data,
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const items = useMemo<NotificationItem[]>(() => {
    const rows = toArray<NotificationApi>(notifQuery.data as NotificationApi[]);
    return rows.map((row) => {
      const time = toTimeLabel(row.created_at);
      return {
        id: row.id,
        kind: normalizeKind(row.type),
        title: row.title,
        body: row.description,
        read: row.is_read,
        timeLabel: time.timeLabel,
        dayBucket: time.dayBucket,
        action: normalizeAction(row.metadata),
      };
    });
  }, [notifQuery.data]);

  if (me.isLoading) return <LoadingState label="Мэдэгдлүүд ачааллаж байна..." />;
  if (me.isError || !me.data) {
    return (
      <ErrorState
        label="Мэдэгдлүүдийг харахын тулд нэвтэрнэ үү."
        action={
          <Link href={withLocale("/auth?tab=signin")} className="ui-btn-primary">
            Нэвтрэх
          </Link>
        }
      />
    );
  }

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "projects") return item.kind === "project" || item.kind === "proposal";
    if (filter === "payments") return item.kind === "payment";
    if (filter === "system") return item.kind === "system";
    return true;
  });

  const unreadCount = items.filter((item) => !item.read).length;
  const unreadProjects = items.filter((item) => !item.read && (item.kind === "project" || item.kind === "proposal")).length;
  const unreadPayments = items.filter((item) => !item.read && item.kind === "payment").length;
  const unreadSystem = items.filter((item) => !item.read && item.kind === "system").length;
  const latestEventLabel = items[0]?.timeLabel || "Шинэ мэдэгдэлгүй";

  const groups = [
    { label: "Шинэ", bucket: "today" as const, items: filteredItems.filter((item) => item.dayBucket === "today") },
    { label: "Өчигдөр", bucket: "yesterday" as const, items: filteredItems.filter((item) => item.dayBucket === "yesterday") },
    { label: "Эрт үе", bucket: "earlier" as const, items: filteredItems.filter((item) => item.dayBucket === "earlier") },
  ].filter((group) => group.items.length > 0);

  return (
    <section className="space-y-6 pb-10">
      <div className="ui-surface p-4 sm:p-5 lg:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-surface-container-low px-4 py-4 sm:px-5">
          <div>
            <p className="ui-eyebrow">Notification Center</p>
            <h1 className="mt-2 font-headline text-[2rem] font-black leading-none tracking-tight text-primary sm:text-[2.25rem]">
              Мэдэгдлүүд
            </h1>
            <p className="mt-2 text-sm font-medium text-on-surface/60">
              Шинэ update-уудаа эрэмбэлж, дараагийн алхмаа хурдан тодорхойлно.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="inline-flex h-8 items-center rounded-full bg-red-100 px-3 text-xs font-black uppercase tracking-[0.16em] text-red-600">
                {unreadCount} шинэ
              </span>
            )}
            <button
              type="button"
              onClick={() => markAllMutation.mutate()}
              disabled={unreadCount === 0 || markAllMutation.isPending}
              className="ui-btn-ghost disabled:opacity-45"
            >
              Бүгдийг уншсан болгох
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_290px]">
          <div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {FILTER_TABS.map((tab) => {
                const active = tab.key === filter;
                const count =
                  tab.key === "all"
                    ? unreadCount
                    : items.filter((item) => {
                        if (tab.key === "projects") return !item.read && (item.kind === "project" || item.kind === "proposal");
                        if (tab.key === "payments") return !item.read && item.kind === "payment";
                        if (tab.key === "system") return !item.read && item.kind === "system";
                        return false;
                      }).length;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilter(tab.key)}
                    className={[
                      "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-[11px] font-black uppercase tracking-[0.16em] transition-all",
                      active
                        ? "bg-primary text-primary-fixed shadow-[0_12px_24px_rgba(3,22,54,0.18)]"
                        : "bg-surface-container-low text-on-surface/65 hover:bg-surface-container",
                    ].join(" ")}
                  >
                    <span>{tab.label}</span>
                    {count > 0 && (
                      <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] ${active ? "bg-white/20 text-white" : "bg-red-100 text-red-600"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {notifQuery.isLoading && <LoadingState label="Мэдэгдэл ачааллаж байна..." />}

            {notifQuery.isError && (
              <div className="mt-4 rounded-2xl bg-surface-container-low p-5 text-center">
                <p className="text-sm font-semibold text-primary">Мэдэгдлийн мэдээлэл дуудаж чадсангүй.</p>
                <button type="button" onClick={() => notifQuery.refetch()} className="mt-3 ui-btn-ghost">
                  Дахин оролдох
                </button>
              </div>
            )}

            {!notifQuery.isLoading && !notifQuery.isError && groups.length === 0 && (
              <div className="mt-4 rounded-2xl bg-surface-container-low p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface/35 shadow-[0_12px_24px_rgba(3,22,54,0.06)]">
                  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden>
                    <path d="M12 2a7 7 0 0 0-7 7v4.6L3.7 15A1 1 0 0 0 4.4 17h15.2a1 1 0 0 0 .7-1.7L19 13.6V9a7 7 0 0 0-7-7Zm0 20a3 3 0 0 0 2.8-2H9.2A3 3 0 0 0 12 22Z" />
                  </svg>
                </div>
                <p className="mt-5 text-lg font-black text-primary">Мэдэгдэл алга байна</p>
                <p className="mt-2 text-sm text-on-surface/60">Шинэ үйл явдал гарахад энд автоматаар нэмэгдэнэ.</p>
                <Link href={withLocale("/projects")} className="mt-5 ui-btn-secondary">
                  Төсөл үзэх
                </Link>
              </div>
            )}

            {!notifQuery.isLoading && !notifQuery.isError && groups.length > 0 && (
              <div className="mt-4 space-y-5">
                {groups.map((group) => (
                  <div key={group.bucket} className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                    <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/45">{group.label}</p>
                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <article
                          key={item.id}
                          className={[
                            "w-full rounded-xl px-4 py-4 text-left transition-all",
                            item.read
                              ? "bg-surface-container-lowest"
                              : "bg-primary-fixed/30 shadow-[0_12px_24px_rgba(3,22,54,0.08)]",
                          ].join(" ")}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${kindColor(item.kind)}`}>
                              <NotifIcon kind={item.kind} />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-start justify-between gap-2">
                                <span className="text-sm font-bold leading-tight text-primary">
                                  {item.title}
                                  {!item.read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-secondary align-middle" />}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface/45">{item.timeLabel}</span>
                              </span>
                              <span className="mt-1 block text-sm font-medium leading-relaxed text-on-surface/68">{item.body}</span>
                              {!item.read && (
                                <button
                                  type="button"
                                  onClick={() => markOneMutation.mutate(item.id)}
                                  className="mt-3 inline-flex text-[10px] font-black uppercase tracking-[0.16em] text-primary underline underline-offset-4"
                                >
                                  Уншсан болгох
                                </button>
                              )}
                              {item.action && (
                                <Link
                                  href={withLocale(item.action.href)}
                                  className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-secondary underline underline-offset-4"
                                >
                                  {item.action.label}
                                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                                    <path d="M5 12h14M13 5l7 7-7 7" />
                                  </svg>
                                </Link>
                              )}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="ui-surface-soft h-fit p-4">
            <p className="ui-eyebrow">Insights</p>
            <h2 className="mt-2 font-headline text-[1.35rem] font-black tracking-tight text-primary">
              Шуурхай тойм
            </h2>
            <p className="mt-2 text-xs font-medium text-on-surface/60">
              Сүүлд шинэчлэгдсэн: {latestEventLabel}
            </p>

            <div className="mt-4 space-y-2">
              <div className="rounded-xl bg-surface-container-low px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface/45">Төсөл / санал</p>
                <p className="mt-1 text-2xl font-black tracking-tight text-primary">{unreadProjects}</p>
              </div>
              <div className="rounded-xl bg-surface-container-low px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface/45">Төлбөр / escrow</p>
                <p className="mt-1 text-2xl font-black tracking-tight text-primary">{unreadPayments}</p>
              </div>
              <div className="rounded-xl bg-surface-container-low px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface/45">Систем</p>
                <p className="mt-1 text-2xl font-black tracking-tight text-primary">{unreadSystem}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-surface-container-low p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface/45">
                Дараагийн алхам
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Link href={withLocale("/messages")} className="ui-btn-ghost">
                  Мессеж рүү очих
                </Link>
                <Link href={withLocale("/projects")} className="ui-btn-ghost">
                  Төсөл шалгах
                </Link>
                <Link href={withLocale("/support")} className="ui-btn-ghost">
                  Тусламж
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
