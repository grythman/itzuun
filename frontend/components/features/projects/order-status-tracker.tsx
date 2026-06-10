"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { ActionButton } from "@/components/ui";
import { adminApi } from "@/lib/api/endpoints";
import { useToastStore } from "@/lib/stores/toast-store";

const STATUS_FLOW = [
  "open",
  "reviewing",
  "agreed",
  "paid",
  "in_progress",
  "delivered",
  "completed",
] as const;

type StatusFlowItem = (typeof STATUS_FLOW)[number];

const STATUS_LABEL_KEYS: Record<StatusFlowItem, string> = {
  open: "statusOpen",
  reviewing: "statusReviewing",
  agreed: "statusAgreed",
  paid: "statusPaid",
  in_progress: "statusInProgress",
  delivered: "statusDelivered",
  completed: "statusCompleted",
};

const ADMIN_TRANSITIONS: Partial<Record<StatusFlowItem, { next: StatusFlowItem; actionKey: string }>> = {
  open: { next: "reviewing", actionKey: "actionMarkReviewing" },
  reviewing: { next: "agreed", actionKey: "actionMarkAgreed" },
  agreed: { next: "paid", actionKey: "actionMarkPaid" },
};

interface OrderStatusTrackerProps {
  status: string;
  userRole: string;
  projectId: string | number;
  onTransitionSuccess?: () => void;
}

export default function OrderStatusTracker({
  status,
  userRole,
  projectId,
  onTransitionSuccess,
}: OrderStatusTrackerProps) {
  const t = useTranslations("ProjectDetail");
  const toast = useToastStore((s) => s.push);
  const [loading, setLoading] = useState(false);

  const currentIndex = STATUS_FLOW.indexOf(status as StatusFlowItem);
  const isAdmin = userRole === "admin";
  const transition = ADMIN_TRANSITIONS[status as StatusFlowItem];

  const handleTransition = async () => {
    if (!transition) return;
    setLoading(true);
    try {
      await adminApi.transitionProject(projectId, transition.next);
      toast("success", t("transitionSuccess"));
      onTransitionSuccess?.();
    } catch {
      toast("error", t("transitionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[2.5rem] bg-surface-container-lowest p-6 shadow-sm">
      <h3 className="font-headline text-[13px] font-black uppercase tracking-[0.2em] text-on-surface/50">
        {t("statusTrackerTitle")}
      </h3>

      <ul className="mt-5 space-y-3">
        {STATUS_FLOW.map((step, index) => {
          const isDone = currentIndex >= 0 && index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = currentIndex < 0 || index > currentIndex;
          const showAction = isAdmin && isCurrent && transition && transition.next === STATUS_FLOW[index + 1];

          return (
            <li key={step} className="flex items-start gap-3">
              {/* Circle indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    isDone
                      ? "bg-emerald-500"
                      : isCurrent
                        ? "bg-primary ring-4 ring-primary/20"
                        : "bg-surface-container"
                  }`}
                >
                  {isDone && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="h-3 w-3">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                  {isCurrent && <span className="h-2 w-2 rounded-full bg-white animate-pulse" />}
                </div>
                {index < STATUS_FLOW.length - 1 && (
                  <div
                    className={`mt-1 h-4 w-0.5 ${
                      isDone ? "bg-emerald-300" : "bg-surface-container"
                    }`}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[12px] font-semibold ${
                    isDone
                      ? "text-emerald-700"
                      : isCurrent
                        ? "text-primary font-black font-headline"
                        : "text-on-surface/40"
                  }`}
                >
                  {t(STATUS_LABEL_KEYS[step] as any)}
                </p>
                {showAction && (
                  <div className="mt-2">
                    <ActionButton
                      className="rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] font-headline"
                      onClick={handleTransition}
                      loading={loading}
                    >
                      {t(transition.actionKey as any)}
                    </ActionButton>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Handle non-linear statuses gracefully */}
      {(status === "closed_refunded" || status === "disputed") && (
        <div className="mt-4 rounded-2xl bg-[#ffe8ea] px-4 py-3">
          <p className="text-[11px] font-black text-[#b42318] font-headline uppercase tracking-[0.12em]">
            {status === "disputed" ? "Disputed" : "Closed / Refunded"}
          </p>
        </div>
      )}
    </div>
  );
}
