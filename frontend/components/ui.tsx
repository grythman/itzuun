import { PropsWithChildren } from "react";

export function Card({ children }: PropsWithChildren) {
  return <div className="rounded-lg border bg-white p-4 shadow-sm">{children}</div>;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="rounded border border-dashed p-4 text-sm text-slate-600">{message}</p>;
}

export function ErrorState({ message }: { message: string }) {
  return <p className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{message}</p>;
}
