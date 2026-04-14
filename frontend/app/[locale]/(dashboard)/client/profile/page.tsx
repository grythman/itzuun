"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";

import { ErrorState, LoadingState } from "@/components/shared/states";
import { RoleGuard } from "@/components/shared/role-guard";
import { profilesApi } from "@/lib/api/endpoints";
import { useMe, useMutation, useMyProfile } from "@/lib/hooks";
import { useToastStore } from "@/lib/stores/toast-store";
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

export default function ClientProfilePage() {
  const me = useMe();
  const profile = useMyProfile();
  const queryClient = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const [skillsInput, setSkillsInput] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      title: "",
      bio: "",
      skills: "",
      hourly_rate: 0,
      is_available: true,
      response_time_hours: 24,
      portfolio: [],
    },
  });

  useEffect(() => {
    if (profile.data) {
      setSkillsInput((profile.data.skills || []).join(", "));
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
        bio: values.bio,
        skills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
        hourly_rate: values.hourly_rate,
        is_available: values.is_available,
        response_time_hours: values.response_time_hours,
        portfolio: values.portfolio,
      }),
    onSuccess: () => {
      profile.refetch();
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      toast("success", "Профайл шинэчлэгдлээ.");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  if (me.isLoading || profile.isLoading) return <LoadingState label="Профайл ачааллаж байна..." />;
  if (me.isError || !me.data) return <ErrorState label="Эхлээд нэвтэрнэ үү." />;
  if (profile.isError || !profile.data) return <ErrorState label="Профайлыг ачааллаж чадсангүй." />;

  const profileData = profile.data;
  const completeness = profileData.profile_completeness || 0;

  return (
    <RoleGuard currentRole={me.data.role} requiredRole="client" fallbackPath="/auth">
      <section className="space-y-8 pb-20">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-surface-400 font-headline">
              Захиалагч
            </p>
            <h1 className="mt-3 font-headline text-[36px] font-black leading-none tracking-tighter text-primary md:text-[44px]">
              Профайл тохиргоо
            </h1>
          </div>
          <Link
            href="/client"
            className="hidden min-h-11 items-center rounded-2xl bg-surface-container-lowest px-6 text-[11px] font-bold uppercase tracking-[0.18em] text-primary shadow-sm transition-all hover:shadow-ambient md:inline-flex font-headline"
          >
            ← Dashboard
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          {/* Left: profile overview card */}
          <div className="flex flex-col gap-6">
            <div className="rounded-[2.5rem] bg-surface-container-lowest p-8 shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] primary-gradient text-2xl font-black text-primary-fixed font-headline">
                {(profileData.full_name || me.data.email || "C")[0].toUpperCase()}
              </div>
              <h2 className="mt-4 font-headline text-xl font-extrabold text-primary">
                {profileData.full_name || "Нэр оруулаагүй"}
              </h2>
              <p className="mt-1 text-sm font-medium text-surface-500">{me.data.email}</p>

              {/* Completeness bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-surface-400 font-headline">Профайлын дүүрэлт</p>
                  <p className="text-[10px] font-black text-primary font-headline">{completeness}%</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-low">
                  <div
                    className="h-full rounded-full primary-gradient transition-all duration-700"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>

              {profileData.bio && (
                <p className="mt-6 text-sm font-medium leading-relaxed text-surface-600">{profileData.bio}</p>
              )}

              {(profileData.skills || []).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(profileData.skills || []).map((skill) => (
                    <span key={skill} className="rounded-xl bg-primary-fixed px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary font-headline">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Info callout */}
            <div className="rounded-[2.5rem] bg-surface-container-low p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-surface-400 font-headline mb-2">Яагаад чухал вэ?</p>
              <p className="text-[13px] font-medium leading-relaxed text-surface-500">
                Профайлыг дүүргэснээр фрилансерүүд таны бизнесийн чиглэлийг ойлгож, чанартай саналууд илгээх болно.
              </p>
            </div>
          </div>

          {/* Right: Edit form */}
          <form
            onSubmit={handleSubmit((v) => updateMutation.mutate(v))}
            className="space-y-6 rounded-[2.5rem] bg-surface-container-lowest p-8 shadow-sm"
          >
            <h2 className="font-headline text-xl font-extrabold text-primary">Профайл засах</h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <FieldLabel>Компани / Бүтэн нэр *</FieldLabel>
                <input {...register("full_name")} className={inputCls()} placeholder="Таны компанийн нэр" />
                {errors.full_name && <p className="mt-2 text-xs text-red-600">{errors.full_name.message}</p>}
              </div>
              <div>
                <FieldLabel>Гарчиг / Ангилал</FieldLabel>
                <input {...register("title")} className={inputCls()} placeholder="Жишээ: E-commerce бизнес" />
              </div>
            </div>

            <div>
              <FieldLabel>Компанийн тухай</FieldLabel>
              <textarea
                {...register("bio")}
                rows={4}
                className={`${inputCls()} resize-none`}
                placeholder="Таны компани, сектор болон хайж буй мэргэжилтний хэлбэрийг товч тайлбарлана уу..."
              />
              {errors.bio && <p className="mt-2 text-xs text-red-600">{errors.bio.message}</p>}
            </div>

            <div>
              <FieldLabel>Үйлчилгээний чиглэл (таслалаар)</FieldLabel>
              <input
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                className={inputCls()}
                placeholder="Жишээ: веб хөгжүүлэлт, мобайл апп, дизайн..."
              />
            </div>

            <div>
              <FieldLabel>Нийт төсвийн хэмжээ (₮)</FieldLabel>
              <input
                type="number"
                {...register("hourly_rate", { valueAsNumber: true })}
                className={inputCls()}
                placeholder="5000000"
                min={0}
              />
            </div>

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
