import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { safeReturn } from "@/lib/domain";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await createClient(
      await cookies(),
    ).auth.exchangeCodeForSession(code);
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
