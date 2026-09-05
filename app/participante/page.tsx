import Link from "next/link";
import { ParticipantNav } from "@/components/ParticipantNav";
import { publicClient } from "@/utils/supabase/public";
import { unwrap } from "@/lib/resources";
export const metadata = { title: "Para o SIS | Jornal SIS" };
export default async function Page() {
  const notices = unwrap(
    await publicClient()
      .from("announcements")
      .select("id,title,body,updated_at")
      .eq("published", true)
      .order("updated_at", { ascending: false })
      .limit(10),
  );
  return (
    <div className="container-premium space-y-8 py-10">
      <p className="text-xs uppercase tracking-widest text-gold">
        Prepare-se. Acompanhe. Participe.
      </p>
      <h1 className="font-display text-5xl">Para viver o SIS</h1>
      <p className="max-w-2xl text-lg text-zinc-400">
        Materiais e informações que ajudam você a acompanhar os debates do
        Simulado Interno Sidarta.
      </p>
      <ParticipantNav />
      <section className="grid gap-5 md:grid-cols-2">
        {[
          [
            "/agenda",
            "Agenda e cobertura",
            "Consulte sessões confirmadas e acompanhe as atualizações da imprensa.",
          ],
          [
            "/biblioteca",
            "Biblioteca de preparação",
            "Regimentos, guias, modelos e documentos publicados pela organização.",
          ],
          [
            "/glossario",
            "Glossário",
            "Entenda termos usados em simulações diplomáticas.",
          ],
          [
            "/arquivo",
            "Arquivo por edição",
            "Revisite matérias e documentos sem perder os endereços anteriores.",
          ],
        ].map(([href, title, body]) => (
          <Link key={href} href={href} className="card-border space-y-3 p-7">
            <h2 className="font-display text-3xl">{title}</h2>
            <p className="text-zinc-400">{body}</p>
            <span className="inline-block text-gold">Acessar →</span>
          </Link>
        ))}
      </section>
      <section className="space-y-4">
        <h2 className="font-display text-3xl">Avisos oficiais</h2>
        {notices.length ? (
          notices.map((n) => (
            <article key={n.id} className="card-border space-y-3 p-5">
              <h3 className="font-semibold">{n.title}</h3>
              <p className="whitespace-pre-wrap">{n.body}</p>
            </article>
          ))
        ) : (
          <p className="text-zinc-400">
            A organização ainda não publicou avisos nesta área.
          </p>
        )}
      </section>
    </div>
  );
}
