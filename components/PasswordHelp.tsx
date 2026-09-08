"use client";
import { useRef, useState } from "react";
import type HCaptcha from "@hcaptcha/react-hcaptcha";
import { createClient } from "@/utils/supabase/client";
import { siteUrl } from "@/lib/domain";
import { AuthCaptcha } from "@/components/AuthCaptcha";
export function PasswordHelp({ email: initialEmail = "" }: { email?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const submittingRef = useRef(false);
  return (
    <form
      className="card-border space-y-5 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (submittingRef.current) return;
        if (!captchaToken) {
          setMessage("Conclua a verificação de segurança.");
          return;
        }
        submittingRef.current = true;
        const currentCaptchaToken = captchaToken;
        setCaptchaToken(null);
        setBusy(true);
        setMessage("");
        try {
          const { error } = await createClient().auth.resetPasswordForEmail(
            email,
            {
              redirectTo: siteUrl + "/conta/senha",
              captchaToken: currentCaptchaToken,
            },
          );
          if (error) throw error;
          setMessage(
            "Se houver uma conta com esse email, enviaremos um link para definir uma nova senha. Confira também o spam.",
          );
        } catch (error) {
          const details = error as { code?: string; message?: string };
          setMessage(
            details.code === "captcha_failed" ||
              /captcha|security verification/i.test(details.message || "")
              ? "A verificação de segurança expirou ou não foi aceita. Tente novamente."
              : "Não foi possível enviar agora. Aguarde um minuto e tente novamente.",
          );
        } finally {
          captchaRef.current?.resetCaptcha();
          submittingRef.current = false;
          setBusy(false);
        }
      }}
    >
      <p>
        Informe o email da conta para receber um link seguro de recuperação.
      </p>
      <label className="block">
        Email
        <input
          className="sis-input mt-2 w-full"
          autoComplete="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
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
      <button className="sis-button" disabled={busy || !captchaToken}>
        {busy ? "Enviando…" : "Enviar link para redefinir senha"}
      </button>
      <p role="status" className="text-gold">
        {message}
      </p>
    </form>
  );
}
