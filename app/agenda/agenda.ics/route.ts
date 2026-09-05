import { agenda } from "@/lib/agenda";
import { calendar } from "@/lib/ics";
import { siteUrl } from "@/lib/domain";
import { failure } from "@/lib/http";
export async function GET(request: Request) {
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const { sessions } = await agenda({ ...params, page: "1" }, 300);
    return new Response(calendar(sessions, siteUrl), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="agenda-sis.ics"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
