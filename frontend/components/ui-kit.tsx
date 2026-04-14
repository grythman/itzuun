"use client";

import Link from "next/link";
import { ReactNode } from "react";

export function AppCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  // No borders, background surface-container-lowest, ambient shadow on hover
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

export function EscrowStatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    created: "bg-surface-container-low text-secondary",
    pending_admin: "bg-surface-container-low text-secondary",
    held: "bg-secondary text-white shadow-sm",
    released: "bg-surface-container-high text-surface-600",
    disputed: "bg-red-50 text-red-700",
    refunded: "bg-surface-container-low text-surface-400",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider font-headline ${classes[status] || "bg-surface-container-low text-surface-500"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
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
  const label = isVerified ? "Verified" : isPending ? "Pending Review" : isSuspended ? "Suspended" : "Unverified";
  const tone = isVerified
    ? "bg-secondary/10 text-secondary"
    : isPending
      ? "bg-primary/5 text-primary"
      : isSuspended
        ? "bg-red-50 text-red-700"
        : "bg-surface-container-low text-surface-400";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest font-headline ${tone}`}>
      {isVerified && <span className="text-[10px]">✦</span>}
      {label}
    </span>
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

export function FlowRail({
  title = "Flow",
  steps,
  currentStep,
}: {
  title?: string;
  steps: Array<{ title: string; subtitle?: string }>;
  currentStep: number;
}) {
  return (
    <div className="sticky top-24 space-y-4 rounded-2xl border border-[#d9d5ed] bg-[#f7f8ff] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f50b8]">{title}</p>
      <ul className="space-y-2">
        {steps.map((item, index) => {
          const tone = index === currentStep ? "active" : index < currentStep ? "done" : "todo";
          return (
            <li
              key={`${item.title}-${index}`}
              className={`rounded-xl px-3 py-3 ${
                tone === "active"
                  ? "bg-surface-container-lowest shadow-ambient border-none"
                  : tone === "done"
                    ? "bg-primary-fixed/20 border-none"
                    : "bg-transparent border-none border-l-2 border-outline-variant/15"
              }`}
            >
              <p className={`text-[12px] font-semibold ${tone === "active" ? "text-primary" : "text-surface-700 font-headline"}`}>
                {index + 1}. {item.title}
              </p>
              {item.subtitle ? <p className="mt-0.5 text-[11px] text-surface-500">{item.subtitle}</p> : null}
            </li>
          );
        })}
      </ul>
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
    <div className="rounded-2xl border border-[#cfe0eb] bg-gradient-to-r from-[#eef7ff] to-[#f2faf7] p-4 text-[13px] text-[#1a4a73]">
      <p className="font-semibold">Secure Escrow Protection</p>
      <p className="mt-1 text-[#355d80]">Your money is held securely until work is completed and confirmed.</p>
    </div>
  );
}

export { DashboardTopHeader } from "@/components/layout/dashboard-header";
export { RoleSidebar } from "@/components/layout/dashboard-sidebar";

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

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const toneClass: Record<string, string> = {
    neutral: "bg-surface-container-low text-surface-500",
    success: "bg-secondary/10 text-secondary",
    warning: "bg-accent-100 text-accent-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-primary/5 text-primary",
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] font-headline ${toneClass[tone]}`}>{label}</span>;
}

export function ActionButton({
  children,
  loading,
  disabled,
  tone = "primary",
  className = "",
  variant = "filled",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  tone?: "primary" | "success" | "warning" | "danger" | "secondary";
  variant?: "filled" | "outline" | "ghost";
}) {
  const toneClass: Record<string, string> = {
    primary: "primary-gradient text-primary-fixed shadow-ambient",
    secondary: "bg-secondary text-white",
    success: "bg-emerald-600 text-white",
    warning: "bg-accent-600 text-white",
    danger: "bg-red-600 text-white",
  };

  const variantStyles = variant === "outline" 
    ? "bg-transparent border border-outline-variant/30 text-on-surface hover:bg-surface-container-low"
    : variant === "ghost"
    ? "bg-transparent text-primary hover:bg-surface-container-low"
    : toneClass[tone] || toneClass.primary;

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 font-headline disabled:cursor-not-allowed disabled:opacity-60 ${variantStyles} ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin text-current" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {children}
        </span>
      ) : children}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-5 shadow-ambient">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight text-on-surface font-headline">{title}</h3>
          <button className="rounded-md bg-surface-container-low px-2 py-1 text-[11px] font-medium text-surface-500 hover:bg-outline-variant/20" onClick={onClose}>
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
