export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";

export default function RegisterRedirectPage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || "mn";
  redirect(`/${locale}/auth?tab=register`);
}
