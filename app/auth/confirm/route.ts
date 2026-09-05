import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { safeReturn } from "@/lib/domain";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  if (token_hash && type === "email") {
    const { error } = await createClient(await cookies()).auth.verifyOtp({
      token_hash,
      type: "email",
    });
    if (!error)
      return NextResponse.redirect(
        new URL(
          "/conta?next=" +
            encodeURIComponent(safeReturn(url.searchParams.get("next"))),
          url.origin,
        ),
      );
  }
  return NextResponse.redirect(
    new URL("/conta?error=confirmation", url.origin),
  );
}
