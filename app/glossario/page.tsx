import Link from "next/link";
import { glossary } from "@/data/glossary";
import { ParticipantNav } from "@/components/ParticipantNav";
export const metadata = { title: "Glossário | Jornal SIS" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = ((await searchParams).q || "").trim().slice(0, 100);
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  const entries = glossary.filter((x) =>
    norm(x.term + " " + x.text).includes(norm(q)),
  );
  return (
    <div className="container-premium mx-auto max-w-5xl space-y-7 py-10">
      <h1 className="font-display text-5xl">Glossário para começar</h1>
      <p className="text-lg text-zinc-400">
        Explicações introdutórias para acompanhar uma simulação. As regras
        oficiais do SIS são as definidas pela organização e pelo regimento de
        cada comitê.
      </p>
      <ParticipantNav />
      <form className="flex gap-3">
        <label className="flex-1">
          Buscar termo
          <input
            className="sis-input mt-2 w-full"
            name="q"
            defaultValue={q}
            maxLength={100}
          />
        </label>
        <button className="sis-button self-end">Buscar</button>
      </form>
      <p className="border-l-2 border-gold pl-4 text-sm">
        Não aplique automaticamente procedimentos do CSNU ao Jurídico ou ao
        Histórico. Consulte a{" "}
        <Link className="text-gold underline" href="/biblioteca?kind=rules">
          biblioteca de regimentos
        </Link>
        .
      </p>
      {entries.length ? (
        <dl className="grid gap-4 sm:grid-cols-2">
          {entries.map((x) => (
            <div
              id={x.slug}
              key={x.slug}
              className="card-border scroll-mt-40 space-y-3 p-6"
            >
              <dt className="font-display text-2xl">
                <a href={"#" + x.slug}>{x.term}</a>
              </dt>
              <dd className="text-zinc-400">{x.text}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p>Nenhum termo encontrado.</p>
      )}
      <p className="text-sm text-zinc-400">
        Referência introdutória:{" "}
        <a
          className="underline"
          rel="noopener noreferrer"
          target="_blank"
          href="https://www.nmun.org/assets/documents/nmun-delegate-prep-guide.pdf"
        >
          NMUN Delegate Preparation Guide
        </a>
        . Os exemplos de outras conferências não substituem as regras do SIS.
      </p>
    </div>
  );
}
