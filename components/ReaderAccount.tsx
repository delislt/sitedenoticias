"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { command } from "@/lib/client-api";
import { type Access, can, siteUrl } from "@/lib/domain";
import { EmailSecondFactor } from "@/components/EmailSecondFactor";
import { AvatarEditor } from "@/components/AvatarEditor";
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
  async function google() {
    setBusy(true);
    setMessage("");
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: siteUrl + "/auth/callback?next=" + encodeURIComponent(next),
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setMessage("Não foi possível abrir o Google. Tente novamente.");
      setBusy(false);
    }
  }
  async function resend() {
    if (!email.trim()) {
      setMessage("Preencha seu email para reenviar a confirmação.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await createClient().auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: siteUrl + "/auth/callback" },
      });
      if (error) throw error;
      setMessage(
        "Se houver um cadastro pendente, você receberá uma nova confirmação. Use somente o email mais recente.",
      );
    } catch {
      setMessage(
        "Não foi possível reenviar agora. Aguarde um minuto e tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
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
  if (access.user_id && !access.verified)
    return (
      <EmailSecondFactor
        next={next}
        primaryValid={access.primary_valid === true}
      />
    );
  return (
    <div className="mx-auto max-w-xl space-y-6">
      {access.user_id ? (
        <>
          <div className="card-border space-y-3 p-6">
            <h2 className="font-display text-3xl">Login concluído</h2>
            <p>Seu email está confirmado e sua conta está pronta para usar.</p>
            <Link href={next} className="sis-button inline-block">
              {next.startsWith("/admin")
                ? "Continuar para o painel"
                : "Continuar no Jornal SIS"}
            </Link>
          </div>
          {access.email_otp_verified ? (
            <p className="text-sm text-gold">
              Código por email confirmado nesta sessão.
            </p>
          ) : (
            <details className="card-border p-5">
              <summary>Verificação adicional por código de email</summary>
              <p className="my-4 text-sm text-zinc-400">
                O envio está em configuração e pode não estar disponível para
                todos os emails.
              </p>
              <EmailSecondFactor
                next={next}
                primaryValid={access.primary_valid === true}
              />
            </details>
          )}
          {access.verified ? (
            <form onSubmit={save} className="card-border space-y-4 p-5">
              <h2 className="font-display text-2xl">Seu perfil</h2>
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
          <AvatarEditor />
          <Link href="/conta/senha" className="sis-button inline-block">
            Alterar senha
          </Link>
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
          <button
            type="button"
            disabled={busy}
            onClick={() => void google()}
            className="sis-button w-full"
          >
            Continuar com Google
          </button>
          <p className="text-center text-sm text-zinc-400">
            ou use seu email e senha
          </p>
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
          <Link href="/conta/esqueci-senha" className="block text-sm underline">
            Esqueci minha senha
          </Link>
          <p className="text-sm text-zinc-400">
            No cadastro por email, confirme o endereço recebido na sua caixa de
            entrada antes do primeiro login.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void resend()}
            className="text-sm underline"
          >
            Reenviar confirmação do cadastro
          </button>
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
