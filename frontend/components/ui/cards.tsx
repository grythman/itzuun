"use client";

import type { ReactNode } from "react";

export function AppCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-surface-container-lowest p-5 transition-all duration-300 hover:shadow-ambient ${className}`}>{children}</div>;
}

export function MetricCard({
  label,
  value,
  hint,
  className = "",
  valueClassName = "",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <AppCard className={className}>
      <p className="text-[11px] uppercase tracking-widest text-surface-500 font-headline">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold text-on-surface font-headline ${valueClassName}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-surface-500">{hint}</p> : null}
    </AppCard>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold tracking-tight text-on-surface font-headline">{title}</h2>
      {subtitle ? <p className="text-[13px] text-surface-500">{subtitle}</p> : null}
    </div>
  );
}

export function TrustPanel() {
  return (
    <div className="rounded-2xl border border-[#cfe0eb] bg-gradient-to-r from-[#eef7ff] to-[#f2faf7] p-4 text-[13px] text-[#1a4a73]">
      <p className="font-semibold">Secure Escrow Protection</p>
      <p className="mt-1 text-[#355d80]">Your money is held securely until work is completed and confirmed.</p>
    </div>
  );
}

export function CompareTable({ rows }: { rows: Array<{ label: string; value: string | number }> }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-surface-container-low shadow-sm">
      <table className="min-w-full text-[13px]">
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.label} className={index % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface-container-low"}>
              <td className="px-4 py-3 font-medium text-surface-500 font-headline uppercase text-[11px] tracking-wider">{row.label}</td>
              <td className="px-4 py-3 text-on-surface font-medium">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
