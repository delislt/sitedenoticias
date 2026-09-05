import { requireStaffPage } from "@/lib/auth";
import { unwrap } from "@/lib/resources";
import { ResourceManager } from "@/components/admin/ResourceManager";
export default async function Page() {
  const { db } = await requireStaffPage("editor");
  const [editions, sessions] = await Promise.all([
    db
      .from("editions")
      .select("id,title")
      .order("year", { ascending: false })
      .limit(100),
    db
      .from("sessions")
      .select("id,title")
      .order("starts_at", { ascending: false })
      .limit(100),
  ]);
  return (
    <div className="container-premium space-y-6 py-10">
      <h1 className="font-display text-4xl">Recursos para o SIS</h1>
      <ResourceManager
        editions={unwrap(editions)}
        sessions={unwrap(sessions)}
      />
    </div>
  );
}
