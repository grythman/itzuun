"use client";

import { useToastStore } from "@/lib/toast-store";

const typeStyles = {
  info: "bg-blue-100 text-blue-900",
  success: "bg-emerald-100 text-emerald-900",
  warn: "bg-amber-100 text-amber-900",
  error: "bg-rose-100 text-rose-900",
};

export function ToastViewport() {
  const items = useToastStore((state) => state.items);
  const remove = useToastStore((state) => state.remove);

  return (
    <div className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2" aria-live="polite" role="status">
      {items.map((item) => (
        <div key={item.id} className={`rounded-md px-3 py-2 text-sm shadow ${typeStyles[item.type]}`}>
          <div className="flex items-start justify-between gap-2">
            <span>{item.message}</span>
            <button className="rounded px-1" onClick={() => remove(item.id)} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
