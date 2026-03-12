"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoleGuard } from "@/components/role-guard";
import { AppCard, ActionButton } from "@/components/ui-kit";
import { profilesApi } from "@/lib/api/endpoints";
import { useMe, useMutation, useMyProfile } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";
import { profileSchema } from "@/lib/validators";
import { useQueryClient } from "@tanstack/react-query";

import type { z } from "zod";

type ProfileForm = z.infer<typeof profileSchema>;

export default function ClientProfilePage() {
  const me = useMe();
  const profile = useMyProfile();
  const queryClient = useQueryClient();
  const toast = useToastStore((s) => s.push);

  const [isEditing, setIsEditing] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", bio: "", skills: "", hourly_rate: 0 },
  });

  const updateMutation = useMutation({
    mutationFn: (values: ProfileForm) =>
      profilesApi.updateMe({
        full_name: values.full_name,
        bio: values.bio,
        skills: values.skills
          ? values.skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        hourly_rate: values.hourly_rate,
      }),
    onSuccess: () => {
      profile.refetch();
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      setIsEditing(false);
      toast("success", "Profile updated");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  if (me.isLoading || profile.isLoading) return <LoadingState label="Loading profile..." />;
  if (me.isError || !me.data) return <ErrorState label="Please sign in first." />;
  if (profile.isError || !profile.data) return <ErrorState label="Could not load profile." />;

  const profileData = profile.data;

  function handleEdit() {
    form.reset({
      full_name: profileData.full_name || "",
      bio: profileData.bio || "",
      skills: (profileData.skills || []).join(", "),
      hourly_rate: profileData.hourly_rate || 0,
    });
    setSkillsInput((profileData.skills || []).join(", "));
    setIsEditing(true);
  }

  function handleSubmit(values: ProfileForm) {
    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    updateMutation.mutate(values);
  }

  function calculateCompleteness() {
    let filled = 0;
    if (profileData.full_name) filled++;
    if (profileData.bio) filled++;
    if (profileData.skills?.length > 0) filled++;
    if (profileData.hourly_rate > 0) filled++;
    return Math.round((filled / 4) * 100);
  }

  const completeness = calculateCompleteness();

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="client" fallbackPath="/auth">
      <section className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Client Profile</h1>
          <Link href="/client" className="text-[13px] text-brand-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>

        {!isEditing ? (
          <>
            <AppCard>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{profileData.full_name || "Your Company"}</h2>
                  {profileData.bio && <p className="mt-2 text-surface-600">{profileData.bio}</p>}

                  {profileData.skills?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {profileData.skills.map((skill) => (
                        <span key={skill} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[13px] font-medium text-brand-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 space-y-1 text-[13px] text-surface-500">
                    <p>Email: {me.data.email}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[13px] font-medium text-surface-800">Profile Completeness</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-surface-100">
                  <div className="h-1.5 rounded-full bg-brand-600" style={{ width: `${completeness}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-surface-500">{completeness}% complete</p>
              </div>

              <button
                type="button"
                className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-700"
                onClick={handleEdit}
              >
                Edit Profile
              </button>
            </AppCard>

            <AppCard>
              <h3 className="font-semibold">About Client Profile</h3>
              <p className="mt-2 text-[13px] text-surface-600">
                Your profile helps freelancers understand your business and builds trust for project collaboration. A complete profile increases the
                quality of proposals you receive.
              </p>
            </AppCard>
          </>
        ) : (
          <AppCard>
            <h2 className="text-lg font-semibold">Edit Your Profile</h2>
            <form className="mt-4 space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <label className="block text-sm font-medium">
                Company / Full Name *
                <input {...form.register("full_name")} placeholder="Your company name" className="mt-1" />
              </label>
              {form.formState.errors.full_name && <p className="text-xs text-red-600">{form.formState.errors.full_name.message}</p>}

              <label className="block text-sm font-medium">
                About Your Business
                <textarea {...form.register("bio")} placeholder="Describe your company, industry, and what you're looking for..." rows={4} className="mt-1" />
              </label>
              {form.formState.errors.bio && <p className="text-xs text-red-600">{form.formState.errors.bio.message}</p>}

              <label className="block text-sm font-medium">
                Services/Categories
                <input
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="web development, mobile apps, design, etc. (comma-separated)"
                  className="mt-1"
                />
              </label>

              <label className="block text-sm font-medium">
                Typical Budget Range (MNT)
                <input
                  type="number"
                  {...form.register("hourly_rate", { valueAsNumber: true })}
                  placeholder="Your typical project budget"
                  className="mt-1"
                />
              </label>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-surface-200/60 py-2 text-[13px] font-medium text-surface-700 hover:bg-surface-50"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <ActionButton className="flex-1 text-sm" type="submit" loading={updateMutation.isPending}>
                  Save Profile
                </ActionButton>
              </div>
            </form>
          </AppCard>
        )}
      </section>
    </RoleGuard>
  );
}
