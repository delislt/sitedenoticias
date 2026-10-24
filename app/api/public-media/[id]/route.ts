import sharp from "sharp";
import { z } from "zod";
import { publicClient } from "@/utils/supabase/public";
import { databaseError, failure, HttpError } from "@/lib/http";

export const runtime = "nodejs";

// This endpoint never uses cookies or a privileged key: RLS must allow anonymous
// access before any bytes may enter the shared cache. Revocation takes <=60s.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!z.uuid().safeParse(id).success)
      throw new HttpError(404, "Arquivo indisponível.");
    const width = new URL(request.url).searchParams.get("w") || "1600";
    if (!["640", "1600"].includes(width))
      throw new HttpError(400, "Tamanho inválido.");
    const db = publicClient();
    const asset = await db
      .from("media_assets")
      .select("bucket,path,mime")
      .eq("id", id)
      .maybeSingle();
    if (asset.error) throw databaseError(asset.error);
    if (
      !asset.data ||
      !/^(image\/(webp|jpeg|png)|video\/mp4)$/.test(asset.data.mime)
    )
      throw new HttpError(404, "Arquivo indisponível.");
    const signed = await db.storage
      .from(asset.data.bucket)
      .createSignedUrl(asset.data.path, 60);
    if (signed.error || !signed.data)
      throw new HttpError(404, "Arquivo indisponível.");
    const headers = new Headers();
    const range = request.headers.get("range");
    if (range && asset.data.mime === "video/mp4") headers.set("Range", range);
    const upstream = await fetch(signed.data.signedUrl, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    if (!upstream.ok && upstream.status !== 416)
      throw new HttpError(503, "Arquivo temporariamente indisponível.");
    const outputHeaders = new Headers({
      "Content-Type": asset.data.mime,
      "Cache-Control": upstream.ok
        ? "public, max-age=60, s-maxage=60, must-revalidate"
        : "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    if (asset.data.mime.startsWith("image/")) {
      const output = await sharp(Buffer.from(await upstream.arrayBuffer()), {
        limitInputPixels: 40000000,
      })
        .rotate()
        .resize({ width: Number(width), withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      outputHeaders.set("Content-Type", "image/webp");
      outputHeaders.set("Content-Length", String(output.length));
      return new Response(new Uint8Array(output), { headers: outputHeaders });
    }
    for (const name of [
      "content-length",
      "content-range",
      "accept-ranges",
      "etag",
      "last-modified",
    ]) {
      const value = upstream.headers.get(name);
      if (value) outputHeaders.set(name, value);
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: outputHeaders,
    });
  } catch (error) {
    return failure(error);
  }
}
