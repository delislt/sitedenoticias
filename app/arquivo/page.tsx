import { ParticipantNav } from "@/components/ParticipantNav";
import { listArticles } from "@/lib/supabase-articles";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import { pageNumber } from "@/lib/domain";
export const metadata = { title: "Notícias do SIS | Jornal SIS" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = pageNumber((await searchParams).page);
  const data = await listArticles({ page });
  return (
    <div className="container-premium space-y-7 py-10">
      <h1 className="font-display text-5xl">Notícias do SIS</h1>
      <ParticipantNav />
      {data.articles.length ? (
        <div className="grid gap-6 md:grid-cols-3">
          {data.articles.map((a) => (
            <ArticleCard article={a} key={a.id} />
          ))}
        </div>
      ) : (
        <p className="card-border p-8">
          Ainda não há matérias publicadas nesta página.
        </p>
      )}
      <Pagination page={page} total={data.total} base="/arquivo" params={{}} />
    </div>
  );
}
