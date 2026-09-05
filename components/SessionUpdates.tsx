"use client";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { readApi } from "@/lib/client-api";
import { formatDate } from "@/lib/domain";
type Entry = {
  id: string;
  body: string;
  author: string;
  created_at: string;
  updated_at: string;
  correction_note: string;
  article: { slug: string; title: string } | null;
};
type Result = { items: Entry[]; total: number };
const stamp = (entry?: Entry) =>
  entry ? entry.id + ":" + entry.updated_at : "";
export function SessionUpdates({ id, live }: { id: string; live: boolean }) {
  const [items, setItems] = useState<Entry[] | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [newEntries, setNewEntries] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const latest = useRef("");
  const apply = useCallback((r: Result, p: number) => {
    setItems(r.items);
    setTotal(r.total);
    setError("");
    if (p === 1) {
      latest.current = stamp(r.items[0]);
      setNewEntries(false);
    }
  }, []);
  useEffect(() => {
    const c = new AbortController();
    readApi<Result>("/api/sessions/" + id + "?page=" + page, c.signal)
      .then((r) => apply(r, page))
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [id, page, apply]);
  useEffect(() => {
    if (!live) return;
    const c = new AbortController();
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      readApi<Result>("/api/sessions/" + id + "?page=1", c.signal)
        .then((r) => {
          if (stamp(r.items[0]) !== latest.current) setNewEntries(true);
        })
        .catch(() => {});
    }, 60000);
    return () => {
      clearInterval(timer);
      c.abort();
    };
  }, [id, live]);
  async function refresh() {
    setBusy(true);
    try {
      const r = await readApi<Result>("/api/sessions/" + id + "?page=1");
      apply(r, 1);
      setPage(1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5">
      <h2 className="font-display text-3xl">Cobertura da sessão</h2>
      <p className="text-sm text-zinc-400">
        Atualizações da imprensa sobre a simulação acadêmica. Resultados são
        publicados após confirmação da organização.
      </p>
      {error ? (
        <p role="alert">
          {error}{" "}
          <button className="underline" onClick={refresh} disabled={busy}>
            Tentar novamente
          </button>
        </p>
      ) : null}
      {newEntries ? (
        <p role="status">
          <button className="sis-button" onClick={refresh} disabled={busy}>
            Há novas entradas. Atualizar cobertura
          </button>
        </p>
      ) : null}
      {items === null && !error ? (
        <p role="status">Carregando cobertura…</p>
      ) : items?.length ? (
        items.map((e) => (
          <article key={e.id} className="card-border space-y-3 p-6">
            <p className="text-xs text-gold">
              {formatDate(e.created_at)} · {e.author}
            </p>
            <p className="whitespace-pre-wrap">{e.body}</p>
            {e.article ? (
              <Link
                className="text-gold underline"
                href={"/artigo/" + e.article.slug}
              >
                Matéria completa: {e.article.title}
              </Link>
            ) : null}
            {e.correction_note ? (
              <p className="text-sm text-zinc-400">
                Correção em {formatDate(e.updated_at)}: {e.correction_note}
              </p>
            ) : null}
          </article>
        ))
      ) : items && !error ? (
        <p className="text-zinc-400">
          A imprensa ainda não publicou entradas nesta sessão.
        </p>
      ) : null}
      {total > 20 ? (
        <nav aria-label="Páginas da cobertura" className="flex justify-between">
          <button
            disabled={page === 1 || busy}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Anterior
          </button>
          <span>Página {page}</span>
          <button
            disabled={page * 20 >= total || busy}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima →
          </button>
        </nav>
      ) : null}
    </section>
  );
}
