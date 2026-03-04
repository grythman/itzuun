"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ErrorState, LoadingState } from "@/components/states";
import { projectsApi } from "@/lib/api/endpoints";
import { useToastStore } from "@/lib/toast-store";

export default function ProjectPaymentPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const router = useRouter();
  const toast = useToastStore((s) => s.push);

  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const initializedRef = useRef(false);

  const createPaymentMutation = useMutation({
    mutationFn: () => projectsApi.createPayment(projectId),
    onSuccess: (data) => {
      const expiration = Date.now() + data.expires_in_seconds * 1000;
      setExpiresAt(expiration);
      toast("success", "QPay invoice created");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    createPaymentMutation.mutate();
  }, [createPaymentMutation]);

  const paymentStatusQuery = useQuery({
    queryKey: ["payment-status", projectId],
    queryFn: () => projectsApi.paymentStatus(projectId),
    enabled: !!projectId,
    refetchInterval: (query) => {
      const statusValue = query.state.data?.status;
      return statusValue === "paid" || statusValue === "failed" ? false : 5000;
    },
  });

  useEffect(() => {
    if (paymentStatusQuery.data?.status === "paid") {
      toast("success", "Payment confirmed. Escrow is now held.");
      router.push(`/projects/${projectId}`);
    }
  }, [paymentStatusQuery.data?.status, projectId, router, toast]);

  const secondsLeft = useMemo(() => {
    if (!expiresAt) return 0;
    return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  }, [expiresAt, paymentStatusQuery.dataUpdatedAt]);

  if (createPaymentMutation.isPending) {
    return <LoadingState label="Creating QPay invoice..." />;
  }

  if (createPaymentMutation.isError || !createPaymentMutation.data) {
    return <ErrorState label="Unable to create payment invoice." />;
  }

  const invoice = createPaymentMutation.data;

  return (
    <section className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Escrow Payment</h1>
      <p className="text-sm text-slate-600">Scan QR from banking app or open payment link. Status auto-checks every 5 seconds.</p>

      <div className="rounded-md border border-slate-200 bg-white p-4 space-y-3">
        <p className="text-sm">Invoice ID: {invoice.invoice_id}</p>
        <p className="text-sm">Amount: {invoice.payment.amount}</p>
        <p className="text-sm">Current status: {paymentStatusQuery.data?.status ?? invoice.payment.status}</p>
        <p className="text-sm">Expires in: {secondsLeft}s</p>

        {invoice.qr_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={invoice.qr_image} alt="QPay QR" className="h-56 w-56 rounded border border-slate-200" />
        ) : (
          <p className="text-xs text-slate-500">QR image unavailable</p>
        )}

        {invoice.invoice_url ? (
          <a className="inline-block rounded bg-blue-600 px-3 py-2 text-white" href={invoice.invoice_url} target="_blank" rel="noreferrer">
            Open Payment Link
          </a>
        ) : null}
      </div>

      {paymentStatusQuery.isError ? <ErrorState label="Unable to fetch payment status." /> : null}
      {paymentStatusQuery.data?.status === "failed" ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Payment failed or expired. Please return and create a new invoice.
        </div>
      ) : null}
    </section>
  );
}
