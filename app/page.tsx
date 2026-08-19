import { ArticleCard } from '@/components/ArticleCard';
import Link from 'next/link';
import { committeeOrder, categoryLabels } from '@/data/news';
import { fetchAllArticles } from '@/lib/supabase-articles';

export const revalidate = 0;

export default async function HomePage() {
  const articles = await fetchAllArticles();
  const featured = articles.filter((a) => a.featured);
  const recent = articles;

  return (
    <div className="container-premium space-y-14 py-10">
      <section className="space-y-6">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Edição Principal</p>
        <h1 className="font-display max-w-4xl text-4xl leading-tight md:text-6xl">Cobertura do SIS</h1>
      </section>

      <section id="dossies" className="relative scroll-mt-24 overflow-hidden border border-gold/40 bg-coal p-6 sm:p-8" aria-labelledby="dossiers-title">
        <div aria-hidden="true" className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Materiais de preparação</p>
            <h2 id="dossiers-title" className="font-display text-3xl text-zinc-100 sm:text-4xl">Dossiês dos comitês</h2>
            <p className="max-w-2xl text-zinc-400">Acesse diretamente o material do seu comitê antes de acompanhar a cobertura do SIS.</p>
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">3 comitês</span>
        </div>

        <div className="relative mt-7 grid gap-3 md:grid-cols-3">
          {committeeOrder.map((slug, index) => {
            return (
              <Link
                key={slug}
                href={'/comite/' + slug}
                className="group flex min-h-40 flex-col justify-between border border-zinc-700 bg-zinc-900/70 p-5 transition hover:-translate-y-1 hover:border-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  {categoryLabels[slug]}
                  <span className="text-zinc-600">0{index + 1}</span>
                </span>
                <span className="mt-6 space-y-3">
                  <span className="block font-display text-xl leading-snug text-zinc-100">
                    Dossiê do Comitê {categoryLabels[slug]}
                  </span>
                  <span className="flex items-center justify-between text-sm font-semibold text-zinc-300">
                    Acessar dossiê
                    <span aria-hidden="true" className="text-lg text-gold transition group-hover:translate-x-1">→</span>
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="space-y-5">
          <h2 className="font-display text-3xl">Destaques</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {featured.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-5">
        <h2 className="font-display text-3xl">Notícias Recentes</h2>
        {recent.length === 0 ? (
          <div className="card-border p-8 text-zinc-400">Nenhuma notícia publicada ainda.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recent.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
