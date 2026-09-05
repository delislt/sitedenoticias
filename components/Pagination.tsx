import Link from "next/link";
export function Pagination({
  page,
  total,
  size = 12,
  base,
  params = {},
}: {
  page: number;
  total: number;
  size?: number;
  base: string;
  params?: Record<string, string>;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  const href = (n: number) =>
    base + "?" + new URLSearchParams({ ...params, page: String(n) });
  if (pages === 1 && page === 1) return null;
  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800 pt-6"
    >
      {page > 1 ? (
        <Link className="sis-button" href={href(page - 1)}>
          ← Anterior
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-zinc-400">
        Página {page}
        {total > 0 ? " de " + pages : ""}
      </span>
      {page < pages ? (
        <Link className="sis-button" href={href(page + 1)}>
          Próxima →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
