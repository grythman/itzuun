import Link from "next/link";

export default function SupportPage() {
  return (
    <section className="space-y-4">
      <h1 className="font-headline text-3xl font-extrabold text-surface-900">Support</h1>
      <p className="max-w-3xl text-[14px] leading-relaxed text-surface-600">
        Need help with account access, project flow, escrow, or disputes? Reach out to the support team.
      </p>
      <div className="rounded-2xl border border-surface-200/60 bg-white p-5 text-[14px] text-surface-600">
        <p>Email: support@itzuun.mn</p>
        <p className="mt-1">Typical response time: within 1 business day.</p>
        <div className="mt-4">
          <Link href="mailto:support@itzuun.mn" className="rounded-full primary-gradient px-5 py-2 text-[13px] font-semibold text-white">
            Contact Support
          </Link>
        </div>
      </div>
    </section>
  );
}
