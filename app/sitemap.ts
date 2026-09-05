import type { MetadataRoute } from "next";
import { publicClient } from "@/utils/supabase/public";
import { siteUrl } from "@/lib/domain";
import { databaseError } from "@/lib/http";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = [
    "",
    "/sobre",
    "/dossies",
    "/participante",
    "/agenda",
    "/biblioteca",
    "/glossario",
    "/arquivo",
    ...["juridico", "csnu", "historico"].flatMap((c) => [
      "/categoria/" + c,
      "/comite/" + c,
    ]),
  ];
  const result: MetadataRoute.Sitemap = paths.map((p) => ({
    url: siteUrl + p,
  }));
  for (let page = 0; page < 100; page++) {
    const { data, error } = await publicClient()
      .from("articles")
      .select("slug,updated_at")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("id")
      .range(page * 500, (page + 1) * 500 - 1);
    if (error) throw databaseError(error);
    result.push(
      ...data.map((a) => ({
        url: siteUrl + "/artigo/" + a.slug,
        lastModified: a.updated_at,
      })),
    );
    if (data.length < 500) break;
  }
  return result;
}
