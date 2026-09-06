"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
export function EmailSecondFactor({
  next,
  primaryValid,
}: {
  next: string;
  primaryValid: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function run(action: "send" | "verify") {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "verify" ? { code } : {}),
        }),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      if (action === "send") {
        setSent(true);
        setCode("");
        setMessage(result.message);
      } else {
        router.replace(next);
        router.refresh();
      }
    } catch (e) {
      setMessage(
        (e as Error).message || "Não foi possível verificar. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mx-auto max-w-xl space-y-5 card-border p-6">
      <p className="text-xs uppercase tracking-widest text-gold">
        Segunda etapa do acesso
      </p>
      <h2 className="font-display text-3xl">
        Confirme com um código por email
      </h2>
      {primaryValid ? (
        <>
          <p>
            Para concluir o login, solicite o código no email da sua conta e
            digite-o abaixo. Não compartilhe esse código.
          </p>
          <button
            className="sis-button"
            disabled={busy}
            onClick={() => void run("send")}
          >
            {busy
              ? "Aguarde…"
              : sent
                ? "Reenviar código"
                : "Enviar código por email"}
          </button>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void run("verify");
            }}
          >
            <label className="block">
              Código recebido por email
              <input
                className="sis-input mt-2 w-full"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6,10}"
                minLength={6}
                maxLength={10}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </label>
            <button className="sis-button" disabled={busy}>
              Verificar e continuar
            </button>
          </form>
          <p className="text-sm text-zinc-400">
            Confira também o spam. Aguarde um minuto entre envios. Se recarregou
            a página, você pode usar o código que já recebeu.
          </p>
        </>
      ) : (
        <p>
          Seu email foi confirmado. Agora entre com sua senha ou com o Google
          para concluir as duas etapas do acesso.
        </p>
      )}
      <p role="status" aria-live="polite" className="text-gold">
        {message}
      </p>
      <button
        className="underline"
        disabled={busy}
        onClick={async () => {
          await createClient().auth.signOut({ scope: "local" });
          router.replace("/conta?next=" + encodeURIComponent(next));
          router.refresh();
        }}
      >
        {primaryValid ? "Sair e usar outra conta" : "Ir para o login"}
      </button>
    </section>
  );
}
