import Link from 'next/link';
import { notFound } from 'next/navigation';
import { categoryLabels, type Category } from '@/data/news';

const validCommittees: Category[] = ['juridico', 'csnu', 'historico'];

export function generateStaticParams() {
  return validCommittees.map((slug) => ({ slug }));
}

export default function CommitteePage({ params }: { params: { slug: Category } }) {
  if (!validCommittees.includes(params.slug)) {
    notFound();
  }

  const committeeName = categoryLabels[params.slug];

  return (
    <main className="container-premium py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link
          href={'/categoria/' + params.slug}
          className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400 transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          <span aria-hidden="true">←</span>
          Voltar às notícias
        </Link>

        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Conheça o comitê</p>
          <h1 className="font-display text-4xl leading-tight md:text-6xl">
            Comitê {committeeName}
          </h1>
        </header>

        <section className="card-border space-y-4 p-6 sm:p-8">
          <h2 className="font-display text-2xl text-zinc-100">Conteúdo em breve</h2>
          <p className="max-w-2xl leading-relaxed text-zinc-400">
            Esta página está preparada para receber as informações, objetivos e materiais do
            Comitê {committeeName}. O conteúdo completo será adicionado posteriormente.
          </p>
        </section>
      </div>
    </main>
  );
}
