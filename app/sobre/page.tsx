import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { dossiers } from '@/data/dossiers';
import { fetchAllArticles } from '@/lib/supabase-articles';
import {
  getConsolidatedTeamMembers,
  getCoverageArticle,
  getCoverageTeamMembers,
} from '@/lib/project-context';

export const metadata: Metadata = {
  title: 'Entenda o projeto | SIS Jornal',
  description:
    'Conheça o Simulado Interno Sidarta, os três comitês, seus dossiês e as equipes responsáveis pela cobertura.',
};

export const revalidate = 0;

const contextualLinks = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#comites', label: 'Comitês e equipes' },
  { href: '#dossies', label: 'Dossiês' },
  { href: '#imprensa', label: 'Equipe de imprensa' },
];

export default async function AboutPage() {
  const articles = await fetchAllArticles();
  const teamMembers = getConsolidatedTeamMembers(articles);

  return (
    <div className="container-premium py-10 sm:py-14">
      <header className="mx-auto max-w-5xl border-b border-zinc-800 pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
          Simulado Interno Sidarta
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl leading-tight text-zinc-100 sm:text-6xl">
          Entenda o projeto por trás das notícias
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-300 sm:text-xl">
          O Jornal SIS acompanha uma simulação acadêmica inspirada nas dinâmicas da ONU. Aqui você encontra o contexto dos três comitês, os materiais de preparação e quem produz a cobertura.
        </p>

        <nav
          aria-label="Nesta página"
          className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-zinc-400"
        >
          {contextualLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="underline decoration-zinc-600 underline-offset-4 transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <section
        id="como-funciona"
        className="mx-auto max-w-5xl scroll-mt-28 border-b border-zinc-800 py-12"
        aria-labelledby="como-funciona-title"
      >
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
            O projeto
          </p>
          <h2 id="como-funciona-title" className="mt-3 font-display text-3xl text-zinc-100">
            O contexto por trás do jornal
          </h2>
        </div>

        <div className="mt-8 grid gap-7 md:grid-cols-3 md:gap-8">
          <div className="border-t border-zinc-800 pt-5">
            <h3 className="font-display text-xl text-zinc-100">O que é o projeto</h3>
            <p className="mt-3 leading-relaxed text-zinc-300">
              O SIS é um simulado acadêmico de alto nível desenvolvido para fortalecer competências em diplomacia, negociação, análise geopolítica e argumentação jurídica.
            </p>
          </div>
          <div className="border-t border-zinc-800 pt-5">
            <h3 className="font-display text-xl text-zinc-100">Como funciona a simulação</h3>
            <p className="mt-3 leading-relaxed text-zinc-300">
              Em 2026, o portal acompanha os comitês Jurídico, CSNU e Histórico. Cada um trabalha com um tema próprio e possui um dossiê para orientar a preparação e a leitura dos acontecimentos.
            </p>
          </div>
          <div className="border-t border-zinc-800 pt-5">
            <h3 className="font-display text-xl text-zinc-100">Como funciona a imprensa</h3>
            <p className="mt-3 leading-relaxed text-zinc-300">
              A imprensa registra debates, resoluções, impasses e avanços dos comitês. As matérias são publicadas como cobertura jornalística dos acontecimentos simulados.
            </p>
          </div>
        </div>
      </section>

      <section
        id="comites"
        className="mx-auto max-w-5xl scroll-mt-28 border-b border-zinc-800 py-12"
        aria-labelledby="comites-title"
      >
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
            Três frentes de cobertura
          </p>
          <h2 id="comites-title" className="mt-3 font-display text-4xl text-zinc-100">
            Comitês e equipes responsáveis
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-400">
            Cada equipe acompanha um comitê específico. Os nomes e as fotografias abaixo vêm das apresentações publicadas no Jornal SIS.
          </p>
        </div>

        <div className="mt-9 space-y-8">
          {dossiers.map((dossier, index) => {
            const teamArticle = getCoverageArticle(articles, dossier.slug);
            const members = teamArticle
              ? getCoverageTeamMembers(teamArticle)
              : [];

            return (
              <article
                key={dossier.slug}
                id={`comite-${dossier.slug}`}
                className="scroll-mt-28 border-t border-zinc-800 pt-8 first:border-t-0 first:pt-0"
              >
                <div className="grid gap-7 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start">
                  {teamArticle?.coverImage ? (
                    <figure className="relative aspect-[4/3] overflow-hidden border border-zinc-800 bg-coal">
                      <Image
                        src={teamArticle.coverImage}
                        alt={`Equipe responsável pela cobertura do Comitê ${dossier.committee}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 440px"
                        className="object-contain"
                      />
                    </figure>
                  ) : null}

                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                        Comitê {dossier.committee}
                      </p>
                      <span className="text-xs text-zinc-600">0{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-display text-3xl leading-tight text-zinc-100">
                        {dossier.title.replace('Dossiê - ', '')}
                      </h3>
                      <p className="mt-3 line-clamp-4 leading-relaxed text-zinc-400">
                        {dossier.summary}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-zinc-200">
                        Equipe responsável pela cobertura
                      </h4>
                      {members.length > 0 ? (
                        <ul className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm text-zinc-400">
                          {members.map((member, memberIndex) => (
                            <li key={member}>
                              {member}
                              {memberIndex < members.length - 1 ? (
                                <span aria-hidden="true" className="ml-2 text-gold">•</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-zinc-500">
                          A apresentação da equipe ainda não está disponível.
                        </p>
                      )}
                    </div>

                    <nav
                      aria-label={`Acessos do Comitê ${dossier.committee}`}
                      className="flex flex-wrap gap-x-5 gap-y-3 pt-1 text-sm font-semibold"
                    >
                      <Link
                        href={`/categoria/${dossier.slug}`}
                        className="text-zinc-300 underline decoration-zinc-600 underline-offset-4 transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                      >
                        Ver notícias
                      </Link>
                      <Link
                        href={`/comite/${dossier.slug}`}
                        className="text-zinc-300 underline decoration-zinc-600 underline-offset-4 transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                      >
                        Ver dossiê
                      </Link>
                      {teamArticle ? (
                        <Link
                          href={`/artigo/${teamArticle.slug}`}
                          className="text-zinc-300 underline decoration-zinc-600 underline-offset-4 transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                        >
                          Ler apresentação da equipe
                        </Link>
                      ) : null}
                    </nav>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="dossies"
        className="mx-auto max-w-5xl scroll-mt-28 border-b border-zinc-800 py-12"
        aria-labelledby="dossies-title"
      >
        <div className="grid gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
              Materiais de preparação
            </p>
            <h2 id="dossies-title" className="mt-3 font-display text-4xl text-zinc-100">
              Dossiês
            </h2>
            <p className="mt-4 leading-relaxed text-zinc-400">
              Cada dossiê reúne o contexto necessário para compreender o tema discutido por seu comitê.
            </p>
          </div>
          <ol className="divide-y divide-zinc-800 border-y border-zinc-800">
            {dossiers.map((dossier) => (
              <li key={dossier.slug}>
                <Link
                  href={`/comite/${dossier.slug}`}
                  className="group flex items-center justify-between gap-5 py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                >
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                      {dossier.committee}
                    </span>
                    <span className="mt-1 block font-display text-xl text-zinc-200 transition group-hover:text-zinc-100">
                      {dossier.title}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-xl text-gold transition group-hover:translate-x-1">→</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="imprensa"
        className="mx-auto max-w-5xl scroll-mt-28 pt-12"
        aria-labelledby="imprensa-title"
      >
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
            Quem produz o jornal
          </p>
          <h2 id="imprensa-title" className="mt-3 font-display text-4xl text-zinc-100">
            Equipe de imprensa
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-400">
            As três equipes acompanham os acontecimentos de seus comitês e produzem a cobertura publicada neste portal.
          </p>
        </div>

        <figure className="mt-8 overflow-hidden border border-zinc-800 bg-coal">
          <Image
            src="/images/imprensa/equipe-imprensa-2026.jpeg"
            alt="Equipe de imprensa do Jornal SIS reunida em sala de aula"
            width={2048}
            height={1536}
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="h-auto w-full"
          />
          <figcaption className="border-t border-zinc-800 px-4 py-3 text-xs leading-relaxed text-zinc-500 sm:px-5">
            Equipe de imprensa do Jornal SIS, 2026. A fotografia representa o grupo coletivamente.
          </figcaption>
        </figure>

        <div className="mt-8 grid gap-6 border-t border-zinc-800 pt-7 md:grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)]">
          <div>
            <h3 className="font-display text-2xl text-zinc-100">Integrantes confirmados</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Consolidação das três apresentações de equipe publicadas no portal.
            </p>
          </div>
          {teamMembers.length > 0 ? (
            <ul className="grid gap-x-8 gap-y-3 text-sm text-zinc-300 sm:grid-cols-2">
              {teamMembers.map((member) => (
                <li key={member} className="border-b border-zinc-800 pb-3">
                  {member}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">
              Os nomes ainda não estão disponíveis nas apresentações publicadas.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
