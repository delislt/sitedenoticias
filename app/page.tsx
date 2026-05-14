import { ArticleCard } from '@/components/ArticleCard';
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
        <h1 className="font-display max-w-4xl text-4xl leading-tight md:text-6xl">Cobertura premium do SIS — Simulado Interno Sidarta</h1>
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
