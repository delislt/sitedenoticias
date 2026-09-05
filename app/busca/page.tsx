import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import { listArticles } from "@/lib/supabase-articles";
import { dossiers } from "@/data/dossiers";
import { categoryLabels } from "@/data/news";
import { pageNumber, calendarDate } from "@/lib/domain";
import { getEditions } from "@/lib/resources";
export const metadata = {
  title: "Busca | Jornal SIS",
  robots: { index: false, follow: true },
};
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const q = (p.q || "").trim().slice(0, 100);
  const category = Object.hasOwn(categoryLabels, p.category || "")
    ? p.category!
    : "";
  const type = ["news", "dossier"].includes(p.type || "") ? p.type! : "";
  const page = pageNumber(p.page);
  const editions = await getEditions();
  const edition = editions.find((e) => e.id === p.edition);
  const from = calendarDate(p.from);
  const to = calendarDate(p.to);
  const end = to
    ? new Date(
        new Date(to + "T00:00:00-03:00").getTime() + 86400000,
      ).toISOString()
    : undefined;
  const news =
    type === "dossier"
      ? { articles: [], total: 0 }
      : await listArticles({
          q,
          category,
          edition: edition?.id,
          from: from ? from + "T00:00:00-03:00" : undefined,
          to: end,
          page,
        });
  const normalized = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  const terms = normalized(q).split(/\s+/).filter(Boolean);
  const ds =
    type === "news" || page > 1
      ? []
      : dossiers.filter(
          (d) =>
            (!category || d.slug === category) &&
            (!edition || edition.slug === "2026") &&
            (!from ||
              from <=
                (d.publishedAt || "").slice(6, 10) +
                  "-" +
                  (d.publishedAt || "").slice(3, 5) +
                  "-" +
                  (d.publishedAt || "").slice(0, 2)) &&
            (!to ||
              to >=
                (d.publishedAt || "").slice(6, 10) +
                  "-" +
                  (d.publishedAt || "").slice(3, 5) +
                  "-" +
                  (d.publishedAt || "").slice(0, 2)) &&
            terms.every((t) =>
              normalized(
                d.title + " " + d.subtitle + " " + d.paragraphs.join(" "),
              ).includes(t),
            ),
        );
  return (
    <div className="container-premium space-y-8 py-10">
      <h1 className="font-display text-4xl">Encontre no Jornal SIS</h1>
      <form
        action="/busca"
        className="card-border grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="sm:col-span-2">
          Palavras-chave
          <input
            className="sis-input mt-2 w-full"
            name="q"
            defaultValue={q}
            maxLength={100}
          />
        </label>
        <label>
          Comitê
          <select
            className="sis-input mt-2 w-full"
            name="category"
            defaultValue={category}
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
          Material
          <select
            className="sis-input mt-2 w-full"
            name="type"
            defaultValue={type}
          >
            <option value="">Notícias e dossiês</option>
            <option value="news">Notícias</option>
            <option value="dossier">Dossiês</option>
          </select>
        </label>
        <label>
          De
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="sis-input mt-2 w-full"
          />
        </label>
        <label>
          Até
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="sis-input mt-2 w-full"
          />
        </label>
        <label>
          Edição
          <select
            name="edition"
            defaultValue={edition?.id || ""}
            className="sis-input mt-2 w-full"
          >
            <option value="">Todas</option>
            {editions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-4">
          <button className="sis-button">Buscar</button>
          <Link href="/busca" className="text-sm underline">
            Limpar filtros
          </Link>
        </div>
      </form>
      <p role="status" className="text-zinc-400">
        {news.total} notícia(s)
        {page === 1 ? " e " + ds.length + " dossiê(s)" : ""}
        {q ? " para “" + q + "”" : ""}.
      </p>
      {!news.articles.length && !ds.length ? (
        <p className="card-border p-8">
          Nenhum resultado nesta página. Tente outras palavras ou limpe os
          filtros.
        </p>
      ) : null}
      {ds.length ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl">Dossiês de preparação</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {ds.map((d) => (
              <Link
                key={d.slug}
                href={"/comite/" + d.slug}
                className="card-border space-y-3 p-5"
              >
                <p className="text-xs uppercase tracking-widest text-gold">
                  Dossiê · Contexto histórico
                </p>
                <h3 className="font-display text-2xl">{d.title}</h3>
                <p className="text-sm text-zinc-400">{d.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {news.articles.length ? (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.articles.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </section>
      ) : null}
      <Pagination
        page={page}
        total={news.total}
        base="/busca"
        params={{ q, category, type, from, to, edition: edition?.id || "" }}
      />
    </div>
  );
}
