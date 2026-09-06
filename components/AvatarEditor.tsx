"use client";
import { useState } from "react";
export function AvatarEditor() {
  const [photo, setPhoto] = useState(true);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(file?: File) {
    if (file && file.size > 4 * 1024 * 1024) {
      setMessage("Escolha uma imagem de até 4 MB.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData();
      if (file) form.set("file", file);
      const r = await fetch("/api/account/avatar", {
        method: file ? "POST" : "DELETE",
        ...(file ? { body: form } : {}),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setVersion((v) => v + 1);
      setPhoto(!!file);
      setMessage(file ? "Foto salva." : "Foto removida.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card-border space-y-4 p-5">
      <h2 className="font-display text-2xl">Sua foto</h2>
      {photo /* Authenticated image requests need the browser cookies. */ ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={"/api/account/avatar?v=" + version}
          alt="Sua foto de perfil"
          width={96}
          height={96}
          className="h-24 w-24 rounded-full object-cover border border-gold"
          onError={() => setPhoto(false)}
        />
      ) : (
        <div
          aria-label="Sem foto de perfil"
          className="flex h-24 w-24 items-center justify-center rounded-full border border-gold text-sm"
        >
          Sem foto
        </div>
      )}
      <label className="block">
        Escolher foto
        <input
          className="sis-input mt-2 w-full"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void save(file);
            e.target.value = "";
          }}
        />
      </label>
      <p className="text-sm text-zinc-400">
        JPEG, PNG ou WebP, até 4 MB. A foto fica visível na sua área pessoal.
      </p>
      {photo ? (
        <button
          className="underline"
          disabled={busy}
          onClick={() => void save()}
        >
          Remover foto
        </button>
      ) : null}
      <p role="status" className="text-gold">
        {busy ? "Salvando…" : message}
      </p>
    </section>
  );
}
