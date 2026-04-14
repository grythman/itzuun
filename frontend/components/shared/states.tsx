import { ReactNode } from "react";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="rounded-xl border border-surface-200/60 bg-white p-4 text-[13px] text-surface-500">
      <p>{label}</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-100">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-brand-500/70" />
      </div>
    </div>
  );
}

export function EmptyState({ label, action }: { label: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-surface-300 bg-white p-4 text-[13px] text-surface-400">
      <p>{label}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ label, action }: { label: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 text-[13px] text-red-700">
      <p>{label}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
