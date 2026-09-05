"use client";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { command, readApi } from "@/lib/client-api";
import type { Comment } from "@/lib/domain";
import { formatDate } from "@/lib/domain";
type Correction = {
  id: string;
  body: string;
  status: string;
  created_at: string;
  title: string;
  slug: string;
};
export function Moderation({ corrections = false }: { corrections?: boolean }) {
  const [kind, setKind] = useState(corrections ? "corrections" : "pending");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<(Comment & Correction)[]>([]);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setItems(
        await readApi(
          "/api/admin/dashboard?" +
            new URLSearchParams({ kind, page: String(page) }),
          signal,
        ),
      );
    },
    [kind, page],
  );
  useEffect(() => {
    const c = new AbortController();
    readApi<(Comment & Correction)[]>(
      "/api/admin/dashboard?" +
        new URLSearchParams({ kind, page: String(page) }),
      c.signal,
    )
      .then((r) => {
        setItems(r);
        setLoaded(true);
        setLoadError(false);
      })
      .catch((e) => {
        if (!c.signal.aborted) {
          setMessage(e.message);
          setLoadError(true);
        }
      });
    return () => c.abort();
  }, [kind, page]);
  async function decide(c: Comment & Correction, decision: string) {
    setBusy(true);
    try {
      await command(
        corrections ? "correction.resolve" : "moderate",
        corrections
          ? { id: c.id, status: decision, reason: reason[c.id] || "" }
          : {
              id: c.id,
              version: c.version,
              decision,
              reason: reason[c.id] || "",
            },
      );
      setMessage("Decisão registrada no histórico.");
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      {!corrections ? (
        <label>
          Fila
          <select
            className="sis-input ml-3"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setPage(1);
            }}
          >
            <option value="pending">Aguardando moderação</option>
            <option value="reported">Denunciados</option>
          </select>
        </label>
      ) : (
        <p className="text-zinc-400">
          Confira a sugestão e faça a correção na matéria antes de marcá-la como
          aceita. Registre a nota pública quando pertinente.
        </p>
      )}
      <p role="status" className="text-gold">
        {message}
      </p>
      {!loaded && !loadError ? (
        <p role="status">Carregando registros…</p>
      ) : null}
      {loaded && !loadError && !items.length ? (
        <p className="card-border p-8">Nenhum item nesta fila.</p>
      ) : null}
      {items.map((c) => (
        <article key={c.id} className="card-border space-y-4 p-5">
          <Link
            className="text-gold underline"
            href={"/artigo/" + (c.article_slug || c.slug)}
          >
            {c.article_title || c.title}
          </Link>
          <p className="text-sm text-zinc-400">
            {c.display_name} · {formatDate(c.created_at)}
          </p>
          <p className="whitespace-pre-wrap break-words">{c.body}</p>
          {c.reports?.map((r, i) => (
            <p key={i} className="border-l-2 border-gold pl-3 text-sm">
              Denúncia: {r.reason}
            </p>
          ))}
          <label className="block">
            Motivo da decisão
            <textarea
              required
              minLength={3}
              maxLength={500}
              className="sis-input mt-2 w-full"
              value={reason[c.id] || ""}
              onChange={(e) =>
                setReason((r) => ({ ...r, [c.id]: e.target.value }))
              }
            />
          </label>
          <div className="flex flex-wrap gap-3">
            {(corrections
              ? [
                  ["accepted", "Aceitar"],
                  ["rejected", "Rejeitar"],
                ]
              : [
                  ["approve", "Aprovar"],
                  ["reject", "Rejeitar"],
                  ["remove", "Remover texto"],
                  ["suspend", "Suspender autor por 7 dias"],
                  ...(kind === "reported"
                    ? [["dismiss", "Encerrar denúncia"]]
                    : []),
                ]
            ).map(([key, label]) => (
              <button
                key={key}
                disabled={busy || (reason[c.id] || "").trim().length < 3}
                className="sis-button"
                onClick={() => decide(c, key)}
              >
                {label}
              </button>
            ))}
          </div>
        </article>
      ))}
      <nav className="flex justify-between">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          ← Anterior
        </button>
        <span>Página {page}</span>
        <button
          disabled={items.length < 20}
          onClick={() => setPage((p) => p + 1)}
        >
          Próxima →
        </button>
      </nav>
    </div>
  );
}
