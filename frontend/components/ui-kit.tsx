"use client";

import Link from "next/link";
import { ReactNode } from "react";

export function AppCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover ${className}`}>{children}</div>;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold tracking-tight text-surface-900">{title}</h2>
      {subtitle ? <p className="text-[13px] text-surface-500">{subtitle}</p> : null}
    </div>
  );
}

export function EscrowStatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    created: "bg-accent-100 text-accent-700",
    pending_admin: "bg-accent-100 text-accent-700",
    held: "bg-emerald-50 text-emerald-700",
    released: "bg-brand-50 text-brand-700",
    disputed: "bg-red-50 text-red-700",
    refunded: "bg-surface-100 text-surface-600",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes[status] || "bg-surface-100 text-surface-600"}`}>
      Escrow: {status}
    </span>
  );
}

export function VerifiedBadge({
  verified,
  status,
}: {
  verified?: boolean;
  status?: "unverified" | "pending" | "verified" | "suspended" | string;
}) {
  const normalized = status?.toLowerCase();
  const isVerified = normalized ? normalized === "verified" : !!verified;
  const isPending = normalized === "pending";
  const isSuspended = normalized === "suspended";
  const label = isVerified ? "✓ Verified" : isPending ? "Pending Review" : isSuspended ? "Suspended" : "Unverified";
  const tone = isVerified
    ? "bg-emerald-50 text-emerald-700"
    : isPending
      ? "bg-blue-50 text-blue-700"
      : isSuspended
        ? "bg-red-50 text-red-700"
        : "bg-surface-100 text-surface-500";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>{label}</span>
  );
}

export function RatingStars({ value, total = 5 }: { value: number; total?: number }) {
  const rounded = Math.max(0, Math.min(total, Math.round(value)));
  return (
    <div className="flex items-center gap-0.5 text-sm">
      {Array.from({ length: total }).map((_, idx) => (
        <span key={idx} className={idx < rounded ? "text-accent-500" : "text-surface-200"}>
          ★
        </span>
      ))}
      <span className="ml-1.5 text-[13px] font-medium text-surface-600">{value.toFixed(1)}</span>
    </div>
  );
}

export function StepProgress({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="space-y-2">
      <div className="h-1.5 w-full rounded-full bg-surface-100">
        <div
          className="h-1.5 rounded-full bg-brand-600 transition-all"
          style={{ width: `${Math.max(0, Math.min(100, ((currentStep + 1) / steps.length) * 100))}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-2 text-[11px] text-surface-500">
        {steps.map((step, idx) => (
          <span key={step} className={idx <= currentStep ? "font-semibold text-brand-700" : ""}>
            {idx + 1}. {step}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ChatBubble({ mine, text, time, fileName, fileUrl }: { mine: boolean; text: string; time?: string; fileName?: string; fileUrl?: string }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] ${
          mine ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-800"
        }`}
      >
        <p>{text}</p>
        {fileName ? (
          <div className={`mt-1 flex items-center gap-1 ${mine ? "text-brand-200" : "text-surface-500"}`}>
            <span>📎</span>
            {fileUrl ? (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-opacity-80">
                {fileName}
              </a>
            ) : (
              <span>{fileName}</span>
            )}
          </div>
        ) : null}
        {time ? <p className={`mt-1 text-[11px] ${mine ? "text-brand-200" : "text-surface-400"}`}>{time}</p> : null}
      </div>
    </div>
  );
}

export function TrustPanel() {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 text-[13px] text-brand-800">
      <p className="font-semibold">Secure Escrow Protection</p>
      <p className="mt-1">Your money is held securely until work is completed and confirmed.</p>
    </div>
  );
}

export function RoleSidebar({ role }: { role: "client" | "freelancer" | "admin" }) {
  const linksByRole: Record<string, Array<{ href: string; label: string }>> = {
    client: [
      { href: "/client", label: "Client Dashboard" },
      { href: "/client/profile", label: "Company Profile" },
      { href: "/projects", label: "Browse Projects" },
      { href: "/projects/new", label: "Post Project" },
    ],
    freelancer: [
      { href: "/freelancer", label: "Freelancer Dashboard" },
      { href: "/freelancer/profile", label: "My Profile" },
      { href: "/projects", label: "Find Projects" },
    ],
    admin: [
      { href: "/admin", label: "Admin Control" },
      { href: "/projects", label: "All Projects" },
      { href: "/auth", label: "Account" },
    ],
  };

  return (
    <aside className="hidden w-56 shrink-0 rounded-2xl border border-surface-200/60 bg-white p-4 shadow-card lg:block">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-surface-400">{role} panel</p>
      <ul className="space-y-0.5">
        {linksByRole[role].map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="block rounded-lg px-3 py-2 text-[13px] font-medium text-surface-600 hover:bg-surface-50 hover:text-surface-900 transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function DashboardBottomBar({ role = "client" }: { role?: "client" | "freelancer" | "admin" }) {
  const mobileLinksByRole: Record<"client" | "freelancer" | "admin", Array<{ href: string; label: string; primary?: boolean }>> = {
    client: [
      { href: "/projects", label: "Projects" },
      { href: "/projects/new", label: "Post Project", primary: true },
      { href: "/client/profile", label: "Profile" },
    ],
    freelancer: [
      { href: "/projects", label: "Projects" },
      { href: "/freelancer", label: "Dashboard", primary: true },
      { href: "/freelancer/profile", label: "Profile" },
    ],
    admin: [
      { href: "/admin", label: "Admin", primary: true },
      { href: "/projects", label: "Projects" },
      { href: "/auth", label: "Account" },
    ],
  };

  const links = mobileLinksByRole[role];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-200/60 bg-white/90 px-4 py-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between text-xs">
        {links.map((link) => (
          <Link
            key={`${role}-${link.href}`}
            href={link.href}
            className={link.primary ? "rounded-lg bg-brand-600 px-3 py-2 font-semibold text-white shadow-sm" : "rounded-lg px-3 py-2 text-surface-600 hover:bg-surface-100"}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CompareTable({ rows }: { rows: Array<{ label: string; value: string | number }> }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-200/60">
      <table className="min-w-full text-[13px]">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-surface-100 last:border-none">
              <td className="bg-surface-50 px-3 py-2 font-medium text-surface-600">{row.label}</td>
              <td className="px-3 py-2 text-surface-900">{row.value}</td>
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
    neutral: "bg-surface-100 text-surface-600",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-accent-50 text-accent-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-brand-50 text-brand-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClass[tone]}`}>{label}</span>;
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
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    warning: "bg-accent-600 text-white hover:bg-accent-700 shadow-sm",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-surface-200/60 bg-white p-5 shadow-modal">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight text-surface-900">{title}</h3>
          <button className="rounded-lg bg-surface-100 px-2 py-1 text-[11px] font-medium text-surface-500 hover:bg-surface-200" onClick={onClose}>
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
      <p className="text-[13px] text-surface-500">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button className="bg-surface-100 text-surface-700 hover:bg-surface-200" onClick={onCancel}>
          Cancel
        </button>
        <ActionButton tone={confirmTone} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </ActionButton>
      </div>
    </Modal>
  );
}
