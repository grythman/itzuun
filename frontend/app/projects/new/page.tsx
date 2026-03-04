"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AppCard, StepProgress, TrustPanel } from "@/components/ui-kit";
import { projectsApi } from "@/lib/api/endpoints";
import { useMutation } from "@/lib/hooks";
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
  const form = useForm<FormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { title: "", description: "", budget: 1000000, timeline_days: 14, category: "web" },
  });

  const mutation = useMutation({
    mutationFn: projectsApi.create,
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
    <section className="mx-auto max-w-3xl space-y-4">
      <AppCard>
        <h1 className="text-2xl font-semibold">Post a Project</h1>
        <p className="mt-1 text-sm text-slate-600">Guided 3-step posting flow for better scope clarity and faster proposals.</p>
        <div className="mt-3">
          <StepProgress steps={steps} currentStep={step} />
        </div>
      </AppCard>

      <form className="space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
        {step === 0 ? (
          <AppCard className="space-y-3">
            <h2 className="text-lg font-semibold">Step 1: Basic Info</h2>
            <label className="block text-sm">
              Title
              <input {...form.register("title")} aria-label="Project title" />
            </label>
            <label className="block text-sm">
              Category
              <input {...form.register("category")} aria-label="Project category" placeholder="web, mobile, backend..." />
            </label>
            <label className="block text-sm">
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
          <AppCard className="space-y-3">
            <h2 className="text-lg font-semibold">Step 2: Budget & Timeline</h2>
            <label className="block text-sm">
              Budget (MNT)
              <input type="number" {...form.register("budget", { valueAsNumber: true })} aria-label="Project budget" />
            </label>
            <p className="text-xs text-slate-500">Budget guidance: clear budget increases proposal quality and reduces negotiation delay.</p>
            <label className="block text-sm">
              Timeline (days)
              <input type="number" {...form.register("timeline_days", { valueAsNumber: true })} aria-label="Project timeline" />
            </label>
          </AppCard>
        ) : null}

        {step === 2 ? (
          <AppCard className="space-y-3">
            <h2 className="text-lg font-semibold">Step 3: Review & Confirm</h2>
            <label className="block text-sm">
              Description
              <textarea {...form.register("description")} aria-label="Project description" rows={5} />
            </label>
            <button
              type="button"
              className="w-full bg-blue-600 text-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => aiMutation.mutate()}
              disabled={aiMutation.isPending}
            >
              {aiMutation.isPending ? "Generating..." : "Suggest Description (AI)"}
            </button>
            <TrustPanel />
          </AppCard>
        ) : null}

        <div className="flex flex-wrap justify-between gap-2">
          <button
            type="button"
            className="bg-slate-200 text-slate-800"
            onClick={() => setStep((prev) => Math.max(0, prev - 1))}
            disabled={step === 0}
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setStep((prev) => Math.min(steps.length - 1, prev + 1))}>
              Continue
            </button>
          ) : (
            <button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Publish Project"}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
