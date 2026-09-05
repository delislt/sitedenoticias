import "server-only";
import { cache } from "react";
import { publicClient } from "@/utils/supabase/public";
import type { Article, Category } from "@/data/news";
import type { ArticleKind, PublicationStatus, Source } from "@/lib/domain";
import { formatDate, readingMinutes } from "@/lib/domain";
import { databaseError } from "@/lib/http";
export type DbArticle = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: Category;
  author: string;
  published_at: string | null;
  updated_at: string;
  created_at: string;
  reading_time: string;
  cover_image: string;
  content?: { paragraphs: string[] };
  featured: boolean;
  kind: ArticleKind;
  status: PublicationStatus;
  tags: string[];
  sources: Source[];
  image_credit: string;
  correction_note: string;
  comments_open: boolean;
  version: number;
  edition_id: string;
  author_id: string | null;
  total?: number;
};
export const listFields =
  "id,slug,title,subtitle,category,author,published_at,updated_at,reading_time,cover_image,featured,kind,tags,edition_id";
export const detailFields =
  "id,slug,title,subtitle,category,author,published_at,updated_at,reading_time,cover_image,featured,kind,tags,edition_id,content,created_at,status,sources,image_credit,correction_note,comments_open,version,author_id";
export function dbToArticle(db: DbArticle): Article {
  return {
    id: db.id,
    slug: db.slug,
    title: db.title,
    subtitle: db.subtitle,
    category: db.category,
    author: db.author,
    date: formatDate(db.published_at),
    readingTime: db.content
      ? readingMinutes(db.content.paragraphs) + " min"
      : db.reading_time,
    coverImage: db.cover_image,
    featured: db.featured,
    content: db.content?.paragraphs || [],
    created_at: db.created_at,
    published_at: db.published_at || undefined,
    updated_at: db.updated_at,
    kind: db.kind,
    tags: db.tags,
    sources: db.sources,
    image_credit: db.image_credit,
    correction_note: db.correction_note,
    comments_open: db.comments_open,
    edition_id: db.edition_id,
  };
}
export async function listArticles(
  options: {
    q?: string;
    category?: string;
    from?: string;
    to?: string;
    edition?: string;
    page?: number;
    size?: number;
  } = {},
) {
  const { data, error } = await publicClient().rpc("sis_search", {
    q: options.q || "",
    committee: options.category || "",
    from_date: options.from || null,
    to_date: options.to || null,
    edition: options.edition || null,
    pg: options.page || 1,
    per_page: options.size || 12,
  });
  if (error) throw databaseError(error);
  const rows = data as DbArticle[];
  return {
    articles: rows.map(dbToArticle),
    total: Number(rows[0]?.total || 0),
  };
}
export const fetchArticleBySlug = cache(
  async (slug: string): Promise<Article | null> => {
    const { data, error } = await publicClient()
      .from("articles")
      .select(detailFields)
      .eq("slug", slug)
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();
    if (error) throw databaseError(error);
    return data ? dbToArticle(data as DbArticle) : null;
  },
);
export async function oldSlugTarget(slug: string) {
  const db = publicClient();
  const alias = await db
    .from("article_slugs")
    .select("article_id")
    .eq("slug", slug)
    .maybeSingle();
  if (alias.error) throw databaseError(alias.error);
  if (!alias.data) return null;
  const article = await db
    .from("articles")
    .select("slug")
    .eq("id", alias.data.article_id)
    .maybeSingle();
  if (article.error) throw databaseError(article.error);
  return article.data?.slug || null;
}
export async function articleContext(article: Article) {
  const db = publicClient();
  const base = () =>
    db
      .from("articles")
      .select(listFields)
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .neq("id", article.id!);
  const [older, newer, related] = await Promise.all([
    base()
      .or(
        "published_at.lt." +
          article.published_at +
          ",and(published_at.eq." +
          article.published_at +
          ",id.lt." +
          article.id +
          ")",
      )
      .order("published_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1),
    base()
      .or(
        "published_at.gt." +
          article.published_at +
          ",and(published_at.eq." +
          article.published_at +
          ",id.gt." +
          article.id +
          ")",
      )
      .order("published_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(1),
    base()
      .eq("category", article.category)
      .order("published_at", { ascending: false })
      .limit(12),
  ]);
  for (const r of [older, newer, related])
    if (r.error) throw databaseError(r.error);
  const items = (related.data as DbArticle[])
    .sort(
      (a, b) =>
        (b.tags?.filter((t) => article.tags?.includes(t)).length || 0) -
        (a.tags?.filter((t) => article.tags?.includes(t)).length || 0),
    )
    .slice(0, 3);
  return {
    previous: older.data?.[0] ? dbToArticle(older.data[0] as DbArticle) : null,
    next: newer.data?.[0] ? dbToArticle(newer.data[0] as DbArticle) : null,
    related: items.map(dbToArticle),
  };
}
