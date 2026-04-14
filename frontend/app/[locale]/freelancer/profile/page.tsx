"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";

import { RoleGuard } from "@/components/role-guard";
import { ErrorState, LoadingState } from "@/components/states";
import { VerifiedBadge } from "@/components/ui-kit";
import { profilesApi } from "@/lib/api/endpoints";
import { useMe, useMutation, useMyProfile } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";
import { profileSchema } from "@/lib/validators";

import type { z } from "zod";

type ProfileForm = z.infer<typeof profileSchema>;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 font-headline mb-2">
      {children}
    </label>
  );
}

function inputCls() {
  return "w-full rounded-2xl border-none bg-surface-container-low px-5 py-4 text-[15px] font-medium text-on-surface transition-all placeholder:text-surface-400 focus:bg-surface-container-lowest focus:shadow-ambient focus:ring-0";
}

export default function FreelancerProfilePage() {
  const me = useMe();
  const profile = useMyProfile();
  const queryClient = useQueryClient();
  const toast = useToastStore((s) => s.push);

  const [skillsInput, setSkillsInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

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
      const profileSkills = profile.data.skills || [];
      setSkills(profileSkills);
      setSkillsInput("");
      reset({
        full_name: profile.data.full_name || "",
        title: profile.data.title || "",
        bio: profile.data.bio || "",
        skills: profileSkills.join(", "),
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
        skills,
        hourly_rate: values.hourly_rate,
        is_available: values.is_available,
        response_time_hours: values.response_time_hours,
        portfolio: values.portfolio,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      toast("success", "Профайл шинэчлэгдлээ.");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  function addSkill(raw: string) {
    const val = raw.trim();
    if (!val || skills.some((s) => s.toLowerCase() === val.toLowerCase())) {
      setSkillsInput("");
      return;
    }
    setSkills((prev) => [...prev, val]);
    setSkillsInput("");
  }

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }

  if (me.isLoading || profile.isLoading) return <LoadingState label="Профайл ачааллаж байна..." />;
  if (me.isError || !me.data) return <ErrorState label="Эхлээд нэвтэрнэ үү." />;

  const completeness = profile.data?.profile_completeness || 0;
  const profileData = profile.data;

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="freelancer" fallbackPath="/auth">
      <section className="space-y-8 pb-20">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-surface-400 font-headline">
              Профайл тохиргоо
            </p>
            <h1 className="mt-3 font-headline text-[36px] font-black leading-none tracking-tighter text-primary md:text-[44px]">
              Профайл
            </h1>
          </div>
          <VerifiedBadge verified={me.data.is_verified} />
        </div>

        {/* Profile completeness ring + stats */}
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          {/* Left: completeness */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-surface-container-lowest p-8 shadow-sm">
            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-secondary/5 blur-3xl" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 font-headline">
              Профайлын дүүрэлт
            </p>
            <div className="relative mx-auto my-8 h-36 w-36">
              <svg className="h-full w-full -rotate-90">
                <circle className="text-surface-container-low" cx="72" cy="72" fill="transparent" r="62" stroke="currentColor" strokeWidth="10" />
                <circle
                  className="text-secondary"
                  cx="72"
                  cy="72"
                  fill="transparent"
                  r="62"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="389.6"
                  strokeDashoffset={389.6 - (389.6 * completeness) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-headline text-3xl font-black text-primary">{completeness}%</span>
                <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-surface-400 font-headline">Дууссан</span>
              </div>
            </div>
            <ul className="space-y-3">
              {[
                { label: "Бүтэн нэр", done: !!profileData?.full_name },
                { label: "Тодорхойлолт (Bio)", done: !!profileData?.bio },
                { label: "Ур чадварууд", done: (profileData?.skills?.length ?? 0) > 0 },
                { label: "Цагийн хөлс", done: (profileData?.hourly_rate ?? 0) > 0 },
              ].map((item) => (
                <li key={item.label} className={`flex items-center gap-3 text-[13px] font-bold font-headline ${item.done ? "text-on-surface" : "text-surface-400 italic opacity-60"}`}>
                  <span className={`text-base ${item.done ? "text-secondary" : "text-surface-container"}`}>
                    {item.done ? "✦" : "○"}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Edit form */}
          <form
            onSubmit={handleSubmit((v) => updateMutation.mutate(v))}
            className="space-y-6 rounded-[2.5rem] bg-surface-container-lowest p-8 shadow-sm"
          >
            <h2 className="font-headline text-xl font-extrabold text-primary">Профайл засах</h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <FieldLabel>Бүтэн нэр *</FieldLabel>
                <input {...register("full_name")} className={inputCls()} placeholder="Жишээ: Бат-Эрдэнэ" />
                {errors.full_name && <p className="mt-2 text-xs text-red-600">{errors.full_name.message}</p>}
              </div>
              <div>
                <FieldLabel>Мэргэжлийн гарчиг</FieldLabel>
                <input {...register("title")} className={inputCls()} placeholder="Жишээ: Senior Frontend Developer" />
                {errors.title && <p className="mt-2 text-xs text-red-600">{errors.title.message}</p>}
              </div>
            </div>

            <div>
              <FieldLabel>Танилцуулга (Bio)</FieldLabel>
              <textarea
                {...register("bio")}
                rows={4}
                className={`${inputCls()} resize-none`}
                placeholder="Таны туршлага, мэргэжлийн онцлог болон хийж чадах ажлуудаа бичнэ үү..."
              />
              {errors.bio && <p className="mt-2 text-xs text-red-600">{errors.bio.message}</p>}
            </div>

            {/* Skills */}
            <div>
              <FieldLabel>Ур чадварууд</FieldLabel>
              <div className="rounded-2xl bg-surface-container-low p-5 transition-all focus-within:bg-surface-container-lowest focus-within:shadow-ambient">
                <div className="mb-4 flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-2 rounded-xl bg-primary-fixed px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary font-headline">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="text-primary hover:text-red-500 transition-colors">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-3">
                  <input
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(skillsInput); } }}
                    placeholder="React, Figma, Python... (Enter дарж нэмэх)"
                    className="flex-1 rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm font-medium text-on-surface focus:ring-1 focus:ring-primary/20"
                  />
                  <button type="button" onClick={() => addSkill(skillsInput)} className="rounded-xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-widest text-primary-fixed font-headline">
                    Нэмэх
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <FieldLabel>Цагийн хөлс (₮)</FieldLabel>
                <input
                  type="number"
                  {...register("hourly_rate", { valueAsNumber: true })}
                  className={inputCls()}
                  placeholder="50000"
                  min={0}
                />
                {errors.hourly_rate && <p className="mt-2 text-xs text-red-600">{errors.hourly_rate.message}</p>}
              </div>
              <div>
                <FieldLabel>Хариу өгөх хугацаа (цаг)</FieldLabel>
                <input
                  type="number"
                  {...register("response_time_hours", { valueAsNumber: true })}
                  className={inputCls()}
                  placeholder="24"
                  min={1}
                />
              </div>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register("is_available")}
                className="h-5 w-5 rounded border-none text-secondary focus:ring-secondary"
              />
              <span className="text-[13px] font-bold text-on-surface font-headline">Ажлын санал хүлээн авах боломжтой</span>
            </label>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="min-h-12 rounded-2xl primary-gradient px-8 text-[11px] font-black uppercase tracking-[0.18em] text-primary-fixed shadow-ambient transition-all hover:-translate-y-0.5 disabled:opacity-60 font-headline"
              >
                {updateMutation.isPending ? "Хадгалж байна..." : "Хадгалах"}
              </button>
              {isDirty && (
                <button
                  type="button"
                  className="min-h-12 rounded-2xl bg-surface-container-lowest px-6 text-[11px] font-bold uppercase tracking-[0.18em] text-surface-500 shadow-sm transition-all hover:text-primary font-headline"
                  onClick={() => reset()}
                >
                  Цуцлах
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </RoleGuard>
  );
}
