import { createClient } from '@/utils/supabase/client';
import type { Article, Category } from '@/data/news';

export type DbArticle = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: Category;
  author: string;
  date: string;
  reading_time: string;
  cover_image: string;
  featured: boolean;
  content: string[];
  created_at: string;
};

export function dbToArticle(db: DbArticle): Article {
  return {
    slug: db.slug,
    title: db.title,
    subtitle: db.subtitle,
    category: db.category,
    author: db.author,
    date: db.date,
    readingTime: db.reading_time,
    coverImage: db.cover_image,
    featured: db.featured,
    content: db.content,
  };
}

export function articleToDb(article: Article): Omit<DbArticle, 'id' | 'created_at'> {
  return {
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle,
    category: article.category,
    author: article.author,
    date: article.date,
    reading_time: article.readingTime,
    cover_image: article.coverImage,
    featured: article.featured ?? false,
    content: article.content,
  };
}

export async function fetchAllArticles(): Promise<Article[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DbArticle[]).map(dbToArticle);
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return dbToArticle(data as DbArticle);
}

export async function createArticle(article: Article): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('articles').insert(articleToDb(article));
  if (error) throw error;
}

export async function updateArticle(slug: string, article: Article): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('articles')
    .update(articleToDb(article))
    .eq('slug', slug);
  if (error) throw error;
}

export async function deleteArticle(slug: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('articles').delete().eq('slug', slug);
  if (error) throw error;
}
