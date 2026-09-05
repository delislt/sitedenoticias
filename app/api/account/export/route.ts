import { requireAccess } from "@/lib/auth";
import { failure, databaseError } from "@/lib/http";
export async function GET() {
  try {
    const { db } = await requireAccess();
    const { data, error } = await db.rpc("sis_account_export");
    if (error) throw databaseError(error);
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="meus-dados-sis.json"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
