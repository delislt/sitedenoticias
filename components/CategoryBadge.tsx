import { categoryLabels, type Category } from '@/data/news';

const badgeStyles: Record<Category, string> = {
  juridico: 'bg-gold/15 text-gold border-gold/40',
  csnu: 'bg-wine/30 text-rose-100 border-wine/60',
  historico: 'bg-zinc-700/40 text-zinc-200 border-zinc-600'
};

export function CategoryBadge({ category }: { category: Category }) {
  return <span className={`inline-flex border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${badgeStyles[category]}`}>{categoryLabels[category]}</span>;
}
