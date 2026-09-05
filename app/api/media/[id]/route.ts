import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { failure, HttpError, databaseError } from "@/lib/http";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!z.uuid().safeParse(id).success)
      throw new HttpError(404, "Arquivo indisponível.");
    const db = createClient(await cookies());
    const asset = await db
      .from("media_assets")
      .select("bucket,path,mime")
      .eq("id", id)
      .maybeSingle();
    if (asset.error) throw databaseError(asset.error);
    if (!asset.data)
      throw new HttpError(404, "Arquivo indisponível ou sem permissão.");
    const { data, error } = await db.storage
      .from(asset.data.bucket)
      .createSignedUrl(asset.data.path, 60, {
        download: asset.data.mime === "application/pdf",
      });
    if (error || !data)
      throw new HttpError(403, "Arquivo indisponível ou sem permissão.");
    return new Response(null, {
      status: 307,
      headers: {
        Location: data.signedUrl,
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
