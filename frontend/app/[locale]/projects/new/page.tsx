"use client";
export const dynamic = "force-dynamic";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AppCard, StepProgress, TrustPanel } from "@/components/ui-kit";
import { projectsApi } from "@/lib/api/endpoints";
import { useCategories, useMutation } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";
import { createProjectSchema } from "@/lib/validators";

import type { z } from "zod";

type FormValues = z.infer<typeof createProjectSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const toast = useToastStore((s) => s.push);
  const [skillsInput, setSkillsInput] = useState("");
  const [step, setStep] = useState(0);
  const steps = ["Basic Info", "Budget & Timeline", "Review & Confirm"];
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
      router.push(`/projects/${data.id}`);
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
              <h1 className="font-headline text-4xl font-extrabold text-surface-900">Let&apos;s start with your project title</h1>
              <p className="text-sm text-surface-600">This helps us match you with the right Mongolian tech talent.</p>
              <label className="block text-sm font-medium">
                Project Title
                <input {...form.register("title")} aria-label="Project title" placeholder="e.g., Build a custom inventory management system" />
              </label>
              <label className="block text-sm font-medium">
                Select a Category
                <select {...form.register("category_id")} aria-label="Project category">
                  <option value="">Сонгох...</option>
                  {categoryOptions.map(c => (
                    <option key={c.id} value={c.id}>{c.name_mn}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Scope checklist / Required skills
                <input
                  value={skillsInput}
                  onChange={(event) => setSkillsInput(event.target.value)}
                  aria-label="Project skills"
                  placeholder="react, django, postgresql"
                />
              </label>
            </AppCard>
          ) : null}

          {step === 1 ? (
            <AppCard className="space-y-4 border-none bg-white">
              <h2 className="font-headline text-3xl font-bold">Budget & Timeline</h2>
              <label className="block text-sm font-medium">
                Budget (MNT)
                <input type="number" {...form.register("budget", { valueAsNumber: true })} aria-label="Project budget" />
              </label>
              <label className="block text-sm font-medium">
                Timeline (days)
                <input type="number" {...form.register("timeline_days", { valueAsNumber: true })} aria-label="Project timeline" />
              </label>
            </AppCard>
          ) : null}

          {step === 2 ? (
            <AppCard className="space-y-4 border-none bg-white">
              <h2 className="font-headline text-3xl font-bold">Review & Confirm</h2>
              <label className="block text-sm font-medium">
                Description
                <textarea {...form.register("description")} aria-label="Project description" rows={6} />
              </label>
              <button
                type="button"
                className="w-full rounded-full bg-surface-200 py-3 text-sm font-semibold text-surface-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => aiMutation.mutate()}
                disabled={aiMutation.isPending}
              >
                {aiMutation.isPending ? "Generating..." : "Suggest Description (AI)"}
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
              ← Back
            </button>
            {step < steps.length - 1 ? (
              <button type="button" className="primary-gradient rounded-full px-9 py-3 text-sm font-semibold text-white" onClick={() => setStep((prev) => Math.min(steps.length - 1, prev + 1))}>
                Continue
              </button>
            ) : (
              <button type="submit" className="primary-gradient rounded-full px-9 py-3 text-sm font-semibold text-white" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Publish Project"}
              </button>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <AppCard className="border-none bg-surface-100">
            <h3 className="font-headline text-xl font-bold text-surface-900">Why post on ITZuun?</h3>
            <ul className="mt-4 space-y-3 text-[13px] text-surface-600">
              <li>Vetted Mongolian talent pool</li>
              <li>Secure QPay payments with escrow</li>
              <li>Workflow optimized for local market</li>
            </ul>
          </AppCard>
          <AppCard className="border-none bg-accent-50">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-700">Pro Tip</p>
            <p className="mt-2 text-[13px] text-surface-700">Projects with specific titles attract more qualified applications in the first 24 hours.</p>
          </AppCard>
        </aside>
      </form>
    </section>
  );
}
