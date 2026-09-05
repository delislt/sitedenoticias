"use client";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import type { Access, Comment, Settings } from "@/lib/domain";
import { formatDate } from "@/lib/domain";
import { readApi, command } from "@/lib/client-api";
type Result = {
  items: Comment[];
  own: Comment[];
  total: number;
  settings: Settings;
  focus: Comment | null;
};
export function Comments({
  articleId,
  slug,
  open,
  focusId,
}: {
  articleId: string;
  slug: string;
  open: boolean;
  focusId?: string;
}) {
  const [data, setData] = useState<Result | null>(null);
  const [access, setAccess] = useState<Access>({ user_id: null, roles: [] });
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState("newest");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState<Comment | null>(null);
  const [edit, setEdit] = useState<Comment | null>(null);
  const [report, setReport] = useState<Comment | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const operation = useRef<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      const [comments, a] = await Promise.all([
        readApi<Result>(
          "/api/comments?" +
            new URLSearchParams({
              article: articleId,
              page: String(page),
              order,
              focus: focusId || "",
            }),
          signal,
        ),
        readApi<Access>("/api/account", signal),
      ]);
      setData(comments);
      setAccess(a);
      setError("");
    },
    [articleId, page, order, focusId],
  );
  useEffect(() => {
    const c = new AbortController();
    Promise.all([
      readApi<Result>(
        "/api/comments?" +
          new URLSearchParams({
            article: articleId,
            page: String(page),
            order,
            focus: focusId || "",
          }),
        c.signal,
      ),
      readApi<Access>("/api/account", c.signal),
    ])
      .then(([r, a]) => {
        setData(r);
        setAccess(a);
        setError("");
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [articleId, page, order, focusId]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    operation.current ||= crypto.randomUUID();
    try {
      await command(
        edit ? "comment.edit" : "comment.create",
        edit
          ? { id: edit.id, version: edit.version, body }
          : { article_id: articleId, parent_id: reply?.id || null, body },
        operation.current,
      );
      setBody("");
      setReply(null);
      setEdit(null);
      operation.current = null;
      setMessage(
        "Comentário recebido. Acompanhe abaixo o estado da publicação.",
      );
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Falha no envio.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(c: Comment) {
    setBusy(true);
    try {
      await command("comment.remove", { id: c.id, version: c.version });
      setMessage("Seu comentário foi removido.");
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function reportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!report) return;
    setBusy(true);
    try {
      await command("comment.report", { id: report.id, reason });
      setReport(null);
      setReason("");
      setMessage("Denúncia enviada em caráter privado à moderação.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function changeText(value: string) {
    setBody(value);
    operation.current = null;
  }
  function comment(c: Comment, own = false) {
    return (
      <article
        id={"comentario-" + c.id}
        key={c.id}
        className={
          "card-border scroll-mt-40 space-y-3 p-5 " +
          (c.parent_id ? "sm:ml-8" : "")
        }
      >
        {c.parent_id ? (
          <p className="text-xs text-zinc-400">
            Em resposta a{" "}
            <a
              className="underline"
              href={"?comment=" + c.parent_id + "#comentario-" + c.parent_id}
            >
              um comentário desta matéria
            </a>
            . Se removido, seu texto fica indisponível.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <strong>{c.display_name}</strong>
          {c.team_badge ? (
            <span className="text-xs text-gold">Equipe SIS</span>
          ) : null}
          <time className="text-xs text-zinc-400" dateTime={c.created_at}>
            {formatDate(c.created_at)}
          </time>
          {c.edited_at ? (
            <span className="text-xs text-zinc-400">Editado</span>
          ) : null}
        </div>
        {own && c.status !== "approved" ? (
          <p className="text-sm text-gold">
            {c.status === "pending"
              ? "Aguardando moderação · visível apenas para você"
              : "Não aprovado pela moderação"}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap break-words">{c.body}</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <a
            className="text-zinc-400 underline"
            href={"?comment=" + c.id + "#comentario-" + c.id}
          >
            Link direto
          </a>
          {!c.parent_id &&
          c.status === "approved" &&
          access.verified &&
          open ? (
            <button
              disabled={busy}
              className="text-gold"
              onClick={() => {
                setReply(c);
                setEdit(null);
                changeText("");
                input.current?.focus();
              }}
            >
              Responder
            </button>
          ) : null}
          {own ? (
            <>
              <button
                disabled={
                  busy ||
                  now - Date.parse(c.created_at) > 900000 ||
                  !["pending", "approved"].includes(c.status)
                }
                onClick={() => {
                  setEdit(c);
                  setReply(null);
                  changeText(c.body);
                  input.current?.focus();
                }}
              >
                Editar (15 min)
              </button>
              <button disabled={busy} onClick={() => remove(c)}>
                Remover meu comentário
              </button>
            </>
          ) : access.verified ? (
            <button
              disabled={busy}
              onClick={() => {
                setReport(c);
                setReason("");
              }}
            >
              Denunciar
            </button>
          ) : null}
        </div>
      </article>
    );
  }
  const ids = new Set(data?.own.map((c) => c.id) || []);
  const enabled =
    open && data?.settings.comments_enabled && data.settings.moderation_ready;
  return (
    <section
      className="no-print space-y-6 border-t border-zinc-800 pt-10"
      aria-labelledby="comments-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="comments-heading" className="font-display text-3xl">
          Comentários{data ? " (" + data.total + ")" : ""}
        </h2>
        <label className="text-sm">
          Ordenar{" "}
          <select
            className="sis-input ml-2"
            value={order}
            onChange={(e) => {
              setOrder(e.target.value);
              setPage(1);
            }}
          >
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
          </select>
        </label>
      </div>
      {error ? (
        <p role="alert">
          {error}{" "}
          <button
            className="underline"
            onClick={() => load().catch((e) => setError(e.message))}
          >
            Tentar novamente
          </button>
        </p>
      ) : !data ? (
        <p role="status">Carregando comentários…</p>
      ) : null}
      {enabled ? (
        access.verified && !access.suspended ? (
          <form className="card-border space-y-4 p-5" onSubmit={submit}>
            <p className="text-sm text-zinc-400">
              Respeite as pessoas. Debata ideias com argumentos. Não publique
              dados pessoais, ofensas ou informações de colegas.{" "}
              <Link href="/convivencia" className="underline">
                Regras de convivência
              </Link>
              .
            </p>
            {!access.display_name ? (
              <p>
                Defina seu nome de exibição em{" "}
                <Link
                  href={"/conta?next=/artigo/" + slug}
                  className="text-gold underline"
                >
                  Sua conta
                </Link>
                .
              </p>
            ) : null}
            {reply || edit ? (
              <p className="text-sm text-gold">
                {edit
                  ? "Editando seu comentário"
                  : "Respondendo a " + reply?.display_name}{" "}
                <button
                  type="button"
                  className="ml-3 underline"
                  onClick={() => {
                    setReply(null);
                    setEdit(null);
                    changeText("");
                  }}
                >
                  Cancelar
                </button>
              </p>
            ) : null}
            <label className="block" htmlFor="comment-body">
              Seu comentário
            </label>
            <textarea
              ref={input}
              id="comment-body"
              required
              maxLength={2000}
              rows={4}
              className="sis-input w-full"
              value={body}
              onChange={(e) => changeText(e.target.value)}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-zinc-400">
                {body.length}/2.000 ·{" "}
                {data?.settings.premoderation || edit
                  ? "Revisão antes da publicação"
                  : "Moderação posterior"}
              </span>
              <button
                disabled={busy || !access.display_name}
                className="sis-button"
              >
                {busy
                  ? "Enviando…"
                  : edit
                    ? "Enviar edição para revisão"
                    : "Enviar comentário"}
              </button>
            </div>
          </form>
        ) : (
          <div className="card-border p-5">
            {access.suspended ? (
              "Sua participação está temporariamente suspensa."
            ) : (
              <p>
                Para participar,{" "}
                <Link
                  href={"/conta?next=" + encodeURIComponent("/artigo/" + slug)}
                  className="text-gold underline"
                >
                  entre com uma conta verificada
                </Link>
                .
              </p>
            )}
          </div>
        )
      ) : data ? (
        <p className="card-border p-5 text-zinc-400">
          Novos comentários estão fechados nesta matéria. Os comentários já
          aprovados continuam disponíveis.
        </p>
      ) : null}
      <p role="status" aria-live="polite" className="text-sm text-gold">
        {message}
      </p>
      {report ? (
        <form onSubmit={reportSubmit} className="card-border space-y-3 p-5">
          <h3 className="font-semibold">
            Denunciar comentário de {report.display_name}
          </h3>
          <label className="block">
            Motivo
            <textarea
              className="sis-input mt-2 w-full"
              minLength={3}
              maxLength={500}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button disabled={busy} className="sis-button">
            Enviar denúncia
          </button>
          <button
            type="button"
            className="ml-4"
            onClick={() => setReport(null)}
          >
            Cancelar
          </button>
        </form>
      ) : null}
      {data?.own.some((c) => c.status !== "approved") ? (
        <div className="space-y-4">
          <h3 className="font-display text-xl">Seus comentários em revisão</h3>
          {data.own
            .filter((c) => c.status !== "approved")
            .map((c) => comment(c, true))}
        </div>
      ) : null}
      {data?.focus && !data.items.some((c) => c.id === data.focus!.id) ? (
        <div className="space-y-3">
          <p className="text-sm text-gold">Comentário acessado pelo link</p>
          {comment(data.focus, ids.has(data.focus.id))}
        </div>
      ) : null}
      {data?.items.map((c) => comment(c, ids.has(c.id)))}
      {data && !data.total ? (
        <p className="text-zinc-400">Ainda não há comentários públicos.</p>
      ) : null}
      {data && data.total > 20 ? (
        <nav
          aria-label="Páginas de comentários"
          className="flex items-center justify-between gap-4"
        >
          <button
            className="sis-button"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          <span>Página {page}</span>
          <button
            className="sis-button"
            disabled={page * 20 >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </button>
        </nav>
      ) : null}
    </section>
  );
}
