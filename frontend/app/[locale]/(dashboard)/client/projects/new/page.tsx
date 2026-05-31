"use client";
export const dynamic = "force-dynamic";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { KeyboardEvent, useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { projectsApi } from "@/lib/api/endpoints";
import { useCategories, useMutation } from "@/lib/hooks";
import { useToastStore } from "@/lib/stores/toast-store";
import { createProjectSchema } from "@/lib/validators";

import type { CategoryDto } from "@/lib/api/types";
import type { z } from "zod";

type FormValues = z.infer<typeof createProjectSchema>;

type StepKey = "basics" | "scope" | "budget" | "preview";
type ProjectType = "fixed" | "hourly";
type ExperienceLevel = "junior" | "mid" | "senior";

const homepageCategoryLabelKeys = {
	website: "homepageCategoryWebsite",
	"landing-page": "homepageCategoryLandingPage",
	"poster-design": "homepageCategoryPosterDesign",
	"logo-design": "homepageCategoryLogoDesign",
	"document-cleanup": "homepageCategoryDocumentCleanup",
	"cv-document": "homepageCategoryCvDocument",
	"template-customization": "homepageCategoryTemplateCustomization",
	"it-support": "homepageCategoryItSupport",
} as const;

type HomepageCategorySlug = keyof typeof homepageCategoryLabelKeys;

const categorySlugAliases: Record<HomepageCategorySlug, string[]> = {
	website: ["website", "web"],
	"landing-page": ["landing-page", "landing", "web"],
	"poster-design": ["poster-design", "poster", "social-media-design", "design"],
	"logo-design": ["logo-design", "logo", "brand-design", "design"],
	"document-cleanup": ["document-cleanup", "document", "documents", "other"],
	"cv-document": ["cv-document", "cv", "resume", "documents", "other"],
	"template-customization": ["template-customization", "template", "theme", "design"],
	"it-support": ["it-support", "support", "sysadmin"],
};

function normalizeHomepageCategory(value: string | null): HomepageCategorySlug | null {
	if (!value) return null;
	const normalized = value.trim().toLowerCase();
	return normalized in homepageCategoryLabelKeys
		? (normalized as HomepageCategorySlug)
		: null;
}

function normalizeCategoryValue(value?: string | number | null): string {
	return String(value || "")
		.trim()
		.toLowerCase()
		.replace(/&/g, "and")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function findCategoryByHomepageSlug(
	categories: CategoryDto[],
	homepageSlug: HomepageCategorySlug,
): CategoryDto | undefined {
	const aliases = categorySlugAliases[homepageSlug];
	return categories.find((category) => {
		const values = [
			category.slug,
			category.name,
			category.name_en,
			category.name_mn,
			category.id,
		].map(normalizeCategoryValue);
		return aliases.some((alias) => values.includes(normalizeCategoryValue(alias)));
	});
}

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
	const t = useTranslations("ProjectNew");
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const pathParts = (pathname || "").split("/").filter(Boolean);
	const locale =
		pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
	const withLocale = (href: string) => `/${locale}${href}`;
	const requestedCategory = normalizeHomepageCategory(searchParams.get("category"));
	const requestedCategoryLabel = requestedCategory
		? t(homepageCategoryLabelKeys[requestedCategory])
		: "";

	const toast = useToastStore((s) => s.push);
	const [skillsInput, setSkillsInput] = useState("");
	const [skills, setSkills] = useState<string[]>([]);
	const [step, setStep] = useState(0);
	const [projectType, setProjectType] = useState<ProjectType>("fixed");
	const [experienceLevel, setExperienceLevel] =
		useState<ExperienceLevel>("mid");

	const steps: {
		key: StepKey;
		title: string;
		subtitle: string;
	}[] = [
		{
			key: "basics",
			title: "Төслийн суурь",
			subtitle: "Төслийн суурь мэдээлэл",
		},
		{
			key: "scope",
			title: "Тайлбар ба ур чадвар",
			subtitle: "Тайлбар ба ур чадвар",
		},
		{
			key: "budget",
			title: "Төсөв ба хугацаа",
			subtitle: "Төсөв ба хугацаа",
		},
		{
			key: "preview",
			title: "Шалгах ба нийтлэх",
			subtitle: "Шалгах ба нийтлэх",
		},
	];

	const currentStep = steps[step];

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
			category: requestedCategory || "other",
			category_id: "",
		},
		mode: "onSubmit",
	});

	const selectedCategory = useMemo(
		() =>
			categoryOptions.find(
				(item) => String(item.id) === String(form.watch("category_id") || ""),
			),
		[categoryOptions, form],
	);

	const selectedCategoryLabel = selectedCategory
		? locale === "en"
			? selectedCategory.name_en ||
				selectedCategory.name_mn ||
				selectedCategory.name ||
				"Other"
			: selectedCategory.name_mn ||
				selectedCategory.name_en ||
				selectedCategory.name ||
				"Бусад"
		: "Ангилал сонгоогүй";

	useEffect(() => {
		if (!requestedCategory) return;

		const matchingCategory = findCategoryByHomepageSlug(
			categoryOptions,
			requestedCategory,
		);
		form.setValue("category", requestedCategory, {
			shouldDirty: false,
			shouldValidate: true,
		});
		if (matchingCategory) {
			form.setValue("category_id", String(matchingCategory.id), {
				shouldDirty: false,
				shouldValidate: true,
			});
		}
	}, [categoryOptions, form, requestedCategory]);

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
			if (
				!values.title ||
				!values.category ||
				!values.budget ||
				!values.timeline_days
			) {
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
			form.setValue("description", data.description, {
				shouldDirty: true,
				shouldValidate: true,
			});
			toast("success", "AI тайлбар бэлэн боллоо.");
		},
		onError: (error: Error) => toast("error", error.message),
	});

	function setCategory(categoryId: string) {
		const category = categoryOptions.find(
			(item) => String(item.id) === categoryId,
		);
		const label =
			locale === "en"
				? category?.name_en || category?.name_mn || category?.name || "other"
				: category?.name_mn || category?.name_en || category?.name || "other";
		form.setValue("category_id", categoryId, {
			shouldDirty: true,
			shouldValidate: true,
		});
		form.setValue("category", category?.slug || label.toLowerCase(), { shouldDirty: true });
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
		const currentValues = form.getValues();
		localStorage.setItem("itzuun_new_project_draft", JSON.stringify({
			...currentValues,
			required_skills: skills,
			projectType,
			experienceLevel
		}));
		toast("success", "Ноорог хадгалагдлаа.");
	}

	// Form auto-save draft effect
	useEffect(() => {
		try {
			const draft = localStorage.getItem("itzuun_new_project_draft");
			if (draft) {
				const parsed = JSON.parse(draft);
				if (parsed.title) form.setValue("title", parsed.title);
				if (parsed.description) form.setValue("description", parsed.description);
				if (parsed.budget) form.setValue("budget", parsed.budget);
				if (parsed.timeline_days) form.setValue("timeline_days", parsed.timeline_days);
				if (parsed.category) form.setValue("category", parsed.category);
				if (parsed.category_id) form.setValue("category_id", parsed.category_id);
				if (parsed.required_skills) setSkills(parsed.required_skills);
				if (parsed.projectType) setProjectType(parsed.projectType);
				if (parsed.experienceLevel) setExperienceLevel(parsed.experienceLevel);
			}
		} catch (e) {}
	}, [form]);

	return (
		<div className="pb-20 text-on-surface">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-black text-primary font-headline">
						Шинэ төсөл оруулах
					</h1>
				</div>
				{step === steps.length - 1 && (
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={saveDraft}
							className="rounded-xl px-4 py-2 text-sm font-bold text-surface-500 transition-all hover:bg-surface-container-lowest font-headline"
						>
							Ноорог хадгалах
						</button>
						<button
							type="button"
							onClick={form.handleSubmit((values) => mutation.mutate(values))}
							className="rounded-xl primary-gradient px-6 py-2.5 text-sm font-bold text-primary-fixed shadow-ambient transition-all active:scale-95 font-headline"
							disabled={mutation.isPending}
						>
							{mutation.isPending ? t("saving") : t("publish")}
						</button>
					</div>
				)}
			</div>

			<div className="min-w-0 flex-1 px-4 py-8 md:px-10 lg:px-16 xl:px-20 2xl:px-24">
				<div className="mx-auto w-full max-w-[1040px] 2xl:max-w-[1120px]">
					<div className="mb-12">
						<div className="mb-14">
							<div className="mb-5 flex items-center justify-between">
								<span className="font-headline text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
									Алхам {step + 1} / {steps.length}
								</span>
								<span className="text-[11px] font-bold uppercase tracking-widest text-surface-400 font-headline">
									{currentStep.subtitle}
								</span>
							</div>
							<div className="h-1.5 overflow-hidden rounded-full bg-surface-container-low">
								<div
									className="h-full rounded-full primary-gradient transition-all duration-500 ease-out shadow-sm"
									style={{ width: `${((step + 1) / steps.length) * 100}%` }}
								/>
							</div>
						</div>
					</div>

					<form
						onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
						className="space-y-10"
					>
						{step === 0 ? (
							<>
								<header className="max-w-4xl mb-12">
									<h1 className="mb-6 font-headline text-5xl font-extrabold tracking-tighter text-primary leading-tight">
										Төслийн үндсэн мэдээлэл
									</h1>
									<p className="max-w-2xl text-lg font-medium leading-relaxed text-surface-500">
										Төслийнхөө талаарх эхний мэдээллийг оруулна уу. Энэ нь танд
										тохирох мэргэжилтнүүдийг олоход тусална.
									</p>
								</header>

								<div className="space-y-10">
									<div className="space-y-4">
										<label className="block text-sm font-bold uppercase tracking-widest text-primary font-headline">
											Төслийн нэр
										</label>
										<input
											{...form.register("title")}
											className="w-full rounded-2xl border-none bg-surface-container-low px-6 py-5 text-lg font-bold text-on-surface transition-all placeholder:text-surface-400 focus:bg-surface-container-lowest focus:shadow-ambient focus:ring-0"
											placeholder="Жишээ нь: Шинэ аппликейшн хөгжүүлэх"
										/>
										{form.formState.errors.title ? (
											<p className="text-xs text-red-600">
												{form.formState.errors.title.message}
											</p>
										) : (
											<p className="text-[11px] font-medium text-surface-400 uppercase tracking-widest font-headline">
												Төслийн зорилгыг тодорхой илэрхийлсэн богино нэр өгнө
												үү.
											</p>
										)}
									</div>

									<div className="space-y-4">
										<label className="block text-sm font-bold uppercase tracking-widest text-primary font-headline">
											Ангилал
										</label>
										<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
											{categoryOptions.slice(0, 6).map((category) => {
												const title =
													locale === "en"
														? category.name_en ||
															category.name_mn ||
															category.name
														: category.name_mn ||
															category.name_en ||
															category.name;
												const selected =
													String(form.watch("category_id") || "") ===
													String(category.id);
												return (
													<button
														key={category.id}
														type="button"
														onClick={() => setCategory(String(category.id))}
														className={`group relative overflow-hidden rounded-2xl p-6 text-left transition-all ${selected ? "bg-primary-fixed text-primary shadow-sm" : "bg-surface-container-low text-surface-500 hover:bg-surface-container-lowest hover:shadow-ambient"}`}
													>
														{selected && (
															<div className="absolute right-0 top-0 h-12 w-12 bg-primary/10 blur-2xl" />
														)}
														<p className="font-headline text-sm font-bold tracking-tight">
															{title}
														</p>
													</button>
												);
											})}
										</div>
										<div className="relative">
											<select
												{...form.register("category_id")}
												onChange={(event) => setCategory(event.target.value)}
												className="w-full appearance-none rounded-2xl border-none bg-surface-container-low px-6 py-5 text-sm font-bold text-primary transition-all focus:bg-surface-container-lowest focus:shadow-ambient focus:ring-0"
											>
												<option value="">Ангилал сонгох</option>
												{categoryOptions.map((category) => {
													const title =
														locale === "en"
															? category.name_en ||
																category.name_mn ||
																category.name
															: category.name_mn ||
																category.name_en ||
																category.name;
													return (
														<option key={category.id} value={category.id}>
															{title}
														</option>
													);
												})}
											</select>
											<span className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-primary opacity-40">
												<DashboardIcon name="expand" className="h-5 w-5" />
											</span>
										</div>
										{requestedCategoryLabel ? (
											<p className="text-[11px] font-medium text-surface-400 uppercase tracking-widest font-headline">
												{t("homepageCategorySelected", { category: requestedCategoryLabel })}
											</p>
										) : null}
									</div>

									<div className="space-y-4">
										<label className="block text-sm font-bold uppercase tracking-widest text-primary font-headline">
											Төслийн төрөл
										</label>
										<div className="grid gap-6 sm:grid-cols-2">
											<button
												type="button"
												onClick={() => setProjectType("fixed")}
												className={`group relative overflow-hidden rounded-[2rem] p-8 text-left transition-all ${projectType === "fixed" ? "bg-surface-container-lowest shadow-ambient" : "bg-surface-container-low hover:bg-surface-container-lowest hover:shadow-ambient"}`}
											>
												<div
													className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${projectType === "fixed" ? "bg-primary-fixed text-primary" : "bg-surface-container-lowest text-surface-300"}`}
												>
													<DashboardIcon name="wallet" className="h-7 w-7" />
												</div>
												<p className="font-headline text-xl font-extrabold text-primary tracking-tight">
													Тогтмол үнэ
												</p>
												<p className="mt-2 text-sm leading-relaxed text-surface-500">
													Тодорхой төсөвт багтаан төслийг бүрэн дуусгах.
												</p>
												{projectType === "fixed" && (
													<div className="absolute right-6 top-6 h-2 w-2 rounded-full bg-secondary" />
												)}
											</button>
											<button
												type="button"
												onClick={() => setProjectType("hourly")}
												className={`group relative overflow-hidden rounded-[2rem] p-8 text-left transition-all ${projectType === "hourly" ? "bg-surface-container-lowest shadow-ambient" : "bg-surface-container-low hover:bg-surface-container-lowest hover:shadow-ambient"}`}
											>
												<div
													className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${projectType === "hourly" ? "bg-primary-fixed text-primary" : "bg-surface-container-lowest text-surface-300"}`}
												>
													<DashboardIcon name="schedule" className="h-7 w-7" />
												</div>
												<p className="font-headline text-xl font-extrabold text-primary tracking-tight">
													Цагийн хөлс
												</p>
												<p className="mt-2 text-sm leading-relaxed text-surface-500">
													Ажилласан цагаар тооцож уян хатан төлөлт хийх.
												</p>
												{projectType === "hourly" && (
													<div className="absolute right-6 top-6 h-2 w-2 rounded-full bg-secondary" />
												)}
											</button>
										</div>
									</div>
								</div>
							</>
						) : null}

						{step === 1 ? (
							<>
								<header className="max-w-4xl mb-12">
									<div className="mb-6 inline-flex items-center gap-3 rounded-full bg-secondary-fixed/30 px-4 py-1.5 text-secondary">
										<span className="text-[10px] font-black uppercase tracking-[0.2em] font-headline">
											Алхам 02
										</span>
									</div>
									<h1 className="mb-6 font-headline text-5xl font-extrabold tracking-tighter text-primary leading-tight">
										Төслийн дэлгэрэнгүй ба ур чадвар
									</h1>
									<p className="max-w-2xl text-lg font-medium leading-relaxed text-surface-500">
										Төслийн зорилго, гүйцэтгэх ажил болон шаардлагатай ур
										чадваруудыг тодорхой оруулна уу.
									</p>
								</header>

								<section className="space-y-10">
									<div className="space-y-4">
										<label className="mb-4 flex items-center justify-between text-sm font-bold uppercase tracking-widest text-primary font-headline">
											<span>
												Төслийн тайлбар{" "}
												<span className="text-red-600 ml-1">*</span>
											</span>
											<button
												type="button"
												className="inline-flex items-center gap-2 rounded-xl bg-primary-fixed px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-primary shadow-sm transition-all hover:bg-primary-fixed-dim hover:shadow-ambient"
												onClick={() => aiMutation.mutate()}
												disabled={aiMutation.isPending}
											>
												<DashboardIcon name="sparkle" className="h-4 w-4" />
												{aiMutation.isPending
													? t("aiGenerating")
													: t("aiSuggest")}
											</button>
										</label>
										<div className="overflow-hidden rounded-[2.5rem] bg-surface-container-low p-2 transition-all focus-within:bg-surface-container-lowest focus-within:shadow-ambient">
											<textarea
												{...form.register("description")}
												rows={10}
												className="min-h-[320px] w-full resize-none border-none bg-transparent p-8 text-lg font-medium leading-relaxed text-on-surface placeholder:text-surface-400 focus:ring-0"
												placeholder="Төслийнхөө талаар аль болох тодорхой бичнэ үү..."
											/>
										</div>
										{form.formState.errors.description ? (
											<p className="mt-2 text-xs text-red-600 font-headline font-bold">
												{form.formState.errors.description.message}
											</p>
										) : null}
									</div>

									<div className="space-y-4">
										<label className="block text-sm font-bold uppercase tracking-widest text-primary font-headline">
											Шаардлагатай ур чадварууд
										</label>
										<div className="rounded-[2.5rem] bg-surface-container-low p-8 transition-all focus-within:bg-surface-container-lowest focus-within:shadow-ambient">
											<div className="mb-6 flex flex-wrap gap-2.5">
												{skills.map((skill) => (
													<span
														key={skill}
														className="inline-flex items-center gap-2.5 rounded-xl bg-primary-fixed px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-primary font-headline"
													>
														{skill}
														<button
															type="button"
															onClick={() =>
																setSkills((prev) =>
																	prev.filter((item) => item !== skill),
																)
															}
															className="text-primary hover:text-red-500 transition-colors"
														>
															<DashboardIcon name="close" className="h-4 w-4" />
														</button>
													</span>
												))}
											</div>
											<div className="flex flex-col gap-4 sm:flex-row">
												<input
													value={skillsInput}
													onChange={(event) =>
														setSkillsInput(event.target.value)
													}
													onKeyDown={onSkillKeyDown}
													placeholder="React, Node.js, UI/UX Design..."
													className="flex-1 rounded-2xl border-none bg-surface-container-lowest px-6 py-4 text-sm font-bold text-on-surface ring-1 ring-outline-variant/10 focus:ring-2 focus:ring-primary/20"
												/>
												<button
													type="button"
													onClick={() => addSkill(skillsInput)}
													className="rounded-2xl bg-primary px-8 py-4 text-xs font-bold uppercase tracking-widest text-primary-fixed shadow-sm hover:opacity-90 transition-all"
												>
													Нэмэх
												</button>
											</div>
											<p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-400 font-headline">
												Enter эсвэл таслал дарж skill нэмнэ.
											</p>
										</div>
									</div>
								</section>
							</>
						) : null}

						{step === 2 ? (
							<>
								<header className="max-w-4xl mb-12">
									<h1 className="mb-6 font-headline text-5xl font-extrabold tracking-tighter text-primary leading-tight">
										Төсөв болон хугацаа
									</h1>
									<p className="max-w-2xl text-lg font-medium leading-relaxed text-surface-500">
										Төслийнхөө санхүүжилт болон гүйцэтгэх хугацааг тодорхойлно
										уу.
									</p>
								</header>

								<div className="grid gap-8 md:grid-cols-12">
									<section className="flex flex-col gap-8 rounded-[2.5rem] bg-surface-container-lowest p-10 shadow-sm md:col-span-8">
										<div className="flex items-center gap-4">
											<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
												<DashboardIcon name="payments" className="h-6 w-6" />
											</div>
											<h3 className="font-headline text-2xl font-black text-primary">
												Төсвийн хэмжээ
											</h3>
										</div>
										<div className="grid gap-8 sm:grid-cols-2">
											<div className="space-y-3">
												<label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-surface-400 font-headline">
													Төсөв
												</label>
												<div className="relative flex items-center">
													<span className="absolute left-5 font-black text-primary">
														₮
													</span>
													<input
														type="number"
														{...form.register("budget", {
															valueAsNumber: true,
														})}
														className="w-full rounded-2xl border-none bg-surface-container-low py-5 pl-12 pr-6 text-xl font-black text-on-surface transition-all focus:bg-surface-container-lowest focus:shadow-ambient focus:ring-0"
														placeholder="500,000"
													/>
												</div>
											</div>
											<div className="space-y-3">
												<label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-surface-400 font-headline">
													Хугацаа (өдөр)
												</label>
												<div className="relative flex items-center">
													<span className="absolute left-5 font-black text-primary opacity-40">
														⏱
													</span>
													<input
														type="number"
														{...form.register("timeline_days", {
															valueAsNumber: true,
														})}
														className="w-full rounded-2xl border-none bg-surface-container-low py-5 pl-12 pr-6 text-xl font-black text-on-surface transition-all focus:bg-surface-container-lowest focus:shadow-ambient focus:ring-0"
														placeholder="14"
													/>
												</div>
											</div>
										</div>
										<div className="flex gap-4 rounded-3xl bg-surface-container-low p-6">
											<DashboardIcon
												name="info"
												className="mt-0.5 h-5 w-5 text-secondary"
											/>
											<p className="text-sm font-medium leading-relaxed text-surface-500">
												Төсвийн хэмжээг тодорхой болгох нь мэргэжлийн
												гүйцэтгэгчдийг татахад тусална.
											</p>
										</div>
									</section>

									<section className="flex flex-col gap-6 md:col-span-4">
										<h3 className="mb-2 font-headline text-sm font-bold uppercase tracking-[0.18em] text-primary">
											Шаардлагатай туршлага
										</h3>
										{[
											{
												key: "junior",
												title: "Анхан шат",
												subtitle: "Суралцаж буй залуус",
												icon: "info",
											},
											{
												key: "mid",
												title: "Дунд шат",
												subtitle: "2-5 жилийн туршлагатай",
												icon: "description",
											},
											{
												key: "senior",
												title: "Ахисан шат",
												subtitle: "Ахлах түвшний эксперт",
												icon: "verified",
											},
										].map((item) => (
											<button
												key={item.key}
												type="button"
												onClick={() =>
													setExperienceLevel(item.key as ExperienceLevel)
												}
												className={`group relative flex items-center gap-5 rounded-3xl p-6 text-left transition-all ${experienceLevel === item.key ? "bg-surface-container-lowest shadow-ambient" : "bg-surface-container-low hover:bg-surface-container-lowest hover:shadow-ambient"}`}
											>
												<div
													className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${experienceLevel === item.key ? "bg-primary-fixed text-primary" : "bg-surface-container-lowest text-surface-300"}`}
												>
													<DashboardIcon
														name={
															item.icon as Parameters<
																typeof DashboardIcon
															>[0]["name"]
														}
														className="h-6 w-6"
													/>
												</div>
												<div className="flex-1">
													<p className="font-headline text-base font-bold text-primary">
														{item.title}
													</p>
													<p className="mt-1 text-xs font-medium text-surface-400">
														{item.subtitle}
													</p>
												</div>
												{experienceLevel === item.key && (
													<DashboardIcon
														name="verified"
														className="h-5 w-5 text-secondary"
													/>
												)}
											</button>
										))}
									</section>

									<section className="rounded-[2.5rem] bg-surface-container-low p-10 md:col-span-12">
										<div className="mb-8 flex items-center gap-4">
											<div className="rounded-2xl bg-surface-container-lowest p-3 text-primary shadow-sm">
												<DashboardIcon name="schedule" className="h-6 w-6" />
											</div>
											<h3 className="font-headline text-2xl font-black text-primary">
												Төсөл үргэлжлэх хугацаа
											</h3>
										</div>
										<div className="grid gap-4 sm:grid-cols-3">
											{[
												{ label: "1-2 долоо хоног", value: 14 },
												{ label: "3-4 долоо хоног", value: 30 },
												{ label: "1+ сар", value: 45 },
											].map((option) => {
												const selected =
													Number(form.watch("timeline_days") || 0) ===
													option.value;
												return (
													<button
														key={option.value}
														type="button"
														onClick={() =>
															form.setValue("timeline_days", option.value, {
																shouldDirty: true,
																shouldValidate: true,
															})
														}
														className={`group relative overflow-hidden rounded-[2rem] p-8 text-left transition-all ${selected ? "bg-surface-container-lowest shadow-ambient" : "bg-surface-container-low hover:bg-surface-container-lowest hover:shadow-ambient"}`}
													>
														{selected && (
															<div className="absolute right-0 top-0 h-10 w-10 bg-secondary/5 blur-xl" />
														)}
														<p className="font-headline text-lg font-bold text-primary tracking-tight">
															{option.label}
														</p>
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
								<header className="max-w-4xl mb-12">
									<h1 className="mb-6 font-headline text-5xl font-extrabold tracking-tighter text-primary leading-tight">
										Төслийг хянах
									</h1>
									<p className="max-w-2xl text-lg font-medium leading-relaxed text-surface-500">
										Нийтлэхээс өмнө бүх мэдээллийг дахин нэг шалгана уу.
									</p>
								</header>

								<div className="space-y-8">
									<section className="rounded-[2.5rem] bg-surface-container-lowest p-10 shadow-sm transition-all hover:shadow-ambient">
										<div className="mb-8 flex items-start justify-between">
											<div className="flex items-center gap-5">
												<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-low text-primary shadow-sm">
													<DashboardIcon
														name="info"
														className="h-7 w-7 opacity-40"
													/>
												</div>
												<div>
													<h2 className="text-xl font-black text-primary font-headline">
														Ерөнхий мэдээлэл
													</h2>
													<p className="text-[11px] font-bold uppercase tracking-widest text-surface-400 font-headline mt-1">
														Төслийн үндсэн гарчиг болон төрөл
													</p>
												</div>
											</div>
											<button
												type="button"
												onClick={() => setStep(0)}
												className="flex items-center gap-2 rounded-xl bg-surface-container-low px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-primary transition-all hover:bg-surface-container-lowest hover:shadow-sm font-headline"
											>
												<DashboardIcon name="edit" className="h-4 w-4" />
												Засах
											</button>
										</div>
										<div className="grid gap-10 md:grid-cols-2 bg-surface-container-low/30 p-8 rounded-3xl">
											<div>
												<p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-surface-400 font-headline">
													Төслийн гарчиг
												</p>
												<p className="text-lg font-extrabold text-on-surface font-headline leading-tight">
													{form.watch("title") || "Гарчиг оруулаагүй"}
												</p>
											</div>
											<div className="flex gap-12">
												<div>
													<p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-surface-400 font-headline">
														Ангилал
													</p>
													<p className="text-base font-bold text-primary font-headline">
														{selectedCategoryLabel}
													</p>
												</div>
												<div>
													<p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-surface-400 font-headline">
														Төрөл
													</p>
													<span className="inline-flex rounded-lg primary-gradient px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary-fixed shadow-sm">
														{projectType === "fixed"
															? "ФИКСЕД ҮНЭ"
															: "ЦАГИЙН ХӨЛС"}
													</span>
												</div>
											</div>
										</div>
									</section>

									<section className="rounded-[2.5rem] bg-surface-container-lowest p-10 shadow-sm transition-all hover:shadow-ambient">
										<div className="mb-8 flex items-start justify-between">
											<div className="flex items-center gap-5">
												<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-low text-primary shadow-sm">
													<DashboardIcon
														name="description"
														className="h-7 w-7 opacity-40"
													/>
												</div>
												<div>
													<h2 className="text-xl font-black text-primary font-headline">
														Тайлбар болон ур чадвар
													</h2>
													<p className="text-[11px] font-bold uppercase tracking-widest text-surface-400 font-headline mt-1">
														Хөгжүүлэгчид тавигдах шаардлага
													</p>
												</div>
											</div>
											<button
												type="button"
												onClick={() => setStep(1)}
												className="flex items-center gap-2 rounded-xl bg-surface-container-low px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-primary transition-all hover:bg-surface-container-lowest hover:shadow-sm font-headline"
											>
												<DashboardIcon name="edit" className="h-4 w-4" />
												Засах
											</button>
										</div>
										<div className="mb-10 bg-surface-container-low/30 p-8 rounded-3xl">
											<p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-surface-400 font-headline">
												Төслийн дэлгэрэнгүй
											</p>
											<div className="whitespace-pre-wrap leading-relaxed text-on-surface font-medium opacity-80">
												{form.watch("description") || "Тайлбар оруулаагүй."}
											</div>
										</div>
										<div className="bg-surface-container-low/30 p-8 rounded-3xl">
											<p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-surface-400 font-headline">
												Шаардлагатай ур чадварууд
											</p>
											<div className="flex flex-wrap gap-2.5">
												{skills.length ? (
													skills.map((skill) => (
														<span
															key={skill}
															className="rounded-xl bg-primary-fixed px-5 py-2 text-[11px] font-black uppercase tracking-widest text-primary font-headline shadow-sm"
														>
															{skill}
														</span>
													))
												) : (
													<span className="text-sm font-medium text-surface-400 italic">
														Ур чадвар оруулаагүй.
													</span>
												)}
											</div>
										</div>
									</section>

									<section className="rounded-[2.5rem] bg-surface-container-lowest p-10 shadow-sm transition-all hover:shadow-ambient">
										<div className="mb-8 flex items-start justify-between">
											<div className="flex items-center gap-5">
												<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-low text-primary shadow-sm">
													<DashboardIcon
														name="payments"
														className="h-7 w-7 opacity-40"
													/>
												</div>
												<div>
													<h2 className="text-xl font-black text-primary font-headline">
														Төсөв ба хугацаа
													</h2>
													<p className="text-[11px] font-bold uppercase tracking-widest text-surface-400 font-headline mt-1">
														Хүрээ, туршлага, хугацааны сонголт
													</p>
												</div>
											</div>
											<button
												type="button"
												onClick={() => setStep(2)}
												className="flex items-center gap-2 rounded-xl bg-surface-container-low px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-primary transition-all hover:bg-surface-container-lowest hover:shadow-sm font-headline"
											>
												<DashboardIcon name="edit" className="h-4 w-4" />
												Засах
											</button>
										</div>
										<div className="grid gap-8 md:grid-cols-3 bg-surface-container-low/30 p-8 rounded-3xl">
											<div>
												<p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-surface-400 font-headline">
													Төсөв
												</p>
												<p className="text-2xl font-black text-primary font-headline tracking-tight">
													{formatMnt(Number(form.watch("budget") || 0))}
												</p>
											</div>
											<div>
												<p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-surface-400 font-headline">
													Хугацаа
												</p>
												<p className="text-xl font-black text-on-surface font-headline">
													{form.watch("timeline_days") || 0} өдөр
												</p>
											</div>
											<div>
												<p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-surface-400 font-headline">
													Туршлага
												</p>
												<p className="text-xl font-black text-on-surface font-headline italic">
													{experienceLevel === "junior"
														? "Анхан шат"
														: experienceLevel === "mid"
															? "Дунд шат"
															: "Ахисан шат"}
												</p>
											</div>
										</div>
									</section>
								</div>
							</>
						) : null}

						<div className="flex flex-col items-center gap-6 pt-16 sm:flex-row">
							{step > 0 ? (
								<button
									type="button"
									onClick={() => setStep((prev) => Math.max(0, prev - 1))}
									className="w-full rounded-2xl bg-surface-container-low px-10 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary transition-all hover:bg-surface-container-lowest hover:shadow-ambient sm:w-auto font-headline"
								>
									Буцах
								</button>
							) : (
								<div className="hidden sm:block sm:w-32" />
							)}
							{step < steps.length - 1 ? (
								<button
									type="button"
									onClick={goNext}
									className="flex w-full items-center justify-center gap-4 rounded-2xl primary-gradient px-12 py-5 text-[11px] font-black uppercase tracking-[0.25em] text-primary-fixed shadow-ambient transition-all hover:-translate-y-1 active:scale-95 sm:w-auto font-headline"
								>
									Дараагийн алхам
									<DashboardIcon name="arrow" className="h-5 w-5 rotate-180" />
								</button>
							) : (
								<button
									type="submit"
									className="flex w-full items-center justify-center gap-4 rounded-2xl primary-gradient px-12 py-5 text-[11px] font-black uppercase tracking-[0.25em] text-primary-fixed shadow-ambient transition-all hover:-translate-y-1 active:scale-95 sm:w-auto font-headline"
									disabled={mutation.isPending}
								>
									<DashboardIcon name="rocket" className="h-5 w-5" />
									{mutation.isPending ? t("saving") : t("publish")}
								</button>
							)}
						</div>
					</form>

					<div className="mt-16 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
						<div className="relative overflow-hidden rounded-[2.5rem] bg-primary-fixed p-8 text-primary shadow-sm hover:shadow-ambient transition-all">
							<div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl" />
							<h4 className="mb-3 font-headline text-lg font-black tracking-tight">
								Тусламж хэрэгтэй юу?
							</h4>
							<p className="max-w-md text-[13px] font-medium leading-relaxed opacity-70">
								Манай зөвлөхүүд төсвөө зөв тодорхойлох, төслийн шаардлагаа илүү
								ойлгомжтой бичихэд тусална.
							</p>
						</div>
						<div className="rounded-[2.5rem] bg-surface-container-low p-8 shadow-sm transition-all hover:shadow-ambient">
							<p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary font-headline">
								Товч мэдээлэл
							</p>
							<p className="mt-4 truncate font-headline text-base font-extrabold text-primary leading-tight">
								{form.watch("title") || "Гарчиг оруулаагүй"}
							</p>
							<p className="mt-2 text-[11px] font-bold text-surface-400 font-headline uppercase tracking-widest leading-none">
								{selectedCategoryLabel} · {form.watch("timeline_days") || 0}{" "}
								өдөр
							</p>
							<p className="mt-4 text-2xl font-black text-primary font-headline tracking-tighter">
								{formatMnt(Number(form.watch("budget") || 0))}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
