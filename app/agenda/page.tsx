import Link from "next/link";
import { ParticipantNav } from "@/components/ParticipantNav";
import { Pagination } from "@/components/Pagination";
import { agenda } from "@/lib/agenda";
import { formatDate } from "@/lib/domain";
import { categoryLabels } from "@/data/news";
export const metadata = { title: "Agenda | Jornal SIS" };
const labels: Record<string, string> = {
  scheduled: "Agendada",
  live: "Em andamento",
  closed: "Encerrada",
  cancelled: "Cancelada",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const { sessions, total, page, requestedAt } = await agenda(p);
  const params = Object.fromEntries(
    Object.entries(p).filter(
      (x): x is [string, string] =>
        typeof x[1] === "string" && x[0] !== "edition",
    ),
  );
  const next = sessions.find(
    (s) =>
      Date.parse(s.ends_at) >= requestedAt &&
      ["scheduled", "live"].includes(s.status),
  );
  return (
    <div className="container-premium space-y-7 py-10">
      <h1 className="font-display text-5xl">Agenda do SIS</h1>
      <p className="text-zinc-400">
        Horários em America/Sao_Paulo (Brasília). A programação é cadastrada
        pela organização.
      </p>
      <ParticipantNav />
      <form className="card-border flex flex-wrap items-end gap-4 p-5">
        <label>
          Dia
          <input
            type="date"
            name="day"
            defaultValue={p.day}
            className="sis-input mt-2 block"
          />
        </label>
        <label>
          Comitê
          <select
            name="category"
            defaultValue={p.category || ""}
            className="sis-input mt-2 block"
          >
            <option value="">Todos</option>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button className="sis-button">Filtrar</button>
        <Link href="/agenda" className="underline">
          Limpar filtros
        </Link>
        <a
          className="sis-button"
          href={"/agenda/agenda.ics?" + new URLSearchParams(params)}
        >
          Exportar agenda (ICS)
        </a>
      </form>
      {next ? (
        <aside className="border-l-2 border-gold pl-5">
          <p className="text-sm text-gold">
            {next.status === "live"
              ? "Em andamento nesta consulta"
              : "Próxima sessão nesta consulta"}
          </p>
          <Link className="font-display text-2xl" href={"/sessao/" + next.id}>
            {next.title}
          </Link>
          <p className="text-sm">{formatDate(next.starts_at)}</p>
        </aside>
      ) : null}
      {sessions.length ? (
        <div className="space-y-4">
          {sessions.map((s) => (
            <article
              key={s.id}
              className="card-border flex flex-col justify-between gap-4 p-6 sm:flex-row"
            >
              <div>
                <p className="text-xs text-gold">
                  {categoryLabels[s.category as keyof typeof categoryLabels]} ·{" "}
                  {labels[s.status]}
                </p>
                <Link
                  href={"/sessao/" + s.id}
                  className="font-display text-2xl"
                >
                  {s.title}
                </Link>
                <p className="mt-2 text-sm text-zinc-400">
                  {formatDate(s.starts_at)} a {formatDate(s.ends_at)}
                </p>
              </div>
              <Link className="text-sm text-gold" href={"/sessao/" + s.id}>
                Acompanhar cobertura →
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="card-border p-8">
          Nenhuma sessão publicada para estes filtros. Aguarde a programação
          oficial.
        </p>
      )}
      <Pagination
        page={page}
        total={total}
        size={20}
        base="/agenda"
        params={params}
      />
    </div>
  );
}
