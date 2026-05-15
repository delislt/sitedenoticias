import { createClient } from '@/utils/supabase/client';
import type { Article, Category } from '@/data/news';

export type DbArticle = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: Category;
  author: string;
  published_at: string;
  reading_time: string;
  cover_image: string;
  featured: boolean;
  content: { paragraphs: string[] };
  created_at: string;
};

/** Grava a hora atual no fuso de Brasília como string local (sem Z) */
function nowBrasilia(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  // sv-SE produz "2026-05-14 20:55:00"
  return formatter.format(now).replace(' ', 'T');
}

/**
 * Formata data para exibição.
 * Strings sem timezone (ex: "2026-05-14T20:55:00") são extraídas via regex
 * sem passar pelo Date() — evita conversão de fuso no servidor Node.
 */
function toBrDateTime(dateStr: string): string {
  if (!dateStr) return '';

  const localMatch = dateStr.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/
  );
  if (localMatch) {
    const [, y, m, d, h, min] = localMatch;
    return `${d}/${m}/${y} ${h}:${min}`;
  }

  // String com timezone (ex: "2026-05-14T23:55:00.000Z") — converte para Brasília
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

export function dbToArticle(db: DbArticle): Article {
  return {
    slug: db.slug,
    title: db.title,
    subtitle: db.subtitle,
    category: db.category,
    author: db.author,
    date: toBrDateTime(db.published_at ?? db.created_at),
    readingTime: db.reading_time ?? '',
    coverImage: db.cover_image ?? '',
    featured: db.featured ?? false,
    content: db.content?.paragraphs ?? [],
    created_at: db.created_at,
  };
}

function getSupabase() {
  return createClient();
}

export async function fetchAllArticles(): Promise<Article[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('fetchAllArticles error:', error);
    return [];
  }
  return (data as DbArticle[]).map(dbToArticle);
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return dbToArticle(data as DbArticle);
}

export async function createArticle(article: Article): Promise<void> {
  const supabase = getSupabase();
  const payload = {
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle,
    category: article.category,
    author: article.author,
    published_at: nowBrasilia(),
    reading_time: article.readingTime,
    cover_image: article.coverImage,
    featured: article.featured ?? false,
    content: { paragraphs: article.content },
  };
  const { error } = await supabase.from('articles').insert([payload]);
  if (error) {
    console.error('createArticle error:', JSON.stringify(error));
    throw new Error(error.message || error.details || JSON.stringify(error));
  }
}

export async function updateArticle(slug: string, article: Article): Promise<void> {
  const supabase = getSupabase();
  const payload = {
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle,
    category: article.category,
    author: article.author,
    reading_time: article.readingTime,
    cover_image: article.coverImage,
    featured: article.featured ?? false,
    content: { paragraphs: article.content },
  };
  const { error } = await supabase
    .from('articles')
    .update(payload)
    .eq('slug', slug);
  if (error) {
    console.error('updateArticle error:', JSON.stringify(error));
    throw new Error(error.message || error.details || JSON.stringify(error));
  }
}

export async function deleteArticle(slug: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('articles').delete().eq('slug', slug);
  if (error) throw new Error(error.message);
}

export async function uploadCoverImage(file: File): Promise<string> {
  const supabase = getSupabase();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const filename = `cover-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('article-images')
    .upload(filename, file, { upsert: true, contentType: file.type });
  if (error) {
    throw new Error('Erro no upload: ' + error.message);
  }
  const { data } = supabase.storage.from('article-images').getPublicUrl(filename);
  return data.publicUrl;
}
