import { ReaderAccount } from "@/components/ReaderAccount";
import { currentSession } from "@/lib/auth";
import { getSettings } from "@/lib/resources";
import { safeReturn } from "@/lib/domain";
import { redirect } from "next/navigation";
export const metadata = {
  title: "Sua conta | Jornal SIS",
  robots: { index: false, follow: false },
};
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    denied?: string;
    error?: string;
    confirmed?: string;
  }>;
}) {
  const [session, settings, p] = await Promise.all([
    currentSession(),
    getSettings(),
    searchParams,
  ]);
  const next = safeReturn(p.next);
  if (session.user && !session.user.email_confirmed_at)
    redirect("/conta/verificar-email?next=" + encodeURIComponent(next));
  return (
    <div className="container-premium space-y-8 py-12">
      <h1 className="font-display text-center text-4xl">
        Sua conta no Jornal SIS
      </h1>
      {p.confirmed === "1" && !session.user ? (
        <p role="status" className="text-center text-gold">
          Email confirmado. Entre com sua senha ou com o Google para continuar.
        </p>
      ) : null}
      {p.denied ? (
        <p role="alert" className="text-center text-gold">
          Sua conta não tem permissão para acessar esta área da equipe.
        </p>
      ) : null}
      {p.error ? (
        <p role="alert" className="text-center text-gold">
          Não foi possível confirmar o email. Use o link mais recente ou entre
          novamente.
        </p>
      ) : null}
      <ReaderAccount
        access={session.access}
        next={next}
        registration={settings.readers_enabled}
        emailVerified={Boolean(session.user?.email_confirmed_at)}
      />
    </div>
  );
}
