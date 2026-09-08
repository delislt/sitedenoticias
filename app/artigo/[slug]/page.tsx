/* eslint-disable @next/next/no-img-element -- Private previews need session cookies; article images retain their natural proportions. */
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { BackButton } from "@/components/BackButton";
import { CategoryBadge } from "@/components/CategoryBadge";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleTools } from "@/components/ArticleTools";
import { Comments } from "@/components/Comments";
import {
  fetchArticleBySlug,
  oldSlugTarget,
  articleContext,
} from "@/lib/supabase-articles";
import { formatDate, kindLabels, siteUrl } from "@/lib/domain";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const a = await fetchArticleBySlug((await params).slug);
  if (!a)
    return {
      title: "Matéria indisponível | Jornal SIS",
      robots: { index: false },
    };
  const url = siteUrl + "/artigo/" + a.slug;
  const title = kindLabels[a.kind || "simulation"] + " · " + a.title;
  const description =
    (a.subtitle || a.content[0] || "").slice(0, 160) +
    " | Simulado Interno Sidarta.";
  return {
    title: title + " | Jornal SIS",
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: "Jornal SIS · Simulação acadêmica",
      publishedTime: a.published_at,
      modifiedTime: a.updated_at,
      images: a.coverImage
        ? [{ url: new URL(a.coverImage, siteUrl).href }]
        : [],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ comment?: string }>;
}) {
  const { slug } = await params;
  const a = await fetchArticleBySlug(slug);
  if (!a) {
    const target = await oldSlugTarget(slug);
    if (target) permanentRedirect("/artigo/" + target);
    notFound();
  }
  const [context, p, h] = await Promise.all([
    articleContext(a),
    searchParams,
    headers(),
  ]);
  const label = kindLabels[a.kind || "simulation"];
  const url = siteUrl + "/artigo/" + a.slug;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.subtitle,
    datePublished: a.published_at,
    dateModified: a.updated_at,
    author: { "@type": "Person", name: a.author },
    publisher: {
      "@type": "Organization",
      name: "Jornal SIS · Simulado Interno Sidarta",
    },
    mainEntityOfPage: url,
    articleSection: label,
    about: {
      "@type": "Thing",
      name: "Simulação acadêmica do Simulado Interno Sidarta",
    },
    ...(a.coverImage ? { image: new URL(a.coverImage, siteUrl).href } : {}),
  };
  return (
    <article className="container-premium py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <script
          type="application/ld+json"
          nonce={h.get("x-nonce") || undefined}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
        <div className="pb-2 no-print">
          <BackButton />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <CategoryBadge category={a.category} />
          <span className="text-xs uppercase tracking-widest text-gold">
            {label}
          </span>
        </div>
        <h1 className="font-display text-4xl leading-tight md:text-5xl">
          {a.title}
        </h1>
        {a.subtitle ? (
          <p className="text-xl text-zinc-300">{a.subtitle}</p>
        ) : null}
        <div className="space-y-1 text-sm text-zinc-400">
          <p>
            <Link href={"/sobre#comite-" + a.category} className="underline">
              {a.author}
            </Link>{" "}
            · {a.readingTime} de leitura
          </p>
          <p>
            Publicado em{" "}
            <time dateTime={a.published_at}>{formatDate(a.published_at)}</time>
            {a.updated_at &&
            a.published_at &&
            Date.parse(a.updated_at) - Date.parse(a.published_at) > 60000 ? (
              <>
                {" "}
                · Atualizado em{" "}
                <time dateTime={a.updated_at}>{formatDate(a.updated_at)}</time>
              </>
            ) : null}{" "}
            · Horário de Brasília
          </p>
        </div>
        <nav
          aria-label="Contexto desta notícia"
          className="no-print flex flex-wrap gap-5 py-2 text-sm text-gold"
        >
          <Link href={"/categoria/" + a.category}>Mais notícias do comitê</Link>
          <Link href={"/sobre#comite-" + a.category}>Entenda este comitê</Link>
          <Link href={"/comite/" + a.category}>Ver dossiê</Link>
          <Link href="/glossario">Glossário</Link>
        </nav>
        {a.coverImage ? (
          <figure className="w-full overflow-hidden border border-zinc-800 bg-coal">
            <img
              src={a.coverImage}
              alt={a.title}
              loading="eager"
              decoding="async"
              className="h-auto w-full"
            />
            {a.image_credit ? (
              <figcaption className="p-3 text-sm text-zinc-400">
                Imagem: {a.image_credit}
              </figcaption>
            ) : null}
          </figure>
        ) : null}
        <ArticleTools
          id={a.id!}
          slug={a.slug}
          title={a.title}
          category={a.category}
          label={label}
          url={url}
        >
          {a.content.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </ArticleTools>
        {a.sources?.length ? (
          <section className="space-y-3 border-t border-zinc-800 pt-6">
            <h2 className="font-display text-2xl">Fontes e referências</h2>
            <ul className="space-y-2">
              {a.sources.map((s, i) => (
                <li key={i}>
                  <a
                    className="break-words text-gold underline"
                    href={s.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {a.correction_note ? (
          <aside className="card-border space-y-2 p-5">
            <h2 className="font-semibold">Nota de correção</h2>
            <p>{a.correction_note}</p>
          </aside>
        ) : null}
        <nav
          aria-label="Navegação entre notícias"
          className="no-print grid gap-4 border-t border-zinc-800 pt-8 sm:grid-cols-2"
        >
          {context.previous ? (
            <Link
              className="card-border p-5"
              href={"/artigo/" + context.previous.slug}
            >
              <span className="text-sm text-gold">← Notícia anterior</span>
              <p>{context.previous.title}</p>
            </Link>
          ) : (
            <p className="text-sm text-zinc-400">
              Esta é a notícia mais antiga.
            </p>
          )}
          {context.next ? (
            <Link
              className="card-border p-5 text-right"
              href={"/artigo/" + context.next.slug}
            >
              <span className="text-sm text-gold">Próxima notícia →</span>
              <p>{context.next.title}</p>
            </Link>
          ) : (
            <p className="text-right text-sm text-zinc-400">
              Esta é a notícia mais recente.
            </p>
          )}
        </nav>
        {context.related.length ? (
          <section className="no-print space-y-5">
            <h2 className="font-display text-3xl">Continue lendo</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {context.related.map((x) => (
                <ArticleCard key={x.id} article={x} />
              ))}
            </div>
          </section>
        ) : null}
        <Comments
          articleId={a.id!}
          slug={a.slug}
          open={a.comments_open !== false}
          focusId={p.comment}
        />
      </div>
    </article>
  );
}
