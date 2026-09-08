"use client";
import { useEffect, useRef, useState } from "react";
import type HCaptcha from "@hcaptcha/react-hcaptcha";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { siteUrl } from "@/lib/domain";
import { AuthCaptcha } from "@/components/AuthCaptcha";

export function EmailVerification({
  initialEmail,
  next,
  postSignup,
}: {
  initialEmail: string;
  next: string;
  postSignup: boolean;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const submittingRef = useRef(false);
  const [cooldown, setCooldown] = useState(postSignup ? 60 : 0);
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
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(
      () => setCooldown((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);
  async function resend(event: React.FormEvent) {
    event.preventDefault();
    if (submittingRef.current) return;
    if (cooldown > 0) return;
    if (!email.trim()) {
      setMessage("Informe o email usado no cadastro.");
      return;
    }
    if (!captchaToken) {
      setMessage("Conclua a verificação de segurança.");
      return;
    }
    submittingRef.current = true;
    const currentCaptchaToken = captchaToken;
    setCaptchaToken(null);
    setCooldown(60);
    setBusy(true);
    setMessage("");
    try {
      const { error } = await createClient().auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: siteUrl + "/conta?next=" + encodeURIComponent(next),
          captchaToken: currentCaptchaToken,
        },
      });
      if (error) throw error;
      sessionStorage.setItem("sis-pending-email", email.trim());
      setMessage(
        "Email reenviado. Use somente a mensagem mais recente e confira também a pasta de spam.",
      );
    } catch (error) {
      const details = error as {
        code?: string;
        message?: string;
        status?: number;
      };
      setMessage(
        details.code === "captcha_failed" ||
          /captcha|security verification/i.test(details.message || "")
          ? "A verificação de segurança expirou ou não foi aceita. Tente novamente."
          : details.status === 429 ||
              details.code === "over_email_send_rate_limit"
            ? "O limite temporário de emails foi atingido. Tente novamente mais tarde."
            : details.code === "email_address_not_authorized"
              ? "O envio de confirmação não está disponível para este email."
              : "Não foi possível reenviar agora. Aguarde um minuto e tente novamente.",
      );
    } finally {
      captchaRef.current?.resetCaptcha();
      submittingRef.current = false;
      setBusy(false);
    }
  }
  return (
    <section
      aria-labelledby="verification-title"
      className="card-border mx-auto max-w-xl space-y-6 border-gold p-6"
    >
      <h1 id="verification-title" className="font-display text-4xl">
        {postSignup
          ? "Confirme seu e-mail"
          : "Solicite outro e-mail de confirmação"}
      </h1>
      {postSignup ? (
        <p>
          Enviamos o link para <strong>{email || "seu email"}</strong>. Abra a
          mensagem e confirme o cadastro.
        </p>
      ) : (
        <p>Informe o email do cadastro para receber um novo link.</p>
      )}
      <form onSubmit={resend} className="space-y-4">
        {!postSignup ? (
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
        ) : null}
        <AuthCaptcha
          captchaRef={captchaRef}
          onVerify={setCaptchaToken}
          onInvalidate={(failed) => {
            setCaptchaToken(null);
            if (failed)
              setMessage(
                "Não foi possível carregar a verificação de segurança. Tente novamente.",
              );
          }}
        />
        <button
          className="sis-button"
          disabled={busy || !captchaToken || cooldown > 0 || !email.trim()}
        >
          {busy
            ? "Reenviando…"
            : cooldown > 0
              ? `Reenviar em ${cooldown}s`
              : "Reenviar e-mail"}
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
