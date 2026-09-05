"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  favorites,
  FAVORITES_KEY,
  snapshot,
  subscribe,
  save,
} from "@/lib/browser-preferences";
import { readApi, command } from "@/lib/client-api";
type Saved = {
  article: { id: string; slug: string; title: string; category: string } | null;
};
export function Favorites() {
  const raw = useSyncExternalStore(
    subscribe,
    () => snapshot(FAVORITES_KEY, "[]"),
    () => "[]",
  );
  const items = favorites(raw);
  const [message, setMessage] = useState("");
  const [remoteIds, setRemoteIds] = useState<string[]>([]);
  return (
    <div className="space-y-6">
      <p className="text-zinc-400">
        Esta lista é salva apenas neste navegador e dispositivo. A limpeza dos
        dados do navegador remove os favoritos locais.
      </p>
      <button
        className="sis-button"
        onClick={async () => {
          try {
            const remote = await readApi<Saved[]>("/api/bookmarks");
            const all = new Map(items.map((a) => [a.id, a]));
            setRemoteIds(
              remote.flatMap((x) => (x.article ? [x.article.id] : [])),
            );
            remote.forEach((x) => {
              if (x.article) all.set(x.article.id, x.article);
            });
            save(FAVORITES_KEY, JSON.stringify(Array.from(all.values())));
            setMessage("Favoritos da conta carregados neste dispositivo.");
          } catch (e) {
            setMessage((e as Error).message);
          }
        }}
      >
        Carregar favoritos da minha conta
      </button>
      <p role="status">{message}</p>
      {items.length ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((a) => (
            <li
              key={a.id}
              className="card-border flex items-center justify-between gap-4 p-5"
            >
              <Link className="font-display text-xl" href={"/artigo/" + a.slug}>
                {a.title}
              </Link>
              <div className="flex flex-wrap gap-3 text-sm">
                {remoteIds.includes(a.id) ? (
                  <button
                    className="underline"
                    onClick={async () => {
                      try {
                        await command("bookmark", {
                          article_id: a.id,
                          saved: false,
                        });
                        setRemoteIds((ids) => ids.filter((id) => id !== a.id));
                        setMessage(
                          "Favorito removido da conta. A cópia local foi preservada.",
                        );
                      } catch (e) {
                        setMessage((e as Error).message);
                      }
                    }}
                  >
                    Remover da conta
                  </button>
                ) : null}
                <button
                  className="text-sm underline"
                  aria-label={"Remover favorito: " + a.title}
                  onClick={() => {
                    try {
                      save(
                        FAVORITES_KEY,
                        JSON.stringify(items.filter((x) => x.id !== a.id)),
                      );
                    } catch {
                      setMessage("Não foi possível atualizar o armazenamento.");
                    }
                  }}
                >
                  Remover do dispositivo
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="card-border p-8">
          Você ainda não salvou matérias neste dispositivo.
        </p>
      )}
    </div>
  );
}
