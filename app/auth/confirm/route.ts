import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { safeReturn } from "@/lib/domain";

export const dynamic = "force-dynamic";

const acceptedTypes = new Set<EmailOtpType>(["email", "recovery"]);

function destination(value: string | null, origin: string, fallback: string) {
  if (!value) return fallback;
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return fallback;
    return safeReturn(url.pathname + url.search);
  } catch {
    return fallback;
  }
}

function errorDestination(type: EmailOtpType | null, code?: string) {
  if (type === "recovery")
    return (
      "/conta/esqueci-senha?error=" +
      (code === "missing" ? "missing" : "expired")
    );
  return (
    "/conta?error=" +
    (code === "missing"
      ? "missing"
      : code === "otp_expired"
        ? "expired"
        : "invalid")
  );
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const rawType = request.nextUrl.searchParams.get("type");
  const type =
    rawType === null
      ? "email"
      : acceptedTypes.has(rawType as EmailOtpType)
        ? (rawType as EmailOtpType)
        : null;
  const fallback = type === "recovery" ? "/conta/senha" : "/conta";
  const next = destination(
    request.nextUrl.searchParams.get("next"),
    request.nextUrl.origin,
    fallback,
  );
  const db = createClient(await cookies());

  const validToken =
    typeof tokenHash === "string" &&
    /^[A-Za-z0-9_-]{20,512}$/.test(tokenHash);

  if (!validToken || !type) {
    const {
      data: { user },
    } = await db.auth.getUser();
    if (user?.email_confirmed_at && type !== "recovery")
      return NextResponse.redirect(new URL(next, request.nextUrl.origin));
    return NextResponse.redirect(
      new URL(
        errorDestination(type, !tokenHash ? "missing" : "invalid"),
        request.nextUrl.origin,
      ),
    );
  }

  const { error } = await db.auth.verifyOtp({ token_hash: tokenHash, type });
  if (!error)
    return NextResponse.redirect(new URL(next, request.nextUrl.origin));

  const {
    data: { user },
  } = await db.auth.getUser();
  if (user?.email_confirmed_at && type === "email")
    return NextResponse.redirect(new URL(next, request.nextUrl.origin));

  return NextResponse.redirect(
    new URL(errorDestination(type, error.code), request.nextUrl.origin),
  );
}
