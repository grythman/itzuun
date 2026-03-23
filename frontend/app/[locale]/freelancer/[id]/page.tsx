"use client";
export const dynamic = "force-dynamic";

import { use } from "react";
import Link from "next/link";

import { ErrorState, LoadingState } from "@/components/states";
import { AppCard, RatingStars } from "@/components/ui-kit";
import { projectsApi, toArray } from "@/lib/api/endpoints";
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

  const reviews = useQuery({
    queryKey: ["user-reviews", id],
    queryFn: () => projectsApi.userReviews(id),
    enabled: !!id,
  });

  if (profile.isLoading) return <LoadingState label="Loading profile..." />;
  if (profile.isError || !profile.data) return <ErrorState label="Profile not found." />;

  const p = profile.data;
  const ratingData = rating.data;

  return (
    <section className="mx-auto max-w-2xl space-y-6 pb-20">
      <Link href="/projects" className="inline-flex items-center gap-1 text-[13px] text-brand-600 hover:underline">
        ← Back to projects
      </Link>

      <div className="rounded-2xl border border-surface-200/60 bg-white p-6 shadow-card">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{p.full_name || "Freelancer"}</h1>
            {ratingData && ratingData.total > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <RatingStars value={ratingData.average} />
                <span className="text-[13px] text-surface-500">
                  ({ratingData.total} review{ratingData.total !== 1 ? "s" : ""})
                </span>
              </div>
            )}
          </div>
          {p.hourly_rate > 0 && (
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-widest text-surface-500">Hourly Rate</p>
              <p className="text-xl font-semibold text-emerald-600">
                {p.hourly_rate.toLocaleString()} MNT
              </p>
            </div>
          )}
        </div>

        {/* Bio */}
        {p.bio && (
          <div className="mt-5">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-surface-500">About</h2>
            <p className="text-[13px] leading-relaxed text-surface-700 whitespace-pre-wrap">{p.bio}</p>
          </div>
        )}

        {/* Skills */}
        {p.skills?.length > 0 && (
          <div className="mt-5">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-surface-500">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {p.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-medium text-brand-700"
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
          <p className="text-center text-[13px] text-surface-500">
            This freelancer hasn&apos;t completed their profile yet.
          </p>
        </AppCard>
      )}

      {/* Reviews */}
      {reviews.data && toArray(reviews.data).length > 0 && (
        <div className="rounded-2xl border border-surface-200/60 bg-white p-6 shadow-card">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-surface-500">Reviews</h2>
          <ul className="space-y-4">
            {toArray(reviews.data).map((review) => (
              <li key={review.id} className="border-b border-surface-100 pb-4 last:border-none last:pb-0">
                <div className="flex items-center gap-2">
                  <RatingStars value={review.rating} />
                  {review.created_at && (
                    <span className="text-[11px] text-surface-400">{new Date(review.created_at).toLocaleDateString()}</span>
                  )}
                </div>
                {review.comment && (
                  <p className="mt-2 text-[13px] leading-relaxed text-surface-700">{review.comment}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
