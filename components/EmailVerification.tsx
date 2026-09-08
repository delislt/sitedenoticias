"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { siteUrl } from "@/lib/domain";

export function EmailVerification({
  initialEmail,
  next,
}: {
  initialEmail: string;
  next: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    localStorage.setItem("sis-email-verification-pending", "1");
    const timer = !initialEmail
      ? window.setTimeout(
          () => setEmail(sessionStorage.getItem("sis-pending-email") || ""),
          0,
        )
      : undefined;
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [initialEmail]);
  async function resend(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const { error } = await createClient().auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: siteUrl + "/auth/callback" },
      });
      if (error) throw error;
      sessionStorage.setItem("sis-pending-email", email.trim());
      setMessage(
        "Email reenviado. Use somente a mensagem mais recente e confira também a pasta de spam.",
      );
    } catch (error) {
      const details = error as { code?: string; status?: number };
      setMessage(
        details.status === 429 ||
          details.code === "over_email_send_rate_limit"
          ? "O limite temporário de emails foi atingido. Tente novamente mais tarde."
          : details.code === "email_address_not_authorized"
            ? "O envio de confirmação não está disponível para este email."
            : "Não foi possível reenviar agora. Aguarde um minuto e tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      aria-labelledby="verification-title"
      className="card-border mx-auto max-w-xl space-y-6 border-gold p-6"
    >
      <h1 id="verification-title" className="font-display text-4xl">
        Confirme seu email para continuar
      </h1>
      <p>
        Abra o email do cadastro e clique em <strong>Confirmar meu email</strong>.
      </p>
      <form onSubmit={resend} className="space-y-4">
        <label className="block">
          Email do cadastro
          <input
            className="sis-input mt-2 w-full"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button className="sis-button" disabled={busy}>
          {busy ? "Reenviando…" : "Reenviar email de confirmação"}
        </button>
      </form>
      <p role="status" aria-live="polite" className="text-gold">
        {message}
      </p>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link
          href={"/conta?next=" + encodeURIComponent(next)}
          className="underline"
        >
          Já confirmei: voltar para entrar
        </Link>
        <Link href="/" className="underline">
          Voltar ao jornal
        </Link>
      </div>
    </section>
  );
}
