import { ReaderAccount } from "@/components/ReaderAccount";
import { currentSession } from "@/lib/auth";
import { getSettings } from "@/lib/resources";
import { safeReturn } from "@/lib/domain";
export const metadata = {
  title: "Sua conta | Jornal SIS",
  robots: { index: false, follow: false },
};
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; denied?: string; error?: string }>;
}) {
  const [{ access }, settings, p] = await Promise.all([
    currentSession(),
    getSettings(),
    searchParams,
  ]);
  return (
    <div className="container-premium space-y-8 py-12">
      <h1 className="font-display text-center text-4xl">
        Sua conta no Jornal SIS
      </h1>
      {p.denied?<p role="alert" className="text-center text-gold">Sua conta não tem permissão para acessar esta área da equipe.</p>:null}{p.error?<p role="alert" className="text-center text-gold">Não foi possível confirmar o email. Use o link mais recente ou entre novamente.</p>:null}<ReaderAccount
        access={access}
        next={safeReturn(p.next)}
        registration={settings.readers_enabled}
      />
    </div>
  );
}
