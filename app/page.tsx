import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import { listArticles } from "@/lib/supabase-articles";
import { pageNumber } from "@/lib/domain";
export const dynamic = "force-dynamic";
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = pageNumber((await searchParams).page);
  const { articles, total } = await listArticles({ page });
  const featured =
    page === 1 ? articles.filter((a) => a.featured).slice(0, 2) : [];
  const recent = articles.filter((a) => !featured.includes(a));
  return (
    <div className="container-premium space-y-12 py-10">
      <section className="space-y-5">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">
          Simulado Interno Sidarta
        </p>
        <h1 className="font-display max-w-4xl text-4xl leading-tight md:text-6xl">
          Cobertura do SIS
        </h1>
        <p className="max-w-2xl text-zinc-400">
          As vozes, os debates e os acontecimentos da nossa simulação acadêmica.
        </p>
      </section>
      {featured.length > 0 ? (
        <section className="space-y-5">
          <h2 className="font-display text-3xl">Destaques</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {featured.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      ) : null}
      <section className="space-y-5">
        <h2 className="font-display text-3xl">Notícias recentes</h2>
        {articles.length === 0 ? (
          <div className="card-border space-y-4 p-8">
            <p>
              Nenhuma notícia publicada{page > 1 ? " nesta página" : " ainda"}.
            </p>
            <p className="text-zinc-400">
              Enquanto a cobertura começa, prepare-se com os materiais do
              projeto.
            </p>
            <div className="flex flex-wrap gap-5 text-gold">
              <Link href="/dossies">Ler os dossiês →</Link>
              <Link href="/sobre">Entenda o projeto →</Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recent.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        )}
      </section>
      <Pagination page={page} total={total} base="/" />
    </div>
  );
}
