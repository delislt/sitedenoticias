import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth";
import { failure, databaseError, HttpError } from "@/lib/http";
import { pageNumber } from "@/lib/domain";
const columns: Record<string, string> = {
  edition: "id,slug,title,year,published,version,updated_at",
  update:
    "id,session_id,body,author,article_id,result,organization_confirmed,correction_note,published,version,created_at,updated_at",
  document:
    "id,edition_id,category,title,description,kind,document_version,responsible,asset_id,audience,published,organization_confirmed,version,updated_at",
  announcement: "id,edition_id,title,body,published,version,updated_at",
};
const tables = {
  edition: "editions",
  session: "sessions",
  update: "session_updates",
  document: "documents",
  announcement: "announcements",
} as const;
export async function GET(request: Request) {
  try {
    const { db } = await requireAccess("editor");
    const p = new URL(request.url).searchParams;
    const kind = p.get("kind") as keyof typeof tables;
    const page = pageNumber(p.get("page"));
    if (!Object.hasOwn(tables, kind))
      throw new HttpError(400, "Recurso inválido.");
    if (kind === "session") {
      const { data, error } = await db.rpc("sis_dashboard", {
        kind: "sessions",
        pg: page,
        query: "",
      });
      if (error) throw databaseError(error);
      return NextResponse.json(data, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }
    const { data, error } = await db
      .from(tables[kind])
      .select(columns[kind])
      .order("updated_at", { ascending: false })
      .range((page - 1) * 30, page * 30 - 1);
    if (error) throw databaseError(error);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
