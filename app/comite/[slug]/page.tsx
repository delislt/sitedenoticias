import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { dossiers, getDossierBySlug } from '@/data/dossiers';
import type { Category } from '@/data/news';

export function generateStaticParams() {
  return dossiers.map((dossier) => ({ slug: dossier.slug }));
}

export function generateMetadata({ params }: { params: { slug: Category } }): Metadata {
  const dossier = getDossierBySlug(params.slug);

  return dossier
    ? { title: `${dossier.title} | SIS Jornal`, description: dossier.summary }
    : {};
}

export default function CommitteePage({ params }: { params: { slug: Category } }) {
  const dossier = getDossierBySlug(params.slug);
  if (!dossier) notFound();

  return (
    <main className="container-premium py-10">
      <article className="mx-auto max-w-5xl space-y-8">
        <Link
          href="/#dossies"
          className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400 transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          <span aria-hidden="true">←</span>
          Todos os dossiês
        </Link>

        <header className="mx-auto max-w-4xl space-y-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Comitê {dossier.committee}</p>
          <h1 className="font-display text-4xl leading-tight md:text-6xl">{dossier.title}</h1>
          <p className="text-lg text-zinc-400 md:text-xl">{dossier.subtitle}</p>
          {dossier.authors || dossier.publishedAt || dossier.readingTime ? (
            <p className="text-xs uppercase leading-relaxed tracking-[0.12em] text-zinc-500">
              {[dossier.authors, dossier.publishedAt, dossier.readingTime ? `${dossier.readingTime} de leitura` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
        </header>

        <figure className="relative aspect-video overflow-hidden border border-zinc-800 bg-coal">
          <Image
            src={dossier.image}
            alt={dossier.imageAlt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        </figure>

        <section className="mx-auto max-w-4xl space-y-6 text-justify text-lg leading-relaxed text-zinc-200">
          {dossier.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </section>

        {dossier.sources.length > 0 ? (
          <section className="mx-auto max-w-4xl border-t border-zinc-800 pt-9" aria-labelledby="sources-title">
            <div className="mb-6 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Continue pesquisando</p>
              <h2 id="sources-title" className="font-display text-3xl text-zinc-100">Saiba mais</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {dossier.sources.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="dossier-source group flex min-h-28 items-center justify-between gap-5 p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                >
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-gold">{source.publisher}</span>
                    <span className="mt-2 block font-display text-lg leading-snug text-zinc-100">{source.title}</span>
                  </span>
                  <span aria-hidden="true" className="shrink-0 text-xl text-gold transition group-hover:-translate-y-1 group-hover:translate-x-1">↗</span>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <nav className="mx-auto flex max-w-4xl flex-wrap gap-3 border-t border-zinc-800 pt-8" aria-label="Outros dossiês">
          {dossiers
            .filter((item) => item.slug !== dossier.slug)
            .map((item) => (
              <Link
                key={item.slug}
                href={'/comite/' + item.slug}
                className="dossier-chip inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300 transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                Dossiê {item.committee}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
        </nav>
      </article>
    </main>
  );
}
