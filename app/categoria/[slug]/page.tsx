import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import { categoryLabels, type Category } from "@/data/news";
import { listArticles } from "@/lib/supabase-articles";
import { pageNumber } from "@/lib/domain";
export const dynamic = "force-dynamic";
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: Category }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  if (!Object.hasOwn(categoryLabels, slug)) notFound();
  const page = pageNumber((await searchParams).page);
  const { articles, total } = await listArticles({ category: slug, page });
  return (
    <div className="container-premium space-y-8 py-10">
      <p className="text-xs uppercase tracking-widest text-gold">
        Cobertura da simulação
      </p>
      <h1 className="font-display text-5xl">{categoryLabels[slug]}</h1>
      <nav
        aria-label="Materiais deste comitê"
        className="flex flex-wrap gap-5 text-gold"
      >
        <Link href={"/sobre#comite-" + slug}>Entenda este comitê</Link>
        <Link href={"/comite/" + slug}>Ver dossiê</Link>
        <Link href={"/agenda?category=" + slug}>Agenda</Link>
        <Link href={"/biblioteca?category=" + slug}>Biblioteca</Link>
      </nav>
      {articles.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      ) : (
        <div className="card-border p-8 text-zinc-400">
          Nenhuma notícia disponível nesta página.
        </div>
      )}
      <Pagination page={page} total={total} base={"/categoria/" + slug} />
    </div>
  );
}
