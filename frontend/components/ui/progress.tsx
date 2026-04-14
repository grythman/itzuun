"use client";

export function StepProgress({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="space-y-2">
      <div className="h-1.5 w-full rounded-full bg-surface-100">
        <div
          className="h-1.5 rounded-full bg-brand-600 transition-all"
          style={{ width: `${Math.max(0, Math.min(100, ((currentStep + 1) / steps.length) * 100))}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-2 text-[11px] text-surface-500">
        {steps.map((step, idx) => (
          <span key={step} className={idx <= currentStep ? "font-semibold text-brand-700" : ""}>
            {idx + 1}. {step}
          </span>
        ))}
      </div>
    </div>
  );
}

export function FlowRail({
  title = "Flow",
  steps,
  currentStep,
}: {
  title?: string;
  steps: Array<{ title: string; subtitle?: string }>;
  currentStep: number;
}) {
  return (
    <div className="sticky top-24 space-y-4 rounded-2xl border border-[#d9d5ed] bg-[#f7f8ff] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f50b8]">{title}</p>
      <ul className="space-y-2">
        {steps.map((item, index) => {
          const tone = index === currentStep ? "active" : index < currentStep ? "done" : "todo";
          return (
            <li
              key={`${item.title}-${index}`}
              className={`rounded-xl px-3 py-3 ${
                tone === "active"
                  ? "bg-surface-container-lowest shadow-ambient border-none"
                  : tone === "done"
                    ? "bg-primary-fixed/20 border-none"
                    : "bg-transparent border-none border-l-2 border-outline-variant/15"
              }`}
            >
              <p className={`text-[12px] font-semibold ${tone === "active" ? "text-primary" : "text-surface-700 font-headline"}`}>
                {index + 1}. {item.title}
              </p>
              {item.subtitle ? <p className="mt-0.5 text-[11px] text-surface-500">{item.subtitle}</p> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
