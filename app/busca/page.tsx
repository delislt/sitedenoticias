import { articles } from '@/data/news';
import { ArticleCard } from '@/components/ArticleCard';

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q?.trim().toLowerCase() ?? '';
  const results = query
    ? articles.filter((article) =>
        [article.title, article.subtitle, article.author].join(' ').toLowerCase().includes(query)
      )
    : [];

  return (
    <div className="container-premium space-y-8 py-10">
      <h1 className="font-display text-4xl">Busca de notícias</h1>
      <form className="card-border flex flex-col gap-3 p-4 md:flex-row" action="/busca">
        <input
          name="q"
          placeholder="Pesquise por tema, autor ou palavra-chave"
          className="w-full bg-zinc-900/80 px-4 py-3 text-zinc-100 outline-none ring-1 ring-zinc-700 transition focus:ring-gold"
          defaultValue={searchParams.q ?? ''}
        />
        <button className="bg-gold px-6 py-3 font-semibold text-ink transition hover:bg-amber-400">Buscar</button>
      </form>

      {!query ? (
        <div className="card-border p-8 text-zinc-400">Digite um termo para iniciar sua busca.</div>
      ) : results.length === 0 ? (
        <div className="card-border p-8 text-zinc-400">Nenhum resultado encontrado para “{searchParams.q}”.</div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">{results.length} resultado(s) para “{searchParams.q}”.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-20 animate-pulse bg-zinc-900/80" />
        ))}
      </div>
    </div>
  );
}
