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

export default async function CategoryPage({ params }: { params: { slug: Category } }) {
  if (!validCategories.includes(params.slug)) {
    notFound();
  }

  const all = await fetchAllArticles();
  const categoryArticles = all.filter((a) => a.category === params.slug);

  return (
    <div className="container-premium space-y-8 py-10">
      <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
        <h1 className="font-display text-5xl">{categoryLabels[params.slug]}</h1>
        <Link
          href={'/comite/' + params.slug}
          className="inline-flex items-center justify-center border border-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold transition hover:bg-gold hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          Saiba mais
        </Link>
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
