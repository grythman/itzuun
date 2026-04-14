"use client";

import type { ButtonHTMLAttributes } from "react";

export function ActionButton({
  children,
  loading,
  disabled,
  tone = "primary",
  className = "",
  variant = "filled",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
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
