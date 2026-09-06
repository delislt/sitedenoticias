import Link from "next/link";
import { PasswordHelp } from "@/components/PasswordHelp";
export const metadata = {
  title: "Recuperar senha | Jornal SIS",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="container-premium max-w-xl space-y-6 py-12">
      <h1 className="font-display text-4xl">Esqueci minha senha</h1>
      {error ? (
        <p role="alert" className="text-gold">
          Este link expirou ou já foi usado. Solicite um novo email abaixo.
        </p>
      ) : null}
      <PasswordHelp />
      <Link href="/conta" className="underline">
        Voltar para o login
      </Link>
    </div>
  );
}
