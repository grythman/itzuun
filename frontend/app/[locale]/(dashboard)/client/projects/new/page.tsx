"use client";
export const dynamic = "force-dynamic";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { KeyboardEvent, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { projectsApi } from "@/lib/api/endpoints";
import { useCategories, useMutation } from "@/lib/hooks";
import { useToastStore } from "@/lib/stores/toast-store";
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
		return (
			<svg viewBox="0 0 24 24" {...common}>
				<path
					fill="currentColor"
					d="M3 17.2V21h3.8L17.9 9.9l-3.8-3.8L3 17.2ZM20.7 7a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.8 1.8L18.9 8 20.7 7Z"
				/>
			</svg>
		);
	}
	if (name === "description") {
		return (
			<svg viewBox="0 0 24 24" {...common}>
				<path
					fill="currentColor"
					d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V7h3.5L13 3.5ZM8 11h8v1.5H8V11Zm0 3h8v1.5H8V14Zm0 3h5v1.5H8V17Z"
				/>
			</svg>
		);
	}
	if (name === "payments" || name === "wallet") {
		return (
			<svg viewBox="0 0 24 24" {...common}>
				<path
					fill="currentColor"
					d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3V6Zm0 4h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8Zm11 3a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3Z"
				/>
			</svg>
		);
	}
	if (name === "visibility") {
		return (
			<svg viewBox="0 0 24 24" {...common}>
				<path
					fill="currentColor"
					d="M12 5c5.5 0 9.6 4.3 10.8 6-1.2 1.7-5.3 6-10.8 6S2.4 12.7 1.2 11C2.4 9.3 6.5 5 12 5Zm0 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-2.2a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Z"
				/>
			</svg>
		);
	}
	if (name === "expand") {
		return (
			<svg viewBox="0 0 24 24" {...common}>
				<path fill="currentColor" d="m7 10 5 5 5-5H7Z" />
			</svg>
		);
	}
	if (name === "schedule") {
		return (
			<svg viewBox="0 0 24 24" {...common}>
				<path
					fill="currentColor"
					d="M12 1a11 11 0 1 0 11 11A11 11 0 0 0 12 1Zm1 11.4 4.2 2.5-.8 1.3L11.5 13V6h1.5Z"
				/>
			</svg>
		);
	}
	if (name === "verified") {
		return (
			<svg viewBox="0 0 24 24" {...common}>
				<path
					fill="currentColor"
					d="m23 12-2.4-2.8.3-3.7-3.6-.8L15.4 1 12 2.5 8.6 1 6.7 4.7l-3.6.8.3 3.7L1 12l2.4 2.8-.3 3.7 3.6.8L8.6 23l3.4-1.5 3.4 1.5 1.9-3.7 3.6-.8-.3-3.7L23 12Zm-12 4-4-4 1.4-1.4 2.6 2.6 5.6-5.6L18 8l-7 8Z"
				/>
			</svg>
		);
	}
	if (name === "rocket") {
		return (
			<svg viewBox="0 0 24 24" {...common}>
				<path
					fill="currentColor"
					d="M14 3c3.9 0 7 3.1 7 7 0 2.1-.9 4.1-2.4 5.4l-2.2 2.2-3.2-3.2 2.2-2.2A5.4 5.4 0 0 0 14 3Zm-3.3 8.1L3 18.8V21h2.2l7.7-7.7-2.2-2.2Zm-5 8.9H4v-1.7l5.8-5.8 1.7 1.7L5.7 20Z"
				/>
			</svg>
		);
	}
	if (name === "close") {
		return (
			<svg viewBox="0 0 24 24" {...common}>
				<path
					fill="currentColor"
					d="m18.3 5.7-1-1L12 10l-5.3-5.3-1 1L11 11l-5.3 5.3 1 1L12 12l5.3 5.3 1-1L13 11l5.3-5.3Z"
				/>
			</svg>
		);
	}
	if (name === "sparkle") {
		return (
			<svg viewBox="0 0 24 24" {...common}>
				<path
					fill="currentColor"
					d="m12 2 1.8 4.7L18.5 8l-4.7 1.3L12 14l-1.8-4.7L5.5 8l4.7-1.3L12 2Zm7 11 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5ZM5 14l1.2 3 3 1.2-3 1.2L5 22l-1.2-3-3-1.2 3-1.2L5 14Z"
				/>
			</svg>
		);
	}
	if (name === "support") {
		return (
			<svg viewBox="0 0 24 24" {...common}>
				<path
					fill="currentColor"
					d="M12 2a8 8 0 0 0-8 8v3a3 3 0 0 0 3 3h1v-6H6v-1a6 6 0 1 1 12 0v1h-2v6h1a3 3 0 0 0 3-3v-3a8 8 0 0 0-8-8Zm-3 9h6v7H9v-7Zm1 8h4v1a2 2 0 1 1-4 0v-1Z"
				/>
			</svg>
		);
	}
	if (name === "info") {
		return (
			<svg viewBox="0 0 24 24" {...common}>
				<path
					fill="currentColor"
					d="M11 10h2v7h-2v-7Zm0-3h2v2h-2V7Zm1-5a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"
				/>
			</svg>
		);
	}
	return (
		<svg viewBox="0 0 24 24" {...common}>
			<path
				fill="currentColor"
				d="m12 4 1.4 1.4-5.6 5.6H20v2H7.8l5.6 5.6L12 20l-8-8 8-8Z"
			/>
		</svg>
	);
}

export default function NewProjectPage() {
	const t = useTranslations("ProjectNew");
	const router = useRouter();
	const pathname = usePathname();
	const pathParts = (pathname || "").split("/").filter(Boolean);
	const locale =
		pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
	const withLocale = (href: string) => `/${locale}${href}`;

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
		icon: ReturnType<typeof stepIconName>;
	}[] = [
		{
			key: "basics",
			title: "Project Basics",
			subtitle: "Төслийн суурь мэдээлэл",
			icon: "edit",
		},
		{
			key: "scope",
			title: "Description & Skills",
			subtitle: "Тайлбар ба ур чадвар",
			icon: "description",
		},
		{
			key: "budget",
			title: "Budget & Timeline",
			subtitle: "Төсөв ба хугацаа",
			icon: "payments",
		},
		{
			key: "preview",
			title: "Preview & Post",
			subtitle: "Шалгах ба нийтлэх",
			icon: "visibility",
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
			category: "other",
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
		<div className="pb-20 text-on-surface">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-black text-primary font-headline">
						Шинэ төсөл оруулах
					</h1>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={saveDraft}
						className="rounded-xl px-4 py-2 text-sm font-bold text-surface-500 transition-all hover:bg-surface-container-lowest font-headline"
					>
						Save as Draft
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
											<div className="flex items-center gap-2 overflow-x-auto border-b border-outline-variant/10 px-6 py-3">
												<button
													type="button"
													className="rounded-lg p-2 text-surface-400 hover:bg-surface-container-lowest hover:text-primary transition-colors"
												>
													<strong>B</strong>
												</button>
												<button
													type="button"
													className="rounded-lg p-2 text-surface-400 hover:bg-surface-container-lowest hover:text-primary transition-colors italic"
												>
													I
												</button>
												<button
													type="button"
													className="rounded-lg p-2 text-surface-400 hover:bg-surface-container-lowest hover:text-primary transition-colors font-headline text-xs font-bold uppercase tracking-widest"
												>
													• List
												</button>
												<button
													type="button"
													className="rounded-lg p-2 text-surface-400 hover:bg-surface-container-lowest hover:text-primary transition-colors font-headline text-xs font-bold uppercase tracking-widest"
												>
													Link
												</button>
											</div>
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
													Доод (Min)
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
									{mutation.isPending ? t("saving") : "Post Project"}
								</button>
							)}
						</div>
					</form>

					<div className="mt-16 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
						<div className="relative overflow-hidden rounded-[2.5rem] bg-primary-fixed p-8 text-primary shadow-sm hover:shadow-ambient transition-all">
							<div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl" />
							<h4 className="mb-3 font-headline text-lg font-black tracking-tight">
								Need Help?
							</h4>
							<p className="max-w-md text-[13px] font-medium leading-relaxed opacity-70">
								Манай зөвлөхүүд төсвөө зөв тодорхойлох, төслийн шаардлагаа илүү
								ойлгомжтой бичихэд тусална.
							</p>
						</div>
						<div className="rounded-[2.5rem] bg-surface-container-low p-8 shadow-sm transition-all hover:shadow-ambient">
							<p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary font-headline">
								Quick Summary
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

function stepIconName(
	step: StepKey,
): Parameters<typeof DashboardIcon>[0]["name"] {
	if (step === "basics") return "edit";
	if (step === "scope") return "description";
	if (step === "budget") return "payments";
	return "visibility";
}
