"use client";
export const dynamic = "force-dynamic";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { AppCard, StepProgress, TrustPanel } from "@/components/ui-kit";
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
  const categories = useCategories();
  const categoryOptions = Array.isArray(categories.data) ? categories.data : [];
  const form = useForm<FormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { title: "", description: "", budget: 1000000, timeline_days: 14, category: "other" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const required_skills = skillsInput.split(",").map(item => item.trim()).filter(Boolean);
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
      <div className="rounded-2xl bg-surface-100 p-5">
        <StepProgress steps={steps} currentStep={step} />
      </div>

      <form className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
        <div className="space-y-4">
          {step === 0 ? (
            <AppCard className="space-y-4 border-none bg-white">
              <h1 className="font-headline text-4xl font-extrabold text-surface-900">{t("headline")}</h1>
              <p className="text-sm text-surface-600">{t("sub")}</p>
              <label className="block text-sm font-medium">
                {t("projectTitle")}
                <input {...form.register("title")} aria-label={t("projectTitle")} placeholder={t("titlePlaceholder")} />
              </label>
              <label className="block text-sm font-medium">
                {t("selectCategory")}
                <select {...form.register("category_id")} aria-label={t("selectCategory")}>
                  <option value="">{t("selectPlaceholder")}</option>
                  {categoryOptions.map(c => (
                    <option key={c.id} value={c.id}>{locale === "en" ? (c.name_en || c.name_mn || c.name) : (c.name_mn || c.name_en || c.name)}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                {t("skills")}
                <input
                  value={skillsInput}
                  onChange={(event) => setSkillsInput(event.target.value)}
                  aria-label={t("skills")}
                  placeholder={t("skillsPlaceholder")}
                />
              </label>
            </AppCard>
          ) : null}

          {step === 1 ? (
            <AppCard className="space-y-4 border-none bg-white">
              <h2 className="font-headline text-3xl font-bold">{t("step2")}</h2>
              <label className="block text-sm font-medium">
                {t("budget")}
                <input type="number" {...form.register("budget", { valueAsNumber: true })} aria-label={t("budget")} />
              </label>
              <label className="block text-sm font-medium">
                {t("timeline")}
                <input type="number" {...form.register("timeline_days", { valueAsNumber: true })} aria-label={t("timeline")} />
              </label>
            </AppCard>
          ) : null}

          {step === 2 ? (
            <AppCard className="space-y-4 border-none bg-white">
              <h2 className="font-headline text-3xl font-bold">{t("step3")}</h2>
              <label className="block text-sm font-medium">
                {t("description")}
                <textarea {...form.register("description")} aria-label={t("description")} rows={6} />
              </label>
              <button
                type="button"
                className="w-full rounded-full bg-surface-200 py-3 text-sm font-semibold text-surface-700 disabled:cursor-not-allowed disabled:opacity-60"
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
              <button type="button" className="primary-gradient rounded-full px-9 py-3 text-sm font-semibold text-white" onClick={() => setStep((prev) => Math.min(steps.length - 1, prev + 1))}>
                {t("continue")}
              </button>
            ) : (
              <button type="submit" className="primary-gradient rounded-full px-9 py-3 text-sm font-semibold text-white" disabled={mutation.isPending}>
                {mutation.isPending ? t("saving") : t("publish")}
              </button>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <AppCard className="border-none bg-surface-100">
            <h3 className="font-headline text-xl font-bold text-surface-900">{t("whyPost")}</h3>
            <ul className="mt-4 space-y-3 text-[13px] text-surface-600">
              <li>{t("why1")}</li>
              <li>{t("why2")}</li>
              <li>{t("why3")}</li>
            </ul>
          </AppCard>
          <AppCard className="border-none bg-accent-50">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-700">{t("proTip")}</p>
            <p className="mt-2 text-[13px] text-surface-700">{t("proTipText")}</p>
          </AppCard>
        </aside>
      </form>
    </section>
  );
}
