"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
export function PasswordEditor({
  currentRequired,
}: {
  currentRequired: boolean;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [current, setCurrent] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  if (done)
    return (
      <section className="card-border space-y-5 p-6">
        <h2 className="font-display text-3xl">Senha alterada</h2>
        <p>Sua nova senha foi salva. Entre novamente para continuar.</p>
        <Link href="/conta" className="sis-button inline-block">
          Entrar com a nova senha
        </Link>
      </section>
    );
  return (
    <form
      className="card-border space-y-5 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (password !== confirmation) {
          setMessage("As duas senhas precisam ser iguais.");
          return;
        }
        setBusy(true);
        setMessage("");
        try {
          const db = createClient();
          const { error } = await db.auth.updateUser({
            password,
            ...(currentRequired ? { current_password: current } : {}),
          });
          if (error) throw error;
          setPassword("");
          setConfirmation("");
          setCurrent("");
          await db.auth.signOut();
          setDone(true);
        } catch {
          setMessage(
            "Não foi possível alterar a senha. Confira a senha atual, use uma nova senha diferente e com ao menos 12 caracteres, ou solicite outro link de recuperação.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {currentRequired ? (
        <label className="block">
          Senha atual
          <input
            className="sis-input mt-2 w-full"
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>
      ) : null}
      <label className="block">
        Nova senha
        <input
          className="sis-input mt-2 w-full"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <label className="block">
        Repita a nova senha
        <input
          className="sis-input mt-2 w-full"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
      </label>
      <p className="text-sm text-zinc-400">
        Use pelo menos 12 caracteres. Após salvar, você precisará entrar
        novamente.
      </p>
      <button disabled={busy} className="sis-button">
        {busy ? "Salvando…" : "Salvar nova senha"}
      </button>
      <p role="status" className="text-gold">
        {message}
      </p>
      <Link href="/conta/esqueci-senha" className="block text-sm underline">
        Não lembro minha senha atual
      </Link>
    </form>
  );
}
