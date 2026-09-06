import { NextResponse } from "next/server";
import { publicClient } from "@/utils/supabase/public";
import { sameOrigin } from "@/lib/http";
import { siteUrl } from "@/lib/domain";
export async function POST(request: Request) {
  let confirmed = false;
  const db = publicClient();
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
    if (!/^[a-f0-9]{40,128}$/i.test(token_hash))
      throw new Error("invalid token");
    const { error } = await db.auth.verifyOtp({ token_hash, type: "email" });
    confirmed = !error;
  } catch {
    confirmed = false;
  } finally {
    await db.auth.signOut({ scope: "local" });
  }
  return NextResponse.redirect(
    new URL(
      confirmed ? "/conta?confirmed=1" : "/conta?error=confirmation",
      siteUrl,
    ),
    303,
  );
}
