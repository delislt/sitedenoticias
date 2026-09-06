import Link from "next/link";
import { ParticipantNav } from "@/components/ParticipantNav";
import { Pagination } from "@/components/Pagination";
import { currentSession } from "@/lib/auth";
import { unwrap } from "@/lib/resources";
import { categoryLabels } from "@/data/news";
import { formatDate, pageNumber } from "@/lib/domain";
export const metadata = { title: "Biblioteca de preparação | Jornal SIS" };
const kinds: Record<string, string> = {
  rules: "Regimento",
  guide: "Guia",
  template: "Modelo",
  resolution: "Resolução",
  notice: "Comunicado",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const page = pageNumber(p.page);
  const { db, access } = await currentSession();
  let query = db
    .from("documents")
    .select(
      "id,title,description,category,edition_id,kind,document_version,responsible,asset_id,audience,updated_at",
      { count: "exact" },
    )
    .eq("published", true)
    .order("updated_at", { ascending: false })
    .range((page - 1) * 20, page * 20 - 1);
  if (Object.hasOwn(categoryLabels, p.category || ""))
    query = query.eq("category", p.category);
  if (Object.hasOwn(kinds, p.kind || "")) query = query.eq("kind", p.kind);
  const r = await query;
  const docs = unwrap(r);
  const params = Object.fromEntries(
    Object.entries(p).filter(
      (e): e is [string, string] =>
        typeof e[1] === "string" && e[0] !== "edition",
    ),
  );
  return (
    <div className="container-premium space-y-7 py-10">
      <h1 className="font-display text-5xl">Biblioteca de preparação</h1>
      <p className="max-w-3xl text-zinc-400">
        Documentos publicados pela equipe, com versão e responsável. Os dossiês
        e suas referências continuam disponíveis nos endereços originais.
      </p>
      <ParticipantNav />
      <form className="card-border flex flex-wrap items-end gap-4 p-5">
        <label>
          Comitê
          <select
            className="sis-input mt-2 block"
            name="category"
            defaultValue={p.category || ""}
          >
            <option value="">Todos</option>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tipo
          <select
            className="sis-input mt-2 block"
            name="kind"
            defaultValue={p.kind || ""}
          >
            <option value="">Todos</option>
            {Object.entries(kinds).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button className="sis-button">Filtrar</button>
        <Link href="/biblioteca" className="underline">
          Limpar filtros
        </Link>
      </form>
      {!access.user_id ? (
        <p className="text-sm text-zinc-400">
          Materiais restritos só aparecem após{" "}
          <Link className="text-gold underline" href="/conta?next=/biblioteca">
            entrar na conta
          </Link>
          .
        </p>
      ) : null}
      {docs.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {docs.map((d) => (
            <article key={d.id} className="card-border space-y-4 p-6">
              <p className="text-xs text-gold">
                {kinds[d.kind]} ·{" "}
                {d.audience === "public" ? "Público" : "Restrito"} · versão{" "}
                {d.document_version}
              </p>
              <h2 className="font-display text-2xl">{d.title}</h2>
              <p>{d.description}</p>
              <p className="text-sm text-zinc-400">
                Responsável: {d.responsible}
                <br />
                Atualizado em {formatDate(d.updated_at)}
              </p>
              <a
                className="sis-button inline-block"
                href={"/api/media/" + d.asset_id}
              >
                Baixar PDF
              </a>
            </article>
          ))}
        </div>
      ) : (
        <div className="card-border space-y-4 p-8">
          <p>Nenhum documento disponível para esta consulta.</p>
          <Link href="/dossies" className="text-gold">
            Acessar os dossiês existentes →
          </Link>
        </div>
      )}
      <Pagination
        page={page}
        total={r.count || 0}
        size={20}
        base="/biblioteca"
        params={params}
      />
    </div>
  );
}
