"use client";

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
