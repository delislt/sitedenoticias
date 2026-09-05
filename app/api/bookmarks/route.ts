import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth";
import { failure, databaseError } from "@/lib/http";
export async function GET() {
  try {
    const { db } = await requireAccess();
    const { data, error } = await db
      .from("bookmarks")
      .select("article:articles(id,slug,title,category)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw databaseError(error);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
