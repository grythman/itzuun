"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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

  return (
    <section className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Create Project</h1>
      <form className="space-y-3 rounded-md border border-slate-200 bg-white p-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
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
        <button type="submit" className="bg-slate-900 text-white" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Create"}
        </button>
      </form>
    </section>
  );
}
