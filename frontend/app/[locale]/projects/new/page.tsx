"use client";
export const dynamic = "force-dynamic";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { AppCard, FlowRail, StepProgress, TrustPanel } from "@/components/ui-kit";
import { projectsApi } from "@/lib/api/endpoints";
import { useCategories, useMutation } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";
import { createProjectSchema } from "@/lib/validators";

import type { z } from "zod";

type FormValues = z.infer<typeof createProjectSchema>;

export default function NewProjectPage() {
  const t = useTranslations("ProjectNew");
  const router = useRouter();
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const toast = useToastStore((s) => s.push);
  const [skillsInput, setSkillsInput] = useState("");
  const [step, setStep] = useState(0);
  const steps = [t("step1"), t("step2"), t("step3")];
  const stepLabels = [
    { title: t("step1"), subtitle: "Төслийн суурь мэдээлэл" },
    { title: t("step2"), subtitle: "Төсөв ба хугацааны хязгаар" },
    { title: t("step3"), subtitle: "Тайлбар, шалгалт, нийтлэл" },
  ];

  const categories = useCategories();
  const categoryOptions = Array.isArray(categories.data) ? categories.data : [];

  const form = useForm<FormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { title: "", description: "", budget: 1000000, timeline_days: 14, category: "other" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const required_skills = skillsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      return projectsApi.create({ ...values, required_skills });
    },
    onSuccess: (data) => {
      toast("success", "Project created");
      router.push(withLocale(`/projects/${data.id}`));
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const aiMutation = useMutation({
    mutationFn: async () => {
      const values = form.getValues();
      if (!values.title || !values.category || !values.budget || !values.timeline_days) {
        throw new Error("Fill title, category, budget, and timeline before AI suggestion");
      }
      const required_skills = skillsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      return projectsApi.suggestDescription({
        title: values.title,
        category: values.category,
        budget: values.budget,
        timeline_days: values.timeline_days,
        required_skills,
      });
    },
    onSuccess: (data) => {
      form.setValue("description", data.description, { shouldDirty: true });
      toast("success", "AI description suggested");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="anim-rise rounded-[28px] border border-[#d8d3ee] bg-gradient-to-r from-[#f7f8ff] via-[#f4f6ff] to-[#ebf1ff] p-6 shadow-[0_14px_34px_rgba(42,35,82,0.14)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5547ac]">{t("intakeLabel")}</p>
            <h1 className="mt-2 font-headline text-3xl font-extrabold tracking-tight text-surface-900 md:text-4xl">{t("headline")}</h1>
            <p className="mt-2 max-w-3xl text-sm text-surface-600">{t("sub")}</p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#4e3db3]">Step {step + 1} / {steps.length}</span>
        </div>
      </div>

      <div className="anim-rise anim-delay-1 rounded-2xl bg-surface-100 p-5">
        <StepProgress steps={steps} currentStep={step} />
      </div>

      <form className="anim-rise anim-delay-2 grid gap-6 xl:grid-cols-[0.7fr_1.6fr_0.9fr]" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
        <aside className="hidden xl:block">
          <div className="space-y-4">
            <FlowRail title="Project flow" steps={stepLabels} currentStep={step} />
            <button
              type="button"
              className="w-full rounded-xl border border-[#d2ccef] bg-white px-3 py-2 text-[12px] font-semibold text-[#4d3cb1]"
              onClick={() => toast("success", "Draft хадгалах flow дараагийн алхамд идэвхжинэ.")}
            >
              Draft хадгалах (demo)
            </button>
          </div>
        </aside>

        <div className="space-y-4">
          {step === 0 ? (
            <AppCard className="space-y-5 border-none bg-white shadow-[0_12px_30px_rgba(30,26,68,0.08)]">
              <label className="block text-sm font-medium">
                {t("projectTitle")}
                <input {...form.register("title")} aria-label={t("projectTitle")} placeholder={t("titlePlaceholder")} className="mt-2" />
              </label>

              <div className="space-y-3">
                <p className="text-sm font-medium">{t("selectCategory")}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {categoryOptions.slice(0, 6).map((c) => {
                    const currentId = String(form.watch("category_id") || "");
                    const selected = currentId === String(c.id);
                    const title = locale === "en" ? c.name_en || c.name_mn || c.name : c.name_mn || c.name_en || c.name;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => form.setValue("category_id", String(c.id), { shouldDirty: true })}
                        className={
                          selected
                            ? "rounded-xl border-2 border-[#4e32be] bg-[#f2efff] p-3 text-left text-sm font-semibold text-[#35247f]"
                            : "rounded-xl border border-[#e2dff2] bg-[#fafaff] p-3 text-left text-sm font-medium text-surface-700 hover:border-[#b7afe0]"
                        }
                      >
                        {title}
                      </button>
                    );
                  })}
                </div>
                <select {...form.register("category_id")} aria-label={t("selectCategory")} className="mt-2 w-full">
                  <option value="">{t("selectPlaceholder")}</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {locale === "en" ? c.name_en || c.name_mn || c.name : c.name_mn || c.name_en || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="block text-sm font-medium">
                {t("skills")}
                <input
                  value={skillsInput}
                  onChange={(event) => setSkillsInput(event.target.value)}
                  aria-label={t("skills")}
                  placeholder={t("skillsPlaceholder")}
                  className="mt-2"
                />
              </label>
            </AppCard>
          ) : null}

          {step === 1 ? (
            <AppCard className="space-y-4 border-none bg-white shadow-[0_12px_30px_rgba(30,26,68,0.08)]">
              <h2 className="font-headline text-3xl font-bold">{t("step2")}</h2>
              <label className="block text-sm font-medium">
                {t("budget")}
                <input type="number" {...form.register("budget", { valueAsNumber: true })} aria-label={t("budget")} className="mt-2" />
              </label>
              <label className="block text-sm font-medium">
                {t("timeline")}
                <input type="number" {...form.register("timeline_days", { valueAsNumber: true })} aria-label={t("timeline")} className="mt-2" />
              </label>
            </AppCard>
          ) : null}

          {step === 2 ? (
            <AppCard className="space-y-4 border-none bg-white shadow-[0_12px_30px_rgba(30,26,68,0.08)]">
              <h2 className="font-headline text-3xl font-bold">{t("step3")}</h2>
              <label className="block text-sm font-medium">
                {t("description")}
                <textarea {...form.register("description")} aria-label={t("description")} rows={7} className="mt-2" />
              </label>
              <button
                type="button"
                className="w-full rounded-full bg-[#ece9ff] py-3 text-sm font-semibold text-[#4f39bb] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => aiMutation.mutate()}
                disabled={aiMutation.isPending}
              >
                {aiMutation.isPending ? t("aiGenerating") : t("aiSuggest")}
              </button>
              <TrustPanel />
            </AppCard>
          ) : null}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              className="bg-transparent px-0 text-sm font-semibold text-surface-600"
              onClick={() => setStep((prev) => Math.max(0, prev - 1))}
              disabled={step === 0}
            >
              ← {t("back")}
            </button>
            {step < steps.length - 1 ? (
              <button
                type="button"
                className="anim-glow rounded-full bg-[#4a23c8] px-9 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(74,35,200,0.34)]"
                onClick={() => setStep((prev) => Math.min(steps.length - 1, prev + 1))}
              >
                {t("continue")}
              </button>
            ) : (
              <button type="submit" className="rounded-full bg-[#4a23c8] px-9 py-3 text-sm font-semibold text-white" disabled={mutation.isPending}>
                {mutation.isPending ? t("saving") : t("publish")}
              </button>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <AppCard className="border-none bg-[#f6f6fd]">
            <h3 className="font-headline text-xl font-bold text-surface-900">{t("whyPost")}</h3>
            <ul className="mt-4 space-y-3 text-[13px] text-surface-600">
              <li>{t("why1")}</li>
              <li>{t("why2")}</li>
              <li>{t("why3")}</li>
            </ul>
          </AppCard>
          <AppCard className="border-none bg-[#ececff]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4f39bb]">{t("proTip")}</p>
            <p className="mt-2 text-[13px] text-surface-700">{t("proTipText")}</p>
          </AppCard>
        </aside>
      </form>
    </section>
  );
}
