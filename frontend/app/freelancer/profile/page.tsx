"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { RoleGuard } from "@/components/role-guard";
import { ErrorState, LoadingState } from "@/components/states";
import { ActionButton, AppCard, DashboardBottomBar, RoleSidebar, VerifiedBadge } from "@/components/ui-kit";
import { profilesApi } from "@/lib/api/endpoints";
import { useMe, useMutation, useMyProfile } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";
import { profileSchema } from "@/lib/validators";

import type { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";

type ProfileForm = z.infer<typeof profileSchema>;

export default function FreelancerProfilePage() {
  const me = useMe();
  const profile = useMyProfile();
  const queryClient = useQueryClient();
  const toast = useToastStore((s) => s.push);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", title: "", bio: "", skills: "", hourly_rate: 0, is_available: true, response_time_hours: 24, portfolio: [] },
  });

  useEffect(() => {
    if (profile.data) {
      reset({
        full_name: profile.data.full_name || "",
        title: profile.data.title || "",
        bio: profile.data.bio || "",
        skills: (profile.data.skills || []).join(", "),
        hourly_rate: Number(profile.data.hourly_rate) || 0,
        is_available: profile.data.is_available ?? true,
        response_time_hours: profile.data.response_time_hours ?? 24,
        portfolio: profile.data.portfolio || [],
      });
    }
  }, [profile.data, reset]);

  const updateMutation = useMutation({
    mutationFn: (values: ProfileForm) =>
      profilesApi.updateMe({
        full_name: values.full_name,
        title: values.title,
        bio: values.bio || "",
        skills: values.skills
          ? values.skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        hourly_rate: values.hourly_rate,
        is_available: values.is_available,
        response_time_hours: values.response_time_hours,
        portfolio: values.portfolio,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      toast("success", "Profile updated");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  if (me.isLoading || profile.isLoading) return <LoadingState label="Loading profile..." />;
  if (me.isError || !me.data) return <ErrorState label="Please sign in first." />;

  const completeness = profile.data?.profile_completeness || 0;

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="freelancer" fallbackPath="/auth">
      <section className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My Profile</h1>
          <VerifiedBadge verified={me.data.is_verified} />
        </div>

        <div className="flex gap-4">
          <RoleSidebar role="freelancer" />

          <div className="flex-1 space-y-4">
            {/* Profile completeness */}
            <AppCard>
              <p className="text-[13px] font-semibold text-surface-800">Profile completeness: {completeness}%</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-surface-100">
                <div
                  className="h-1.5 rounded-full bg-emerald-600 transition-all"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              {completeness < 100 && (
                <p className="mt-2 text-[11px] text-surface-500">
                  Fill in all fields to reach 100% and get more visibility.
                </p>
              )}
            </AppCard>

            {/* Profile edit form */}
            <form
              onSubmit={handleSubmit((v) => updateMutation.mutate(v))}
              className="rounded-2xl border border-surface-200/60 bg-white p-6 shadow-card space-y-5"
            >
              <h2 className="text-lg font-medium text-surface-900">Edit Profile</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="full_name" className="mb-1 block text-[13px] font-medium text-surface-700">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    {...register("full_name")}
                    className="w-full rounded-xl border border-surface-200/60 px-4 py-2.5 text-[13px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="Your full name"
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.full_name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="title" className="mb-1 block text-[13px] font-medium text-surface-700">
                    Professional Title
                  </label>
                  <input
                    id="title"
                    {...register("title")}
                    className="w-full rounded-xl border border-surface-200/60 px-4 py-2.5 text-[13px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="e.g. Senior Frontend Developer"
                  />
                  {errors.title && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.title.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="mb-1 block text-[13px] font-medium text-surface-700">
                  Bio
                </label>
                <textarea
                  id="bio"
                  {...register("bio")}
                  rows={4}
                  className="w-full rounded-xl border border-surface-200/60 px-4 py-2.5 text-[13px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Tell clients about yourself, your experience, and what you can offer..."
                />
                {errors.bio && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.bio.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="skills" className="mb-1 block text-[13px] font-medium text-surface-700">
                  Skills
                </label>
                <input
                  id="skills"
                  {...register("skills")}
                  className="w-full rounded-xl border border-surface-200/60 px-4 py-2.5 text-[13px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="React, TypeScript, Node.js, Python (comma separated)"
                />
                <p className="mt-1 text-[11px] text-surface-500">Separate skills with commas</p>
                {errors.skills && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.skills.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label htmlFor="hourly_rate" className="mb-1 block text-[13px] font-medium text-surface-700">
                    Hourly Rate (MNT)
                  </label>
                  <input
                    id="hourly_rate"
                    type="number"
                    {...register("hourly_rate")}
                    className="w-full rounded-xl border border-surface-200/60 px-4 py-2.5 text-[13px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="50000"
                    min={0}
                  />
                  {errors.hourly_rate && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.hourly_rate.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="response_time_hours" className="mb-1 block text-[13px] font-medium text-surface-700">
                    Response Time (Hours)
                  </label>
                  <input
                    id="response_time_hours"
                    type="number"
                    {...register("response_time_hours")}
                    className="w-full rounded-xl border border-surface-200/60 px-4 py-2.5 text-[13px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="24"
                    min={1}
                  />
                  {errors.response_time_hours && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.response_time_hours.message}</p>
                  )}
                </div>

                <div className="flex items-center mt-6">
                  <input
                    id="is_available"
                    type="checkbox"
                    {...register("is_available")}
                    className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="is_available" className="ml-2 block text-[13px] font-medium text-surface-700">
                    Available for Work
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ActionButton type="submit" loading={updateMutation.isPending} disabled={!isDirty}>
                  Save Profile
                </ActionButton>
                {isDirty && (
                  <button
                    type="button"
                    className="rounded-xl px-4 py-2.5 text-[13px] text-surface-600 hover:bg-surface-100"
                    onClick={() => reset()}
                  >
                    Discard Changes
                  </button>
                )}
              </div>
            </form>

            {/* Preview card */}
            {profile.data && (
              <AppCard>
                <h2 className="mb-3 text-lg font-medium text-surface-900">Profile Preview</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-surface-500">Name</p>
                    <p className="text-[13px] font-medium text-surface-800">{profile.data.full_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-surface-500">Bio</p>
                    <p className="text-[13px] text-surface-700 whitespace-pre-wrap">
                      {profile.data.bio || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-surface-500">Skills</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {(profile.data.skills || []).length > 0 ? (
                        profile.data.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-medium text-brand-700"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-[13px] text-surface-400">—</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-surface-500">Hourly Rate</p>
                    <p className="text-[13px] font-medium">
                      {profile.data.hourly_rate
                        ? `${profile.data.hourly_rate.toLocaleString()} MNT`
                        : "—"}
                    </p>
                  </div>
                </div>
              </AppCard>
            )}
          </div>
        </div>

        <DashboardBottomBar role="freelancer" />
      </section>
    </RoleGuard>
  );
}

function calculateCompleteness(
  profile: { full_name: string; bio: string; skills: string[]; hourly_rate: number } | undefined,
): number {
  if (!profile) return 0;
  let filled = 0;
  const total = 4;
  if (profile.full_name) filled++;
  if (profile.bio) filled++;
  if (profile.skills?.length > 0) filled++;
  if (profile.hourly_rate > 0) filled++;
  return Math.round((filled / total) * 100);
}
