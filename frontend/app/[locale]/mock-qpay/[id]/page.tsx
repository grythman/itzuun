"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppCard, ActionButton } from "@/components/ui-kit";
import { LoadingState } from "@/components/states";
import { useToastStore } from "@/lib/toast-store";
import { API_BASE } from "@/lib/api/endpoints";

export default function MockQPayPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const toast = useToastStore((s) => s.push);

  async function handleSimulatePayment() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/payments/webhook/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: params.id,
          amount: 1000000,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
      toast("success", "Mock payment webhook triggered successfully!");
      // close window, since normally QPay would redirect or the user closes the app
      window.close();
      // fallback if window.close is blocked
      router.back();
    } catch (err: any) {
      toast("error", "Error simulating mock payment: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 p-6">
      <AppCard className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-brand-700">Sandbox QPay Gateway</h1>
        <p className="mt-2 text-[13px] text-surface-600">
          Invoice: <span className="font-mono text-surface-900">{params.id}</span>
        </p>

        <div className="mt-6 flex justify-center pb-4">
          <div className="h-32 w-32 animate-pulse rounded-xl bg-surface-200"></div>
        </div>

        <p className="mb-6 text-sm text-surface-500">
          This page only appears in local development. Click below to simulate paying this invoice.
        </p>

        <ActionButton loading={loading} onClick={handleSimulatePayment} className="w-full text-base py-3">
          Simulate Payment
        </ActionButton>
      </AppCard>
    </div>
  );
}