import { ReactNode } from "react";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return <p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">{label}</p>;
}

export function EmptyState({ label }: { label: string }) {
  return <p className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">{label}</p>;
}

export function ErrorState({ label, action }: { label: string; action?: ReactNode }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p>{label}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
