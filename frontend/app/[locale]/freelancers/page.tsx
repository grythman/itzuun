"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RatingStars, VerifiedBadge } from "@/components/ui-kit";
import { profilesApi } from "@/lib/api/endpoints";

import type { Profile } from "@/lib/types";

function FreelancerCard({ profile, withLocale }: { profile: Profile; withLocale: (href: string) => string }) {
  const avg = Number(profile.avg_rating ?? 0);
  const total = Number(profile.review_count ?? 0);

  return (
    <li className="rounded-2xl border border-surface-200/60 bg-white p-5 shadow-card transition hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-surface-900">
            {profile.full_name || "Unnamed Freelancer"}
          </h2>

          {profile.bio && (
            <p className="mt-1 line-clamp-2 text-[13px] text-surface-600">{profile.bio}</p>
          )}

          {profile.skills?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-700">
                  {skill}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-4 text-[11px] text-surface-500">
            {profile.hourly_rate > 0 && (
              <span>{Number(profile.hourly_rate).toLocaleString()}₮/hr</span>
            )}
            <span className="flex items-center gap-2">
              <VerifiedBadge status={profile.verification_status} />
              {total > 0 ? <RatingStars value={avg} /> : <span className="text-[11px] text-surface-400">No reviews yet</span>}
            </span>
          </div>
        </div>

        <Link
          href={withLocale(`/freelancer/${profile.user}`)}
          className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700"
        >
          View Profile
        </Link>
      </div>
    </li>
  );
}

export default function FreelancersPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get("page") || "1") || 1));
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") || "");
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [skillFilter, setSkillFilter] = useState(() => searchParams.get("skill") || "");
  const [minRating, setMinRating] = useState(() => searchParams.get("min_rating") || "");
  const [verifiedOnly, setVerifiedOnly] = useState(() => searchParams.get("verified") === "true");

  const profiles = useQuery({
    queryKey: ["freelancers", page, search, skillFilter, minRating, verifiedOnly],
    queryFn: () =>
      profilesApi.list(page, {
        ...(search ? { search } : {}),
        ...(skillFilter ? { skill: skillFilter } : {}),
        ...(minRating ? { min_rating: minRating } : {}),
        ...(verifiedOnly ? { verified: true } : {}),
      }),
  });

  const items = profiles.data?.results || [];
  const hasNext = !!profiles.data?.next;
  const hasPrev = page > 1;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function applyPreset(preset: "verified_45" | "react_verified" | "top_rated") {
    setPage(1);
    if (preset === "verified_45") {
      setVerifiedOnly(true);
      setMinRating("4.5");
      return;
    }
    if (preset === "react_verified") {
      setSkillFilter("react");
      setVerifiedOnly(true);
      setMinRating("");
      return;
    }
    setVerifiedOnly(false);
    setMinRating("5");
  }

  function clearFilters() {
    setPage(1);
    setSearchInput("");
    setSearch("");
    setSkillFilter("");
    setMinRating("");
    setVerifiedOnly(false);
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (search) params.set("search", search);
    if (skillFilter) params.set("skill", skillFilter);
    if (minRating) params.set("min_rating", minRating);
    if (verifiedOnly) params.set("verified", "true");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [page, search, skillFilter, minRating, verifiedOnly, pathname, router]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Find Freelancers</h1>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Search by name, bio, or skills..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 rounded-xl border border-surface-200/60 px-3 py-2 text-[13px]"
        />
        <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 text-[13px] text-white hover:bg-brand-700">
          Search
        </button>
      </form>
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          type="text"
          placeholder="Filter by skill..."
          value={skillFilter}
          onChange={(e) => {
            setSkillFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-surface-200/60 px-3 py-2 text-[13px]"
        />
        <select
          value={minRating}
          onChange={(e) => {
            setMinRating(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-surface-200/60 px-3 py-2 text-[13px]"
        >
          <option value="">Min rating</option>
          <option value="4">4.0+</option>
          <option value="4.5">4.5+</option>
          <option value="5">5.0</option>
        </select>
        <label className="flex items-center gap-2 rounded-xl border border-surface-200/60 px-3 py-2 text-[13px]">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => {
              setVerifiedOnly(e.target.checked);
              setPage(1);
            }}
          />
          Verified only
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full bg-surface-100 px-3 py-1 text-xs font-medium text-surface-700 hover:bg-surface-200"
          onClick={() => applyPreset("verified_45")}
        >
          Verified 4.5+
        </button>
        <button
          type="button"
          className="rounded-full bg-surface-100 px-3 py-1 text-xs font-medium text-surface-700 hover:bg-surface-200"
          onClick={() => applyPreset("react_verified")}
        >
          React Verified
        </button>
        <button
          type="button"
          className="rounded-full bg-surface-100 px-3 py-1 text-xs font-medium text-surface-700 hover:bg-surface-200"
          onClick={() => applyPreset("top_rated")}
        >
          Top Rated 5.0
        </button>
        <button
          type="button"
          className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          onClick={clearFilters}
        >
          Clear
        </button>
      </div>

      {profiles.isLoading ? (
        <LoadingState label="Loading freelancers..." />
      ) : profiles.isError ? (
        <ErrorState label="Could not load freelancers." />
      ) : !items.length ? (
        <EmptyState label="No freelancers found." />
      ) : (
        <>
          <ul className="grid gap-3">
            {items.map((profile) => (
              <FreelancerCard key={profile.id} profile={profile} withLocale={withLocale} />
            ))}
          </ul>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border border-surface-200/60 px-4 py-2 text-[13px] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-[13px] text-surface-600">Page {page}</span>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-surface-200/60 px-4 py-2 text-[13px] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
