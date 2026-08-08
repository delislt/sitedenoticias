import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BackButton } from '@/components/BackButton';
import { CategoryBadge } from '@/components/CategoryBadge';
import { DateDisplay } from '@/components/DateDisplay';
import { fetchAllArticles } from '@/lib/supabase-articles';

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
  const articles = await fetchAllArticles();
  const articleIndex = articles.findIndex((item) => item.slug === slug);
  const article = articles[articleIndex];

  if (!article) notFound();

  const previousArticle = articles[articleIndex + 1] ?? null;
  const nextArticle = articleIndex > 0 ? articles[articleIndex - 1] : null;

  return (
    <article className="container-premium py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <BackButton />

        <CategoryBadge category={article.category} />
        <h1 className="font-display text-4xl leading-tight md:text-5xl">{article.title}</h1>
        <p className="text-xl text-zinc-300">{article.subtitle}</p>
        <div className="text-sm uppercase tracking-[0.14em] text-zinc-500">
          {article.author} &middot; <DateDisplay dateStr={article.created_at ?? ''} /> &middot; {article.readingTime} de leitura
        </div>

        {article.coverImage && (
          <figure className="w-full overflow-hidden border border-zinc-800 bg-coal">
            {/* A imagem interna preserva suas dimensões naturais; o recorte 16:9 fica apenas nos cards. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverImage}
              alt={article.title}
              loading="eager"
              decoding="async"
              className="h-auto w-full"
            />
          </figure>
        )}

        <div className="space-y-6 text-justify text-lg leading-relaxed text-zinc-200">
          {article.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <nav
          aria-label="Navegação entre notícias"
          className="grid gap-3 border-t border-zinc-800 pt-8 sm:grid-cols-2"
        >
          {previousArticle ? (
            <Link
              href={'/artigo/' + previousArticle.slug}
              className="group flex min-h-24 flex-col justify-center border border-zinc-800 px-5 py-4 transition hover:border-gold/70 hover:bg-coal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                ← Notícia Anterior
              </span>
              <span className="mt-2 line-clamp-2 text-sm text-zinc-300 transition group-hover:text-zinc-100">
                {previousArticle.title}
              </span>
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="flex min-h-24 flex-col justify-center border border-zinc-900 px-5 py-4 text-zinc-600"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                ← Notícia Anterior
              </span>
              <span className="mt-2 text-sm">Esta é a notícia mais antiga.</span>
            </span>
          )}

          {nextArticle ? (
            <Link
              href={'/artigo/' + nextArticle.slug}
              className="group flex min-h-24 flex-col justify-center border border-zinc-800 px-5 py-4 text-right transition hover:border-gold/70 hover:bg-coal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                Próxima Notícia →
              </span>
              <span className="mt-2 line-clamp-2 text-sm text-zinc-300 transition group-hover:text-zinc-100">
                {nextArticle.title}
              </span>
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="flex min-h-24 flex-col justify-center border border-zinc-900 px-5 py-4 text-right text-zinc-600"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                Próxima Notícia →
              </span>
              <span className="mt-2 text-sm">Esta é a notícia mais recente.</span>
            </span>
          )}
        </nav>
      </div>
    </article>
  );
}
