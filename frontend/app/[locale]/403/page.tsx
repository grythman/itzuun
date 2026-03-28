import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <section className="mx-auto max-w-2xl space-y-4 py-10 text-center">
      <p className="text-[12px] font-semibold uppercase tracking-widest text-surface-400">403</p>
      <h1 className="font-headline text-4xl font-extrabold text-surface-900">Access Forbidden</h1>
      <p className="text-[14px] text-surface-600">You do not have permission to access this resource.</p>
      <div className="pt-2">
        <Link href="/" className="rounded-full primary-gradient px-6 py-2 text-[13px] font-semibold text-white">Go Home</Link>
      </div>
    </section>
  );
}
