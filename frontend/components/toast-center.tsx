"use client";

import { useEffect } from "react";

import { useToastStore } from "@/lib/toast-store";

const palette = {
  info: "bg-brand-50 text-brand-800 border border-brand-100",
  success: "bg-emerald-50 text-emerald-800 border border-emerald-100",
  warning: "bg-accent-50 text-accent-800 border border-accent-100",
  error: "bg-red-50 text-red-800 border border-red-100",
};

export function ToastCenter() {
  const { toasts, removeToast } = useToastStore();

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((toast) => setTimeout(() => removeToast(toast.id), 3500));
    return () => timers.forEach(clearTimeout);
  }, [toasts, removeToast]);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-2" aria-live="polite" role="status">
      {toasts.map((toast) => (
        <div key={toast.id} className={`pointer-events-auto rounded-xl px-3.5 py-2.5 text-[13px] shadow-card ${palette[toast.type] || palette.info}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold">{toast.title}</div>
              {toast.message && <div className="text-[11px] opacity-80">{toast.message}</div>}
            </div>
            <button
              className="rounded-md bg-black/5 px-2 py-0.5 text-[11px] font-medium hover:bg-black/10"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
