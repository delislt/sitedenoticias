import { articles, type Article, type Category } from '@/data/news';

export const ADMIN_STORAGE_KEY = 'sis_admin_articles_v1';

export type EditableArticle = Article;

export const emptyArticle = (): EditableArticle => ({
  slug: '',
  title: '',
  subtitle: '',
  category: 'juridico',
  author: '',
  date: '',
  readingTime: '',
  coverImage: '',
  content: ['']
});

export function parseArticleBody(contentText: string): string[] {
  return contentText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function stringifyArticleBody(content: string[]): string {
  return content.join('\n\n');
}

export function getDefaultArticles(): EditableArticle[] {
  return articles;
}

export const categories: { value: Category; label: string }[] = [
  { value: 'juridico', label: 'Jurídico' },
  { value: 'csnu', label: 'CSNU' },
  { value: 'historico', label: 'Histórico' }
];
