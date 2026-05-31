"use client";
export const dynamic = "force-dynamic";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { projectsApi } from "@/lib/api/endpoints";
import { useCategories, useMutation } from "@/lib/hooks";
import { useToastStore } from "@/lib/stores/toast-store";
import { createProjectSchema } from "@/lib/validators";

import type { z } from "zod";

type FormValues = z.infer<typeof createProjectSchema>;

function formatMnt(value: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} ₮`;
}

function buildBriefTitle(description: string, category: string): string {
  const firstLine = description.split("\n").find((line) => line.trim())?.trim() || "";
  const shortDescription = firstLine.slice(0, 56).trim();
  if (shortDescription.length >= 3) return shortDescription;
  return `${category || "MVP"} brief`;
}

export default function NewProjectPage() {
  const t = useTranslations("ProjectNew");
  const router = useRouter();
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const toast = useToastStore((state) => state.push);
  const categories = useCategories();
  const categoryOptions = useMemo(
    () => (Array.isArray(categories.data) ? categories.data : []),
    [categories.data],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      budget: 1000000,
      timeline_days: 14,
      category: "other",
      category_id: "",
      contact_info: "",
    },
  });

  const selectedCategory = useMemo(
    () => categoryOptions.find((item) => String(item.id) === String(form.watch("category_id") || "")),
    [categoryOptions, form],
  );

  const selectedCategoryLabel = selectedCategory
    ? locale === "en"
      ? selectedCategory.name_en || selectedCategory.name_mn || selectedCategory.name || t("fallbackCategory")
      : selectedCategory.name_mn || selectedCategory.name_en || selectedCategory.name || t("fallbackCategory")
    : t("fallbackCategory");

  function setCategory(categoryId: string) {
    const category = categoryOptions.find((item) => String(item.id) === categoryId);
    const label = locale === "en"
      ? category?.name_en || category?.name_mn || category?.name || "other"
      : category?.name_mn || category?.name_en || category?.name || "other";

    form.setValue("category_id", categoryId, { shouldDirty: true, shouldValidate: true });
    form.setValue("category", label.toLowerCase(), { shouldDirty: true, shouldValidate: true });
  }

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const title = values.title?.trim() || buildBriefTitle(values.description, selectedCategoryLabel);
      return projectsApi.create({
        ...values,
        title,
        category: values.category || "other",
        required_skills: [],
      });
    },
    onSuccess: (data) => {
      toast("success", t("successToast"));
      router.push(withLocale(`/projects/${data.id}`));
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const budget = Number(form.watch("budget") || 0);
  const timelineDays = Number(form.watch("timeline_days") || 0);

  return (
    <div className="pb-20 text-on-surface">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 lg:px-12">
        <div className="mb-10 rounded-[2rem] bg-surface-container-lowest p-8 shadow-sm md:p-10">
          <span className="font-headline text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
            {t("intakeLabel")}
          </span>
          <h1 className="mt-4 max-w-3xl font-headline text-4xl font-black leading-tight tracking-tighter text-primary md:text-5xl">
            {t("headline")}
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-on-surface/60 md:text-lg">
            {t("sub")}
          </p>
        </div>

        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            <section className="rounded-[2rem] bg-surface-container-low p-6 md:p-8">
              <label className="block text-sm font-bold uppercase tracking-widest text-primary font-headline">
                {t("selectCategory")}
              </label>
              <p className="mt-2 text-sm font-medium text-on-surface/55">{t("categoryHelper")}</p>
              <select
                {...form.register("category_id")}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-5 w-full rounded-2xl border-none bg-surface-container-lowest px-5 py-4 text-sm font-bold text-on-surface shadow-sm focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{t("selectPlaceholder")}</option>
                {categoryOptions.map((category) => {
                  const title = locale === "en"
                    ? category.name_en || category.name_mn || category.name
                    : category.name_mn || category.name_en || category.name;
                  return (
                    <option key={category.id} value={category.id}>
                      {title}
                    </option>
                  );
                })}
              </select>
              {form.formState.errors.category_id ? (
                <p className="mt-2 text-xs font-bold text-red-600">{form.formState.errors.category_id.message}</p>
              ) : null}
            </section>

            <section className="rounded-[2rem] bg-surface-container-low p-6 md:p-8">
              <label className="block text-sm font-bold uppercase tracking-widest text-primary font-headline">
                {t("description")}
              </label>
              <p className="mt-2 text-sm font-medium text-on-surface/55">{t("descriptionHelper")}</p>
              <textarea
                {...form.register("description")}
                rows={9}
                className="mt-5 w-full resize-none rounded-2xl border-none bg-surface-container-lowest px-5 py-4 text-base font-medium leading-relaxed text-on-surface shadow-sm placeholder:text-on-surface/35 focus:ring-2 focus:ring-primary/20"
                placeholder={t("descriptionPlaceholder")}
              />
              {form.formState.errors.description ? (
                <p className="mt-2 text-xs font-bold text-red-600">{form.formState.errors.description.message}</p>
              ) : null}
            </section>

            <section className="grid gap-6 rounded-[2rem] bg-surface-container-low p-6 md:grid-cols-2 md:p-8">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-primary font-headline">
                  {t("budget")}
                </label>
                <p className="mt-2 text-sm font-medium text-on-surface/55">{t("budgetHelper")}</p>
                <input
                  type="number"
                  {...form.register("budget", { valueAsNumber: true })}
                  className="mt-5 w-full rounded-2xl border-none bg-surface-container-lowest px-5 py-4 text-base font-black text-on-surface shadow-sm focus:ring-2 focus:ring-primary/20"
                  placeholder="1000000"
                />
                {form.formState.errors.budget ? (
                  <p className="mt-2 text-xs font-bold text-red-600">{form.formState.errors.budget.message}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-primary font-headline">
                  {t("timeline")}
                </label>
                <p className="mt-2 text-sm font-medium text-on-surface/55">{t("timelineHelper")}</p>
                <input
                  type="number"
                  {...form.register("timeline_days", { valueAsNumber: true })}
                  className="mt-5 w-full rounded-2xl border-none bg-surface-container-lowest px-5 py-4 text-base font-black text-on-surface shadow-sm focus:ring-2 focus:ring-primary/20"
                  placeholder="14"
                />
                {form.formState.errors.timeline_days ? (
                  <p className="mt-2 text-xs font-bold text-red-600">{form.formState.errors.timeline_days.message}</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-[2rem] bg-surface-container-low p-6 md:p-8">
              <label className="block text-sm font-bold uppercase tracking-widest text-primary font-headline">
                {t("contact")}
              </label>
              <p className="mt-2 text-sm font-medium text-on-surface/55">{t("contactHelper")}</p>
              <input
                {...form.register("contact_info")}
                className="mt-5 w-full rounded-2xl border-none bg-surface-container-lowest px-5 py-4 text-base font-bold text-on-surface shadow-sm placeholder:text-on-surface/35 focus:ring-2 focus:ring-primary/20"
                placeholder={t("contactPlaceholder")}
              />
              {form.formState.errors.contact_info ? (
                <p className="mt-2 text-xs font-bold text-red-600">{form.formState.errors.contact_info.message}</p>
              ) : null}
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[2rem] bg-primary-fixed p-7 text-primary shadow-sm">
              <p className="font-headline text-[11px] font-black uppercase tracking-[0.22em] opacity-70">
                {t("mvpNoticeLabel")}
              </p>
              <h2 className="mt-4 font-headline text-2xl font-black tracking-tight">{t("mvpNoticeTitle")}</h2>
              <p className="mt-4 text-sm font-semibold leading-relaxed opacity-75">{t("mvpNoticeText")}</p>
            </div>

            <div className="rounded-[2rem] bg-surface-container-lowest p-7 shadow-sm">
              <p className="font-headline text-[11px] font-black uppercase tracking-[0.22em] text-on-surface/45">
                {t("summary")}
              </p>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="font-bold text-on-surface/45">{t("summaryCategory")}</dt>
                  <dd className="mt-1 font-black text-primary">{selectedCategoryLabel}</dd>
                </div>
                <div>
                  <dt className="font-bold text-on-surface/45">{t("summaryBudget")}</dt>
                  <dd className="mt-1 font-black text-primary">{formatMnt(budget)}</dd>
                </div>
                <div>
                  <dt className="font-bold text-on-surface/45">{t("summaryTimeline")}</dt>
                  <dd className="mt-1 font-black text-primary">{timelineDays} {t("days")}</dd>
                </div>
              </dl>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-2xl primary-gradient px-8 py-5 text-[12px] font-black uppercase tracking-[0.2em] text-primary-fixed shadow-ambient transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? t("saving") : t("publish")}
            </button>
          </aside>
        </form>
      </div>
    </div>
  );
}
