"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
    <section className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Create Project</h1>
      <form className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
        <label className="block text-sm">
          Title
          <input {...form.register("title")} aria-label="Project title" />
        </label>
        <label className="block text-sm">
          Description
          <textarea {...form.register("description")} aria-label="Project description" rows={4} />
        </label>
        <label className="block text-sm">
          Budget
          <input type="number" {...form.register("budget", { valueAsNumber: true })} aria-label="Project budget" />
        </label>
        <label className="block text-sm">
          Timeline (days)
          <input type="number" {...form.register("timeline_days", { valueAsNumber: true })} aria-label="Project timeline" />
        </label>
        <label className="block text-sm">
          Category
          <input {...form.register("category")} aria-label="Project category" />
        </label>
        <label className="block text-sm">
          Required skills (comma separated)
          <input
            value={skillsInput}
            onChange={(event) => setSkillsInput(event.target.value)}
            aria-label="Project skills"
            placeholder="react, django, postgresql"
          />
        </label>
        <button
          type="button"
          className="w-full bg-blue-600 text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => aiMutation.mutate()}
          disabled={aiMutation.isPending}
        >
          {aiMutation.isPending ? "Generating..." : "Suggest Description (AI)"}
        </button>
        <button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Create"}
        </button>
      </form>
    </section>
  );
}
