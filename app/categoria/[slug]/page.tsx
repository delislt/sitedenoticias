import { notFound } from 'next/navigation';
import { ArticleCard } from '@/components/ArticleCard';
import { categoryLabels, getArticlesByCategory, type Category } from '@/data/news';

export default function CategoryPage({ params }: { params: { slug: Category } }) {
  const validCategories: Category[] = ['juridico', 'csnu', 'historico'];

  if (!validCategories.includes(params.slug)) {
    notFound();
  }

  const categoryArticles = getArticlesByCategory(params.slug);

  return (
    <div className="container-premium space-y-8 py-10">
      <h1 className="font-display text-5xl">{categoryLabels[params.slug]}</h1>
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
