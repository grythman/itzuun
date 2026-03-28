"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { AppCard } from "@/components/ui-kit";
import { useMe } from "@/lib/hooks";

export default function MessagesPage() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  const me = useMe();

  if (me.isLoading) return <LoadingState label="Loading messages..." />;
  if (me.isError || !me.data) {
    return (
      <ErrorState
        label="Please sign in to view messages."
        action={<Link href={withLocale("/auth?tab=signin")} className="text-brand-700 underline">Go to login</Link>}
      />
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="font-headline text-3xl font-extrabold text-surface-900">Messages Inbox</h1>
        <p className="mt-1 text-[14px] text-surface-500">Conversation threads between clients and freelancers will appear here.</p>
      </div>

      <AppCard>
        <EmptyState label="No conversations yet." />
      </AppCard>
    </section>
  );
}
