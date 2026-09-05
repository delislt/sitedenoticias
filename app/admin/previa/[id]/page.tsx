/* eslint-disable @next/next/no-img-element -- Private previews need session cookies; article images retain their natural proportions. */
import { notFound } from "next/navigation";
import { requireStaffPage } from "@/lib/auth";
import { detailFields } from "@/lib/supabase-articles";
import { databaseError } from "@/lib/http";
import { kindLabels, formatDate } from "@/lib/domain";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { db } = await requireStaffPage("journalist", "editor");
  const { id } = await params;
  const { data, error } = await db
    .from("articles")
    .select(detailFields)
    .eq("id", id)
    .maybeSingle();
  if (error) throw databaseError(error);
  if (!data) notFound();
  return (
    <article className="container-premium mx-auto max-w-4xl space-y-6 py-10">
      <p className="card-border p-4 text-gold">
        Prévia protegida · {data.status} · revisão {data.version}
      </p>
      <p>{kindLabels[data.kind as keyof typeof kindLabels]}</p>
      <h1 className="font-display text-5xl">{data.title}</h1>
      <p className="text-xl">{data.subtitle}</p>
      <p>
        {data.author} · {formatDate(data.updated_at)}
      </p>
      {data.cover_image ? (
        <>
          <img
            src={data.cover_image}
            alt={data.title}
            className="h-auto w-full"
          />
        </>
      ) : null}
      <div className="article-content space-y-6 text-justify text-lg">
        {data.content.paragraphs.map((p: string, i: number) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}
