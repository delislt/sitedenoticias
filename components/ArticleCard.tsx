import Image from 'next/image';
import Link from 'next/link';
import { type Article } from '@/data/news';
import { CategoryBadge } from './CategoryBadge';

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

export function ArticleCard({ article }: { article: Article }) {
  const postedAt = formatDate(article.created_at);

  return (
    <article className="group card-border overflow-hidden transition hover:border-gold/50">
      <Link href={`/artigo/${article.slug}`} className="block cursor-pointer">
        <div className="relative h-48 overflow-hidden bg-zinc-800">
          {article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" fill="none" />
                <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" fill="currentColor" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}
        </div>
        <div className="space-y-3 p-5">
          <CategoryBadge category={article.category} />
          <h3 className="font-display text-2xl leading-tight text-zinc-100 group-hover:text-gold">{article.title}</h3>
          <p className="text-sm text-zinc-300">{article.subtitle}</p>
          <div className="flex flex-wrap items-center justify-between gap-1 text-xs uppercase tracking-wider text-zinc-500">
            <span>{article.author}</span>
            {postedAt && (
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 6v6l4 2" />
                </svg>
                {postedAt}
              </span>
            )}
          </div>
          <span className="inline-block text-sm font-semibold text-zinc-100 underline decoration-zinc-600 underline-offset-4 transition group-hover:text-gold">
            Ler matéria
          </span>
        </div>
      </Link>
    </article>
  );
}
