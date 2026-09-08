import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { privilegedClient } from "@/utils/supabase/privileged";
import { databaseError, failure } from "@/lib/http";

const bucket = "sis-avatars";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!z.uuid().safeParse(id).success)
      return new Response(null, { status: 404 });

    const db = createClient(await cookies());
    const visible = await db
      .from("comments")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (visible.error) throw databaseError(visible.error);
    if (!visible.data) return new Response(null, { status: 404 });

    const admin = privilegedClient();
    const comment = await admin
      .from("comments")
      .select("author_id")
      .eq("id", id)
      .maybeSingle();
    if (comment.error) throw databaseError(comment.error);
    if (!comment.data?.author_id)
      return new Response(null, { status: 404 });

    const avatar = await admin.storage
      .from(bucket)
      .download(comment.data.author_id + "/avatar.webp");
    if (avatar.error || !avatar.data)
      return new Response(null, { status: 404 });

    return new Response(avatar.data, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return failure(error);
  }
}
