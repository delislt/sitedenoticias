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
      <div className="no-print space-y-3 border-y border-zinc-800 py-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <button className="sis-button" onClick={share}>
            Compartilhar
          </button>
          <button onClick={copy}>Copiar link</button>
          <a
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
            WhatsApp
          </a>
          <button aria-pressed={saved} className="sis-button" onClick={toggle}>
            {saved ? "★ Salvo" : "☆ Salvar"}
          </button>
          <button onClick={() => window.print()}>Imprimir</button>
          <label className="ml-auto">
            Texto{" "}
            <select
              className="sis-input ml-2"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            >
              <option value={1}>Padrão</option>
              <option value={1.15}>Maior</option>
              <option value={1.3}>Bem maior</option>
            </select>
          </label>
        </div>
        <p className="text-xs text-zinc-400">
          Favoritos ficam neste dispositivo.{" "}
          <button
            className="underline"
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
        </p>
        <p role="status" className="text-sm text-gold">
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
          className="text-sm underline"
          onClick={() => setCorrection(!correction)}
        >
          Sugerir correção em caráter privado
        </button>
        {correction ? (
          <form onSubmit={suggest} className="card-border mt-4 space-y-4 p-5">
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
            <button className="sis-button" disabled={busy}>
              {busy ? "Enviando…" : "Enviar sugestão"}
            </button>
          </form>
        ) : null}
      </div>
    </>
  );
}
