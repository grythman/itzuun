"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ChatBubble, StatusPill } from "@/components/ui-kit";
import { EmptyState } from "@/components/states";
import { projectsApi, toArray } from "@/lib/api/endpoints";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useMutation, useProjectMessages } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";

import type { MessageItem } from "@/lib/types";

const POLL_INTERVAL = 5000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg", "txt", "zip", "docx"]);

export default function ProjectChat({
  projectId,
  currentUserId,
}: {
  projectId: number | string;
  currentUserId: number;
}) {
  const toast = useToastStore((s) => s.push);
  const messages = useProjectMessages(projectId);
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-poll for new messages
  useEffect(() => {
    const interval = setInterval(() => {
      messages.refetch();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [messages]);

  // Auto-scroll to bottom when new messages come in
  const messageItems: MessageItem[] = messages.data ? toArray(messages.data) : [];
  const sortedMessages = [...messageItems].sort((a, b) => {
    if (!a.created_at || !b.created_at) return 0;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages.length]);

  const sendMutation = useMutation({
    mutationFn: async (msg: string) => {
      return projectsApi.sendMessage(projectId, msg);
    },
    onSuccess: () => {
      setText("");
      messages.refetch();
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const fileMutation = useMutation({
    mutationFn: async (file: File) => {
      const result = await projectsApi.uploadMessageFile(projectId, file, setUploadProgress);
      // After uploading the file, send a message referencing it
      const fileData = JSON.stringify({ name: result.name || file.name, url: result.url });
      await projectsApi.sendMessage(projectId, fileData, "file");
      return result;
    },
    onSuccess: () => {
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
      messages.refetch();
      toast("success", "File sent");
    },
    onError: (error: any) => {
      setUploadProgress(0);
      toast("error", "File upload failed", extractApiErrorMessage(error, "Upload failed. Please try again."));
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && !selectedFile) return;

    if (selectedFile) {
      fileMutation.mutate(selectedFile);
    }
    if (trimmed) {
      sendMutation.mutate(trimmed);
    }
  }, [text, selectedFile, sendMutation, fileMutation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast("error", "File size must be less than 10MB");
      e.target.value = "";
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      toast("error", `File type .${ext} is not allowed. Allowed: ${[...ALLOWED_EXTENSIONS].join(", ")}`);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const isSending = sendMutation.isPending || fileMutation.isPending;

  return (
    <div className="rounded-2xl border border-surface-200/60 bg-white shadow-card flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-100 px-5 py-3">
        <h2 className="text-lg font-medium text-surface-900">Project Chat</h2>
        <div className="flex items-center gap-2">
          <StatusPill label="Live" tone="success" />
          <button
            type="button"
            onClick={() => messages.refetch()}
            className="rounded-lg px-2 py-1 text-[11px] text-surface-500 hover:bg-surface-100"
            title="Refresh messages"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Escrow banner */}
      <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Messages are secured within the escrow communication channel</span>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ maxHeight: "400px", minHeight: "200px" }}>
        {messages.isLoading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[13px] text-surface-400">Loading messages...</p>
          </div>
        ) : !sortedMessages.length ? (
          <EmptyState label="No messages yet. Start the conversation!" />
        ) : (
          <>
            {sortedMessages.map((item) => {
              const isFile = item.type === "file";
              let fileName = undefined;
              let fileUrl = undefined;
              if (isFile) {
                try {
                  const parsed = JSON.parse(item.text);
                  fileName = parsed.name;
                  fileUrl = parsed.url;
                } catch {
                  fileName = item.text;
                }
              }
              return (
                <ChatBubble
                  key={item.id}
                  mine={item.sender === currentUserId}
                  text={isFile ? "" : item.text}
                  fileName={fileName}
                  fileUrl={fileUrl}
                  time={item.created_at ? formatTime(item.created_at) : undefined}
                />
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-surface-100 px-4 py-3 space-y-2">
        {/* Selected file preview */}
        {selectedFile && (
          <div className="flex items-center gap-2 rounded-lg bg-surface-50 px-3 py-2 text-[13px]">
            <svg className="h-4 w-4 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="flex-1 truncate text-surface-700">{selectedFile.name}</span>
            <span className="text-[11px] text-surface-400">{formatFileSize(selectedFile.size)}</span>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-surface-400 hover:text-red-500"
            >
              ✕
            </button>
          </div>
        )}
        {fileMutation.isPending && (
          <div className="rounded-lg bg-surface-50 px-3 py-2">
            <div className="mb-1 flex items-center justify-between text-[11px] text-surface-500">
              <span>Uploading file...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-200">
              <div className="h-full bg-brand-600 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* File upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 rounded-xl p-2.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
            title="Attach file (PDF, PNG, JPG, TXT, ZIP, DOCX — max 10MB)"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.txt,.zip,.docx"
            onChange={handleFileSelect}
          />

          {/* Text input */}
          <textarea
            className="flex-1 resize-none rounded-xl border border-surface-200/60 px-4 py-2.5 text-[13px] placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            disabled={isSending}
          />

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || (!text.trim() && !selectedFile)}
            className="shrink-0 rounded-xl bg-brand-600 p-2.5 text-white transition-colors hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            {isSending ? (
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
