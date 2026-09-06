"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { siteUrl } from "@/lib/domain";
export function PasswordHelp({ email: initialEmail = "" }: { email?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <form
      className="card-border space-y-5 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          const { error } = await createClient().auth.resetPasswordForEmail(
            email,
            { redirectTo: siteUrl + "/auth/callback?next=/conta/senha" },
          );
          if (error) throw error;
          setMessage(
            "Se houver uma conta com esse email, enviaremos um link para definir uma nova senha. Confira também o spam.",
          );
        } catch {
          setMessage(
            "Não foi possível enviar agora. Aguarde um minuto e tente novamente. O envio de emails ainda está em configuração.",
          );
        } finally {
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
      <button className="sis-button" disabled={busy}>
        {busy ? "Enviando…" : "Enviar link para redefinir senha"}
      </button>
      <p role="status" className="text-gold">
        {message}
      </p>
    </form>
  );
}
