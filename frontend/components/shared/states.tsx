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

export function EmptyState({
  label,
  description,
  action,
  icon,
}: {
  label: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 bg-surface-container-lowest/60 px-8 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container text-surface-400">
        {icon ?? (
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden="true">
            <path d="M19 11H5v2h14v-2Zm-7-9a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
          </svg>
        )}
      </div>
      <p className="font-headline text-base font-bold text-on-surface">{label}</p>
      {description && <p className="mt-2 max-w-xs text-sm text-surface-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
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
