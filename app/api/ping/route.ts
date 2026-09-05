import { privilegedClient } from "@/utils/supabase/privileged";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: responseHeaders },
    );
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "Supabase keep-alive is missing required environment variables.",
      );
      return NextResponse.json(
        { ok: false, error: "Server misconfigured" },
        { status: 500, headers: responseHeaders },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error } = await supabase.from("articles").select("id").limit(1);

    if (error) {
      console.error("Supabase keep-alive query failed.", {
        code: error.code,
        message: error.message,
      });
      return NextResponse.json(
        { ok: false, error: "Database query failed" },
        { status: 502, headers: responseHeaders },
      );
    }

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const cleanup = await privilegedClient().rpc("sis_retention_cleanup");
      if (cleanup.error)
        return NextResponse.json(
          { ok: false, error: "Maintenance failed" },
          { status: 503, headers: responseHeaders },
        );
    }
    return NextResponse.json(
      { ok: true, timestamp: new Date().toISOString() },
      { headers: responseHeaders },
    );
  } catch (err: unknown) {
    console.error("Unexpected Supabase keep-alive error.", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500, headers: responseHeaders },
    );
  }
}
