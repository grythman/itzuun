import { ReactNode } from "react";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return <p className="rounded-xl border border-surface-200/60 bg-white p-4 text-[13px] text-surface-500">{label}</p>;
}

export function EmptyState({ label }: { label: string }) {
  return <p className="rounded-xl border border-dashed border-surface-300 bg-white p-4 text-[13px] text-surface-400">{label}</p>;
}

export function ErrorState({ label, action }: { label: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 text-[13px] text-red-700">
      <p>{label}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
