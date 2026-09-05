import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth";
import { failure, databaseError, HttpError } from "@/lib/http";
import { detailFields, listFields } from "@/lib/supabase-articles";
import { pageNumber } from "@/lib/domain";
import { z } from "zod";
export async function GET(request: Request) {
  try {
    const { db } = await requireAccess("journalist", "editor");
    const p = new URL(request.url).searchParams;
    const id = p.get("id");
    if (id) {
      if (!z.uuid().safeParse(id).success)
        throw new HttpError(400, "ID inválido.");
      const { data, error } = await db
        .from("articles")
        .select(detailFields)
        .eq("id", id)
        .maybeSingle();
      if (error) throw databaseError(error);
      if (!data) throw new HttpError(404, "Matéria indisponível.");
      return NextResponse.json(data, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }
    const page = pageNumber(p.get("page"));
    let query = db
      .from("articles")
      .select(listFields + ",status,version,author_id", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range((page - 1) * 20, page * 20 - 1);
    const q = (p.get("q") || "").slice(0, 100);
    if (q) query = query.ilike("title", "%" + q.replace(/[%_]/g, "") + "%");
    if (
      ["draft", "review", "published", "archived"].includes(
        p.get("status") || "",
      )
    )
      query = query.eq("status", p.get("status"));
    const { data, error, count } = await query;
    if (error) throw databaseError(error);
    return NextResponse.json(
      { items: data, total: count },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
