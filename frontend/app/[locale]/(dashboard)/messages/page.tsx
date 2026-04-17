"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { useMe } from "@/lib/hooks";
import { messagingApi, projectsApi } from "@/lib/api/endpoints";

type Thread = {
  id: number;
  name: string;
  avatar: string;
  role: "client" | "freelancer";
  lastMessage: string;
  time: string;
  unread: number;
};

const MOCK_THREADS: Thread[] = [
  {
    id: 1,
    name: "Дорж Б.",
    avatar: "Д",
    role: "client",
    lastMessage: "Давхардлыг арилгасан. Pull request бэлэн болсон. Шалгана уу.",
    time: "14:32",
    unread: 2,
  },
  {
    id: 2,
    name: "Мөнхбат Э.",
    avatar: "М",
    role: "freelancer",
    lastMessage: "Энэ долоо хоногт дуусгана. API интеграцийг хийж байна.",
    time: "09:15",
    unread: 0,
  },
  {
    id: 3,
    name: "Оюун Г.",
    avatar: "О",
    role: "client",
    lastMessage: "Сайн! Кодоо review хийлгэнэ үү.",
    time: "Өчигдөр",
    unread: 1,
  },
];

const MOCK_MESSAGES = [
  { id: 1, from: "other", text: "Сайн байна уу? Mobile app-ын backend-ийн тухай асуумаар байна.", time: "10:12" },
  { id: 2, from: "me", text: "Сайн сайн! Node.js болон PostgreSQL хэрэглэж байна. Юу шаардлагатай вэ?", time: "10:14" },
  { id: 3, from: "other", text: "React Native клиентэд нийцэх REST API хэрэгтэй. Authentication, database schema, file uploads.", time: "10:17" },
  { id: 4, from: "me", text: "Ойлголоо. 3-5 хоногт хийж чадна. Төсвөө ямар гэж бодсон бэ?", time: "10:19" },
  { id: 5, from: "other", text: "Давхардлыг арилгасан. Pull request бэлэн болсон. Шалгана уу.", time: "14:32" },
];

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const [selected, setSelected] = useState<Thread | null>(null);
  const [message, setMessage] = useState("");

  const inboxQuery = useQuery<Thread[]>({
    queryKey: ["globalInbox"],
    queryFn: () => messagingApi.globalInbox(),
    enabled: !!me.data,
  });

  const activeProjectId = selected?.id;
  const messagesQuery = useQuery({
    queryKey: ["projectMessages", activeProjectId],
    queryFn: () => messagingApi.getProjectMessages(activeProjectId!),
    enabled: !!activeProjectId,
  });

  // Automatically select the first thread if none is selected and data is available
  if (!selected && inboxQuery.data && inboxQuery.data.length > 0) {
    setSelected(inboxQuery.data[0]);
  }

  const sendMutation = useMutation({
    mutationFn: (text: string) => projectsApi.sendMessage(activeProjectId!, text, "text"),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["projectMessages", activeProjectId] });
    },
  });

  function sendMessage() {
    if (!message.trim() || !activeProjectId) return;
    sendMutation.mutate(message);
  }

  if (me.isLoading) return <LoadingState label="Мессежүүд ачааллаж байна..." />;
  if (me.isError || !me.data) {
    return (
      <ErrorState
        label="Мессежүүдийг харахын тулд нэвтэрнэ үү."
        action={<Link href={withLocale("/auth?tab=signin")} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-xs font-bold text-primary-fixed">Нэвтрэх</Link>}
      />
    );
  }

  return (
    <section className="h-[calc(100vh-80px)] overflow-hidden">
      <div className="flex h-full gap-0 overflow-hidden rounded-[2.5rem] bg-surface-container-lowest shadow-sm">
        {/* Thread list */}
        <aside className="flex w-80 shrink-0 flex-col border-r border-outline-variant/10">
          <div className="border-b border-outline-variant/10 px-6 py-5">
            <h1 className="font-headline text-xl font-extrabold text-primary">Мессежүүд</h1>
            <div className="relative mt-4">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-surface-400">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Хайх..."
                className="w-full rounded-2xl border-none bg-surface-container-low py-2.5 pl-10 pr-4 text-sm font-medium text-on-surface focus:ring-0 placeholder:text-surface-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {inboxQuery.isLoading && <p className="p-5 text-sm text-surface-500">Ачааллаж байна...</p>}
            {inboxQuery.data?.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setSelected(thread)}
                className={`flex w-full items-start gap-4 px-5 py-5 text-left transition-all ${
                  selected?.id === thread.id
                    ? "bg-primary-fixed"
                    : "hover:bg-surface-container-low"
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-base font-black text-primary-fixed font-headline">
                  {thread.avatar || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-headline text-sm font-bold text-on-surface">{thread.name}</p>
                    <span className="text-[10px] font-bold text-surface-400 font-headline">{thread.time}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-[12px] font-medium text-surface-500">{thread.lastMessage}</p>
                </div>
                {thread.unread > 0 && (
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-black text-white">
                    {thread.unread}
                  </span>
                )}
              </button>
            ))}
            {inboxQuery.data && inboxQuery.data.length === 0 && (
               <p className="p-5 text-sm text-surface-500">Мессеж алга байна.</p>
            )}
          </div>
        </aside>

        {/* Chat panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-4 border-b border-outline-variant/10 px-8 py-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-base font-black text-primary-fixed font-headline">
                  {selected.avatar || "?"}
                </div>
                <div>
                  <p className="font-headline text-base font-extrabold text-primary">{selected.name}</p>
                  <p className="text-[10px] text-surface-400">Төсөл #{selected.id}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 px-8 py-6 flex flex-col-reverse">
                {messagesQuery.data?.slice().reverse().map((msg: any) => {
                  const isMe = msg.sender === me.data?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-5 py-3.5 ${
                          isMe
                            ? "primary-gradient text-primary-fixed rounded-br-none"
                            : "bg-surface-container-low text-on-surface rounded-bl-none"
                        }`}
                      >
                        {msg.type === "file" ? (
                          <p className="text-[14px] font-medium leading-relaxed italic">[Файл илгээгдсэн]</p>
                        ) : (
                          <p className="text-[14px] font-medium leading-relaxed">{msg.text}</p>
                        )}
                        <p className={`mt-2 text-[10px] font-bold uppercase tracking-widest font-headline ${isMe ? "text-white/50" : "text-surface-400"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {messagesQuery.isLoading && <p className="text-center text-sm text-surface-400">Уншиж байна...</p>}
              </div>

          {/* Message input */}
          <div className="border-t border-outline-variant/10 p-5">
            <div className="flex items-center gap-4 rounded-2xl bg-surface-container-low p-3 transition-all focus-within:bg-surface-container-lowest focus-within:shadow-ambient">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                placeholder="Мессеж бичих..."
                className="flex-1 border-none bg-transparent text-sm font-medium text-on-surface placeholder:text-surface-400 focus:ring-0"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!message.trim() || sendMutation.isPending}
                className="flex h-10 w-10 items-center justify-center rounded-xl primary-gradient text-primary-fixed shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-30 disabled:translate-y-0"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7Z" />
                </svg>
              </button>
            </div>
          </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-surface-400">Харилцах хүнээ сонгоно уу.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
