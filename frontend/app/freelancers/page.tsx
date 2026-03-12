"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { profilesApi, projectsApi } from "@/lib/api/endpoints";

import type { Profile } from "@/lib/types";

function FreelancerCard({ profile }: { profile: Profile }) {
  const rating = useQuery({
    queryKey: ["rating", profile.user],
    queryFn: () => projectsApi.ratingSummary(profile.user),
  });

  const avg = rating.data?.average ?? 0;
  const total = rating.data?.total ?? 0;

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
            {total > 0 && (
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-accent-500">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {avg.toFixed(1)} ({total})
              </span>
            )}
          </div>
        </div>

        <Link
          href={`/freelancer/${profile.user}`}
          className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700"
        >
          View Profile
        </Link>
      </div>
    </li>
  );
}

export default function FreelancersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const profiles = useQuery({
    queryKey: ["freelancers", page, search],
    queryFn: () => profilesApi.list(page, search ? { search } : undefined),
  });

  const items = profiles.data?.results || [];
  const hasNext = !!profiles.data?.next;
  const hasPrev = page > 1;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

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
              <FreelancerCard key={profile.id} profile={profile} />
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
