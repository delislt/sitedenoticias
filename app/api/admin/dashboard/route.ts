import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth";
import { failure, databaseError } from "@/lib/http";
import { pageNumber } from "@/lib/domain";
export async function GET(request: Request) {
  try {
    const { db } = await requireAccess("journalist", "editor", "moderator");
    const p = new URL(request.url).searchParams;
    const { data, error } = await db.rpc("sis_dashboard", {
      kind: p.get("kind") || "audit",
      pg: pageNumber(p.get("page")),
      query: (p.get("q") || "").slice(0, 100),
    });
    if (error) throw databaseError(error);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
