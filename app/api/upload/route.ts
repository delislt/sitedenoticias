import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth";
import { privilegedClient } from "@/utils/supabase/privileged";
import { sameOrigin, HttpError, databaseError, failure } from "@/lib/http";
import {
  boundedForm,
  validateImage,
  validatePdf,
} from "@/lib/upload-validation";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { db, user } = await requireAccess("journalist", "editor");
    const reservation = await db.rpc("sis_mutate", {
      act: "upload.reserve",
      d: {},
      operation: crypto.randomUUID(),
    });
    if (reservation.error) throw databaseError(reservation.error);
    const form = await boundedForm(request);
    const file = form.get("file");
    const kind = form.get("kind") || "image";
    if (!(file instanceof File) || !["image", "pdf"].includes(String(kind)))
      throw new HttpError(400, "Selecione um arquivo.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const output =
      kind === "pdf" ? await validatePdf(bytes) : await validateImage(bytes);
    const bucket = kind === "pdf" ? "sis-documents" : "sis-images";
    const mime = kind === "pdf" ? "application/pdf" : "image/webp";
    const id = crypto.randomUUID();
    const path = user!.id + "/" + id + (kind === "pdf" ? ".pdf" : ".webp");
    const privileged = privilegedClient();
    const uploaded = await privileged.storage
      .from(bucket)
      .upload(path, output, {
        contentType: mime,
        upsert: false,
        cacheControl: "60",
      });
    if (uploaded.error)
      throw new HttpError(503, "Não foi possível armazenar o arquivo.");
    const registered = await privileged
      .from("media_assets")
      .insert({
        id,
        owner_id: user!.id,
        bucket,
        path,
        mime,
        bytes: output.length,
      });
    if (registered.error) {
      await privileged.storage.from(bucket).remove([path]);
      throw new HttpError(503, "Não foi possível registrar o arquivo.");
    }
    return NextResponse.json(
      { id, url: "/api/media/" + id },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
