"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ErrorState, LoadingState } from "@/components/shared/states";
import { messagingApi, projectsApi, toArray } from "@/lib/api/endpoints";
import { useMe } from "@/lib/hooks";

type InboxThreadApi = {
  id: number;
  project_title?: string;
  name?: string;
  avatar?: string;
  role?: "client" | "freelancer";
  lastMessage?: string;
  time?: string;
  unread?: number;
};

type MessageApi = {
  id: number;
  sender: number;
  type: "text" | "file";
  text: string;
  created_at: string;
};

type Thread = {
  id: number;
  title: string;
  name: string;
  avatar: string;
  role: "client" | "freelancer";
  lastMessage: string;
  time: string;
  unread: number;
};

type ThreadFilter = "all" | "unread";

function formatMessageTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatMessageDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("mn-MN", { month: "short", day: "numeric" });
}

function roleLabel(role: Thread["role"]) {
  return role === "client" ? "Захиалагч" : "Фрилансер";
}

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const [search, setSearch] = useState("");
  const [threadFilter, setThreadFilter] = useState<ThreadFilter>("all");
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [composer, setComposer] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  const inboxQuery = useQuery({
    queryKey: ["globalInbox"],
    queryFn: () => messagingApi.globalInbox(),
    enabled: !!me.data,
  });

  const inboxRows = useMemo(
    () => toArray<InboxThreadApi>(inboxQuery.data as InboxThreadApi[]),
    [inboxQuery.data],
  );

  const threads = useMemo<Thread[]>(
    () =>
      inboxRows.map((row) => ({
        id: row.id,
        title: row.project_title || `Төсөл #${row.id}`,
        name: row.name || "Unknown",
        avatar: row.avatar || (row.name?.slice(0, 1).toUpperCase() || "?"),
        role: row.role || "client",
        lastMessage: row.lastMessage || "Мессеж байхгүй.",
        time: row.time || "",
        unread: row.unread || 0,
      })),
    [inboxRows],
  );

  useEffect(() => {
    if (!activeThreadId && threads.length > 0) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId]);

  const filteredThreads = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return threads.filter((thread) => {
      const passThreadFilter = threadFilter === "all" || thread.unread > 0;
      if (!passThreadFilter) return false;
      if (!keyword) return true;
      return (
        thread.name.toLowerCase().includes(keyword) ||
        thread.title.toLowerCase().includes(keyword) ||
        thread.lastMessage.toLowerCase().includes(keyword)
      );
    });
  }, [threads, search, threadFilter]);

  const unreadThreads = useMemo(
    () => threads.filter((thread) => thread.unread > 0).length,
    [threads],
  );

  const totalUnreadMessages = useMemo(
    () => threads.reduce((sum, thread) => sum + thread.unread, 0),
    [threads],
  );

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) || null,
    [threads, activeThreadId],
  );

  const messagesQuery = useQuery({
    queryKey: ["projectMessages", activeThreadId],
    queryFn: () => messagingApi.getProjectMessages(activeThreadId!),
    enabled: !!activeThreadId,
  });

  const messages = useMemo(() => {
    const rows = toArray<MessageApi>(messagesQuery.data as MessageApi[]);
    return [...rows].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return aTime - bTime;
    });
  }, [messagesQuery.data]);

  const sendMutation = useMutation({
    mutationFn: (text: string) => projectsApi.sendMessage(activeThreadId!, text, "text"),
    onSuccess: () => {
      setComposer("");
      setSendError(null);
      queryClient.invalidateQueries({ queryKey: ["projectMessages", activeThreadId] });
      queryClient.invalidateQueries({ queryKey: ["globalInbox"] });
    },
    onError: (error: Error) => {
      setSendError(error.message || "Мессеж илгээхэд алдаа гарлаа.");
    },
  });

  function sendMessage() {
    const value = composer.trim();
    if (!value || !activeThreadId || sendMutation.isPending) return;
    sendMutation.mutate(value);
  }

  if (me.isLoading) return <LoadingState label="Мессежүүд ачааллаж байна..." />;
  if (me.isError || !me.data) {
    return (
      <ErrorState
        label="Мессежүүдийг харахын тулд нэвтэрнэ үү."
        action={
          <Link href={withLocale("/auth?tab=signin")} className="ui-btn-primary">
            Нэвтрэх
          </Link>
        }
      />
    );
  }

  return (
    <section className="pb-10">
      <div className="ui-surface p-3 sm:p-4 lg:p-5">
        <div className="mb-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-surface-container-low p-3.5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface/45">
              Нийт thread
            </p>
            <p className="mt-2 font-headline text-3xl font-black leading-none tracking-tight text-primary">
              {threads.length}
            </p>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-3.5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface/45">
              Уншаагүй thread
            </p>
            <p className="mt-2 font-headline text-3xl font-black leading-none tracking-tight text-primary">
              {unreadThreads}
            </p>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-3.5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface/45">
              Уншаагүй мессеж
            </p>
            <p className="mt-2 font-headline text-3xl font-black leading-none tracking-tight text-primary">
              {totalUnreadMessages}
            </p>
          </div>
        </div>

        <div className="grid min-h-[calc(100vh-220px)] gap-3 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="ui-surface-soft flex min-h-[320px] flex-col p-3 sm:p-4">
            <div className="rounded-2xl bg-surface-container-low px-4 py-4">
              <p className="ui-eyebrow">Communication</p>
              <h1 className="mt-2 font-headline text-[1.6rem] font-black tracking-tight text-primary">Мессежүүд</h1>
              <p className="mt-1 text-xs font-medium text-on-surface/60">
                Төслийн харилцааг нэг дэлгэц дээрээс удирдана.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setThreadFilter("all")}
                  className={[
                    "inline-flex min-h-9 items-center rounded-lg px-3 text-[10px] font-black uppercase tracking-[0.14em]",
                    threadFilter === "all"
                      ? "bg-primary text-primary-fixed"
                      : "bg-surface-container-lowest text-on-surface/60",
                  ].join(" ")}
                >
                  Бүгд
                </button>
                <button
                  type="button"
                  onClick={() => setThreadFilter("unread")}
                  className={[
                    "inline-flex min-h-9 items-center rounded-lg px-3 text-[10px] font-black uppercase tracking-[0.14em]",
                    threadFilter === "unread"
                      ? "bg-primary text-primary-fixed"
                      : "bg-surface-container-lowest text-on-surface/60",
                  ].join(" ")}
                >
                  Уншаагүй
                </button>
              </div>
              <div className="mt-4">
                <label htmlFor="thread-search" className="sr-only">
                  Thread хайлт
                </label>
                <div className="flex min-h-11 items-center gap-2 rounded-xl bg-surface-container-lowest px-3 shadow-[0_8px_20px_rgba(3,22,54,0.04)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-on-surface/45" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    id="thread-search"
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Төсөл эсвэл хүний нэр..."
                    className="w-full bg-transparent px-0 py-0 text-sm font-medium text-on-surface placeholder:text-on-surface/45 focus:ring-0"
                  />
                </div>
              </div>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface/45">
                {filteredThreads.length} thread · {totalUnreadMessages} уншаагүй мессеж
              </p>
            </div>

            <div className="mt-3 flex-1 overflow-y-auto rounded-2xl bg-surface-container-low p-2">
              {inboxQuery.isLoading && (
                <p className="px-3 py-4 text-sm font-medium text-on-surface/60">Thread ачааллаж байна...</p>
              )}

              {inboxQuery.isError && (
                <div className="rounded-xl bg-surface-container-lowest p-4 text-sm text-on-surface/65">
                  Thread уншиж чадсангүй.
                  <button
                    type="button"
                    onClick={() => inboxQuery.refetch()}
                    className="ml-2 font-semibold text-primary underline underline-offset-4"
                  >
                    Дахин оролдох
                  </button>
                </div>
              )}

              {!inboxQuery.isLoading && !inboxQuery.isError && filteredThreads.length === 0 && (
                <div className="rounded-xl bg-surface-container-lowest p-4">
                  <p className="text-sm font-semibold text-primary">
                    {search.trim() ? "Тохирох харилцаа олдсонгүй." : "Мессежийн thread алга."}
                  </p>
                  <p className="mt-1 text-xs text-on-surface/60">
                    {me.data.role === "client"
                      ? "Шинэ төсөл үүсгэж фрилансеруудтай шууд холбогдоорой."
                      : "Төсөлд санал илгээгээд харилцаагаа эхлүүлээрэй."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {me.data.role === "client" ? (
                      <Link href={withLocale("/client/projects/new")} className="ui-btn-ghost">
                        Шинэ төсөл үүсгэх
                      </Link>
                    ) : (
                      <Link href={withLocale("/projects")} className="ui-btn-ghost">
                        Ажил хайх
                      </Link>
                    )}
                    {(search.trim() || threadFilter === "unread") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setThreadFilter("all");
                        }}
                        className="ui-btn-ghost"
                      >
                        Шүүлтүүр цэвэрлэх
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                {filteredThreads.map((thread) => {
                  const active = thread.id === activeThreadId;
                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => setActiveThreadId(thread.id)}
                      className={[
                        "w-full rounded-xl px-3 py-3 text-left transition-all",
                        active
                          ? "bg-primary-fixed shadow-[0_12px_24px_rgba(3,22,54,0.08)]"
                          : "bg-surface-container-lowest hover:bg-surface-container",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-fixed">
                          {thread.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-bold text-primary">{thread.name}</p>
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface/40">
                              {thread.time}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs font-medium text-on-surface/65">{thread.lastMessage}</p>
                          <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface/40">
                            {thread.title}
                          </p>
                          <p className="mt-1 inline-flex rounded-full bg-surface-container px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-on-surface/55">
                            {roleLabel(thread.role)}
                          </p>
                        </div>
                        {thread.unread > 0 && (
                          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-black text-white">
                            {thread.unread}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="ui-surface-soft flex min-h-[320px] flex-col p-3 sm:p-4">
            {activeThread ? (
              <>
                <div className="rounded-2xl bg-surface-container-low px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-fixed">
                        {activeThread.avatar}
                      </div>
                      <div>
                        <p className="text-base font-black text-primary">{activeThread.name}</p>
                        <p className="text-xs font-medium text-on-surface/55">{activeThread.title}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-on-surface/45">
                          {roleLabel(activeThread.role)}
                          {activeThread.unread > 0 ? ` · ${activeThread.unread} шинэ` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => messagesQuery.refetch()} className="ui-btn-ghost">
                        Шинэчлэх
                      </button>
                      <Link href={withLocale(`/projects/${activeThread.id}`)} className="ui-btn-ghost">
                        Төсөл рүү очих
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex-1 overflow-y-auto rounded-2xl bg-surface-container-low p-3 sm:p-4">
                  {messagesQuery.isLoading && (
                    <p className="text-center text-sm font-medium text-on-surface/60">Мессеж ачааллаж байна...</p>
                  )}

                  {messagesQuery.isError && (
                    <div className="mx-auto max-w-md rounded-2xl bg-surface-container-lowest p-5 text-center">
                      <p className="text-sm font-semibold text-primary">Мессеж уншиж чадсангүй.</p>
                      <button
                        type="button"
                        onClick={() => messagesQuery.refetch()}
                        className="mt-3 ui-btn-ghost"
                      >
                        Дахин оролдох
                      </button>
                    </div>
                  )}

                  {!messagesQuery.isLoading && !messagesQuery.isError && messages.length === 0 && (
                    <p className="text-center text-sm font-medium text-on-surface/60">Энэ төсөл дээр мессеж эхлээгүй байна.</p>
                  )}

                  <div className="space-y-3">
                    {messages.map((item, index) => {
                      const mine = item.sender === me.data?.id;
                      const currentDate = formatMessageDate(item.created_at);
                      const prevDate =
                        index > 0 ? formatMessageDate(messages[index - 1]?.created_at || "") : "";
                      const showDateDivider = !!currentDate && currentDate !== prevDate;
                      return (
                        <div key={item.id}>
                          {showDateDivider && (
                            <div className="my-2 flex justify-center">
                              <span className="rounded-full bg-surface-container-lowest px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface/45">
                                {currentDate}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div
                              className={[
                                "max-w-[85%] rounded-2xl px-4 py-3 shadow-[0_12px_22px_rgba(3,22,54,0.06)] sm:max-w-[72%]",
                                mine
                                  ? "primary-gradient text-primary-fixed"
                                  : "bg-surface-container-lowest text-on-surface",
                              ].join(" ")}
                            >
                              {item.type === "file" ? (
                                <p className="text-sm font-semibold italic leading-relaxed">[Файл илгээсэн]</p>
                              ) : (
                                <p className="text-sm font-medium leading-relaxed">{item.text}</p>
                              )}
                              <p className={`mt-2 text-[10px] font-bold tracking-[0.12em] ${mine ? "text-white/65" : "text-on-surface/45"}`}>
                                {formatMessageTime(item.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-surface-container-low px-3 py-3">
                  {sendError && (
                    <div className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                      {sendError}
                    </div>
                  )}
                  <div className="flex items-center gap-3 rounded-xl bg-surface-container-lowest px-3 py-2 shadow-[0_12px_26px_rgba(3,22,54,0.06)]">
                    <label htmlFor="message-input" className="sr-only">
                      Мессеж бичих талбар
                    </label>
                    <textarea
                      id="message-input"
                      value={composer}
                      onChange={(event) => setComposer(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Мессеж бичих..."
                      rows={1}
                      className="max-h-28 min-h-8 flex-1 resize-none bg-transparent px-0 py-0 text-sm font-medium text-on-surface placeholder:text-on-surface/45 focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={!composer.trim() || sendMutation.isPending}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-fixed shadow-[0_12px_24px_rgba(3,22,54,0.18)] transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40"
                      aria-label="Мессеж илгээх"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                        <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface/45">
                    <span>Enter: илгээх · Shift+Enter: шинэ мөр</span>
                    {sendMutation.isPending && <span className="text-secondary">Илгээж байна...</span>}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-2xl bg-surface-container-low p-10 text-center">
                <div>
                  <p className="text-lg font-black text-primary">Харилцах хүнээ сонгоно уу.</p>
                  <p className="mt-2 text-sm text-on-surface/60">
                    Төсөл дээрээ үргэлжлүүлэн ажиллахын тулд зүүн талын thread-ээс сонгоно уу.
                  </p>
                  <Link href={withLocale("/projects")} className="mt-4 ui-btn-ghost">
                    Төсөл үзэх
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
