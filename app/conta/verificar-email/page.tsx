import { redirect } from "next/navigation";
import { EmailVerification } from "@/components/EmailVerification";
import { currentSession } from "@/lib/auth";
import { safeReturn } from "@/lib/domain";

export const metadata = {
  title: "Verificar email | Jornal SIS",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ user }, params] = await Promise.all([
    currentSession(),
    searchParams,
  ]);
  const next = safeReturn(params.next);
  if (user?.email_confirmed_at)
    redirect("/conta?next=" + encodeURIComponent(next));
  return (
    <div className="container-premium py-12">
      <EmailVerification initialEmail={user?.email || ""} next={next} />
    </div>
  );
}
