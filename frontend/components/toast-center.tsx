"use client";

import { useEffect } from "react";

import { useToastStore } from "@/lib/toast-store";

const palette = {
  info: "bg-blue-100 text-blue-900",
  success: "bg-green-100 text-green-900",
  warn: "bg-amber-100 text-amber-900",
  error: "bg-red-100 text-red-900",
};

export function ToastCenter() {
  const { toasts, remove } = useToastStore();

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((toast) => setTimeout(() => remove(toast.id), 3500));
    return () => timers.forEach(clearTimeout);
  }, [toasts, remove]);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-2" aria-live="polite" role="status">
      {toasts.map((toast) => (
        <div key={toast.id} className={`pointer-events-auto rounded-md px-3 py-2 text-sm ${palette[toast.level]}`}>
          <div className="flex items-start justify-between gap-2">
            <span>{toast.message}</span>
            <button
              className="rounded bg-black/10 px-2 py-0.5 text-xs"
              onClick={() => remove(toast.id)}
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
