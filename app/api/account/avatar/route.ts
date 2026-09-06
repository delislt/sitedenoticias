import sharp from "sharp";
import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth";
import { privilegedClient } from "@/utils/supabase/privileged";
import { sameOrigin, HttpError, databaseError, failure } from "@/lib/http";
import { boundedForm, validateImage } from "@/lib/upload-validation";
const bucket = "sis-avatars";
export async function GET() {
  try {
    const { db, user } = await requireAccess();
    const { data, error } = await db.storage
      .from(bucket)
      .download(user!.id + "/avatar.webp");
    if (error || !data)
      return new Response(null, {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    return new Response(data, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { db, user } = await requireAccess();
    const reservation = await db.rpc("sis_avatar_reserve");
    if (reservation.error) throw databaseError(reservation.error);
    const file = (await boundedForm(request)).get("file");
    if (!(file instanceof File))
      throw new HttpError(400, "Selecione uma foto.");
    const validated = await validateImage(
      Buffer.from(await file.arrayBuffer()),
    );
    const image = await sharp(validated)
      .resize(512, 512, { fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();
    const { error } = await privilegedClient()
      .storage.from(bucket)
      .upload(user!.id + "/avatar.webp", image, {
        contentType: "image/webp",
        upsert: true,
        cacheControl: "0",
      });
    if (error)
      throw new HttpError(
        503,
        "Não foi possível salvar a foto. Tente novamente.",
      );
    return NextResponse.json(
      { saved: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const { user } = await requireAccess();
    const { error } = await privilegedClient()
      .storage.from(bucket)
      .remove([user!.id + "/avatar.webp"]);
    if (error) throw new HttpError(503, "Não foi possível remover a foto.");
    return NextResponse.json(
      { removed: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
