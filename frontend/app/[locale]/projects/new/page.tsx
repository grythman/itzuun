"use client";
export const dynamic = "force-dynamic";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { KeyboardEvent, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { projectsApi } from "@/lib/api/endpoints";
import { useCategories, useMutation } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";
import { createProjectSchema } from "@/lib/validators";

import type { z } from "zod";

type FormValues = z.infer<typeof createProjectSchema>;

type StepKey = "basics" | "scope" | "budget" | "preview";
type ProjectType = "fixed" | "hourly";
type ExperienceLevel = "junior" | "mid" | "senior";

function formatMnt(value: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} ₮`;
}

function DashboardIcon({
  name,
  className = "h-5 w-5",
}: {
  name:
    | "edit"
    | "description"
    | "payments"
    | "visibility"
    | "expand"
    | "wallet"
    | "schedule"
    | "verified"
    | "rocket"
    | "close"
    | "sparkle"
    | "support"
    | "info"
    | "arrow";
  className?: string;
}) {
  const common = { className, "aria-hidden": true };
  if (name === "edit") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M3 17.2V21h3.8L17.9 9.9l-3.8-3.8L3 17.2ZM20.7 7a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.8 1.8L18.9 8 20.7 7Z"/></svg>;
  }
  if (name === "description") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V7h3.5L13 3.5ZM8 11h8v1.5H8V11Zm0 3h8v1.5H8V14Zm0 3h5v1.5H8V17Z"/></svg>;
  }
  if (name === "payments" || name === "wallet") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3V6Zm0 4h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8Zm11 3a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3Z"/></svg>;
  }
  if (name === "visibility") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M12 5c5.5 0 9.6 4.3 10.8 6-1.2 1.7-5.3 6-10.8 6S2.4 12.7 1.2 11C2.4 9.3 6.5 5 12 5Zm0 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-2.2a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Z"/></svg>;
  }
  if (name === "expand") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m7 10 5 5 5-5H7Z"/></svg>;
  }
  if (name === "schedule") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M12 1a11 11 0 1 0 11 11A11 11 0 0 0 12 1Zm1 11.4 4.2 2.5-.8 1.3L11.5 13V6h1.5Z"/></svg>;
  }
  if (name === "verified") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m23 12-2.4-2.8.3-3.7-3.6-.8L15.4 1 12 2.5 8.6 1 6.7 4.7l-3.6.8.3 3.7L1 12l2.4 2.8-.3 3.7 3.6.8L8.6 23l3.4-1.5 3.4 1.5 1.9-3.7 3.6-.8-.3-3.7L23 12Zm-12 4-4-4 1.4-1.4 2.6 2.6 5.6-5.6L18 8l-7 8Z"/></svg>;
  }
  if (name === "rocket") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M14 3c3.9 0 7 3.1 7 7 0 2.1-.9 4.1-2.4 5.4l-2.2 2.2-3.2-3.2 2.2-2.2A5.4 5.4 0 0 0 14 3Zm-3.3 8.1L3 18.8V21h2.2l7.7-7.7-2.2-2.2Zm-5 8.9H4v-1.7l5.8-5.8 1.7 1.7L5.7 20Z"/></svg>;
  }
  if (name === "close") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m18.3 5.7-1-1L12 10l-5.3-5.3-1 1L11 11l-5.3 5.3 1 1L12 12l5.3 5.3 1-1L13 11l5.3-5.3Z"/></svg>;
  }
  if (name === "sparkle") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m12 2 1.8 4.7L18.5 8l-4.7 1.3L12 14l-1.8-4.7L5.5 8l4.7-1.3L12 2Zm7 11 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5ZM5 14l1.2 3 3 1.2-3 1.2L5 22l-1.2-3-3-1.2 3-1.2L5 14Z"/></svg>;
  }
  if (name === "support") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M12 2a8 8 0 0 0-8 8v3a3 3 0 0 0 3 3h1v-6H6v-1a6 6 0 1 1 12 0v1h-2v6h1a3 3 0 0 0 3-3v-3a8 8 0 0 0-8-8Zm-3 9h6v7H9v-7Zm1 8h4v1a2 2 0 1 1-4 0v-1Z"/></svg>;
  }
  if (name === "info") {
    return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M11 10h2v7h-2v-7Zm0-3h2v2h-2V7Zm1-5a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/></svg>;
  }
  return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="m12 4 1.4 1.4-5.6 5.6H20v2H7.8l5.6 5.6L12 20l-8-8 8-8Z"/></svg>;
}

export default function NewProjectPage() {
  const t = useTranslations("ProjectNew");
  const router = useRouter();
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const toast = useToastStore((s) => s.push);
  const [skillsInput, setSkillsInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [projectType, setProjectType] = useState<ProjectType>("fixed");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("mid");

  const steps: { key: StepKey; title: string; subtitle: string; icon: ReturnType<typeof stepIconName> }[] = [
    { key: "basics", title: "Project Basics", subtitle: "Төслийн суурь мэдээлэл", icon: "edit" },
    { key: "scope", title: "Description & Skills", subtitle: "Тайлбар ба ур чадвар", icon: "description" },
    { key: "budget", title: "Budget & Timeline", subtitle: "Төсөв ба хугацаа", icon: "payments" },
    { key: "preview", title: "Preview & Post", subtitle: "Шалгах ба нийтлэх", icon: "visibility" },
  ];

  const currentStep = steps[step];

  const categories = useCategories();
  const categoryOptions = Array.isArray(categories.data) ? categories.data : [];

  const form = useForm<FormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      budget: 1000000,
      timeline_days: 14,
      category: "other",
      category_id: "",
    },
    mode: "onSubmit",
  });

  const selectedCategory = useMemo(
    () => categoryOptions.find((item) => String(item.id) === String(form.watch("category_id") || "")),
    [categoryOptions, form],
  );

  const selectedCategoryLabel = selectedCategory
    ? locale === "en"
      ? selectedCategory.name_en || selectedCategory.name_mn || selectedCategory.name || "Other"
      : selectedCategory.name_mn || selectedCategory.name_en || selectedCategory.name || "Бусад"
    : "Ангилал сонгоогүй";

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      projectsApi.create({
        ...values,
        category: values.category || "other",
        required_skills: skills,
      }),
    onSuccess: (data) => {
      toast("success", "Төсөл амжилттай нийтлэгдлээ.");
      router.push(withLocale(`/projects/${data.id}`));
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const aiMutation = useMutation({
    mutationFn: async () => {
      const values = form.getValues();
      if (!values.title || !values.category || !values.budget || !values.timeline_days) {
        throw new Error("Эхлээд нэр, ангилал, төсөв, хугацаагаа бөглөнө үү.");
      }
      return projectsApi.suggestDescription({
        title: values.title,
        category: values.category,
        budget: values.budget,
        timeline_days: values.timeline_days,
        required_skills: skills,
      });
    },
    onSuccess: (data) => {
      form.setValue("description", data.description, { shouldDirty: true, shouldValidate: true });
      toast("success", "AI тайлбар бэлэн боллоо.");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  function setCategory(categoryId: string) {
    const category = categoryOptions.find((item) => String(item.id) === categoryId);
    const label =
      locale === "en"
        ? category?.name_en || category?.name_mn || category?.name || "other"
        : category?.name_mn || category?.name_en || category?.name || "other";
    form.setValue("category_id", categoryId, { shouldDirty: true, shouldValidate: true });
    form.setValue("category", label.toLowerCase(), { shouldDirty: true });
  }

  function addSkill(rawValue: string) {
    const value = rawValue.trim();
    if (!value) return;
    if (skills.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setSkillsInput("");
      return;
    }
    setSkills((prev) => [...prev, value]);
    setSkillsInput("");
  }

  function onSkillKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSkill(skillsInput);
    }
  }

  async function goNext() {
    if (step === 0) {
      const valid = await form.trigger(["title", "category_id"]);
      if (!valid) return;
    }
    if (step === 1) {
      const valid = await form.trigger(["description"]);
      if (!valid) return;
    }
    if (step === 2) {
      const valid = await form.trigger(["budget", "timeline_days"]);
      if (!valid) return;
    }
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  }

  function saveDraft() {
    toast("success", "Draft локал төлөвт хадгалагдлаа.");
  }

  return (
    <section className="min-h-screen bg-[#f7f9fb] text-[#191c1e]">
      <header className="sticky top-0 z-40 border-b border-slate-200/50 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1680px] items-center justify-between px-4 md:px-8 2xl:px-10">
          <div className="text-xl font-black tracking-tight text-[#031636]">ITZuun</div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={saveDraft} className="hidden rounded-xl px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 md:inline-flex">
              Save as Draft
            </button>
            <button
              type="button"
              onClick={form.handleSubmit((values) => mutation.mutate(values))}
              className="rounded-xl bg-[#031636] px-5 py-2.5 text-sm font-bold text-[#d8e2ff] shadow-[0_12px_24px_rgba(3,22,54,0.18)] transition-all active:scale-95"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? t("saving") : t("publish")}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1680px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-72 flex-col bg-[#eceef0] px-6 py-8 xl:flex 2xl:w-80 2xl:px-8">
          <div className="mb-10">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                <DashboardIcon name={currentStep.icon} className="h-5 w-5 text-[#031636]" />
              </div>
              <div>
                <h2 className="text-lg font-black leading-none text-[#031636]">New Project</h2>
                <p className="text-[14px] text-slate-500">Step {step + 1} of {steps.length}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {steps.map((item, index) => {
              const active = index === step;
              const done = index < step;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStep(index)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all ${
                    active
                      ? "bg-white font-bold text-[#031636] shadow-[0_12px_28px_rgba(3,22,54,0.08)]"
                      : "text-slate-500 hover:translate-x-1 hover:text-[#031636]"
                  }`}
                >
                  <DashboardIcon name={item.icon} className={`h-5 w-5 ${done ? "text-[#13696a]" : active ? "text-[#031636]" : "text-slate-400"}`} />
                  <span className="font-headline text-sm tracking-tight">{item.title}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-4">
            <div className="rounded-2xl bg-[#1a2b4c] p-5 text-white">
              <div className="flex items-center gap-3">
                <DashboardIcon name="support" className="h-6 w-6 text-[#a5eff0]" />
                <div>
                  <p className="text-sm font-bold">Need Help?</p>
                  <p className="mt-1 text-xs text-[#c7d2e6]">Төсвөө зөв тодорхойлох, scope-оо цэгцлэхэд тусална.</p>
                </div>
              </div>
            </div>
            <button type="button" onClick={saveDraft} className="w-full rounded-xl bg-[#e0e3e5] py-3 font-bold text-[#031636] transition-colors hover:bg-[#d8dadc]">
              Save Draft
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 md:px-10 lg:px-16 xl:px-20 2xl:px-24">
          <div className="mx-auto w-full max-w-[1040px] 2xl:max-w-[1120px]">
            <div className="mb-12">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-headline text-sm font-bold uppercase tracking-[0.2em] text-[#031636]">Алхам {step + 1} / 4</span>
                <span className="text-sm text-slate-500">{currentStep.subtitle}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#eceef0]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#031636] to-[#13696a]" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
              </div>
            </div>

            <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-10">
              {step === 0 ? (
                <>
                  <header className="max-w-2xl">
                    <h1 className="mb-4 font-headline text-4xl font-extrabold tracking-tight text-[#031636]">Төслийн үндсэн мэдээлэл</h1>
                    <p className="max-w-lg text-[#44474e]">Төслийнхөө талаарх эхний мэдээллийг оруулна уу. Энэ нь танд тохирох мэргэжилтнүүдийг олоход тусална.</p>
                  </header>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-[#031636]">Төслийн нэр</label>
                      <input
                        {...form.register("title")}
                        className="w-full rounded-xl border-0 bg-white px-5 py-4 text-[#191c1e] shadow-sm ring-1 ring-transparent transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-[#031636]"
                        placeholder="Жишээ нь: Шинэ аппликейшн хөгжүүлэх"
                      />
                      {form.formState.errors.title ? <p className="text-xs text-red-600">{form.formState.errors.title.message}</p> : <p className="text-xs text-slate-500">Төслийн зорилгыг тодорхой илэрхийлсэн богино нэр өгнө үү.</p>}
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-[#031636]">Ангилал</label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {categoryOptions.slice(0, 6).map((category) => {
                          const title = locale === "en" ? category.name_en || category.name_mn || category.name : category.name_mn || category.name_en || category.name;
                          const selected = String(form.watch("category_id") || "") === String(category.id);
                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => setCategory(String(category.id))}
                              className={`rounded-2xl border-2 p-5 text-left shadow-sm transition-all ${selected ? "border-[#13696a] bg-white text-[#031636]" : "border-transparent bg-white/70 text-slate-600 hover:bg-white"}`}
                            >
                              <p className="font-semibold">{title}</p>
                            </button>
                          );
                        })}
                      </div>
                      <div className="relative">
                        <select
                          {...form.register("category_id")}
                          onChange={(event) => setCategory(event.target.value)}
                          className="w-full appearance-none rounded-xl border-0 bg-white px-5 py-4 shadow-sm ring-1 ring-transparent focus:ring-2 focus:ring-[#031636]"
                        >
                          <option value="">Ангилал сонгох</option>
                          {categoryOptions.map((category) => {
                            const title = locale === "en" ? category.name_en || category.name_mn || category.name : category.name_mn || category.name_en || category.name;
                            return (
                              <option key={category.id} value={category.id}>
                                {title}
                              </option>
                            );
                          })}
                        </select>
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <DashboardIcon name="expand" className="h-5 w-5" />
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-[#031636]">Төслийн төрөл</label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setProjectType("fixed")}
                          className={`rounded-2xl border-2 p-6 text-left shadow-sm transition-all ${projectType === "fixed" ? "border-[#13696a] bg-white shadow-[0_10px_24px_rgba(3,22,54,0.08)]" : "border-transparent bg-white/70 hover:bg-white"}`}
                        >
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#a2eded] text-[#13696a]">
                            <DashboardIcon name="wallet" className="h-6 w-6" />
                          </div>
                          <p className="font-headline text-lg font-bold text-[#031636]">Тогтмол үнэ</p>
                          <p className="mt-1 text-xs text-slate-500">Тодорхой төсөвт багтаан төслийг бүрэн дуусгах.</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setProjectType("hourly")}
                          className={`rounded-2xl border-2 p-6 text-left shadow-sm transition-all ${projectType === "hourly" ? "border-[#13696a] bg-white shadow-[0_10px_24px_rgba(3,22,54,0.08)]" : "border-transparent bg-white/70 hover:bg-white"}`}
                        >
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#eceef0] text-slate-500">
                            <DashboardIcon name="schedule" className="h-6 w-6" />
                          </div>
                          <p className="font-headline text-lg font-bold text-[#031636]">Цагийн хөлс</p>
                          <p className="mt-1 text-xs text-slate-500">Ажилласан цагаар тооцож уян хатан төлөлт хийх.</p>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <header className="max-w-3xl">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#a2eded]/30 px-3 py-1 text-[#13696a]">
                      <span className="text-xs font-bold uppercase tracking-[0.18em]">Алхам 02</span>
                    </div>
                    <h1 className="mb-4 font-headline text-4xl font-extrabold text-[#031636]">Төслийн дэлгэрэнгүй ба ур чадвар</h1>
                    <p className="max-w-2xl text-[#44474e]">Төслийн зорилго, гүйцэтгэх ажил болон шаардлагатай ур чадваруудыг тодорхой оруулна уу.</p>
                  </header>

                  <section className="space-y-10">
                    <div>
                      <label className="mb-4 flex items-center gap-2 text-lg font-bold text-[#031636]">
                        Төслийн тайлбар
                        <span className="text-red-600">*</span>
                      </label>
                      <div className="rounded-xl bg-white p-1 shadow-[0_4px_20px_rgba(3,22,54,0.03)] transition-all focus-within:shadow-[0_20px_50px_rgba(3,22,54,0.06)]">
                        <div className="flex items-center gap-2 overflow-x-auto border-b border-[#eceef0] px-4 py-2">
                          <button type="button" className="rounded p-1.5 hover:bg-[#eceef0]"><strong>B</strong></button>
                          <button type="button" className="rounded p-1.5 hover:bg-[#eceef0] italic">I</button>
                          <button type="button" className="rounded p-1.5 hover:bg-[#eceef0]">• List</button>
                          <button type="button" className="rounded p-1.5 hover:bg-[#eceef0]">Link</button>
                          <button
                            type="button"
                            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#eceef0] px-3 py-1.5 text-xs font-semibold text-[#031636]"
                            onClick={() => aiMutation.mutate()}
                            disabled={aiMutation.isPending}
                          >
                            <DashboardIcon name="sparkle" className="h-4 w-4" />
                            {aiMutation.isPending ? t("aiGenerating") : t("aiSuggest")}
                          </button>
                        </div>
                        <textarea
                          {...form.register("description")}
                          rows={10}
                          className="min-h-[280px] w-full resize-none border-0 bg-transparent p-6 text-[#191c1e] placeholder:text-slate-400 focus:ring-0"
                          placeholder="Төслийнхөө талаар аль болох тодорхой бичнэ үү..."
                        />
                      </div>
                      {form.formState.errors.description ? <p className="mt-2 text-xs text-red-600">{form.formState.errors.description.message}</p> : null}
                    </div>

                    <div>
                      <label className="mb-4 block text-lg font-bold text-[#031636]">Шаардлагатай ур чадварууд</label>
                      <div className="rounded-xl bg-white p-5 shadow-[0_4px_20px_rgba(3,22,54,0.03)]">
                        <div className="mb-4 flex flex-wrap gap-2">
                          {skills.map((skill) => (
                            <span key={skill} className="inline-flex items-center gap-2 rounded-lg bg-[#1a2b4c] px-3 py-1.5 text-sm font-medium text-white">
                              {skill}
                              <button type="button" onClick={() => setSkills((prev) => prev.filter((item) => item !== skill))} className="text-white/80 transition-colors hover:text-red-300">
                                <DashboardIcon name="close" className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <input
                            value={skillsInput}
                            onChange={(event) => setSkillsInput(event.target.value)}
                            onKeyDown={onSkillKeyDown}
                            placeholder="React, Node.js, UI/UX Design..."
                            className="flex-1 rounded-xl border-0 bg-[#f2f4f6] px-4 py-3 shadow-sm ring-1 ring-transparent focus:ring-2 focus:ring-[#13696a]"
                          />
                          <button type="button" onClick={() => addSkill(skillsInput)} className="rounded-xl bg-[#031636] px-5 py-3 text-sm font-bold text-white">
                            Нэмэх
                          </button>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">Enter эсвэл таслал дарж skill нэмнэ.</p>
                      </div>
                    </div>
                  </section>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <header className="mb-12 max-w-3xl">
                    <h1 className="mb-3 font-headline text-4xl font-extrabold tracking-tight text-[#031636]">Төсөв болон хугацаа</h1>
                    <p className="text-lg text-[#44474e]">Төслийнхөө санхүүжилт болон гүйцэтгэх хугацааг тодорхойлно уу.</p>
                  </header>

                  <div className="grid gap-8 md:grid-cols-12">
                    <section className="flex flex-col gap-6 rounded-2xl bg-white p-8 shadow-[0_20px_50px_rgba(3,22,54,0.06)] md:col-span-8">
                      <div className="flex items-center gap-3">
                        <DashboardIcon name="wallet" className="h-6 w-6 text-[#13696a]" />
                        <h3 className="font-headline text-xl font-bold">Төсвийн хэмжээ</h3>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="ml-1 text-sm font-semibold text-slate-600">Доод (Min)</label>
                          <div className="relative flex items-center">
                            <span className="absolute left-4 font-bold text-[#13696a]">₮</span>
                            <input
                              type="number"
                              {...form.register("budget", { valueAsNumber: true })}
                              className="w-full rounded-xl border-0 bg-[#f2f4f6] py-4 pl-10 pr-4 text-lg font-medium text-[#031636] ring-1 ring-transparent transition-all focus:ring-2 focus:ring-[#13696a]/20"
                              placeholder="500,000"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="ml-1 text-sm font-semibold text-slate-600">Хугацаа (өдөр)</label>
                          <div className="relative flex items-center">
                            <span className="absolute left-4 font-bold text-[#13696a]">⏱</span>
                            <input
                              type="number"
                              {...form.register("timeline_days", { valueAsNumber: true })}
                              className="w-full rounded-xl border-0 bg-[#f2f4f6] py-4 pl-10 pr-4 text-lg font-medium text-[#031636] ring-1 ring-transparent transition-all focus:ring-2 focus:ring-[#13696a]/20"
                              placeholder="14"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4 rounded-xl border-l-4 border-[#13696a] bg-[#13696a]/5 p-4">
                        <DashboardIcon name="info" className="mt-0.5 h-5 w-5 text-[#13696a]" />
                        <p className="text-sm text-[#1a6d6e]">Төсвийн хэмжээг тодорхой болгох нь мэргэжлийн гүйцэтгэгчдийг татахад тусална.</p>
                      </div>
                    </section>

                    <section className="flex flex-col gap-4 md:col-span-4">
                      <h3 className="mb-2 font-headline text-lg font-bold">Шаардлагатай туршлага</h3>
                      {[
                        { key: "junior", title: "Анхан шат", subtitle: "Суралцаж буй залуус", icon: "info" },
                        { key: "mid", title: "Дунд шат", subtitle: "2-5 жилийн туршлагатай", icon: "description" },
                        { key: "senior", title: "Ахисан шат", subtitle: "Ахлах түвшний эксперт", icon: "verified" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setExperienceLevel(item.key as ExperienceLevel)}
                          className={`relative flex items-center gap-4 rounded-xl p-4 text-left transition-all ${experienceLevel === item.key ? "bg-white shadow-sm" : "bg-white/70 hover:bg-white"}`}
                        >
                          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${experienceLevel === item.key ? "bg-[#13696a] text-white" : "bg-[#f2f4f6] text-[#031636]"}`}>
                            <DashboardIcon name={item.icon as Parameters<typeof DashboardIcon>[0]["name"]} className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold">{item.title}</p>
                            <p className="text-xs text-slate-500">{item.subtitle}</p>
                          </div>
                          {experienceLevel === item.key ? <DashboardIcon name="verified" className="h-5 w-5 text-[#13696a]" /> : null}
                        </button>
                      ))}
                    </section>

                    <section className="rounded-2xl bg-[#f2f4f6] p-8 md:col-span-12">
                      <div className="mb-6 flex items-center gap-3">
                        <DashboardIcon name="schedule" className="h-6 w-6 text-[#031636]" />
                        <h3 className="font-headline text-xl font-bold">Төсөл үргэлжлэх хугацаа</h3>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        {[
                          { label: "1-2 долоо хоног", value: 14 },
                          { label: "3-4 долоо хоног", value: 30 },
                          { label: "1+ сар", value: 45 },
                        ].map((option) => {
                          const selected = Number(form.watch("timeline_days") || 0) === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => form.setValue("timeline_days", option.value, { shouldDirty: true, shouldValidate: true })}
                              className={`rounded-xl border px-5 py-4 text-left transition-all ${selected ? "border-[#13696a] bg-white text-[#031636]" : "border-transparent bg-white/70 text-slate-600 hover:bg-white"}`}
                            >
                              <p className="font-semibold">{option.label}</p>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <header className="mb-10 max-w-3xl">
                    <h1 className="mb-2 font-headline text-3xl font-extrabold text-[#031636]">Төслийг хянах</h1>
                    <p className="text-[#44474e]">Нийтлэхээс өмнө бүх мэдээллийг дахин нэг шалгана уу.</p>
                  </header>

                  <div className="space-y-8">
                    <section className="rounded-xl bg-white p-8">
                      <div className="mb-6 flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#eceef0] text-[#031636]">
                            <DashboardIcon name="info" className="h-7 w-7" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-[#031636]">Ерөнхий мэдээлэл</h2>
                            <p className="text-sm text-slate-500">Төслийн үндсэн гарчиг болон төрөл</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setStep(0)} className="flex items-center gap-2 rounded-lg bg-[#f2f4f6] px-4 py-2 font-semibold text-[#031636]">
                          <DashboardIcon name="edit" className="h-4 w-4" />
                          Засах
                        </button>
                      </div>
                      <div className="grid gap-8 md:grid-cols-2">
                        <div>
                          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Төслийн гарчиг</p>
                          <p className="text-lg font-semibold text-[#031636]">{form.watch("title") || "Гарчиг оруулаагүй"}</p>
                        </div>
                        <div className="flex gap-12">
                          <div>
                            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ангилал</p>
                            <p className="text-base font-medium text-[#031636]">{selectedCategoryLabel}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Төрөл</p>
                            <span className="inline-flex rounded-md bg-[#a2eded] px-3 py-1 text-xs font-bold text-[#1a6d6e]">
                              {projectType === "fixed" ? "ФИКСЕД ҮНЭ" : "ЦАГИЙН ХӨЛС"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-xl bg-white p-8">
                      <div className="mb-6 flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#eceef0] text-[#031636]">
                            <DashboardIcon name="description" className="h-7 w-7" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-[#031636]">Тайлбар болон ур чадвар</h2>
                            <p className="text-sm text-slate-500">Хөгжүүлэгчид тавигдах шаардлага</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 rounded-lg bg-[#f2f4f6] px-4 py-2 font-semibold text-[#031636]">
                          <DashboardIcon name="edit" className="h-4 w-4" />
                          Засах
                        </button>
                      </div>
                      <div className="mb-8">
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Төслийн дэлгэрэнгүй</p>
                        <div className="whitespace-pre-wrap leading-relaxed text-[#031636]">{form.watch("description") || "Тайлбар оруулаагүй."}</div>
                      </div>
                      <div>
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Шаардлагатай ур чадварууд</p>
                        <div className="flex flex-wrap gap-2">
                          {skills.length ? skills.map((skill) => (
                            <span key={skill} className="rounded-full bg-[#eceef0] px-4 py-2 text-sm font-semibold text-[#031636]">{skill}</span>
                          )) : <span className="text-sm text-slate-500">Ур чадвар оруулаагүй.</span>}
                        </div>
                      </div>
                    </section>

                    <section className="rounded-xl bg-white p-8">
                      <div className="mb-6 flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#eceef0] text-[#031636]">
                            <DashboardIcon name="payments" className="h-7 w-7" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-[#031636]">Төсөв ба хугацаа</h2>
                            <p className="text-sm text-slate-500">Хүрээ, туршлага, хугацааны сонголт</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setStep(2)} className="flex items-center gap-2 rounded-lg bg-[#f2f4f6] px-4 py-2 font-semibold text-[#031636]">
                          <DashboardIcon name="edit" className="h-4 w-4" />
                          Засах
                        </button>
                      </div>
                      <div className="grid gap-8 md:grid-cols-3">
                        <div>
                          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Төсөв</p>
                          <p className="text-lg font-semibold text-[#031636]">{formatMnt(Number(form.watch("budget") || 0))}</p>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Хугацаа</p>
                          <p className="text-lg font-semibold text-[#031636]">{form.watch("timeline_days") || 0} өдөр</p>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Туршлага</p>
                          <p className="text-lg font-semibold text-[#031636]">
                            {experienceLevel === "junior" ? "Анхан шат" : experienceLevel === "mid" ? "Дунд шат" : "Ахисан шат"}
                          </p>
                        </div>
                      </div>
                    </section>
                  </div>
                </>
              ) : null}

              <div className="flex flex-col items-center gap-4 pt-10 sm:flex-row">
                {step > 0 ? (
                  <button type="button" onClick={() => setStep((prev) => Math.max(0, prev - 1))} className="w-full rounded-xl px-8 py-4 font-bold text-[#031636] transition-all hover:bg-[#eceef0] sm:w-auto">
                    Буцах
                  </button>
                ) : <div />}
                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#031636] to-[#1a2b4c] px-10 py-4 font-bold text-[#d8e2ff] shadow-[0_20px_50px_rgba(3,22,54,0.06)] transition-all active:scale-95 sm:w-auto"
                  >
                    Дараагийн алхам
                    <DashboardIcon name="arrow" className="h-5 w-5 rotate-180" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#031636] to-[#1a2b4c] px-10 py-4 font-bold text-[#d8e2ff] shadow-[0_20px_50px_rgba(3,22,54,0.06)] transition-all active:scale-95 sm:w-auto"
                    disabled={mutation.isPending}
                  >
                    <DashboardIcon name="rocket" className="h-5 w-5" />
                    {mutation.isPending ? t("saving") : "Post Project"}
                  </button>
                )}
              </div>
            </form>

            <div className="mt-12 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl bg-[#1a2b4c] p-6 text-white">
                <h4 className="mb-2 font-headline text-sm font-bold">Need Help?</h4>
                <p className="text-xs leading-relaxed text-[#c7d2e6]">Манай зөвлөхүүд төсвөө зөв тодорхойлох, төслийн шаардлагаа илүү ойлгомжтой бичихэд тусална.</p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-[0_10px_24px_rgba(3,22,54,0.05)]">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#13696a]">Quick Summary</p>
                <p className="mt-3 text-sm font-semibold text-[#031636]">{form.watch("title") || "Гарчиг оруулаагүй"}</p>
                <p className="mt-1 text-xs text-slate-500">{selectedCategoryLabel} · {form.watch("timeline_days") || 0} өдөр</p>
                <p className="mt-3 text-lg font-extrabold text-[#031636]">{formatMnt(Number(form.watch("budget") || 0))}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}

function stepIconName(step: StepKey): Parameters<typeof DashboardIcon>[0]["name"] {
  if (step === "basics") return "edit";
  if (step === "scope") return "description";
  if (step === "budget") return "payments";
  return "visibility";
}
