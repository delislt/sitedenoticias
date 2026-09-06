import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { safeReturn } from "@/lib/domain";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeReturn(url.searchParams.get("next"));
  if (code) {
    const db = createClient(await cookies());
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next !== "/conta/senha") {
        const {
          data: { user },
          error: userError,
        } = await db.auth.getUser();
        if (!userError && user && !user.email_confirmed_at)
          return NextResponse.redirect(
            new URL(
              "/conta/verificar-email?next=" + encodeURIComponent(next),
              url.origin,
            ),
          );
      }
      return NextResponse.redirect(
        new URL(
          next === "/conta/senha"
            ? "/conta/senha"
            : "/conta?next=" + encodeURIComponent(next),
          url.origin,
        ),
      );
    }
  }
  return NextResponse.redirect(
    new URL("/conta?error=confirmation", url.origin),
  );
}
