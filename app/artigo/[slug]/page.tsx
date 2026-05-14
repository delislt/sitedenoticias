import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CategoryBadge } from '@/components/CategoryBadge';
import { fetchAllArticles, fetchArticleBySlug } from '@/lib/supabase-articles';

export const revalidate = 0;

export async function generateStaticParams() {
  const articles = await fetchAllArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await fetchArticleBySlug(params.slug);

  if (!article) notFound();

  return (
    <article className="container-premium py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <CategoryBadge category={article.category} />
        <h1 className="font-display text-4xl leading-tight md:text-5xl">{article.title}</h1>
        <p className="text-xl text-zinc-300">{article.subtitle}</p>
        <div className="text-sm uppercase tracking-[0.14em] text-zinc-500">
          {article.author} · {article.date} · {article.readingTime} de leitura
        </div>
        <div className="relative h-[360px] overflow-hidden border border-zinc-800">
          <Image src={article.coverImage} alt={article.title} fill className="object-cover" />
        </div>
        <div className="space-y-6 text-lg leading-relaxed text-zinc-200">
          {article.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
