export type Category = "juridico" | "csnu" | "historico";

export type Article = {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  category: Category;
  author: string;
  date: string;
  created_at?: string;
  published_at?: string;
  updated_at?: string;
  kind?: import("@/lib/domain").ArticleKind;
  tags?: string[];
  sources?: import("@/lib/domain").Source[];
  image_credit?: string;
  correction_note?: string;
  comments_open?: boolean;
  edition_id?: string;
  readingTime: string;
  coverImage: string;
  featured?: boolean;
  content: string[];
};

export const categoryLabels: Record<Category, string> = {
  juridico: "Jurídico",
  csnu: "CSNU",
  historico: "Histórico",
};

export const articles: Article[] = [];

export const getFeaturedArticles = () =>
  articles.filter((article) => article.featured);

export const getRecentArticles = () =>
  [...articles].sort((a, b) => (a.date < b.date ? 1 : -1));

export const getArticlesByCategory = (category: Category) =>
  articles.filter((article) => article.category === category);
