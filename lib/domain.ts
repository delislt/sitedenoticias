export const roles = ["journalist", "editor", "moderator", "admin"] as const;
export type Role = (typeof roles)[number];
export type Access = {
  user_id: string | null;
  verified?: boolean;
  primary_valid?: boolean;
  email_otp_verified?: boolean;
  display_name?: string | null;
  roles: Role[];
  suspended?: boolean;
};
export const roleLabels: Record<Role, string> = {
  journalist: "Jornalista",
  editor: "Editor",
  moderator: "Moderador",
  admin: "Administrador",
};
export const kindLabels = {
  simulation: "Cobertura da simulação",
  context: "Contexto histórico",
  opinion: "Opinião sobre a simulação",
  official: "Comunicado da organização",
} as const;
export type ArticleKind = keyof typeof kindLabels;
export const statusLabels = {
  draft: "Rascunho",
  review: "Em revisão",
  published: "Publicado",
  archived: "Arquivado",
} as const;
export type PublicationStatus = keyof typeof statusLabels;
export type Source = { title: string; url: string };
export type Settings = {
  comments_enabled: boolean;
  moderation_ready: boolean;
  premoderation: boolean;
  readers_enabled: boolean;
};
export type Edition = {
  id: string;
  slug: string;
  title: string;
  year: number;
  published: boolean;
  version: number;
};
export type Session = {
  id: string;
  edition_id: string;
  category: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: string;
  summary: string;
  published: boolean;
  version: number;
  updated_at: string;
  location?: string;
  location_public?: boolean;
};
export type Comment = {
  id: string;
  article_id: string;
  parent_id: string | null;
  display_name: string;
  team_badge: boolean;
  body: string;
  status: string;
  created_at: string;
  edited_at: string | null;
  version: number;
  author_id?: string;
  article_title?: string;
  article_slug?: string;
  reports?: { reason: string; created_at: string }[];
};
export function can(access: Access, ...wanted: Role[]) {
  return (
    access.verified === true &&
    (access.roles.includes("admin") ||
      wanted.some((r) => access.roles.includes(r)))
  );
}
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sisnoticias.vercel.app";
export function formatDate(value?: string | null, withTime = true) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? ({ hour: "2-digit", minute: "2-digit" } as const) : {}),
  }).format(date);
}
export function readingMinutes(paragraphs: string[]) {
  return Math.max(
    1,
    Math.ceil(paragraphs.join(" ").split(/\s+/).filter(Boolean).length / 200),
  );
}
export function safeReturn(value: unknown) {
  return typeof value === "string" &&
    !/%(?:2f|5c|0d|0a|25)/i.test(value) &&
    /^\/(?!\/)[a-zA-Z0-9/?#=&%_.-]*$/.test(value)
    ? value
    : "/";
}
export function pageNumber(value: unknown) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 10000) : 1;
}

export function calendarDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return "";
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? value
    : "";
}
