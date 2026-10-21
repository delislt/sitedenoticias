"use client";
import { useState, useSyncExternalStore } from "react";
import {
  FAVORITES_KEY,
  subscribe,
  snapshot,
  save,
  favorites,
} from "@/lib/browser-preferences";
import { command } from "@/lib/client-api";

function ToolIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}
export function ArticleTools({
  id,
  slug,
  title,
  category,
  label,
  url,
  children,
}: {
  id: string;
  slug: string;
  title: string;
  category: string;
  label: string;
  url: string;
  children: React.ReactNode;
}) {
  const raw = useSyncExternalStore(
    subscribe,
    () => snapshot(FAVORITES_KEY, "[]"),
    () => "[]",
  );
  const items = favorites(raw);
  const saved = items.some((a) => a.id === id);
  const [size, setSize] = useState(1);
  const [message, setMessage] = useState("");
  const [correction, setCorrection] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  function toggle() {
    try {
      save(
        FAVORITES_KEY,
        JSON.stringify(
          saved
            ? items.filter((a) => a.id !== id)
            : [...items, { id, slug, title, category }].slice(-500),
        ),
      );
      setMessage(
        saved
          ? "Favorito removido deste dispositivo."
          : "Favorito salvo apenas neste dispositivo.",
      );
    } catch {
      setMessage("O navegador não permitiu salvar neste dispositivo.");
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copiado.");
    } catch {
      setMessage("Copie este endereço: " + url);
    }
  }
  async function share() {
    try {
      if (navigator.share)
        await navigator.share({
          title: label + " · " + title,
          text: label + " · Jornal SIS · Simulação acadêmica",
          url,
        });
      else await copy();
    } catch (e) {
      if ((e as Error).name !== "AbortError") await copy();
    }
  }
  async function suggest(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await command("correction", { article_id: id, body });
      setBody("");
      setCorrection(false);
      setMessage("Sugestão enviada em caráter privado à revisão editorial.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="no-print space-y-4 border-y border-zinc-800 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Ações da notícia"
            className="flex flex-wrap items-center gap-2"
          >
            <button type="button" className="article-action" onClick={share}>
              <ToolIcon>
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
              </ToolIcon>
              Compartilhar
            </button>
            <button type="button" className="article-action" onClick={copy}>
              <ToolIcon>
                <rect x="8" y="8" width="12" height="12" rx="2" />
                <path d="M16 8V4H4v12h4" />
              </ToolIcon>
              Copiar link
            </button>
            <a
              className="article-action article-action-whatsapp"
              aria-label="Compartilhar notícia no WhatsApp (abre em nova aba)"
              target="_blank"
              rel="noopener noreferrer"
              href={
                "https://wa.me/?text=" +
                encodeURIComponent(
                  label +
                    " · " +
                    title +
                    " — Jornal SIS (simulação acadêmica) " +
                    url,
                )
              }
            >
              <ToolIcon>
                <path d="M20.5 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.2-4.6A8.5 8.5 0 1 1 20.5 11.5Z" />
                <path d="m8 7 2 3-1.2 1.2a10 10 0 0 0 4 4L14 14l3 2c-1 3-4.3 1.4-7.1-1.4S5 8 8 7Z" />
              </ToolIcon>
              WhatsApp
            </a>
            <button
              type="button"
              aria-pressed={saved}
              className="article-action"
              onClick={toggle}
            >
              <ToolIcon>
                <path
                  d="M6 3h12v18l-6-4-6 4Z"
                  fill={saved ? "currentColor" : "none"}
                />
              </ToolIcon>
              {saved ? "Salvo" : "Salvar"}
            </button>
            <button
              type="button"
              className="article-action article-action-icon"
              aria-label="Imprimir notícia"
              title="Imprimir notícia"
              onClick={() => window.print()}
            >
              <ToolIcon>
                <path d="M6 9V3h12v6M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
                <path d="M6 14h12v7H6zM18 12h.01" />
              </ToolIcon>
            </button>
          </div>
          <label className="flex w-full items-center gap-2 text-xs text-zinc-400 sm:ml-auto sm:w-auto">
            Tamanho do texto
            <select
              className="sis-input min-h-11 text-sm"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            >
              <option value={1}>Padrão</option>
              <option value={1.15}>Maior</option>
              <option value={1.3}>Bem maior</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400">
          <p>Favoritos ficam neste dispositivo.</p>
          <button
            type="button"
            className="article-action"
            onClick={async () => {
              try {
                await command("bookmark", { article_id: id, saved: true });
                if (!saved) toggle();
                setMessage(
                  "Matéria salva na sua conta. Gerencie a lista em Favoritos.",
                );
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          >
            Salvar também na minha conta
          </button>
        </div>
        <p
          role="status"
          aria-live="polite"
          className="empty:hidden text-sm text-gold"
        >
          {message}
        </p>
      </div>
      <div
        className="article-content space-y-6 text-justify leading-relaxed text-zinc-200"
        style={{ fontSize: size * 1.125 + "rem" }}
      >
        {children}
      </div>
      <div className="no-print pt-5">
        <button
          type="button"
          className="article-action"
          aria-expanded={correction}
          aria-controls="article-correction-form"
          onClick={() => setCorrection(!correction)}
        >
          Sugerir correção em caráter privado
        </button>
        {correction ? (
          <form
            id="article-correction-form"
            onSubmit={suggest}
            className="card-border mt-4 space-y-4 p-5"
          >
            <p className="text-sm text-zinc-400">
              Exige conta verificada. Explique o problema e, se possível, a
              fonte. Sua mensagem será vista pela equipe editorial.
            </p>
            <label className="block">
              Sua sugestão
              <textarea
                required
                minLength={10}
                maxLength={2000}
                rows={4}
                className="sis-input mt-2 w-full"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </label>
            <button className="article-action" disabled={busy}>
              {busy ? "Enviando…" : "Enviar sugestão"}
            </button>
          </form>
        ) : null}
      </div>
    </>
  );
}
