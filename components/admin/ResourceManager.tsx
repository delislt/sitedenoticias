"use client";
import { useState, useEffect, useCallback } from "react";
import { readApi, command, uploadFile } from "@/lib/client-api";
import { categoryLabels } from "@/data/news";
type Row = Record<string, unknown> & {
  id: string;
  version: number;
  title?: string;
};
type Field = {
  key: string;
  label: string;
  type?:
    "textarea" | "checkbox" | "select" | "number" | "datetime-local" | "file";
  options?: [string, string][];
  required?: boolean;
};
const committees: [string, string][] = Object.entries(categoryLabels);
const base: Field[] = [
  { key: "edition_id", label: "Edição", type: "select", required: true },
];
const fields: Record<string, Field[]> = {
  edition: [
    { key: "slug", label: "Identificador da edição", required: true },
    { key: "title", label: "Título", required: true },
    { key: "year", label: "Ano", type: "number", required: true },
  ],
  session: [
    ...base,
    {
      key: "category",
      label: "Comitê",
      type: "select",
      options: committees,
      required: true,
    },
    { key: "title", label: "Título da sessão", required: true },
    {
      key: "starts_at",
      label: "Início · horário de Brasília",
      type: "datetime-local",
      required: true,
    },
    {
      key: "ends_at",
      label: "Fim · horário de Brasília",
      type: "datetime-local",
      required: true,
    },
    { key: "location", label: "Local (opcional)" },
    {
      key: "location_public",
      label: "A organização autorizou divulgar este local",
      type: "checkbox",
    },
    {
      key: "status",
      label: "Situação",
      type: "select",
      options: [
        ["scheduled", "Agendada"],
        ["live", "Em andamento"],
        ["closed", "Encerrada"],
        ["cancelled", "Cancelada"],
      ],
    },
    {
      key: "summary",
      label: "Resumo editorial revisado pela equipe",
      type: "textarea",
    },
  ],
  update: [
    { key: "session_id", label: "Sessão", type: "select", required: true },
    {
      key: "body",
      label: "Atualização curta da cobertura",
      type: "textarea",
      required: true,
    },
    { key: "author", label: "Autoria", required: true },
    { key: "article_id", label: "UUID da matéria completa (opcional)" },
    {
      key: "result",
      label: "Esta entrada contém resultados ou resoluções",
      type: "checkbox",
    },
    {
      key: "organization_confirmed",
      label: "A organização confirmou o resultado",
      type: "checkbox",
    },
    {
      key: "correction_note",
      label: "Nota pública de correção",
      type: "textarea",
    },
  ],
  document: [
    ...base,
    {
      key: "category",
      label: "Comitê",
      type: "select",
      options: [["", "Todos"], ...committees],
    },
    { key: "title", label: "Título", required: true },
    { key: "description", label: "Descrição", type: "textarea" },
    {
      key: "kind",
      label: "Tipo",
      type: "select",
      options: [
        ["rules", "Regimento"],
        ["guide", "Guia"],
        ["template", "Modelo de documento"],
        ["resolution", "Resolução"],
        ["notice", "Comunicado"],
      ],
      required: true,
    },
    { key: "document_version", label: "Versão do documento", required: true },
    { key: "responsible", label: "Responsável", required: true },
    {
      key: "asset_id",
      label: "PDF · até 4 MB · sem senha ou conteúdo ativo",
      type: "file",
      required: true,
    },
    {
      key: "audience",
      label: "Acesso",
      type: "select",
      options: [
        ["restricted", "Restrito a contas autenticadas"],
        ["public", "Público"],
      ],
      required: true,
    },
    {
      key: "organization_confirmed",
      label:
        "A organização confirmou esta resolução (obrigatório para resoluções)",
      type: "checkbox",
    },
  ],
  announcement: [
    ...base,
    { key: "title", label: "Título do aviso oficial", required: true },
    {
      key: "body",
      label: "Texto autorizado pela organização",
      type: "textarea",
      required: true,
    },
  ],
};
const labels: Record<string, string> = {
  edition: "Edições",
  session: "Agenda e sessões",
  update: "Cobertura por sessão",
  document: "Biblioteca",
  announcement: "Avisos oficiais",
};
function localDate(value: unknown) {
  if (!value) return "";
  return new Date(Date.parse(String(value)) - 3 * 3600000)
    .toISOString()
    .slice(0, 16);
}
export function ResourceManager({
  editions,
  sessions,
}: {
  editions: { id: string; title: string }[];
  sessions: { id: string; title: string }[];
}) {
  const [kind, setKind] = useState("session");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [edit, setEdit] = useState<Record<string, unknown> | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const load = useCallback(
    async (signal?: AbortSignal) =>
      setRows(
        await readApi(
          "/api/admin/resources?kind=" + kind + "&page=" + page,
          signal,
        ),
      ),
    [kind, page],
  );
  useEffect(() => {
    const c = new AbortController();
    readApi<Row[]>(
      "/api/admin/resources?kind=" + kind + "&page=" + page,
      c.signal,
    )
      .then((r) => {
        setRows(r);
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
  useEffect(() => {
    if (!dirty) return;
    const f = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [dirty]);
  function field(key: string, value: unknown) {
    setEdit((d) => ({ ...d, [key]: value }));
    setDirty(true);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setBusy(true);
    try {
      const d = { ...edit };
      for (const f of fields[kind])
        if (f.type === "datetime-local")
          d[f.key] = String(d[f.key]) + ":00-03:00";
      const result = await command(kind, d);
      setEdit({ ...edit, ...result });
      setDirty(false);
      setMessage(
        "Registro salvo. Recarregue esta página para atualizar as opções de novas edições e sessões.",
      );
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <p className="text-zinc-400">
        Cadastre somente informações definidas pela organização. As datas usam
        America/Sao_Paulo. Resultados e resoluções exigem confirmação explícita.
      </p>
      <div className="flex flex-wrap gap-4">
        <label>
          Área
          <select
            disabled={dirty}
            className="sis-input ml-3"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setPage(1);
              setEdit(null);
            }}
          >
            {Object.entries(labels).map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={dirty}
          className="sis-button"
          onClick={() => {
            setEdit({
              edition_id: editions[0]?.id || "",
              category: "csnu",
              kind: "guide",
              audience: "restricted",
              document_version: "1",
              status: "scheduled",
              session_id: sessions[0]?.id || "",
              published: false,
            });
            setDirty(false);
          }}
        >
          Novo registro
        </button>
      </div>
      <p role="status" className="text-gold">
        {message}
      </p>
      {dirty ? (
        <p>
          Há alterações não salvas.{" "}
          <button
            className="underline"
            onClick={() => {
              setDirty(false);
              setEdit(null);
            }}
          >
            Descartar
          </button>
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          {!loaded && !loadError ? (
            <p role="status">Carregando registros…</p>
          ) : loadError ? (
            <p role="alert">
              A lista não pôde ser carregada. Recarregue a página.
            </p>
          ) : rows.length ? (
            rows.map((r) => (
              <button
                disabled={dirty}
                key={r.id}
                className="card-border block w-full p-4 text-left"
                onClick={() => {
                  const d = { ...r };
                  for (const f of fields[kind])
                    if (f.type === "datetime-local")
                      d[f.key] = localDate(d[f.key]);
                  setEdit(d);
                  setDirty(false);
                }}
              >
                <strong className="block">
                  {r.title || String(r.body || "").slice(0, 80)}
                </strong>
                <span className="text-xs text-gold">
                  {r.published ? "Publicado" : "Rascunho"} · revisão {r.version}
                </span>
              </button>
            ))
          ) : (
            <p className="text-zinc-400">Nenhum registro nesta página.</p>
          )}
          <div className="flex justify-between gap-4">
            <button
              disabled={page === 1 || dirty}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Anterior
            </button>
            <span>{page}</span>
            <button
              disabled={rows.length < 30 || dirty}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima →
            </button>
          </div>
        </div>
        {edit ? (
          <form className="card-border space-y-5 p-6" onSubmit={submit}>
            {fields[kind].map((f) => {
              const options =
                f.key === "edition_id"
                  ? editions.map((e) => [e.id, e.title])
                  : f.key === "session_id"
                    ? sessions.map((e) => [e.id, e.title])
                    : f.options || [];
              if (f.type === "checkbox")
                return (
                  <label key={f.key} className="block">
                    <input
                      type="checkbox"
                      checked={!!edit[f.key]}
                      onChange={(e) => field(f.key, e.target.checked)}
                    />{" "}
                    {f.label}
                  </label>
                );
              if (f.type === "file")
                return (
                  <div key={f.key}>
                    <label className="block">
                      {f.label}
                      <input
                        type="file"
                        accept="application/pdf"
                        className="mt-2 w-full"
                        disabled={busy}
                        required={!edit.asset_id}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setBusy(true);
                          try {
                            const asset = await uploadFile(file, "pdf");
                            field("asset_id", asset.id);
                            setMessage(
                              "PDF validado. Confira título, versão e acesso antes de publicar.",
                            );
                          } catch (e) {
                            setMessage((e as Error).message);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      />
                    </label>
                    {edit.asset_id ? (
                      <p className="mt-2 text-sm text-gold">
                        PDF vinculado.{" "}
                        <a
                          href={"/api/media/" + edit.asset_id}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Conferir arquivo
                        </a>
                      </p>
                    ) : null}
                  </div>
                );
              return (
                <label key={f.key} className="block">
                  {f.label}
                  {f.type === "textarea" ? (
                    <textarea
                      rows={5}
                      required={f.required}
                      maxLength={f.key === "summary" ? 10000 : 2000}
                      value={String(edit[f.key] || "")}
                      className="sis-input mt-2 w-full"
                      onChange={(e) => field(f.key, e.target.value)}
                    />
                  ) : f.type === "select" ? (
                    <select
                      required={f.required}
                      className="sis-input mt-2 w-full"
                      value={String(edit[f.key] || "")}
                      onChange={(e) => field(f.key, e.target.value)}
                    >
                      {f.required ? <option value="">Selecione</option> : null}
                      {options.map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type || "text"}
                      required={f.required}
                      maxLength={200}
                      className="sis-input mt-2 w-full"
                      value={String(edit[f.key] || "")}
                      onChange={(e) =>
                        field(
                          f.key,
                          f.type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                        )
                      }
                    />
                  )}
                </label>
              );
            })}
            <label className="block">
              <input
                type="checkbox"
                checked={!!edit.published}
                onChange={(e) => field("published", e.target.checked)}
              />{" "}
              Publicar este registro após revisão humana
            </label>
            <button disabled={busy} className="sis-button">
              {busy ? "Salvando…" : "Salvar registro"}
            </button>
          </form>
        ) : (
          <div className="card-border p-8 text-zinc-400">
            Selecione ou crie um registro.
          </div>
        )}
      </div>
    </div>
  );
}
