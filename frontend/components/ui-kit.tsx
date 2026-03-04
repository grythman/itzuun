"use client";

import Link from "next/link";
import { ReactNode } from "react";

export function AppCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

export function EscrowStatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    created: "bg-amber-100 text-amber-800",
    pending_admin: "bg-amber-100 text-amber-800",
    held: "bg-emerald-100 text-emerald-800",
    released: "bg-blue-100 text-blue-800",
    disputed: "bg-red-100 text-red-800",
    refunded: "bg-slate-200 text-slate-700",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes[status] || "bg-slate-100 text-slate-700"}`}>
      Escrow: {status}
    </span>
  );
}

export function VerifiedBadge({ verified }: { verified?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        verified ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
      }`}
    >
      {verified ? "Verified" : "Unverified"}
    </span>
  );
}

export function RatingStars({ value, total = 5 }: { value: number; total?: number }) {
  const rounded = Math.max(0, Math.min(total, Math.round(value)));
  return (
    <div className="flex items-center gap-1 text-sm">
      {Array.from({ length: total }).map((_, idx) => (
        <span key={idx} className={idx < rounded ? "text-amber-500" : "text-slate-300"}>
          ★
        </span>
      ))}
      <span className="ml-1 text-slate-600">{value.toFixed(1)}</span>
    </div>
  );
}

export function StepProgress({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="space-y-2">
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-blue-700 transition-all"
          style={{ width: `${Math.max(0, Math.min(100, ((currentStep + 1) / steps.length) * 100))}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
        {steps.map((step, idx) => (
          <span key={step} className={idx <= currentStep ? "font-semibold text-blue-800" : ""}>
            {idx + 1}. {step}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ChatBubble({ mine, text, time, fileName }: { mine: boolean; text: string; time?: string; fileName?: string }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
          mine ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"
        }`}
      >
        <p>{text}</p>
        {fileName ? <p className={`mt-1 text-xs ${mine ? "text-blue-100" : "text-slate-500"}`}>Attachment: {fileName}</p> : null}
        {time ? <p className={`mt-1 text-[11px] ${mine ? "text-blue-100" : "text-slate-500"}`}>{time}</p> : null}
      </div>
    </div>
  );
}

export function TrustPanel() {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
      <p className="font-semibold">Secure Escrow Protection</p>
      <p className="mt-1">Your money is held securely until work is completed and confirmed.</p>
    </div>
  );
}

export function RoleSidebar({ role }: { role: "client" | "freelancer" | "admin" }) {
  const linksByRole: Record<string, Array<{ href: string; label: string }>> = {
    client: [
      { href: "/client", label: "Client Dashboard" },
      { href: "/projects", label: "Browse Projects" },
      { href: "/projects/new", label: "Post Project" },
    ],
    freelancer: [
      { href: "/freelancer", label: "Freelancer Dashboard" },
      { href: "/projects", label: "Find Projects" },
      { href: "/auth", label: "Profile & Verification" },
    ],
    admin: [
      { href: "/admin", label: "Admin Control" },
      { href: "/projects", label: "All Projects" },
      { href: "/auth", label: "Account" },
    ],
  };

  return (
    <aside className="hidden w-64 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{role} panel</p>
      <ul className="space-y-2">
        {linksByRole[role].map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function DashboardBottomBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-2 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between text-xs">
        <Link href="/projects" className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100">
          Projects
        </Link>
        <Link href="/projects/new" className="rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white">
          Post Project
        </Link>
        <Link href="/auth" className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100">
          Account
        </Link>
      </div>
    </div>
  );
}

export function CompareTable({ rows }: { rows: Array<{ label: string; value: string | number }> }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="min-w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-slate-100 last:border-none">
              <td className="bg-slate-50 px-3 py-2 font-medium text-slate-700">{row.label}</td>
              <td className="px-3 py-2 text-slate-900">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const toneClass: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass[tone]}`}>{label}</span>;
}

export function ActionButton({
  children,
  loading,
  disabled,
  tone = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const toneClass: Record<string, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    warning: "bg-amber-600 text-white hover:bg-amber-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${toneClass[tone]} disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? "Processing..." : children}
    </button>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel,
  confirmTone = "primary",
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmTone?: "primary" | "success" | "warning" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button className="bg-slate-200 text-slate-800 hover:bg-slate-300" onClick={onCancel}>
          Cancel
        </button>
        <ActionButton tone={confirmTone} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </ActionButton>
      </div>
    </Modal>
  );
}
