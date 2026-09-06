"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { siteUrl } from "@/lib/domain";

export function EmailVerification({
  initialEmail,
  next,
}: {
  initialEmail: string;
  next: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"resend" | "verify" | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const timer = !initialEmail
      ? window.setTimeout(
          () => setEmail(sessionStorage.getItem("sis-pending-email") || ""),
          0,
        )
      : undefined;
    localStorage.setItem("sis-email-verification-pending", "1");
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [initialEmail]);
  async function resend(event: React.FormEvent) {
    event.preventDefault();
    setBusy("resend");
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
    } catch {
      setMessage(
        "Não foi possível reenviar agora. Aguarde um minuto e tente novamente.",
      );
    } finally {
      setBusy(null);
    }
  }
  async function confirmCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy("verify");
    setMessage("");
    try {
      const { error } = await createClient().auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "email",
      });
      if (error) throw error;
      localStorage.removeItem("sis-email-verification-pending");
      sessionStorage.removeItem("sis-pending-email");
      router.replace("/conta?confirmed=1&next=" + encodeURIComponent(next));
      router.refresh();
    } catch {
      setMessage(
        "O código não é válido ou expirou. Confira a mensagem mais recente ou solicite outro email.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <section
      aria-labelledby="verification-title"
      className="card-border mx-auto max-w-xl space-y-6 border-gold p-6"
    >
      <p role="alert" className="text-xs uppercase tracking-widest text-gold">
        Verificação necessária
      </p>
      <h1 id="verification-title" className="font-display text-4xl">
        Confirme seu email para continuar
      </h1>
      <p>
        Abra a mensagem e use o botão <strong>Confirmar meu email</strong>. Se
        ela mostrar um código, digite-o abaixo. Esta etapa protege sua conta e
        libera o acesso ao Jornal SIS.
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
        <button className="sis-button" disabled={busy !== null}>
          {busy === "resend" ? "Reenviando…" : "Reenviar email de confirmação"}
        </button>
      </form>
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-zinc-700" />
        <span className="text-xs uppercase tracking-widest text-zinc-400">
          ou use o código
        </span>
        <span className="h-px flex-1 bg-zinc-700" />
      </div>
      <form onSubmit={confirmCode} className="space-y-4">
        <label className="block">
          Código recebido por email
          <input
            className="sis-input mt-2 w-full"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6,10}"
            minLength={6}
            maxLength={10}
            required
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          />
        </label>
        <button className="sis-button" disabled={busy !== null}>
          {busy === "verify" ? "Verificando…" : "Confirmar código"}
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
