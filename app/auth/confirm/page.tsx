import Link from "next/link";
export const metadata = {
  title: "Confirmar email | Jornal SIS",
  robots: { index: false, follow: false },
};
export default async function ConfirmEmail({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string }>;
}) {
  const token = (await searchParams).token_hash || "";
  const valid = /^[a-f0-9]{40,128}$/i.test(token);
  return (
    <div className="container-premium py-16">
      <section className="card-border mx-auto max-w-lg space-y-6 p-8">
        <p className="text-xs uppercase tracking-widest text-gold">
          Jornal SIS · Sua conta
        </p>
        <h1 className="font-display text-4xl">Confirme seu email</h1>
        {valid ? (
          <>
            <p>
              Conclua a confirmação do seu cadastro. Depois, entre com sua senha
              para acessar sua conta no Jornal SIS.
            </p>
            <form action="/auth/confirm/verify" method="post">
              <input type="hidden" name="token_hash" value={token} />
              <button className="sis-button">Confirmar meu email</button>
            </form>
          </>
        ) : (
          <p>
            Este link está incompleto ou não é válido. Solicite uma nova
            confirmação na página da sua conta.
          </p>
        )}
        <Link href="/conta" className="block text-sm underline">
          Ir para minha conta
        </Link>
      </section>
    </div>
  );
}
