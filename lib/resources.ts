import "server-only";
import { publicClient } from "@/utils/supabase/public";
import { databaseError } from "@/lib/http";
import type { Edition, Settings } from "@/lib/domain";
export async function getSettings(): Promise<Settings> {
  const { data, error } = await publicClient()
    .from("site_settings")
    .select("comments_enabled,moderation_ready,premoderation,readers_enabled")
    .single();
  if (error) throw databaseError(error);
  return data;
}
export async function getEditions(): Promise<Edition[]> {
  const { data, error } = await publicClient()
    .from("editions")
    .select("id,slug,title,year,published,version")
    .eq("published", true)
    .eq("slug", "2026")
    .order("year", { ascending: false })
    .limit(100);
  if (error) throw databaseError(error);
  return data;
}
export function unwrap<T>({
  data,
  error,
}: {
  data: T | null;
  error: { code?: string; message?: string } | null;
}): T {
  if (error) throw databaseError(error);
  if (data === null) throw new Error("Missing result");
  return data;
}
