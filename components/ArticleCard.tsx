import Image from 'next/image';
import Link from 'next/link';
import { type Article } from '@/data/news';
import { CategoryBadge } from './CategoryBadge';

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="group card-border overflow-hidden transition hover:border-gold/50">
      <div className="relative h-48 overflow-hidden">
        <Image src={article.coverImage} alt={article.title} fill className="object-cover transition duration-500 group-hover:scale-105" />
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
