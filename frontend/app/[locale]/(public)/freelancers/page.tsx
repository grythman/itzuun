"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { RatingStars, VerifiedBadge } from "@/components/ui";
import { profilesApi } from "@/lib/api/endpoints";
import type { Profile } from "@/lib/types";

// ── helpers ──
const ChevronIcon = ({ down }: { down?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`h-3.5 w-3.5 transition-transform ${down ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
);

function FilterSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-secondary">{icon}</span>
          <span className="font-headline text-[9px] font-black uppercase tracking-[0.25em] text-surface-400">{title}</span>
        </div>
        <ChevronIcon down={open} />
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
}

function FreelancerCard({ profile, locale }: { profile: Profile; locale: string }) {
  const avg = Number(profile.avg_rating ?? 0);
  const total = Number(profile.review_count ?? 0);
  const rate = Number(profile.hourly_rate ?? 0);
  const skills = (profile.skills || []).slice(0, 5);
  const isVerified = profile.verification_status === "verified";

  return (
    <Link href={`/${locale}/freelancer/${profile.user}`} className="group block rounded-[2rem] bg-surface-container-lowest p-8 shadow-sm transition-all hover:shadow-ambient hover:-translate-y-0.5 relative overflow-hidden">
      {/* Hover accent bar */}
      <div className="absolute top-0 left-0 w-1 h-full bg-secondary opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            {isVerified && (
              <span className="inline-flex rounded-xl bg-secondary-fixed px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-secondary font-headline">Баталгаажсан</span>
            )}
            {profile.is_available && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-600">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />Нээлттэй
              </span>
            )}
          </div>

          <h2 className="font-headline text-[22px] font-black leading-tight tracking-tight text-primary group-hover:text-secondary transition-colors">
            {profile.full_name || "Нэргүй мэргэжилтэн"}
          </h2>

          {profile.title && (
            <p className="mt-1 text-[13px] font-bold text-surface-400">{profile.title}</p>
          )}

          {profile.bio && (
            <p className="mt-3 line-clamp-2 text-[14px] font-medium leading-relaxed text-surface-400">{profile.bio}</p>
          )}

          {skills.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="rounded-xl bg-surface-container-low px-3 py-1.5 text-[11px] font-bold text-surface-500 font-headline">{s}</span>
              ))}
            </div>
          )}

          {/* Footer — avatar row */}
          <div className="flex items-center gap-3 pt-6 mt-6 border-t border-surface-container">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary font-headline text-[13px] font-black text-primary-fixed">
              {isVerified
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="M20 6 9 17l-5-5" /></svg>
                : <span>{String(profile.full_name || "F")[0].toUpperCase()}</span>}
            </div>
            <div>
              <p className="text-[12px] font-black text-primary font-headline">{profile.full_name || "Мэргэжилтэн"}</p>
              <div className="flex items-center gap-1.5">
                <VerifiedBadge status={profile.verification_status} />
                {total > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-surface-400"><RatingStars value={avg} />({avg.toFixed(1)})</span>
                ) : (
                  <span className="text-[10px] text-surface-400">Шинэ</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right — rate + CTA */}
        <div className="lg:w-56 flex flex-col justify-between items-start lg:items-end gap-6">
          <div className="text-left lg:text-right">
            {rate > 0 && (
              <>
                <p className="font-headline text-[9px] font-black uppercase tracking-[0.2em] text-surface-400">Цагийн үнэ</p>
                <p className="mt-1 font-headline text-[22px] font-black text-secondary">₮{rate.toLocaleString()} <span className="text-[13px] font-bold opacity-60">/ цаг</span></p>
              </>
            )}
            {total > 0 && (
              <p className="mt-2 text-[11px] font-bold text-surface-400">{total} сэтгэгдэл</p>
            )}
          </div>
          <span className="inline-flex items-center gap-2 rounded-2xl primary-gradient px-6 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-primary-fixed font-headline shadow-sm transition-all group-hover:shadow-ambient">
            Профайл харах →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function FreelancersPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";

  const page = Number(searchParams.get("page") || "1");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const search = searchParams.get("search") || "";
  const skillFilter = searchParams.get("skill") || "";
  const minRating = searchParams.get("min_rating") || "";
  const verifiedOnly = searchParams.get("verified") === "true";
  const sortBy = searchParams.get("ordering") || "";

  const profiles = useQuery({
    queryKey: ["freelancers", page, search, skillFilter, minRating, verifiedOnly, sortBy],
    queryFn: () => profilesApi.list(page, {
      ...(search ? { search } : {}),
      ...(skillFilter ? { skill: skillFilter } : {}),
      ...(minRating ? { min_rating: minRating } : {}),
      ...(verifiedOnly ? { verified: true } : {}),
      ...(sortBy ? { ordering: sortBy } : {}),
    }),
  });

  const items: Profile[] = profiles.data?.results || [];
  const total = profiles.data?.count ?? items.length;
  const totalPages = Math.max(1, Math.ceil(total / 10));

  function push(updates: Record<string, string | undefined>) {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === "") p.delete(k);
      else p.set(k, v);
    });
    if (!updates.page) p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  }

  useEffect(() => { setSearchInput(search); }, [search]);

  const popularSkills = ["React", "Node.js", "Figma", "UI/UX", "TypeScript", "Python"];
  const ratingOptions = [
    { val: "", label: "Бүх" },
    { val: "4", label: "4.0+" },
    { val: "4.5", label: "4.5+" },
    { val: "5", label: "5.0" },
  ];

  return (
    <div className="flex min-h-screen gap-8 pb-24 lg:gap-12">

      {/* ── SIDEBAR ── */}
      <aside className="hidden w-56 shrink-0 space-y-7 lg:block">
        <div>
          <p className="font-headline text-[11px] font-black uppercase tracking-[0.25em] text-primary">Шүүлтүүр</p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.15em] text-surface-400">Хайлтаа нарийвчлах</p>
        </div>

        {/* Skills */}
        <FilterSection title="Ур чадвар" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
        }>
          <div className="flex flex-wrap gap-1.5">
            {popularSkills.map((s) => {
              const active = skillFilter.toLowerCase() === s.toLowerCase();
              return (
                <button key={s} type="button"
                  onClick={() => push({ skill: active ? "" : s.toLowerCase() })}
                  className={`rounded-xl px-3 py-1.5 text-[11px] font-black font-headline transition-all ${active ? "primary-gradient text-primary-fixed shadow-ambient" : "bg-surface-container-low text-surface-500 hover:bg-surface-container"}`}>
                  {s}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Min Rating */}
        <FilterSection title="Хамгийн бага үнэлгээ" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
        }>
          <div className="flex flex-wrap gap-1.5">
            {ratingOptions.map(({ val, label }) => {
              const active = minRating === val;
              return (
                <button key={val} type="button"
                  onClick={() => push({ min_rating: active ? "" : val })}
                  className={`rounded-xl px-3 py-1.5 text-[11px] font-black font-headline transition-all ${active ? "bg-secondary text-white" : "bg-surface-container-low text-surface-500 hover:bg-surface-container"}`}>
                  {label}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Verified */}
        <FilterSection title="Статус" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
        }>
          <label className="flex cursor-pointer items-center gap-2.5">
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${verifiedOnly ? "bg-secondary" : "bg-surface-container-low border border-surface-200"}`}
              onClick={() => push({ verified: verifiedOnly ? "" : "true" })}>
              {verifiedOnly && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="h-2.5 w-2.5"><path d="M20 6 9 17l-5-5" /></svg>}
            </span>
            <span className={`text-[13px] font-medium ${verifiedOnly ? "font-bold text-primary" : "text-surface-500"}`}>Зөвхөн баталгаажсан</span>
          </label>
        </FilterSection>

        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="w-full rounded-2xl primary-gradient py-4 text-[11px] font-black uppercase tracking-[0.2em] text-primary-fixed shadow-ambient font-headline transition-all hover:shadow-lg"
        >
          Шүүлтүүр хэрэглэх
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 min-w-0 space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-headline text-[36px] font-black tracking-tighter text-primary">Мэргэжилтэн хайх</h1>
            {!profiles.isLoading && <p className="mt-2 text-[14px] font-medium text-surface-400">Нийт <span className="font-black text-primary">{total.toLocaleString()}</span> мэргэжилтэн</p>}
          </div>
          <div className="flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => push({ ordering: e.target.value })}
              className="appearance-none rounded-2xl bg-surface-container-lowest py-3 pl-5 pr-10 text-[13px] font-bold text-primary outline-none shadow-sm focus:shadow-ambient"
            >
              <option value="">Шинэ</option>
              <option value="-avg_rating">Үнэлгээ ↓</option>
              <option value="hourly_rate">Цагийн үнэ ↑</option>
              <option value="-hourly_rate">Цагийн үнэ ↓</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-surface-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          </div>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && push({ search: searchInput })}
            placeholder="Нэр, ур чадвар, bio хайх..."
            className="w-full rounded-2xl bg-surface-container-lowest py-4 pl-12 pr-14 text-[14px] font-medium text-primary outline-none shadow-sm placeholder:text-surface-300 focus:shadow-ambient"
          />
          <button
            type="button"
            onClick={() => push({ search: searchInput })}
            aria-label="Хайх"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl primary-gradient text-primary-fixed shadow-sm transition-all hover:shadow-ambient"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          </button>
        </div>

        {/* Cards */}
        {profiles.isLoading && <LoadingState label="Мэргэжилтнүүд ачааллаж байна..." />}
        {profiles.isError && <ErrorState label="Алдаа гарлаа." />}
        {!profiles.isLoading && !profiles.isError && (
          items.length === 0
            ? <EmptyState
                label="Тохирох мэргэжилтэн олдсонгүй"
                description="Шүүлтүүрэе өөрчлөж дахин хайгаарай, эсвэл хайлтаа өөрчийг арилгаарай."
                action={
                  <button type="button" onClick={() => router.push(pathname)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-surface-container px-6 text-sm font-bold text-primary shadow-sm transition-all hover:shadow-ambient">
                    Шүүлтүүр цэвох
                  </button>
                }
              />
            : <div className="space-y-5">{items.map((p) => <FreelancerCard key={p.id} profile={p} locale={locale} />)}</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button type="button" disabled={page <= 1} onClick={() => push({ page: String(page - 1) })}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-lowest shadow-sm transition-all hover:shadow-ambient disabled:opacity-30 font-headline font-black text-surface-400">
              ‹
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p2 = i + 1;
              if (totalPages > 5) { const mid = Math.min(Math.max(page, 3), totalPages - 2); p2 = mid - 2 + i; }
              return (
                <button key={p2} type="button" onClick={() => push({ page: String(p2) })}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-[13px] font-black font-headline transition-all ${p2 === page ? "primary-gradient text-primary-fixed shadow-ambient" : "bg-surface-container-lowest text-surface-400 shadow-sm hover:shadow-ambient"}`}>
                  {p2}
                </button>
              );
            })}
            {totalPages > 5 && page < totalPages - 2 && (
              <>
                <span className="text-surface-400">…</span>
                <button type="button" onClick={() => push({ page: String(totalPages) })} className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-lowest text-[13px] font-black font-headline text-surface-400 shadow-sm hover:shadow-ambient">{totalPages}</button>
              </>
            )}
            <button type="button" disabled={page >= totalPages} onClick={() => push({ page: String(page + 1) })}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-lowest shadow-sm transition-all hover:shadow-ambient disabled:opacity-30 font-headline font-black text-surface-400">
              ›
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
