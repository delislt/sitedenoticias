import Link from "next/link";
export const metadata = {
  title: "Recuperar senha | Jornal SIS",
  robots: { index: false, follow: false },
};
export default async function RecoverPassword({
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
        <h1 className="font-display text-4xl">Recupere sua senha</h1>
        {valid ? (
          <>
            <p>Continue para definir uma nova senha para sua conta.</p>
            <form action="/auth/recover/verify" method="post">
              <input type="hidden" name="token_hash" value={token} />
              <button className="sis-button">
                Continuar para definir senha
              </button>
            </form>
          </>
        ) : (
          <p>
            Este link está incompleto ou não é válido. Solicite um novo link de
            recuperação na página da sua conta.
          </p>
        )}
        <Link href="/conta" className="block text-sm underline">
          Ir para minha conta
        </Link>
      </section>
    </div>
  );
}
