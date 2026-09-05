import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { failure, HttpError, databaseError } from "@/lib/http";
import { pageNumber } from "@/lib/domain";
const fields =
  "id,article_id,parent_id,display_name,team_badge,body,status,created_at,edited_at,version";
export async function GET(request: Request) {
  try {
    const p = new URL(request.url).searchParams;
    const id = p.get("article");
    if (!z.uuid().safeParse(id).success)
      throw new HttpError(400, "Matéria inválida.");
    const db = createClient(await cookies());
    const {
      data: { user },
    } = await db.auth.getUser();
    const page = pageNumber(p.get("page"));
    const ascending = p.get("order") === "oldest";
    const [result, own, settings, focus] = await Promise.all([
      db
        .from("comments")
        .select(fields, { count: "exact" })
        .eq("article_id", id)
        .eq("status", "approved")
        .order("created_at", { ascending })
        .order("id", { ascending })
        .range((page - 1) * 20, page * 20 - 1),
      user
        ? db
            .from("comments")
            .select(fields)
            .eq("article_id", id)
            .eq("author_id", user.id)
            .neq("status", "removed")
            .order("created_at", { ascending: false })
            .limit(30)
        : Promise.resolve({ data: [], error: null }),
      db
        .from("site_settings")
        .select("comments_enabled,moderation_ready,premoderation")
        .single(),
      z.uuid().safeParse(p.get("focus")).success
        ? db
            .from("comments")
            .select(fields)
            .eq("article_id", id)
            .eq("id", p.get("focus")!)
            .eq("status", "approved")
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    for (const r of [result, own, settings, focus])
      if (r.error) throw databaseError(r.error);
    return NextResponse.json(
      {
        items: result.data,
        own: own.data,
        total: result.count,
        page,
        settings: settings.data,
        focus: focus.data,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
