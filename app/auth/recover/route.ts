import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const target = request.nextUrl.clone();
  target.pathname = "/auth/confirm";
  target.searchParams.set("type", "recovery");
  return NextResponse.redirect(target);
}
