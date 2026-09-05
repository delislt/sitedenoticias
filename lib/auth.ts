import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { type Access, type Role, can } from "@/lib/domain";
import { HttpError } from "@/lib/http";
export const currentSession = cache(async () => {
  const db = createClient(await cookies());
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error && error.status && error.status >= 500)
    throw new HttpError(503, "Autenticação indisponível. Tente novamente.");
  if (!user)
    return { db, user: null, access: { user_id: null, roles: [] } as Access };
  const { data, error: accessError } = await db.rpc("sis_access");
  if (accessError)
    throw new HttpError(503, "Não foi possível verificar as permissões.");
  return { db, user, access: data as Access };
});
export async function requireAccess(...wanted: Role[]) {
  const session = await currentSession();
  if (!session.user)
    throw new HttpError(401, "Entre na sua conta para continuar.");
  if (!session.access.verified)
    throw new HttpError(403, "Confirme seu email para participar.");
  if (wanted.length && !can(session.access, ...wanted))
    throw new HttpError(403, "Sua conta não tem permissão para esta ação.");
  return session;
}

export async function requireStaffPage(...wanted: Role[]) {
  const { redirect } = await import("next/navigation");
  const session = await currentSession();
  if (!session.user) redirect("/admin/login");
  if (!can(session.access, ...wanted)) redirect("/conta?denied=1");
  return session;
}
