import Image from 'next/image';
import Link from 'next/link';
import { type Article } from '@/data/news';
import { CategoryBadge } from './CategoryBadge';

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="group card-border overflow-hidden transition hover:border-gold/50">
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
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-zinc-500">
          <span>{article.author}</span>
          <span>{article.readingTime}</span>
        </div>
        <Link href={`/artigo/${article.slug}`} className="inline-block text-sm font-semibold text-zinc-100 underline decoration-zinc-600 underline-offset-4 transition hover:text-gold">
          Ler matéria
        </Link>
      </div>
    </article>
  );
}
