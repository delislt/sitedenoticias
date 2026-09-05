import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { failure } from "@/lib/http";
export async function GET() {
  try {
    return NextResponse.json((await currentSession()).access, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
