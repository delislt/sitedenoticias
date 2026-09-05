import { notFound } from "next/navigation";
import { ParticipantNav } from "@/components/ParticipantNav";
import { SessionUpdates } from "@/components/SessionUpdates";
import { publicClient } from "@/utils/supabase/public";
import { sessionFields } from "@/lib/agenda";
import { databaseError } from "@/lib/http";
import { formatDate } from "@/lib/domain";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = publicClient();
  const { data: s, error } = await db
    .from("sessions")
    .select(sessionFields)
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();
  if (error) throw databaseError(error);
  if (!s) notFound();
  const { data: location, error: le } = await db.rpc("sis_public_location", {
    session_id: id,
  });
  if (le) throw databaseError(le);
  return (
    <div className="container-premium mx-auto max-w-4xl space-y-7 py-10">
      <p className="text-xs uppercase tracking-widest text-gold">
        Simulação acadêmica ·{" "}
        {s.status === "live"
          ? "Em andamento"
          : s.status === "closed"
            ? "Encerrada"
            : s.status === "cancelled"
              ? "Cancelada"
              : "Agendada"}
      </p>
      <h1 className="font-display text-4xl">{s.title}</h1>
      <p>
        {formatDate(s.starts_at)} a {formatDate(s.ends_at)} · Brasília
      </p>
      {location ? <p>Local divulgado pela organização: {location}</p> : null}
      <ParticipantNav />
      {s.summary ? (
        <section className="space-y-3">
          <h2 className="font-display text-3xl">Resumo editorial</h2>
          <p className="whitespace-pre-wrap">{s.summary}</p>
        </section>
      ) : null}
      <SessionUpdates id={id} live={s.status === "live"} />
    </div>
  );
}
