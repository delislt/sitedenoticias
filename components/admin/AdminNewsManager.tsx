/* eslint-disable @next/next/no-img-element -- Private previews need session cookies; article images retain their natural proportions. */
"use client";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import type { DbArticle } from "@/lib/supabase-articles";
import type { Access, Edition } from "@/lib/domain";
import { can, statusLabels, kindLabels, formatDate } from "@/lib/domain";
import { categoryLabels } from "@/data/news";
import { ApiError, command, readApi, uploadFile } from "@/lib/client-api";
import { validateClientVideo } from "@/lib/client-video";
export function AdminNewsManager({
  access,
  editions,
}: {
  access: Access;
  editions: Edition[];
}) {
  const [items, setItems] = useState<DbArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState<Partial<DbArticle> | null>(null);
  const [body, setBody] = useState("");
  const [sources, setSources] = useState("");
  const [tags, setTags] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [uploadKind, setUploadKind] = useState<"image" | "video">("image");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [history, setHistory] = useState<
    {
      id: number;
      created_at: string;
      actor_id: string;
      action: string;
      after_data: DbArticle;
    }[]
  >([]);
  const operation = useRef<string | null>(null);
  const deleteOperation = useRef<string | null>(null);
  const editor = can(access, "editor");
  const load = useCallback(
    async (signal?: AbortSignal) => {
      const r = await readApi<{ items: DbArticle[]; total: number }>(
        "/api/admin/articles?" +
          new URLSearchParams({ page: String(page), q, status }),
        signal,
      );
      setItems(r.items);
      setLoaded(true);
      setLoadError(false);
      setTotal(r.total);
    },
    [page, q, status],
  );
  useEffect(() => {
    const c = new AbortController();
    const timeout = setTimeout(
      () =>
        load(c.signal).catch((e) => {
          if (!c.signal.aborted) {
            setMessage(e.message);
            setLoadError(true);
          }
        }),
      250,
    );
    return () => {
      clearTimeout(timeout);
      c.abort();
    };
  }, [load]);
  useEffect(() => {
    if (!dirty) return;
    const leave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [dirty]);
  function field(key: keyof DbArticle, value: unknown) {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
    operation.current = null;
  }
  function select(a: Partial<DbArticle>) {
    setUploadKind(a.cover_media_type || "image");
    setDraft(a);
    setBody(a.content?.paragraphs.join("\n\n") || "");
    setSources(a.sources?.map((s) => s.title + " | " + s.url).join("\n") || "");
    setTags(a.tags?.join(", ") || "");
    setDirty(false);
    setHistory([]);
    setDeletePending(false);
    operation.current = null;
    deleteOperation.current = null;
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setMessage("");
    setNeedsLogin(false);
    operation.current ||= crypto.randomUUID();
    try {
      const content = {
        paragraphs: body
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean),
      };
      const sourceList = sources
        .split("\n")
        .filter((s) => s.trim())
        .map((s) => {
          const n = s.indexOf("|");
          return { title: s.slice(0, n).trim(), url: s.slice(n + 1).trim() };
        });
      const submitted = {
        ...draft,
        content,
        sources: sourceList,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      const result = await command<{ id: string; version: number }>(
        "article.save",
        submitted,
        operation.current,
      );
      // A confirmed write must not become a save failure if refreshing the list fails.
      select({ ...submitted, ...result });
      const success =
        "Matéria salva. Estado: " +
        statusLabels[submitted.status || "draft"] +
        ".";
      setMessage(success);
      try {
        await load();
      } catch {
        setLoadError(true);
        setMessage(
          success +
            " Não foi possível atualizar a lista. Use Atualizar lista para conferir.",
        );
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setNeedsLogin(true);
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function removeArticle() {
    if (!draft?.id || !draft.title || !draft.version) return;
    setBusy(true);
    setMessage("");
    deleteOperation.current ||= crypto.randomUUID();
    try {
      await command(
        "article.delete",
        {
          id: draft.id,
          version: draft.version,
          confirmation: draft.title,
        },
        deleteOperation.current,
      );
      setDraft(null);
      setBody("");
      setSources("");
      setTags("");
      setDirty(false);
      setHistory([]);
      setDeletePending(false);
      operation.current = null;
      deleteOperation.current = null;
      setMessage("Matéria apagada.");
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end gap-4">
        <label>
          Buscar no painel
          <input
            className="sis-input mt-2 block"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            maxLength={100}
          />
        </label>
        <label>
          Estado
          <select
            className="sis-input mt-2 block"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={dirty || busy}
          className="sis-button"
          onClick={() =>
            select({
              title: "",
              subtitle: "",
              category: "juridico",
              author: "",
              status: "draft",
              kind: "simulation",
              edition_id: editions[0]?.id,
              comments_open: true,
              cover_image: "",
            })
          }
        >
          Nova matéria
        </button>
        <button
          type="button"
          disabled={busy}
          className="sis-button"
          onClick={() =>
            load().catch((e) => {
              setMessage(e.message);
              setLoadError(true);
            })
          }
        >
          Atualizar lista
        </button>
      </div>
      <p role="status" aria-live="polite" className="text-gold">
        {message}
      </p>
      {needsLogin ? (
        <p className="card-border p-4">
          Seu texto continua neste formulário.{" "}
          <a
            href="/admin/login"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold underline"
          >
            Entrar novamente em outra aba
          </a>
          . Depois, volte a esta aba e clique em Salvar matéria.
        </p>
      ) : null}
      {dirty ? (
        <p className="card-border p-4 text-gold">
          Há alterações não salvas. Salve antes de trocar de matéria ou{" "}
          <button
            className="underline"
            onClick={() => {
              setDirty(false);
              setDraft(null);
            }}
          >
            descarte as alterações
          </button>
          .
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          <h2 className="font-display text-xl">Matérias ({total})</h2>
          {!loaded && !loadError ? (
            <p role="status">Carregando registros…</p>
          ) : null}
          {loaded && !loadError && !items.length ? (
            <p className="text-sm text-zinc-400">
              Nenhuma matéria nesta consulta.
            </p>
          ) : null}
          {items.map((a) => (
            <button
              key={a.id}
              disabled={dirty || busy}
              className="card-border block w-full space-y-2 p-4 text-left"
              onClick={async () => {
                try {
                  select(
                    await readApi<DbArticle>("/api/admin/articles?id=" + a.id),
                  );
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
            >
              <span className="text-xs text-gold">
                {statusLabels[a.status]}
              </span>
              <strong className="block">{a.title}</strong>
              <span className="text-xs text-zinc-400">
                {formatDate(a.updated_at)}
              </span>
            </button>
          ))}
          <div className="flex items-center justify-between gap-2">
            <button
              disabled={page === 1 || dirty}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Anterior
            </button>
            <span>{page}</span>
            <button
              disabled={page * 20 >= total || dirty}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima →
            </button>
          </div>
        </aside>
        {draft ? (
          <form onSubmit={save} className="card-border p-5 sm:p-7">
            <fieldset disabled={busy} className="min-w-0 space-y-5">
              <div className="flex flex-wrap justify-between gap-4">
                <h2 className="font-display text-3xl">
                  {draft.id ? "Editar matéria" : "Novo rascunho"}
                </h2>
                {draft.id ? (
                  <Link
                    className="text-gold underline"
                    target="_blank"
                    href={"/admin/previa/" + draft.id}
                  >
                    Prévia protegida
                  </Link>
                ) : null}
              </div>
              <label className="block">
                Título
                <input
                  className="sis-input mt-2 w-full"
                  required
                  minLength={5}
                  maxLength={180}
                  value={draft.title || ""}
                  onChange={(e) => field("title", e.target.value)}
                />
              </label>
              <label className="block">
                Resumo
                <textarea
                  className="sis-input mt-2 w-full"
                  maxLength={500}
                  value={draft.subtitle || ""}
                  onChange={(e) => field("subtitle", e.target.value)}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  Comitê
                  <select
                    className="sis-input mt-2 w-full"
                    value={draft.category}
                    onChange={(e) => field("category", e.target.value)}
                  >
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                Autoria exibida
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  className="sis-input mt-2 w-full"
                  value={draft.author || ""}
                  onChange={(e) => field("author", e.target.value)}
                />
              </label>
              <label className="block">
                Tipo de conteúdo
                <select
                  className="sis-input mt-2 w-full"
                  value={draft.kind || "simulation"}
                  onChange={(e) => field("kind", e.target.value)}
                >
                  {Object.entries(kindLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                Texto da matéria
                <textarea
                  rows={14}
                  required
                  maxLength={150000}
                  className="sis-input mt-2 w-full"
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    setDirty(true);
                    operation.current = null;
                  }}
                />
                <span className="text-xs text-zinc-400">
                  Separe os parágrafos com uma linha em branco. Apenas texto.
                </span>
              </label>
              <label className="block">
                Tags (até 12, separadas por vírgula)
                <input
                  className="sis-input mt-2 w-full"
                  maxLength={492}
                  value={tags}
                  onChange={(e) => {
                    setTags(e.target.value);
                    setDirty(true);
                    operation.current = null;
                  }}
                />
              </label>
              <label className="block">
                Fontes (uma por linha: título | https://…)
                <textarea
                  rows={3}
                  className="sis-input mt-2 w-full"
                  value={sources}
                  onChange={(e) => {
                    setSources(e.target.value);
                    setDirty(true);
                    operation.current = null;
                  }}
                />
              </label>
              <label className="block">
                Mídia da matéria
                <select
                  className="sis-input mt-2 w-full"
                  value={uploadKind}
                  onChange={(e) =>
                    setUploadKind(e.target.value as "image" | "video")
                  }
                >
                  <option value="image">Imagem</option>
                  <option value="video">Vídeo</option>
                </select>
              </label>
              <label className="block">
                {uploadKind === "video"
                  ? "Vídeo MP4 (H.264 ou HEVC/H.265) · até 30 MB · sem limite de duração"
                  : "Imagem · JPEG, PNG ou WebP · até 15 MB"}
                <input
                  type="file"
                  accept={
                    uploadKind === "video"
                      ? "video/mp4,.mp4"
                      : "image/jpeg,image/png,image/webp"
                  }
                  className="mt-2 block w-full text-sm"
                  disabled={busy}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setBusy(true);
                    try {
                      if (uploadKind === "video")
                        await validateClientVideo(file);
                      const r = await uploadFile(file, uploadKind);
                      field("cover_image", r.url);
                      field("cover_media_type", uploadKind);
                      setMessage(
                        "Mídia validada e enviada. Ela só ficará pública com a matéria.",
                      );
                    } catch (e) {
                      setMessage((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </label>
              {uploadKind === "video" ? (
                <p className="text-sm text-[var(--site-muted)]">
                  A reprodução de HEVC depende do navegador e do aparelho.
                  Para maior compatibilidade, prefira H.264.
                </p>
              ) : null}
              {draft.cover_image ? (
                <div className="space-y-3">
                  {draft.cover_media_type === "video" ? (
                    <video
                      src={draft.cover_image}
                      controls
                      playsInline
                      preload="metadata"
                      aria-label="Prévia do vídeo"
                      className="max-h-60 max-w-full bg-black"
                    />
                  ) : (
                    <img
                      className="max-h-60 max-w-full object-contain"
                      src={draft.cover_image}
                      alt="Prévia da capa"
                    />
                  )}
                  <button
                    type="button"
                    className="text-sm underline"
                    onClick={() => {
                      field("cover_image", "");
                      field("cover_media_type", "image");
                    }}
                  >
                    Remover vínculo da capa
                  </button>
                </div>
              ) : null}
              <label className="block">
                Legenda da mídia
                <textarea
                  className="sis-input mt-2 w-full"
                  maxLength={1000}
                  rows={3}
                  placeholder="Descreva a imagem ou o vídeo e seu contexto."
                  value={draft.image_caption || ""}
                  onChange={(e) => field("image_caption", e.target.value)}
                />
                <span className="mt-1 block text-xs text-zinc-400">
                  A legenda será exibida abaixo da imagem ou do vídeo na
                  matéria.
                </span>
              </label>
              <label className="block">
                Crédito da mídia
                <input
                  className="sis-input mt-2 w-full"
                  maxLength={300}
                  value={draft.image_credit || ""}
                  onChange={(e) => field("image_credit", e.target.value)}
                />
              </label>
              <label className="block">
                Nota pública de correção
                <textarea
                  className="sis-input mt-2 w-full"
                  maxLength={2000}
                  value={draft.correction_note || ""}
                  onChange={(e) => field("correction_note", e.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-5">
                <label>
                  <input
                    type="checkbox"
                    checked={!!draft.featured}
                    onChange={(e) => field("featured", e.target.checked)}
                  />{" "}
                  Destaque
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.comments_open !== false}
                    onChange={(e) => field("comments_open", e.target.checked)}
                  />{" "}
                  Permitir comentários quando a operação global estiver aberta
                </label>
              </div>
              <label className="block">
                Estado de publicação
                <select
                  className="sis-input mt-2 w-full"
                  value={draft.status || "draft"}
                  onChange={(e) => field("status", e.target.value)}
                >
                  {Object.entries(statusLabels)
                    .filter(([k]) => editor || ["draft", "review"].includes(k))
                    .map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                </select>
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button disabled={busy} className="sis-button">
                  {busy ? "Salvando…" : "Salvar matéria"}
                </button>
                {draft.id ? (
                  <button
                    type="button"
                    className="sis-button"
                    onClick={async () => {
                      try {
                        setHistory(
                          await readApi(
                            "/api/admin/dashboard?kind=history&q=" + draft.id,
                          ),
                        );
                      } catch (e) {
                        setMessage((e as Error).message);
                      }
                    }}
                  >
                    Histórico de alterações
                  </button>
                ) : null}
                {draft.id &&
                (editor ||
                  (draft.author_id === access.user_id &&
                    ["draft", "review"].includes(draft.status || "draft"))) ? (
                  <button
                    type="button"
                    className="sis-button sis-button-danger"
                    disabled={busy || dirty}
                    onClick={() => setDeletePending(true)}
                  >
                    Apagar matéria
                  </button>
                ) : null}
              </div>
              {deletePending ? (
                <div
                  role="alert"
                  className="space-y-3 rounded-lg border border-red-800 bg-red-950/30 p-4"
                >
                  <p>
                    Apagar <strong>{draft.title}</strong> permanentemente? Os
                    comentários e favoritos vinculados também serão removidos.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="sis-button sis-button-danger"
                      disabled={busy || dirty}
                      onClick={() => void removeArticle()}
                    >
                      {busy ? "Apagando…" : "Sim, apagar definitivamente"}
                    </button>
                    <button
                      type="button"
                      className="sis-button"
                      disabled={busy}
                      onClick={() => setDeletePending(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}
              {history.map((h) => (
                <details key={h.id} className="border-t border-zinc-800 pt-3">
                  <summary>
                    Revisão {h.after_data.version} · {formatDate(h.created_at)}{" "}
                    · {h.actor_id}
                  </summary>
                  <p className="mt-2 font-semibold">{h.after_data.title}</p>
                  <p className="whitespace-pre-wrap text-sm">
                    {h.after_data.content?.paragraphs.join("\n\n")}
                  </p>
                </details>
              ))}
            </fieldset>
          </form>
        ) : (
          <div className="card-border p-8 text-zinc-400">
            Selecione uma matéria ou crie um rascunho.
          </div>
        )}
      </div>
    </div>
  );
}
