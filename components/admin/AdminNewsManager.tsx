/* eslint-disable @next/next/no-img-element -- Private previews need session cookies; article images retain their natural proportions. */
"use client";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import type { DbArticle } from "@/lib/supabase-articles";
import type { Access, Edition } from "@/lib/domain";
import { can, statusLabels, kindLabels, formatDate } from "@/lib/domain";
import { categoryLabels } from "@/data/news";
import { command, readApi, uploadFile } from "@/lib/client-api";
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
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
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
    setDraft(a);
    setBody(a.content?.paragraphs.join("\n\n") || "");
    setSources(a.sources?.map((s) => s.title + " | " + s.url).join("\n") || "");
    setTags(a.tags?.join(", ") || "");
    setDirty(false);
    setHistory([]);
    operation.current = null;
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setMessage("");
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
      const result = await command<{ id: string; version: number }>(
        "article.save",
        {
          ...draft,
          content,
          sources: sourceList,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
        operation.current,
      );
      select(await readApi<DbArticle>("/api/admin/articles?id=" + result.id));
      setMessage(
        "Matéria salva. Estado: " + statusLabels[draft.status || "draft"] + ".",
      );
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
              slug: "",
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
      </div>
      <p role="status" aria-live="polite" className="text-gold">
        {message}
      </p>
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
          <form onSubmit={save} className="card-border space-y-5 p-5 sm:p-7">
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
              Endereço (slug)
              <input
                className="sis-input mt-2 w-full"
                required
                pattern="[a-z0-9][a-z0-9-]{0,149}"
                maxLength={150}
                value={draft.slug || ""}
                onChange={(e) => field("slug", e.target.value)}
              />
              <span className="text-xs text-zinc-400">
                Letras minúsculas sem acentos e hífens. Endereços antigos
                continuarão redirecionando.
              </span>
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
              <label>
                Edição
                <select
                  required
                  className="sis-input mt-2 w-full"
                  value={draft.edition_id || ""}
                  onChange={(e) => field("edition_id", e.target.value)}
                >
                  <option value="">Selecione</option>
                  {editions.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.title}
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
              Imagem da matéria · JPEG, PNG ou WebP · até 4 MB
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-2 block w-full text-sm"
                disabled={busy}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setBusy(true);
                  try {
                    const r = await uploadFile(file);
                    field("cover_image", r.url);
                    setMessage(
                      "Imagem validada e enviada. Ela só ficará pública com a matéria.",
                    );
                  } catch (e) {
                    setMessage((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </label>
            {draft.cover_image ? (
              <div className="space-y-3">
                <img
                  className="max-h-60 max-w-full object-contain"
                  src={draft.cover_image}
                  alt="Prévia da capa"
                />
                <button
                  type="button"
                  className="text-sm underline"
                  onClick={() => field("cover_image", "")}
                >
                  Remover vínculo da capa
                </button>
              </div>
            ) : null}
            <label className="block">
              Crédito da imagem
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
            <button disabled={busy} className="sis-button">
              {busy ? "Salvando…" : "Salvar matéria"}
            </button>
            {draft.id ? (
              <button
                type="button"
                className="ml-4 underline"
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
            {history.map((h) => (
              <details key={h.id} className="border-t border-zinc-800 pt-3">
                <summary>
                  Revisão {h.after_data.version} · {formatDate(h.created_at)} ·{" "}
                  {h.actor_id}
                </summary>
                <p className="mt-2 font-semibold">{h.after_data.title}</p>
                <p className="whitespace-pre-wrap text-sm">
                  {h.after_data.content?.paragraphs.join("\n\n")}
                </p>
              </details>
            ))}
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
