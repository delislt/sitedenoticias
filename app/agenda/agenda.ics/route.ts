import { agenda } from "@/lib/agenda";
import { calendar } from "@/lib/ics";
import { siteUrl } from "@/lib/domain";
import { failure } from "@/lib/http";
import { generalCalendarDays } from "@/lib/sis-schedule";
export async function GET(request: Request) {
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const { sessions } = await agenda({ ...params, page: "1" }, 300);
    const events = [...generalCalendarDays(params), ...sessions].sort(
      (a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at),
    );
    return new Response(calendar(events, siteUrl), {
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
