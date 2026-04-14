"use client";
export const dynamic = "force-dynamic";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { AppCard, StepProgress, TrustPanel } from "@/components/ui";
import { projectsApi } from "@/lib/api/endpoints";
import { useMe, useMutation, useProjectDetail } from "@/lib/hooks";
import { useToastStore } from "@/lib/stores/toast-store";
import { createProjectSchema } from "@/lib/validators";
import { ErrorState, LoadingState } from "@/components/shared/states";

import type { z } from "zod";

type FormValues = z.infer<typeof createProjectSchema>;

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const toast = useToastStore((s) => s.push);
  const me = useMe();
  const detail = useProjectDetail(id);

  const [skillsInput, setSkillsInput] = useState("");
  const [step, setStep] = useState(0);
  const steps = ["Basic Info", "Budget & Timeline", "Review & Confirm"];

  const form = useForm<FormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { title: "", description: "", budget: 1000000, timeline_days: 14, category: "web" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => projectsApi.update(id, values),
    onSuccess: () => {
      toast("success", "Project updated");
      router.push(`/projects/${id}`);
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

  // Pre-fill form when project data loads
  useEffect(() => {
    if (detail.data) {
      const project = detail.data;
      form.reset({
        title: project.title,
        description: project.description,
        budget: project.budget,
        timeline_days: project.timeline_days,
        category: project.category,
      });
    }
  }, [detail.data, form]);

  if (me.isLoading || detail.isLoading) return <LoadingState label="Loading project..." />;
  if (me.isError || !me.data) return <ErrorState label="Please sign in first." />;
  if (detail.isError || !detail.data) return <ErrorState label="Could not load project." />;

  const project = detail.data;
  const isOwner = me.data.id === project.owner;
  const canEdit = isOwner && project.status === "open";

  if (!canEdit) {
    return (
      <div className="rounded-2xl border border-surface-200/60 bg-white p-6 text-center">
        <p className="text-surface-700">
          {!isOwner ? "You can only edit your own projects." : "This project cannot be edited (not in open status)."}
        </p>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <AppCard>
        <h1 className="text-2xl font-semibold">Edit Project</h1>
        <p className="mt-1 text-[13px] text-surface-500">Update your project details (only available while open).</p>
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
            <p className="text-[11px] text-surface-500">Tip: Increasing budget shows strong commitment to freelancers.</p>
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
              className="w-full bg-brand-600 text-white disabled:cursor-not-allowed disabled:opacity-60"
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
            className="bg-surface-100 text-surface-700"
            onClick={() => setStep((prev) => Math.max(0, prev - 1))}
            disabled={step === 0}
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button type="button" className="bg-brand-600 text-white hover:bg-brand-700" onClick={() => setStep((prev) => Math.min(steps.length - 1, prev + 1))}>
              Continue
            </button>
          ) : (
            <button type="submit" className="bg-brand-600 text-white hover:bg-brand-700" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
