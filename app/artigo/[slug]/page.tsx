import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CategoryBadge } from '@/components/CategoryBadge';
import { DateDisplay } from '@/components/DateDisplay';
import { fetchAllArticles, fetchArticleBySlug } from '@/lib/supabase-articles';

export const revalidate = 0;

export async function generateStaticParams() {
  const articles = await fetchAllArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug);

  if (!article) notFound();

  return (
    <article className="container-premium py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <CategoryBadge category={article.category} />
        <h1 className="font-display text-4xl leading-tight md:text-5xl">{article.title}</h1>
        <p className="text-xl text-zinc-300">{article.subtitle}</p>
        <div className="text-sm uppercase tracking-[0.14em] text-zinc-500">
          {article.author} &middot; <DateDisplay dateStr={article.created_at ?? ''} /> &middot; {article.readingTime} de leitura
        </div>
        {article.coverImage && (
          <div className="relative w-full overflow-hidden border border-zinc-800" style={{ aspectRatio: '16/9' }}>
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, 896px"
              priority
              className="object-contain"
            />
          </div>
        )}
        <div className="space-y-6 text-lg leading-relaxed text-zinc-200">
          {article.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
