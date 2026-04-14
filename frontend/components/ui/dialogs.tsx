"use client";

import type { ReactNode } from "react";

import { ActionButton } from "@/components/ui/actions";

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
