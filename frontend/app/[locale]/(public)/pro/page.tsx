"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { EmptyState, ErrorState } from "@/components/shared/states";
import { ActionButton, AppCard, CompareTable, Modal, StatusPill } from "@/components/ui";
import { useMe, usePremiumCancel, usePremiumMe, usePremiumSubscribe } from "@/lib/hooks";

function formatMnt(value: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(Math.max(0, value))} ₮`;
}

export default function ProPage() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();
  const premiumMe = usePremiumMe({ enabled: !!me.data });
  const subscribe = usePremiumSubscribe();
  const cancel = usePremiumCancel();

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [winAmount, setWinAmount] = useState(500000);
  const [extraWins, setExtraWins] = useState(1);

  const monthlyPrice = 79000;
  const estimatedGain = useMemo(() => Math.max(0, winAmount * extraWins), [winAmount, extraWins]);
  const netAfterPlan = Math.max(0, estimatedGain - monthlyPrice);

  if (me.isLoading || premiumMe.isLoading) {
    return <section className="space-y-4"><div className="h-48 animate-pulse rounded-2xl border border-surface-200/60 bg-surface-100" /></section>;
  }

  if (!me.data) {
    return (
      <ErrorState
        label="PRO багц харахын тулд эхлээд нэвтэрнэ үү."
        action={<Link href={withLocale("/auth")} className="inline-flex min-h-11 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white">Нэвтрэх</Link>}
      />
    );
  }

  if (premiumMe.isError || !premiumMe.data) {
    return <ErrorState label="PRO багцын мэдээлэл ачааллаж чадсангүй." />;
  }

  if (me.data.role !== "freelancer") {
    return (
      <EmptyState
        label="PRO багц одоогоор freelancer role-д нээлттэй."
        action={<Link href={withLocale("/freelancer")} className="inline-flex min-h-11 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white">Freelancer самбар руу</Link>}
      />
    );
  }

  const isPremium = premiumMe.data.is_premium;

  return (
    <section className="space-y-5 pb-20">
      <AppCard className="border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-brand-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">ITZuun PRO</p>
            <h1 className="mt-1 text-2xl font-extrabold text-surface-900">Хурдан өсөх freelancer багц</h1>
            <p className="mt-1 text-sm text-surface-600">Visibility, proposal limit, support-оо нэг дор өсгөнө.</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-surface-500">Үнэ</p>
            <p className="text-2xl font-extrabold text-emerald-700">{formatMnt(monthlyPrice)}/сар</p>
            <div className="mt-2">
              <StatusPill label={isPremium ? "PRO active" : "Free tier"} tone={isPremium ? "success" : "neutral"} />
            </div>
          </div>
        </div>
      </AppCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AppCard>
          <h2 className="text-lg font-semibold text-surface-900">Free vs PRO</h2>
          <div className="mt-3">
            <CompareTable
              rows={[
                { label: "Сарын proposal limit", value: isPremium ? "50 (PRO)" : "10 (Free)" },
                { label: "Search visibility", value: "PRO = Priority boost (cap-тай)" },
                { label: "Support", value: "PRO = Priority support" },
                { label: "Badge", value: "PRO label" },
              ]}
            />
          </div>
        </AppCard>

        <AppCard>
          <h2 className="text-lg font-semibold text-surface-900">ROI тооцоолуур</h2>
          <p className="mt-1 text-sm text-surface-600">Хэрэв PRO-оор нэмэлт хэдэн ажил авах вэ гэдгээ тооцоол.</p>
          <div className="mt-3 space-y-3 text-sm">
            <label className="block">
              <span className="mb-1 block text-surface-600">Нэг ажил дундаж орлого (₮)</span>
              <input type="number" min={0} value={winAmount} onChange={(e) => setWinAmount(Number(e.target.value || 0))} className="w-full rounded-xl border border-surface-200/70 px-3 py-2" />
            </label>
            <label className="block">
              <span className="mb-1 block text-surface-600">PRO-оор нэмэгдэх боломжит win (сар)</span>
              <input type="number" min={0} value={extraWins} onChange={(e) => setExtraWins(Number(e.target.value || 0))} className="w-full rounded-xl border border-surface-200/70 px-3 py-2" />
            </label>
          </div>
          <div className="mt-4 rounded-xl bg-surface-50 p-3 text-sm">
            <p>Нэмэлт орлого: <strong>{formatMnt(estimatedGain)}</strong></p>
            <p>Багцын дараах цэвэр өсөлт: <strong className="text-emerald-700">{formatMnt(netAfterPlan)}</strong></p>
          </div>
        </AppCard>
      </div>

      <AppCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-surface-900">Дараагийн алхам</h3>
            <p className="mt-1 text-sm text-surface-600">
              PRO нь сонгогдохыг батлахгүй. Гэхдээ таны харагдах боломжийг өсгөнө.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isPremium ? (
              <ActionButton className="min-h-11 rounded-xl px-4 text-sm font-semibold" onClick={() => setShowUpgrade(true)} loading={subscribe.isPending}>
                PRO идэвхжүүлэх
              </ActionButton>
            ) : (
              <ActionButton tone="danger" className="min-h-11 rounded-xl px-4 text-sm font-semibold" onClick={() => cancel.mutate()} loading={cancel.isPending}>
                PRO цуцлах
              </ActionButton>
            )}
            <Link href={withLocale("/freelancer")} className="inline-flex min-h-11 items-center rounded-xl border border-surface-200 px-4 text-sm font-semibold text-surface-700">
              Dashboard руу буцах
            </Link>
          </div>
        </div>
      </AppCard>

      <Modal open={showUpgrade} title="ITZuun PRO идэвхжүүлэх үү?" onClose={() => setShowUpgrade(false)}>
        <p className="text-sm text-surface-600">Энэ үйлдлээр таны freelancer багц 30 хоног PRO болж шинэчлэгдэнэ.</p>
        <div className="mt-2 rounded-lg bg-surface-50 p-3 text-sm">
          <p>Төлбөр: <strong>{formatMnt(monthlyPrice)}</strong></p>
          <p>Багц: <strong>pro_monthly</strong></p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-lg bg-surface-100 px-3 py-2 text-sm font-medium text-surface-700" onClick={() => setShowUpgrade(false)}>
            Болих
          </button>
          <ActionButton
            className="rounded-lg px-3 py-2 text-sm font-semibold"
            onClick={() => {
              subscribe.mutate("pro_monthly", {
                onSuccess: () => setShowUpgrade(false),
              });
            }}
            loading={subscribe.isPending}
          >
            Баталгаажуулах
          </ActionButton>
        </div>
      </Modal>
    </section>
  );
}
