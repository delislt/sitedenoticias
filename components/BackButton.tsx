import Link from 'next/link';

export function BackButton() {
  return (
    <Link
      href="/"
      className="flex w-fit items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400 transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      aria-label="Voltar para todas as notícias"
    >
      <span aria-hidden="true">←</span>
      Voltar
    </Link>
  );
}
