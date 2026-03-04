"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AppCard, CompareTable, EscrowStatusBadge, StepProgress, TrustPanel } from "@/components/ui-kit";
import { ErrorState, LoadingState } from "@/components/states";
import { projectsApi } from "@/lib/api/endpoints";
import { useProjectDetail } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";

export default function ProjectPaymentPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const router = useRouter();
  const toast = useToastStore((s) => s.push);

  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [faqOpen, setFaqOpen] = useState(false);
  const initializedRef = useRef(false);
  const projectQuery = useProjectDetail(projectId);

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
  const statusValue = paymentStatusQuery.data?.status ?? invoice.payment.status;
  const paymentSteps = ["Invoice Created", "Waiting Payment", "Confirmed"];
  const currentStep = statusValue === "paid" ? 2 : 1;

  const feeBreakdown = useMemo(() => {
    const total = invoice.payment.amount;
    const fee = Math.round(total * 0.12);
    const freelancerAmount = total - fee;
    return { total, fee, freelancerAmount };
  }, [invoice.payment.amount]);

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <AppCard>
        <h1 className="text-2xl font-semibold">Escrow Payment</h1>
        <p className="mt-1 text-sm text-slate-600">Complete secure invoice payment to hold funds safely in escrow.</p>
        <div className="mt-3">
          <StepProgress steps={paymentSteps} currentStep={currentStep} />
        </div>
      </AppCard>

      <div className="grid gap-4 md:grid-cols-2">
        <AppCard className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project Summary</p>
          <p className="font-semibold text-slate-900">{projectQuery.data?.title || `Project #${projectId}`}</p>
          <p className="text-sm text-slate-600">{projectQuery.data?.category}</p>
          <EscrowStatusBadge status={invoice.payment.escrow_status || "created"} />
          <p className="text-sm">Invoice ID: {invoice.invoice_id}</p>
          <p className="text-sm">Current status: {statusValue}</p>
          <p className="text-sm">Expires in: {secondsLeft}s</p>
        </AppCard>

        <AppCard className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pricing Transparency</p>
          <CompareTable
            rows={[
              { label: "Project amount", value: `${feeBreakdown.total} MNT` },
              { label: "Platform fee (12%)", value: `${feeBreakdown.fee} MNT` },
              { label: "Freelancer receives", value: `${feeBreakdown.freelancerAmount} MNT` },
            ]}
          />
          <TrustPanel />
        </AppCard>
      </div>

      <AppCard className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pay via QPay</p>

        {invoice.qr_image ? (
          <Image src={invoice.qr_image} alt="QPay QR" width={224} height={224} className="rounded-xl border border-slate-200" unoptimized />
        ) : (
          <p className="text-xs text-slate-500">QR image unavailable</p>
        )}

        {invoice.invoice_url ? (
          <a className="inline-block rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" href={invoice.invoice_url} target="_blank" rel="noreferrer">
            Open Payment Link
          </a>
        ) : null}
      </AppCard>

      <AppCard>
        <button className="w-full text-left text-sm font-semibold text-slate-800" onClick={() => setFaqOpen((prev) => !prev)}>
          {faqOpen ? "Hide" : "Show"} payment FAQ
        </button>
        {faqOpen ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Funds are held in escrow until delivery confirmation.</li>
            <li>If issue occurs, admin mediation and dispute tools are available.</li>
            <li>Never share payment credentials outside your bank app.</li>
          </ul>
        ) : null}
      </AppCard>

      {paymentStatusQuery.isError ? <ErrorState label="Unable to fetch payment status." /> : null}
      {paymentStatusQuery.data?.status === "failed" ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Payment failed or expired. Please return and create a new invoice.
        </div>
      ) : null}
    </section>
  );
}
