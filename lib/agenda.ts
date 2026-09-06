import "server-only";
import { publicClient } from "@/utils/supabase/public";
import { unwrap } from "@/lib/resources";
import { categoryLabels } from "@/data/news";
import { pageNumber, calendarDate, type Session } from "@/lib/domain";
export const sessionFields =
  "id,edition_id,category,title,starts_at,ends_at,status,summary,published,version,updated_at";
export async function agenda(p: Record<string, string | undefined>, size = 20) {
  const page = pageNumber(p.page);
  let query = publicClient()
    .from("sessions")
    .select(sessionFields, { count: "exact" })
    .eq("published", true)
    .order("starts_at", { ascending: true })
    .order("id")
    .range((page - 1) * size, page * size - 1);
  if (Object.hasOwn(categoryLabels, p.category || ""))
    query = query.eq("category", p.category);
  if (calendarDate(p.day)) {
    const start = p.day + "T00:00:00-03:00";
    query = query
      .gte("starts_at", start)
      .lt("starts_at", new Date(Date.parse(start) + 86400000).toISOString());
  }
  const result = await query;
  return {
    sessions: unwrap(result) as Session[],
    total: result.count || 0,
    page,
    requestedAt: Date.now(),
  };
}
