import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleCard } from '@/components/ArticleCard';
import { categoryLabels, type Category } from '@/data/news';
import { fetchAllArticles } from '@/lib/supabase-articles';

export const revalidate = 0;

const validCategories: Category[] = ['juridico', 'csnu', 'historico'];

export async function generateStaticParams() {
  return validCategories.map((slug) => ({ slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: Category }> }) {
  const { slug } = await params;

  if (!validCategories.includes(slug)) {
    notFound();
  }

  const all = await fetchAllArticles();
  const categoryArticles = all.filter((a) => a.category === slug);

  return (
    <div className="container-premium space-y-8 py-10">
      <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
        <h1 className="font-display text-5xl">{categoryLabels[slug]}</h1>
        <nav aria-label={`Contexto do Comitê ${categoryLabels[slug]}`} className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
          <Link
            href={`/sobre#comite-${slug}`}
            className="text-zinc-400 underline decoration-zinc-600 underline-offset-4 transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            Entenda este comitê
          </Link>
          <Link
            href={`/comite/${slug}`}
            className="text-zinc-400 underline decoration-zinc-600 underline-offset-4 transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            Ver dossiê
          </Link>
        </nav>
      </div>

      {categoryArticles.length === 0 ? (
        <div className="card-border p-8 text-zinc-400">Nenhuma notícia disponível nesta categoria no momento.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categoryArticles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
