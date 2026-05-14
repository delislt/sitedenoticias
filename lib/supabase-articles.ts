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

/** Converte DD/MM/AAAA → YYYY-MM-DD para o banco */
function toIsoDate(date: string): string {
  // Se já está no formato ISO, retorna como está
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  // Converte DD/MM/AAAA
  const parts = date.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Fallback: data de hoje
  return new Date().toISOString().split('T')[0];
}

/** Converte YYYY-MM-DD → DD/MM/AAAA para exibição */
function toBrDate(date: string): string {
  if (!date) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
  }
  return date;
}

export function dbToArticle(db: DbArticle): Article {
  return {
    slug: db.slug,
    title: db.title,
    subtitle: db.subtitle,
    category: db.category,
    author: db.author,
    date: toBrDate(db.published_at),
    readingTime: db.reading_time ?? '',
    coverImage: db.cover_image ?? '',
    featured: db.featured ?? false,
    content: db.content?.paragraphs ?? [],
  };
}

export function articleToDb(article: Article): Omit<DbArticle, 'id' | 'created_at'> {
  return {
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle,
    category: article.category,
    author: article.author,
    published_at: toIsoDate(article.date),
    reading_time: article.readingTime,
    cover_image: article.coverImage,
    featured: article.featured ?? false,
    content: { paragraphs: article.content },
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
  const payload = articleToDb(article);
  const { error } = await supabase.from('articles').insert(payload);
  if (error) {
    console.error('createArticle error:', JSON.stringify(error));
    throw new Error(error.message || error.details || JSON.stringify(error));
  }
}

export async function updateArticle(slug: string, article: Article): Promise<void> {
  const supabase = getSupabase();
  const payload = articleToDb(article);
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
