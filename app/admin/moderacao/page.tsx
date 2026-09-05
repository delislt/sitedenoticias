import { requireStaffPage } from "@/lib/auth";
import { Moderation } from "@/components/admin/Moderation";
export default async function Page() {
  await requireStaffPage("moderator");
  return (
    <div className="container-premium space-y-6 py-10">
      <h1 className="font-display text-4xl">Moderação de comentários</h1>
      <p className="text-zinc-400">
        As decisões ficam registradas. A moderação não altera o texto de outras
        pessoas.
      </p>
      <Moderation />
    </div>
  );
}
