export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";

export default function RegisterRedirectPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const locale = params?.locale || "mn";
  const query = new URLSearchParams();
  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (key === "tab") return;
    if (typeof value === "string") query.set(key, value);
    if (Array.isArray(value) && value.length > 0) query.set(key, value[0] || "");
  });
  query.set("tab", "register");
  redirect(`/${locale}/auth?${query.toString()}`);
}
