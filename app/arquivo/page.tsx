import Link from "next/link";
import { ParticipantNav } from "@/components/ParticipantNav";
import { getEditions } from "@/lib/resources";
import { listArticles } from "@/lib/supabase-articles";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import { pageNumber } from "@/lib/domain";
export const metadata = { title: "Arquivo por edição | Jornal SIS" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ edition?: string; page?: string }>;
}) {
  const p = await searchParams;
  const editions = await getEditions();
  const edition = editions.find((e) => e.slug === p.edition) || editions[0];
  const page = pageNumber(p.page);
  const data = edition
    ? await listArticles({ edition: edition.id, page })
    : { articles: [], total: 0 };
  return (
    <div className="container-premium space-y-7 py-10">
      <h1 className="font-display text-5xl">Arquivo por edição</h1>
      <ParticipantNav />
      <nav aria-label="Edições" className="flex flex-wrap gap-3">
        {editions.map((e) => (
          <Link
            className="sis-button"
            key={e.id}
            href={"?edition=" + e.slug}
            aria-current={e.id === edition?.id ? "page" : undefined}
          >
            {e.title}
          </Link>
        ))}
      </nav>
      {edition ? (
        <>
          <h2 className="font-display text-3xl">{edition.title}</h2>
          <div className="flex gap-5 text-gold">
            <Link href={"/agenda?edition=" + edition.id}>
              Sessões da edição
            </Link>
            <Link href={"/biblioteca?edition=" + edition.id}>
              Documentos da edição
            </Link>
            {edition.slug === "2026" ? (
              <Link href="/dossies">Dossiês de 2026</Link>
            ) : null}
          </div>
        </>
      ) : null}
      {data.articles.length ? (
        <div className="grid gap-6 md:grid-cols-3">
          {data.articles.map((a) => (
            <ArticleCard article={a} key={a.id} />
          ))}
        </div>
      ) : (
        <p className="card-border p-8">
          Ainda não há matérias públicas nesta página da edição.
        </p>
      )}
      <Pagination
        page={page}
        total={data.total}
        base="/arquivo"
        params={{ edition: edition?.slug || "" }}
      />
    </div>
  );
}
