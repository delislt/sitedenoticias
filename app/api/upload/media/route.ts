import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAccess } from "@/lib/auth";
import { privilegedClient } from "@/utils/supabase/privileged";
import {
  sameOrigin,
  boundedJson,
  HttpError,
  databaseError,
  failure,
} from "@/lib/http";
import { issueUploadTicket, verifyUploadTicket } from "@/lib/upload-ticket";
import { validateVideo } from "@/lib/video-validation";
import { validateImage } from "@/lib/upload-validation";
import { MAX_VIDEO_BYTES, MAX_IMAGE_BYTES } from "@/lib/media-limits";

const inputSchema = z.discriminatedUnion("stage", [
  z
    .object({
      stage: z.literal("prepare"),
      kind: z.enum(["image", "video"]),
      bytes: z.number().int().min(1).max(MAX_VIDEO_BYTES),
    })
    .strict(),
  z
    .object({ stage: z.literal("finish"), ticket: z.string().max(1000) })
    .strict(),
]);

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { db, user } = await requireAccess("journalist", "editor");
    const parsed = inputSchema.safeParse(await boundedJson(request, 2048));
    if (!parsed.success)
      throw new HttpError(
        400,
        "Envie imagem de até 15 MB ou vídeo de até 30 MB.",
      );
    const input = parsed.data;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new HttpError(503, "Serviço de arquivos indisponível.");
    const privileged = privilegedClient();
    const storage = privileged.storage.from("sis-images");
    if (input.stage === "prepare") {
      if (
        input.bytes >
        (input.kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES)
      )
        throw new HttpError(413, "A imagem deve ter até 15 MB.");
      const reservation = await db.rpc("sis_mutate", {
        act: "upload.reserve",
        d: {},
        operation: crypto.randomUUID(),
      });
      if (reservation.error) throw databaseError(reservation.error);
      const id = crypto.randomUUID();
      const path = user!.id + "/pending-" + id + ".upload";
      const signed = await storage.createSignedUploadUrl(path, {
        upsert: false,
      });
      if (signed.error || !signed.data)
        throw new HttpError(503, "Não foi possível preparar o envio.");
      return NextResponse.json(
        {
          path,
          token: signed.data.token,
          ticket: issueUploadTicket(id, user!.id, input.kind, key),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const { id, kind } = verifyUploadTicket(input.ticket, user!.id, key);
    const path = user!.id + "/" + id + (kind === "image" ? ".webp" : ".mp4");
    const pending = user!.id + "/pending-" + id + ".upload";
    const maximum = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    const mime = kind === "image" ? "image/webp" : "video/mp4";
    const completed = await privileged
      .from("media_assets")
      .select("id")
      .eq("id", id)
      .eq("owner_id", user!.id)
      .maybeSingle();
    if (completed.error) throw databaseError(completed.error);
    if (!completed.data) {
      const downloaded = await storage.download(pending);
      if (downloaded.error || !downloaded.data)
        throw new HttpError(
          503,
          "O arquivo ainda não foi recebido. Tente novamente.",
        );
      let bytes: Buffer;
      try {
        if (downloaded.data.size > maximum)
          throw new HttpError(
            413,
            kind === "image"
              ? "A imagem deve ter até 15 MB."
              : "O vídeo deve ter até 30 MB.",
          );
        const source = Buffer.from(await downloaded.data.arrayBuffer());
        bytes =
          kind === "image"
            ? await validateImage(source)
            : validateVideo(source);
      } catch (error) {
        await storage.remove([pending]);
        throw error;
      }
      // Publish only the validated copy. The browser's upload token can never
      // replace this final path, even if the temporary token is reused.
      const uploaded = await storage.upload(path, bytes, {
        contentType: mime,
        upsert: false,
        cacheControl: "60",
      });
      if (uploaded.error)
        throw new HttpError(
          503,
          "Não foi possível concluir o arquivo. Tente novamente.",
        );
      const registered = await privileged.from("media_assets").insert({
        id,
        owner_id: user!.id,
        bucket: "sis-images",
        path,
        mime,
        bytes: bytes.length,
      });
      if (registered.error) {
        await storage.remove([path]);
        throw new HttpError(
          503,
          "Não foi possível registrar o arquivo. Tente novamente.",
        );
      }
      await storage.remove([pending]);
    }
    return NextResponse.json(
      { id, url: "/api/media/" + id, media_type: kind },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("media_upload_failed", {
      error: error instanceof Error ? error.name : "UnknownError",
      status: error instanceof HttpError ? error.status : 503,
    });
    return failure(error);
  }
}
