"use client";
import { useEffect, useRef, useState } from "react";
import type HCaptcha from "@hcaptcha/react-hcaptcha";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { command } from "@/lib/client-api";
import { type Access, can, siteUrl } from "@/lib/domain";
import { EmailSecondFactor } from "@/components/EmailSecondFactor";
import { AvatarEditor } from "@/components/AvatarEditor";
import { AuthCaptcha } from "@/components/AuthCaptcha";
export function ReaderAccount({
  access,
  next,
  registration,
  emailVerified,
}: {
  access: Access;
  next: string;
  registration: boolean;
  emailVerified: boolean;
}) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [name, setName] = useState(access.display_name || "");
  const [savedName, setSavedName] = useState(access.display_name || "");
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const submittingRef = useRef(false);
  const [message, setMessage] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  useEffect(() => {
    if (emailVerified) {
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
  }, [emailVerified]);
  useEffect(() => {
    const pendingName = sessionStorage.getItem("sis-pending-display-name");
    if (!access.verified || !pendingName) return;
    sessionStorage.removeItem("sis-pending-display-name");
    void command("profile", { display_name: pendingName })
      .then(() => {
        setName(pendingName);
        setSavedName(pendingName);
        router.refresh();
      })
      .catch(() =>
        sessionStorage.setItem("sis-pending-display-name", pendingName),
      );
  }, [access.verified, router]);
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
  function verificationPage(postSignup = false) {
    return (
      "/conta/verificar-email?next=" +
      encodeURIComponent(next) +
      (postSignup ? "&cadastro=1" : "")
    );
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
  async function auth(e: React.FormEvent) {
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
      const db = createClient();
      if (mode === "signup") {
        const displayName = name.trim();
        if (displayName.length < 2 || displayName.length > 60) {
          setMessage("Informe um nome entre 2 e 60 caracteres.");
          return;
        }
        if (password !== passwordConfirmation) {
          setMessage("As senhas precisam ser iguais.");
          return;
        }
        const { data, error } = await db.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo:
              siteUrl + "/conta?next=" + encodeURIComponent(next),
            captchaToken: currentCaptchaToken,
          },
        });
        if (error) throw error;
        if (data.user?.identities?.length)
          sessionStorage.setItem("sis-pending-display-name", displayName);
        if (!data.user?.email_confirmed_at) {
          rememberPendingEmail();
          router.push(verificationPage(true));
          return;
        }
        clearPendingEmail();
        router.push("/conta?next=" + encodeURIComponent(next));
        router.refresh();
      } else {
        const { data, error } = await db.auth.signInWithPassword({
          email,
          password,
          options: { captchaToken: currentCaptchaToken },
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
    } catch (error) {
      const details = error as {
        code?: string;
        message?: string;
        status?: number;
      };
      const emailLimit =
        details.status === 429 || details.code === "over_email_send_rate_limit";
      const emailUnavailable = details.code === "email_address_not_authorized";
      const captchaError =
        details.code === "captcha_failed" ||
        /captcha|security verification/i.test(details.message || "");
      const passwordError =
        mode === "signup" &&
        (details.code === "weak_password" ||
          /password|senha/i.test(details.message || ""));
      setMessage(
        captchaError
          ? "A verificação de segurança expirou ou não foi aceita. Tente novamente."
          : emailLimit
            ? "O limite temporário de emails foi atingido. Tente novamente mais tarde ou continue com o Google."
            : emailUnavailable
              ? "O envio de confirmação não está disponível para este email. Continue com o Google."
              : passwordError
                ? "Use pelo menos 6 caracteres, com letras e números."
                : mode === "signup"
                  ? "Não foi possível criar a conta. Tente novamente."
                  : "Não foi possível entrar. Confira os dados e tente novamente.",
      );
    } finally {
      captchaRef.current?.resetCaptcha();
      submittingRef.current = false;
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const displayName = name.trim();
      await command("profile", { display_name: displayName });
      setName(displayName);
      setSavedName(displayName);
      setMessage("Nome de exibição salvo.");
      router.refresh();
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
          {access.verified ? (
            <form onSubmit={save} className="card-border space-y-4 p-5">
              <h2 className="font-display text-2xl">Seu perfil</h2>
              <div>
                <p className="text-sm text-zinc-400">Nome atual</p>
                <p className="mt-1 text-lg font-semibold">
                  {savedName || "Nome ainda não definido"}
                </p>
              </div>
              <label className="block">
                Alterar nome
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
              <h2
                id="pending-verification-title"
                className="font-display text-2xl"
              >
                E-mail ainda não confirmado
              </h2>
              <p>Solicite um novo link para concluir seu cadastro.</p>
              <Link
                href={verificationPage()}
                className="sis-button inline-block"
              >
                Solicitar novo e-mail de confirmação
              </Link>
            </section>
          ) : null}
          <div className="grid grid-cols-2 gap-3" aria-label="Forma de acesso">
            <button
              type="button"
              className="account-mode-button"
              aria-pressed={mode === "login"}
              onClick={() => {
                setMode("login");
                setCaptchaToken(null);
                captchaRef.current?.resetCaptcha();
              }}
            >
              Entrar
            </button>
            {registration ? (
              <button
                type="button"
                className="account-mode-button"
                aria-pressed={mode === "signup"}
                onClick={() => {
                  setMode("signup");
                  setCaptchaToken(null);
                  captchaRef.current?.resetCaptcha();
                }}
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
            {mode === "signup" ? (
              <label className="block">
                Nome de exibição
                <input
                  className="sis-input mt-2 w-full"
                  autoComplete="nickname"
                  minLength={2}
                  maxLength={60}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            ) : null}
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
                minLength={mode === "signup" ? 6 : 1}
                maxLength={128}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {mode === "signup" ? (
                <span className="mt-2 block text-sm text-zinc-400">
                  Use pelo menos 6 caracteres, com letras e números.
                </span>
              ) : null}
            </label>
            {mode === "signup" ? (
              <label className="block">
                Confirme a senha
                <input
                  className="sis-input mt-2 w-full"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={128}
                  required
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
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
            <button disabled={busy || !captchaToken} className="sis-button">
              {busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
          <Link href="/conta/esqueci-senha" className="block text-sm underline">
            Esqueci minha senha
          </Link>
          {!registration ? (
            <p className="text-sm text-zinc-400">
              Novos cadastros de leitores aguardam a configuração da equipe
              responsável.
            </p>
          ) : null}
          <p className="text-sm text-zinc-400">
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
