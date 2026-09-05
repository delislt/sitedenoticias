import { redirect } from "next/navigation";
import { currentSession } from "@/lib/auth";
import { can } from "@/lib/domain";
import { getEditions } from "@/lib/resources";
import { AdminNewsManager } from "@/components/admin/AdminNewsManager";
import { LogoutButton } from "@/components/admin/LogoutButton";
export default async function AdminPage() {
  const { access } = await currentSession();
  if (!access.user_id) redirect("/admin/login");
  if (!can(access, "journalist", "editor")) {
    if (can(access, "moderator")) redirect("/admin/moderacao");
    redirect("/conta");
  }
  const editions = await getEditions();
  return (
    <div className="container-premium space-y-7 py-10">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">
            Painel editorial
          </p>
          <h1 className="font-display text-4xl">Gestão de notícias do SIS</h1>
        </div>
        <LogoutButton />
      </div>
      <AdminNewsManager access={access} editions={editions} />
    </div>
  );
}
