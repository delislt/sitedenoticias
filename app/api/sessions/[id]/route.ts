import { NextResponse } from "next/server";
import { publicClient } from "@/utils/supabase/public";
import { failure, databaseError } from "@/lib/http";
import { pageNumber } from "@/lib/domain";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const page = pageNumber(new URL(request.url).searchParams.get("page"));
    const { data, error, count } = await publicClient()
      .from("session_updates")
      .select(
        "id,body,author,created_at,updated_at,correction_note,article:articles(slug,title)",
        { count: "exact" },
      )
      .eq("session_id", id)
      .eq("published", true)
      .order("created_at", { ascending: false })
      .range((page - 1) * 20, page * 20 - 1);
    if (error) throw databaseError(error);
    return NextResponse.json(
      { items: data, total: count },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
