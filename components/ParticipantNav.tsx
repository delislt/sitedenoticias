import Link from "next/link";
export function ParticipantNav() {
  return (
    <nav
      aria-label="Preparação e acompanhamento do SIS"
      className="flex flex-wrap gap-5 border-y border-zinc-800 py-4 text-sm text-gold"
    >
      <Link href="/agenda">Agenda</Link>
      <Link href="/biblioteca">Biblioteca</Link>
      <Link href="/glossario">Glossário</Link>
      <Link href="/arquivo">Arquivo por edição</Link>
      <Link href="/dossies">Dossiês</Link>
    </nav>
  );
}
