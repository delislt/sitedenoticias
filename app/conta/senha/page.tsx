import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PasswordEditor } from "@/components/PasswordEditor";
export const metadata = {
  title: "Alterar senha | Jornal SIS",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const db = createClient(await cookies());
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/conta/esqueci-senha");
  const { data, error } = await db.auth.getClaims();
  if (error || !data) redirect("/conta/esqueci-senha");
  const currentRequired =
    Array.isArray(data.claims.amr) &&
    data.claims.amr.some(
      (m: unknown) =>
        typeof m === "object" &&
        m !== null &&
        "method" in m &&
        m.method === "password",
    );
  return (
    <div className="container-premium max-w-xl space-y-6 py-12">
      <h1 className="font-display text-4xl">Definir nova senha</h1>
      <PasswordEditor currentRequired={currentRequired} />
    </div>
  );
}
