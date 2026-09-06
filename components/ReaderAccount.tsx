"use client";
import { useEffect, useState } from "react";
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
  emailVerified,
  confirmationComplete,
}: {
  access: Access;
  next: string;
  registration: boolean;
  emailVerified: boolean;
  confirmationComplete: boolean;
}) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(access.display_name || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  useEffect(() => {
    if (emailVerified || confirmationComplete) {
      localStorage.removeItem("sis-email-verification-pending");
      sessionStorage.removeItem("sis-pending-email");
      const timer = window.setTimeout(() => setPendingVerification(false), 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(
      () =>
        setPendingVerification(
          localStorage.getItem("sis-email-verification-pending") === "1",
        ),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [confirmationComplete, emailVerified]);
  function rememberPendingEmail() {
    localStorage.setItem("sis-email-verification-pending", "1");
    sessionStorage.setItem("sis-pending-email", email.trim());
    setPendingVerification(true);
  }
  function clearPendingEmail() {
    localStorage.removeItem("sis-email-verification-pending");
    sessionStorage.removeItem("sis-pending-email");
    setPendingVerification(false);
  }
  function verificationPage() {
    return "/conta/verificar-email?next=" + encodeURIComponent(next);
  }
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
        const { data, error } = await db.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              siteUrl + "/auth/callback?next=" + encodeURIComponent(next),
          },
        });
        if (error) throw error;
        if (!data.user?.email_confirmed_at) {
          rememberPendingEmail();
          router.push(verificationPage());
          return;
        }
        clearPendingEmail();
        router.push("/conta?next=" + encodeURIComponent(next));
        router.refresh();
      } else {
        const { data, error } = await db.auth.signInWithPassword({
          email,
          password,
        });
        if (error?.code === "email_not_confirmed") {
          rememberPendingEmail();
          router.push(verificationPage());
          return;
        }
        if (error) throw error;
        if (!data.user.email_confirmed_at) {
          rememberPendingEmail();
          router.push(verificationPage());
          return;
        }
        clearPendingEmail();
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
          {pendingVerification ? (
            <section
              aria-labelledby="pending-verification-title"
              className="card-border space-y-3 border-gold p-5"
            >
              <p role="alert" className="text-xs uppercase tracking-widest text-gold">
                Verificação necessária
              </p>
              <h2 id="pending-verification-title" className="font-display text-2xl">
                Email ainda pendente
              </h2>
              <p>
                Confirme o endereço enviado para liberar sua conta. Se precisar,
                solicite outro email e retome a verificação.
              </p>
              <Link
                href={verificationPage()}
                className="sis-button inline-block"
              >
                Reenviar ou concluir verificação
              </Link>
            </section>
          ) : null}
          <div className="grid grid-cols-2 gap-3" aria-label="Forma de acesso">
            <button
              type="button"
              className="account-mode-button"
              aria-pressed={mode === "login"}
              onClick={() => setMode("login")}
            >
              Entrar
            </button>
            {registration ? (
              <button
                type="button"
                className="account-mode-button"
                aria-pressed={mode === "signup"}
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
            className="google-button"
          >
            <svg aria-hidden="true" viewBox="0 0 18 18" width="18" height="18">
              <path
                fill="#4285F4"
                d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.716v2.258h2.909c1.702-1.567 2.684-3.874 2.684-6.615Z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.468-.806 5.956-2.18l-2.909-2.258c-.806.54-1.835.859-3.047.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z"
              />
              <path
                fill="#FBBC05"
                d="M3.963 10.707A5.41 5.41 0 0 1 3.682 9c0-.592.102-1.168.281-1.707V4.961H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.039l3.007-2.332Z"
              />
              <path
                fill="#EA4335"
                d="M9 3.579c1.321 0 2.507.454 3.441 1.346l2.581-2.581C13.464.892 11.426 0 9 0A9 9 0 0 0 .956 4.961l3.007 2.332C4.672 5.164 6.656 3.579 9 3.579Z"
              />
            </svg>
            <span>Continuar com Google</span>
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
