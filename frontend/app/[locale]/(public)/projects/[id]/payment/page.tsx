"use client";
export const dynamic = "force-dynamic";

import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  ActionButton,
  AppCard,
  CompareTable,
  ConfirmationDialog,
  EscrowStatusBadge,
  StatusPill,
  StepProgress,
  TrustPanel,
} from "@/components/ui";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { useTranslations } from "next-intl";

import { projectsApi } from "@/lib/api/endpoints";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useProjectDetail } from "@/lib/hooks";
import { useToastStore } from "@/lib/stores/toast-store";

// ─── Types ───────────────────────────────────────────────────────────────────

type EscrowLifecycleState =
  | "created"
  | "pending_admin"
  | "held"
  | "released"
  | "disputed"
  | "refunded";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMnt(value: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} ₮`;
}

function mapEscrowState(s: string | undefined): EscrowLifecycleState {
  if (!s) return "created";
  const n = s.toLowerCase();
  if (n === "pending_admin") return "pending_admin";
  if (n === "held") return "held";
  if (n === "released" || n === "paid") return "released";
  if (n === "disputed") return "disputed";
  if (n === "refunded") return "refunded";
  return "created";
}

/** True when backend says QPay credentials are not configured. */
function isQpayUnavailable(error: unknown): boolean {
  const payload = (error as any)?.response?.data;
  return (
    payload?.error_code === "qpay_unavailable" ||
    (error as any)?.response?.status === 503
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Shown when QPay is not configured — user-friendly, no technical text. */
function ManualPaymentBanner({
  projectId,
  supportHref,
}: {
  projectId: string;
  supportHref: string;
}) {
  const m = useTranslations("ManualFlow");
  return (
    <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-2xl">💳</span>
        <div>
          <p className="font-semibold text-amber-900">
            {m("bannerTitle")}
          </p>
          <p className="mt-1 text-sm text-amber-800">
            {m("bannerText")}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <a
          href={`mailto:support@itzuun.mn?subject=Escrow%20payment%20-%20Project%20%23${projectId}`}
          className="inline-flex min-h-11 items-center rounded-xl bg-amber-600 px-5 text-[13px] font-semibold text-white hover:bg-amber-700"
        >
          {m("adminCta")}
        </a>
        <Link
          href={supportHref}
          className="inline-flex min-h-11 items-center rounded-xl border border-amber-300 bg-white px-5 text-[13px] font-semibold text-amber-800"
        >
          {m("supportCta")}
        </Link>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

const lifecycleMeta: Record<
  EscrowLifecycleState,
  {
    title: string;
    tone: "neutral" | "success" | "warning" | "danger" | "info";
    what: string;
    now: string;
    actor: string;
    next: string;
  }
> = {
  created: {
    title: "Created",
    tone: "info",
    what: "Invoice үүссэн, төлбөр хүлээгдэж байна.",
    now: "QPay-ээр төлбөрөө дуусга.",
    actor: "Client",
    next: "Төлбөр амжилттай бол Held шат руу орно.",
  },
  pending_admin: {
    title: "Pending admin",
    tone: "warning",
    what: "Төлбөр баталгаажуулалт хүлээгдэж байна.",
    now: "Status-аа шинэчлэн шалга.",
    actor: "Admin/System",
    next: "Held шат руу шилжинэ.",
  },
  held: {
    title: "Held",
    tone: "success",
    what: "Мөнгө escrow-д түгжигдсэн.",
    now: "Ажлаа гүйцэтгэж review шат руу ор.",
    actor: "Freelancer + Client",
    next: "Released эсвэл Disputed.",
  },
  released: {
    title: "Released",
    tone: "info",
    what: "Төлбөр freelancer руу шилжсэн.",
    now: "Project дууссан.",
    actor: "System",
    next: "Final review үлдээж болно.",
  },
  disputed: {
    title: "Disputed",
    tone: "danger",
    what: "Маргаантай тул escrow түгжигдсэн.",
    now: "Нотолгоо бэлдэж support/admin-т ханд.",
    actor: "Admin",
    next: "Шийдвэрийн дагуу Released/Refunded.",
  },
  refunded: {
    title: "Refunded",
    tone: "neutral",
    what: "Мөнгө client руу буцсан.",
    now: "Case хаагдсан.",
    actor: "System",
    next: "Дахин ажил эхлүүлэх бол шинэ escrow үүсгэнэ.",
  },
};

export default function ProjectPaymentPage() {
  const params = useParams<{ id: string; locale: string }>();
  const projectId = params.id;
  const locale = params.locale || "mn";
  const withLocale = (href: string) => `/${locale}${href}`;
  const router = useRouter();
  const toast = useToastStore((s) => s.push);

  const [invoiceOpenConfirm, setInvoiceOpenConfirm] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [faqOpen, setFaqOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const projectQuery = useProjectDetail(projectId);

  // ── Create invoice mutation ────────────────────────────────────────────────
  const createPaymentMutation = useMutation({
    mutationFn: () => projectsApi.createPayment(projectId),
    onSuccess: (data) => {
      setExpiresAt(Date.now() + data.expires_in_seconds * 1000);
      toast("success", "QPay invoice амжилттай үүслээ");
    },
    onError: (error: Error) => {
      // QPay not configured — do NOT toast; ManualPaymentBanner handles UI.
      if (isQpayUnavailable(error)) return;

      const payload = (error as any)?.response?.data;
      if (payload?.error_code === "no_selected_proposal") {
        toast(
          "error",
          "Эхлээд фрилансер сонгоно уу. Төслийн хуудас руу буцаж санал сонгоно уу.",
        );
      } else {
        toast("error", extractApiErrorMessage(error, "Invoice үүсгэхэд алдаа гарлаа."));
      }
    },
  });

  // ── Payment status query ────────────────────────────────────────────────────
  // Only poll after we have a live invoice — never poll on a fresh project.
  const hasActiveInvoice = !!createPaymentMutation.data;

  const paymentStatusQuery = useQuery({
    queryKey: ["payment-status", projectId],
    queryFn: () => projectsApi.paymentStatus(projectId),
    enabled: hasActiveInvoice,
    retry: false,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      // Stop polling when terminal or not yet created
      if (!s || s === "not_created") return false;
      if (s === "paid" || s === "failed") return false;
      return 5000;
    },
  });

  // ── Derived state ──────────────────────────────────────────────────────────
  const paymentData = createPaymentMutation.data;
  const rawStatus = paymentStatusQuery.data?.status;
  const qpayUnavailableFromCreate = isQpayUnavailable(createPaymentMutation.error);
  const qpayUnavailableFromStatus =
    paymentStatusQuery.isError && isQpayUnavailable(paymentStatusQuery.error);
  const showManualBanner = qpayUnavailableFromCreate || qpayUnavailableFromStatus;

  const statusValue =
    rawStatus && rawStatus !== "not_created"
      ? rawStatus
      : (paymentData?.payment?.status ?? "pending");

  const escrowState = mapEscrowState(
    paymentData?.payment?.escrow_status || statusValue,
  );

  const total = Number(
    paymentData?.payment?.amount || projectQuery.data?.budget || 0,
  );
  const pct = Number(paymentData?.fee_pct || 12);
  const fee = Math.round(total * (pct / 100));
  const freelancerAmount = total - fee;

  const secondsLeft = useMemo(() => {
    if (!expiresAt) return 0;
    return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  }, [expiresAt]);

  const paymentSteps = ["Invoice", "Escrow hold", "Completion"];
  const currentStep = statusValue === "paid" ? 1 : 0;

  const lastCheckedLabel = paymentStatusQuery.dataUpdatedAt
    ? new Date(paymentStatusQuery.dataUpdatedAt).toLocaleTimeString("mn-MN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "-";

  const createErrorLabel = useMemo(() => {
    if (!createPaymentMutation.error) return "";
    if (isQpayUnavailable(createPaymentMutation.error)) return ""; // handled by banner
    const payload = (createPaymentMutation.error as any)?.response?.data;
    if (payload?.error_code === "no_selected_proposal") {
      return "Эхлээд фрилансер сонгоно уу. Төслийн хуудас руу буцаж санал сонгоно уу.";
    }
    return extractApiErrorMessage(
      createPaymentMutation.error,
      "Invoice үүсгэхэд алдаа гарлаа.",
    );
  }, [createPaymentMutation.error]);

  const canCreateInvoice =
    !paymentData || statusValue === "failed" || secondsLeft === 0;

  if (projectQuery.isLoading) return <LoadingState label="Төлбөрийн мэдээлэл ачааллаж байна..." />;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section className="mx-auto max-w-6xl space-y-5 px-4 pb-20">
      {/* Header */}
      <AppCard>
        <h1 className="text-2xl font-semibold">Escrow Төлбөр</h1>
        <p className="mt-1 text-[13px] text-surface-500">
          Төлбөрөө аюулгүй escrow-д байршуулж, эрсдэлгүй гүйцэтгэл эхлүүл.
        </p>
        <div className="mt-3">
          <StepProgress steps={paymentSteps} currentStep={currentStep} />
        </div>
      </AppCard>

      {/* QPay unavailable — show friendly banner, hide all QPay UI */}
      {showManualBanner ? (
        <ManualPaymentBanner
          projectId={projectId}
          supportHref={withLocale("/support")}
        />
      ) : (
        <>
          {/* Breakdown + Escrow state */}
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            <AppCard className="space-y-3 xl:col-span-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-surface-500">
                Төлбөрийн задаргаа
              </p>
              <CompareTable
                rows={[
                  { label: "Нийт дүн", value: formatMnt(total) },
                  {
                    label: `Платформ шимтгэл (${pct}%)`,
                    value: formatMnt(fee),
                  },
                  { label: "Freelancer авах дүн", value: formatMnt(freelancerAmount) },
                ]}
              />
              <p className="text-[12px] text-surface-600">
                Давхар төлбөрөөс сэргийлэхийн тулд нэг invoice-г нэг удаа төлнө.
              </p>
            </AppCard>

            <AppCard className="space-y-3 xl:col-span-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-surface-500">
                Escrow state
              </p>
              <div className="flex items-center gap-2">
                <EscrowStatusBadge status={escrowState} />
                <StatusPill
                  label={lifecycleMeta[escrowState].title}
                  tone={lifecycleMeta[escrowState].tone}
                />
              </div>
              <ul className="space-y-1 text-[12px] text-surface-700">
                <li>
                  <strong>Юу болсон:</strong> {lifecycleMeta[escrowState].what}
                </li>
                <li>
                  <strong>Одоо юу хийх:</strong> {lifecycleMeta[escrowState].now}
                </li>
                <li>
                  <strong>Хэн хийх:</strong> {lifecycleMeta[escrowState].actor}
                </li>
                <li>
                  <strong>Дараагийн алхам:</strong> {lifecycleMeta[escrowState].next}
                </li>
              </ul>
            </AppCard>
          </div>

          {/* Invoice card */}
          <AppCard className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-surface-500">
              Төсөл
            </p>
            <p className="font-semibold text-surface-900">
              {projectQuery.data?.title || `Project #${projectId}`}
            </p>
            <p className="text-[13px] text-surface-600">
              {projectQuery.data?.category}
            </p>

            {!paymentData ? (
              <div className="space-y-2">
                <p className="text-[12px] text-surface-600">
                  Invoice үүсгэсний дараа QPay link/QR харагдана.
                </p>
                <ActionButton
                  className="min-h-11 rounded-xl px-4 text-[13px] font-semibold"
                  onClick={() => createPaymentMutation.mutate()}
                  loading={createPaymentMutation.isPending}
                  disabled={
                    createPaymentMutation.isPending ||
                    paymentStatusQuery.isFetching
                  }
                >
                  Invoice үүсгэх
                </ActionButton>
                {createPaymentMutation.isError && createErrorLabel ? (
                  <ErrorState
                    label={createErrorLabel}
                    action={
                      <button
                        className="min-h-11 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-red-700"
                        onClick={() => createPaymentMutation.mutate()}
                      >
                        Дахин оролдох
                      </button>
                    }
                  />
                ) : null}
              </div>
            ) : (
              <>
                <p className="text-[13px]">
                  Invoice ID:{" "}
                  <span className="font-mono text-[12px]">
                    {paymentData.invoice_id}
                  </span>
                </p>
                <p className="text-[13px]">Статус: {statusValue}</p>
                {secondsLeft > 0 && (
                  <p className="text-[13px]">
                    Хугацаа: {secondsLeft}с үлдсэн
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-surface-600">
                  <span>Сүүлд шалгасан: {lastCheckedLabel}</span>
                  <button
                    className="rounded-md border border-surface-200 px-2 py-1 font-semibold"
                    onClick={() => paymentStatusQuery.refetch()}
                  >
                    Шинэчлэх
                  </button>
                </div>

                {paymentData.qr_image ? (
                  <Image
                    src={paymentData.qr_image}
                    alt="QPay QR"
                    width={224}
                    height={224}
                    className="rounded-xl border border-surface-200/60"
                    unoptimized
                  />
                ) : (
                  <p className="text-[11px] text-surface-500">
                    QR код ачааллаагүй байна
                  </p>
                )}

                <ActionButton
                  className="min-h-11 rounded-xl px-4 text-[13px] font-semibold"
                  tone="success"
                  onClick={() => setInvoiceOpenConfirm(true)}
                  disabled={!paymentData.invoice_url || statusValue === "paid"}
                >
                  Төлбөрийн линк нээх
                </ActionButton>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex min-h-11 items-center rounded-xl border border-surface-200 bg-white px-4 text-[13px] font-semibold text-surface-700"
                    onClick={async () => {
                      await navigator.clipboard.writeText(paymentData.invoice_id);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    {copied ? "Invoice ID хуулсан ✓" : "Invoice ID хуулах"}
                  </button>
                  <Link
                    href={withLocale("/support")}
                    className="inline-flex min-h-11 items-center rounded-xl border border-surface-200 bg-white px-4 text-[13px] font-semibold text-surface-700"
                  >
                    Дэмжлэг авах
                  </Link>
                </div>

                {(secondsLeft === 0 || statusValue === "failed") &&
                  canCreateInvoice && (
                    <button
                      className="inline-flex min-h-11 items-center rounded-xl border border-surface-200 bg-white px-4 text-[13px] font-semibold text-surface-700"
                      onClick={() => createPaymentMutation.mutate()}
                      disabled={createPaymentMutation.isPending}
                    >
                      Шинэ invoice үүсгэх
                    </button>
                  )}
              </>
            )}
          </AppCard>

          <TrustPanel />

          {/* FAQ */}
          <AppCard>
            <button
              className="w-full text-left text-[13px] font-semibold text-surface-800"
              onClick={() => setFaqOpen((p) => !p)}
            >
              {faqOpen ? "Хаах" : "Түгээмэл асуулт харах"}
            </button>
            {faqOpen && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px] text-surface-600">
                <li>
                  Escrow held үед client болон freelancer хоёулаа хамгаалагдана.
                </li>
                <li>
                  Маргаан гарвал dispute нээж admin медиаци авах боломжтой.
                </li>
                <li>
                  Төлбөр удааширвал &ldquo;Шинэчлэх&rdquo; товч дараад дэмжлэгт хандна уу.
                </li>
              </ul>
            )}
          </AppCard>

          {/* Fallback: payment status error that is NOT qpay_unavailable */}
          {paymentStatusQuery.isError && !qpayUnavailableFromStatus && (
            <ErrorState
              label="Төлбөрийн статус ачааллахад алдаа гарлаа."
              action={
                <div className="flex flex-wrap gap-2">
                  <button
                    className="min-h-11 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-red-700"
                    onClick={() => paymentStatusQuery.refetch()}
                  >
                    Дахин оролдох
                  </button>
                  <Link
                    href={withLocale("/support")}
                    className="inline-flex min-h-11 items-center rounded-lg bg-white px-4 py-2 text-xs font-semibold text-red-700"
                  >
                    Дэмжлэг авах
                  </Link>
                </div>
              }
            />
          )}

          {/* Success */}
          {statusValue === "paid" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Төлбөр баталгаажлаа. Escrow түгжигдсэн.{" "}
              <button
                className="ml-1 font-semibold underline"
                onClick={() => router.push(withLocale(`/projects/${projectId}`))}
              >
                Төслийн хуудас руу буцах
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirmation dialog */}
      <ConfirmationDialog
        open={invoiceOpenConfirm}
        title="Төлбөр үргэлжлүүлэх"
        message={`Та ${formatMnt(total)} төлж escrow-г идэвхжүүлнэ. Давхар төлбөрөөс сэргийлж банк апп дээр зөвхөн нэг удаа баталгаажуул.`}
        confirmLabel="Тийм, үргэлжлүүл"
        confirmTone="success"
        onCancel={() => setInvoiceOpenConfirm(false)}
        onConfirm={() => {
          if (paymentData?.invoice_url) {
            window.open(paymentData.invoice_url, "_blank", "noopener,noreferrer");
          }
          setInvoiceOpenConfirm(false);
        }}
      />
    </section>
  );
}
