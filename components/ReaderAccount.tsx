"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { command } from "@/lib/client-api";
import { type Access, can, siteUrl } from "@/lib/domain";
export function ReaderAccount({
  access,
  next,
  registration,
}: {
  access: Access;
  next: string;
  registration: boolean;
}) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(access.display_name || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function auth(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const db = createClient();
      if (mode === "signup") {
        const { error } = await db.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              siteUrl + "/auth/callback?next=" + encodeURIComponent(next),
          },
        });
        if (error) throw error;
        setMessage(
          "Confira seu email para verificar a conta. Depois, entre e escolha seu nome de exibição.",
        );
      } else {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/conta?next=" + encodeURIComponent(next));
        router.refresh();
      }
    } catch {
      setMessage(
        "Não foi possível concluir. Confira os dados, a verificação do email e tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await command("profile", { display_name: name });
      setMessage("Nome de exibição salvo.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-xl space-y-6">
      {access.user_id ? (
        <>
          <p>
            Você está conectado
            {access.verified
              ? " com uma conta verificada"
              : ". Confirme seu email para participar"}
            .
          </p>
          {access.verified ? (
            <form onSubmit={save} className="card-border space-y-4 p-5">
              <label className="block">
                Nome de exibição
                <input
                  className="sis-input mt-2 w-full"
                  minLength={2}
                  maxLength={60}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <p className="text-sm text-zinc-400">
                Um apelido é suficiente. Seu email não aparece nos comentários.
              </p>
              <button disabled={busy} className="sis-button">
                Salvar nome
              </button>
            </form>
          ) : null}
          <p className="break-all text-xs text-zinc-400">
            Identificador privado da sua conta: {access.user_id}
          </p>
          <details className="card-border space-y-4 p-5">
            <summary>Meus dados e contribuições</summary>
            <a href="/api/account/export" className="block text-gold underline">
              Baixar meus dados
            </a>
            <p className="text-sm">
              A remoção apaga seus comentários, favoritos sincronizados, nome de
              exibição e sugestões privadas. A conta de autenticação é
              preservada. Para confirmar, escreva APAGAR MINHAS CONTRIBUIÇÕES.
            </p>
            <input
              aria-label="Confirmação de remoção"
              className="sis-input w-full"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
            <button
              className="sis-button"
              disabled={confirmation !== "APAGAR MINHAS CONTRIBUIÇÕES"}
              onClick={async () => {
                try {
                  await command("account.erase", { confirmation });
                  setMessage("Contribuições removidas.");
                  setConfirmation("");
                  router.refresh();
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
            >
              Apagar minhas contribuições
            </button>
          </details>
          <div className="flex flex-wrap gap-4">
            <Link href={next} className="sis-button">
              Continuar a leitura
            </Link>
            {can(access, "journalist", "editor", "moderator") ? (
              <Link href="/admin" className="sis-button">
                Abrir painel da equipe
              </Link>
            ) : null}
            <button
              onClick={async () => {
                await createClient().auth.signOut();
                router.push("/conta");
                router.refresh();
              }}
              className="underline"
            >
              Sair
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-4">
            <button
              className={mode === "login" ? "text-gold underline" : ""}
              onClick={() => setMode("login")}
            >
              Entrar
            </button>
            {registration ? (
              <button
                className={mode === "signup" ? "text-gold underline" : ""}
                onClick={() => setMode("signup")}
              >
                Criar conta de leitor
              </button>
            ) : null}
          </div>
          <form onSubmit={auth} className="card-border space-y-5 p-6">
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
            <label className="block">
              Senha
              <input
                className="sis-input mt-2 w-full"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={mode === "signup" ? 12 : 1}
                maxLength={128}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button disabled={busy} className="sis-button">
              {busy
                ? "Aguarde…"
                : mode === "login"
                  ? "Entrar"
                  : "Criar conta e verificar email"}
            </button>
          </form>
          {!registration ? (
            <p className="text-sm text-zinc-400">
              Novos cadastros de leitores aguardam a configuração da equipe
              responsável.
            </p>
          ) : null}
          <p className="text-sm text-zinc-400">
            Seu email é usado para autenticação. Não pedimos telefone, data de
            nascimento nem delegação.{" "}
            <Link href="/privacidade" className="underline">
              Leia sobre privacidade
            </Link>
            .
          </p>
        </>
      )}
      <p role="status" aria-live="polite" className="text-gold">
        {message}
      </p>
    </div>
  );
}
