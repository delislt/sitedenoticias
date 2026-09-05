import Link from "next/link";
import { currentSession } from "@/lib/auth";
import { can } from "@/lib/domain";
export const metadata = { robots: { index: false, follow: false } };
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { access } = await currentSession();
  return (
    <>
      {can(access, "journalist", "editor", "moderator") ? (
        <nav
          aria-label="Áreas da equipe"
          className="container-premium flex flex-wrap gap-5 border-b border-zinc-800 py-5 text-sm text-gold"
        >
          {can(access, "journalist", "editor") ? (
            <Link href="/admin">Matérias</Link>
          ) : null}
          {can(access, "editor") ? (
            <>
              <Link href="/admin/recursos">Agenda e biblioteca</Link>
              <Link href="/admin/correcoes">Sugestões de correção</Link>
            </>
          ) : null}
          {can(access, "moderator") ? (
            <Link href="/admin/moderacao">Moderação</Link>
          ) : null}
          {can(access, "admin") ? (
            <Link href="/admin/configuracoes">Configurações e funções</Link>
          ) : null}
          {can(access, "editor", "moderator") ? (
            <Link href="/admin/historico">Histórico</Link>
          ) : null}
        </nav>
      ) : null}
      {children}
    </>
  );
}
