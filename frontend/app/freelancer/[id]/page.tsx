"use client";

import { use } from "react";
import Link from "next/link";

import { ErrorState, LoadingState } from "@/components/states";
import { AppCard, RatingStars } from "@/components/ui-kit";
import { projectsApi } from "@/lib/api/endpoints";
import { useProfile } from "@/lib/hooks";
import { useQuery } from "@tanstack/react-query";

export default function FreelancerPublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const profile = useProfile(id);
  const rating = useQuery({
    queryKey: ["rating-summary", id],
    queryFn: () => projectsApi.ratingSummary(id),
    enabled: !!id,
  });

  if (profile.isLoading) return <LoadingState label="Loading profile..." />;
  if (profile.isError || !profile.data) return <ErrorState label="Profile not found." />;

  const p = profile.data;
  const ratingData = rating.data;

  return (
    <section className="mx-auto max-w-2xl space-y-6 pb-20">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
        ← Back to projects
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{p.full_name || "Freelancer"}</h1>
            {ratingData && ratingData.total > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <RatingStars value={ratingData.average} />
                <span className="text-sm text-slate-500">
                  ({ratingData.total} review{ratingData.total !== 1 ? "s" : ""})
                </span>
              </div>
            )}
          </div>
          {p.hourly_rate > 0 && (
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-500">Hourly Rate</p>
              <p className="text-xl font-semibold text-emerald-600">
                {p.hourly_rate.toLocaleString()} MNT
              </p>
            </div>
          )}
        </div>

        {/* Bio */}
        {p.bio && (
          <div className="mt-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">About</h2>
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{p.bio}</p>
          </div>
        )}

        {/* Skills */}
        {p.skills?.length > 0 && (
          <div className="mt-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {p.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty state for incomplete profile */}
      {!p.bio && (!p.skills || p.skills.length === 0) && (
        <AppCard>
          <p className="text-center text-sm text-slate-500">
            This freelancer hasn&apos;t completed their profile yet.
          </p>
        </AppCard>
      )}
    </section>
  );
}
