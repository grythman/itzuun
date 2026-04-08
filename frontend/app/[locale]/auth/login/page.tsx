export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";

export default function LoginRedirectPage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || "mn";
  redirect(`/${locale}/auth?tab=signin`);
}
