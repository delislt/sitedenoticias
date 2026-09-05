import Link from "next/link";
import { requireStaffPage } from "@/lib/auth";
import { formatDate, pageNumber } from "@/lib/domain";
import { unwrap } from "@/lib/resources";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { db } = await requireStaffPage("editor", "moderator");
  const pg = pageNumber((await searchParams).page);
  const rows = unwrap(
    await db.rpc("sis_dashboard", { kind: "audit", pg, query: "" }),
  ) as {
    id: number;
    actor_id: string | null;
    action: string;
    entity_id: string;
    reason: string;
    created_at: string;
  }[];
  return (
    <div className="container-premium space-y-6 py-10">
      <h1 className="font-display text-4xl">Histórico de decisões</h1>
      {rows.length ? (
        <ol className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="card-border space-y-2 p-5">
              <p className="text-gold">
                {r.action} · {formatDate(r.created_at)}
              </p>
              <p className="text-sm">
                Responsável: {r.actor_id || "Conta removida"}
              </p>
              <p>{r.reason || "Alteração registrada"}</p>
              <p className="break-all text-xs text-zinc-400">
                Registro: {r.entity_id || "Configuração global"}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p>Nenhuma decisão nesta página.</p>
      )}
      <nav className="flex justify-between">
        {pg > 1 ? <Link href={"?page=" + (pg - 1)}>← Anterior</Link> : <span />}
        {rows.length === 30 ? (
          <Link href={"?page=" + (pg + 1)}>Próxima →</Link>
        ) : null}
      </nav>
    </div>
  );
}
