import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { sameOrigin } from "@/lib/http";
import { siteUrl } from "@/lib/domain";
export async function POST(request: Request) {
  let confirmed = false;
  const db = createClient(await cookies());
  try {
    sameOrigin(request);
    // A POST prevents email link scanners from consuming the one-time token.
    const reader = request.body?.getReader();
    if (!reader) throw new Error("missing body");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const r = await reader.read();
      if (r.done) break;
      size += r.value.length;
      if (size > 2048) {
        await reader.cancel();
        throw new Error("body too large");
      }
      chunks.push(r.value);
    }
    const token_hash =
      new URLSearchParams(Buffer.concat(chunks).toString("utf8")).get(
        "token_hash",
      ) || "";
    if (!/^[A-Za-z0-9_-]{20,512}$/.test(token_hash))
      throw new Error("invalid token");
    const { error } = await db.auth.verifyOtp({ token_hash, type: "recovery" });
    confirmed = !error;
  } catch {
    confirmed = false;
  }
  return NextResponse.redirect(
    new URL(
      confirmed ? "/conta/senha" : "/conta/esqueci-senha?error=expired",
      siteUrl,
    ),
    303,
  );
}
