"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { projectApi } from "@/lib/api/endpoints";
import { Card, SectionTitle } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/lib/toast-store";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  budget: z.string().optional(),
});

type FormInput = z.infer<typeof schema>;

export default function NewProjectPage() {
  const router = useRouter();
  const pushToast = useToastStore((state) => state.push);
  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", budget: "" },
  });

  const createMutation = useMutation({
    mutationFn: (input: FormInput) => projectApi.create(input),
    onSuccess: (project) => {
      pushToast("success", "Project created");
      router.push(`/projects/${project.id}`);
    },
    onError: () => pushToast("error", "Project creation failed"),
  });

  return (
    <Card>
      <SectionTitle title="Create Project" subtitle="Client flow" />
      <form className="space-y-3" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
        <label className="block text-sm">
          Title
          <input className="mt-1 w-full rounded border px-3 py-2" {...form.register("title")} />
        </label>
        <label className="block text-sm">
          Description
          <textarea className="mt-1 w-full rounded border px-3 py-2" rows={4} {...form.register("description")} />
        </label>
        <label className="block text-sm">
          Budget (optional)
          <input className="mt-1 w-full rounded border px-3 py-2" {...form.register("budget")} />
        </label>
        <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create"}
        </button>
      </form>
    </Card>
  );
}
