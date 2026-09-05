import { requireStaffPage } from "@/lib/auth";
import { Moderation } from "@/components/admin/Moderation";
export default async function Page() {
  await requireStaffPage("editor");
  return (
    <div className="container-premium space-y-6 py-10">
      <h1 className="font-display text-4xl">Sugestões de correção</h1>
      <Moderation corrections />
    </div>
  );
}
