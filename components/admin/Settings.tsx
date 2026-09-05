"use client";
import { useState } from "react";
import { command } from "@/lib/client-api";
import { type Settings as SiteSettings, roleLabels } from "@/lib/domain";
export function Settings({ initial }: { initial: SiteSettings }) {
  const [settings, setSettings] = useState(initial);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("journalist");
  const [grant, setGrant] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function run(act: string, d: unknown) {
    setBusy(true);
    try {
      await command(act, d);
      setMessage("Configuração salva e registrada no histórico.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="card-border space-y-5 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          void run("settings", settings);
        }}
      >
        <h2 className="font-display text-2xl">Participação dos leitores</h2>
        <p className="text-sm text-zinc-400">
          Confirme quem acompanha as filas antes de abrir comentários. Mantenha
          revisão prévia no contexto escolar.
        </p>
        {(
          [
            [
              "moderation_ready",
              "Confirmo que há uma equipe acompanhando a moderação",
            ],
            ["premoderation", "Revisar comentários antes de publicar"],
            ["readers_enabled", "Abrir cadastro de leitores na interface"],
            ["comments_enabled", "Abrir novos comentários globalmente"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-start gap-3">
            <input
              className="mt-1"
              type="checkbox"
              checked={settings[key]}
              onChange={(e) =>
                setSettings((s) => ({ ...s, [key]: e.target.checked }))
              }
            />
            {label}
          </label>
        ))}
        <button className="sis-button" disabled={busy}>
          Salvar operação
        </button>
      </form>
      <form
        className="card-border space-y-5 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          void run("role", { user_id: userId, role, grant });
        }}
      >
        <h2 className="font-display text-2xl">Funções protegidas</h2>
        <p className="text-sm text-zinc-400">
          Use o identificador da conta fornecido pela pessoa. Uma pessoa pode
          acumular funções. Você não pode alterar seus próprios privilégios.
        </p>
        <label className="block">
          UUID da conta
          <input
            className="sis-input mt-2 w-full"
            required
            pattern="[a-fA-F0-9-]{36}"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </label>
        <label className="block">
          Função
          <select
            className="sis-input mt-2 w-full"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {Object.entries(roleLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={grant}
            onChange={(e) => setGrant(e.target.checked)}
          />{" "}
          Conceder função (desmarque para revogar)
        </label>
        <button className="sis-button block" disabled={busy}>
          Aplicar à conta indicada
        </button>
      </form>
      <p role="status" className="text-gold lg:col-span-2">
        {message}
      </p>
    </div>
  );
}
