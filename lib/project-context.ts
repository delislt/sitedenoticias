import type { Article, Category } from '@/data/news';

const TEAM_ARTICLE_PATTERN = /equipe|imprensa|jornalismo/i;

const NAME_SEGMENT_PATTERNS: Record<Category, RegExp[]> = {
  juridico: [
    /(?:da\s+)?esquerda\s+(?:para|pra)\s+(?:a\s+)?direita\)?\s*:\s*(.+?)\s+será\s+responsável/i,
  ],
  csnu: [
    /equipe,?\s+formada\s+por\s+(.+?),?\s+tem\s+como\s+objetivo/i,
  ],
  historico: [
    /(?:da\s+)?esquerda\s+(?:para|pra)\s+(?:a\s+)?direita\s*:\s*(.+?)\)/i,
  ],
};

function splitNames(value: string): string[] {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s*(?:,|\be\b)\s*/i)
    .map((name) => name.trim())
    .filter((name) => name.split(/\s+/).length >= 2);
}

export function getCoverageArticle(
  articles: Article[],
  category: Category,
): Article | null {
  return (
    articles.find(
      (article) =>
        article.category === category &&
        TEAM_ARTICLE_PATTERN.test(`${article.title} ${article.subtitle}`),
    ) ?? null
  );
}

export function getCoverageTeamMembers(article: Article): string[] {
  const content = article.content.join(' ');

  for (const pattern of NAME_SEGMENT_PATTERNS[article.category]) {
    const match = content.match(pattern);
    if (match?.[1]) return splitNames(match[1]);
  }

  return splitNames(article.author);
}

export function getConsolidatedTeamMembers(articles: Article[]): string[] {
  const uniqueNames = new Map<string, string>();

  (['juridico', 'csnu', 'historico'] satisfies Category[]).forEach(
    (category) => {
      const article = getCoverageArticle(articles, category);
      if (!article) return;

      getCoverageTeamMembers(article).forEach((name) => {
        uniqueNames.set(name.toLocaleLowerCase('pt-BR'), name);
      });
    },
  );

  return Array.from(uniqueNames.values());
}
