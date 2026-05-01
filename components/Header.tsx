import Link from 'next/link';

const navItems = [
  { href: '/categoria/juridico', label: 'Jurídico' },
  { href: '/categoria/csnu', label: 'CSNU' },
  { href: '/categoria/historico', label: 'Histórico' },
  { href: '/sobre', label: 'Sobre o SIS' },
  { href: '/busca', label: 'Busca' },
  { href: '/admin', label: 'Admin' }
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-ink/95 backdrop-blur">
      <div className="container-premium flex items-center justify-between py-4">
        <Link href="/" className="font-display text-2xl font-bold tracking-wide text-white">
          SIS <span className="text-gold">Jornal</span>
        </Link>
        <nav className="hidden gap-5 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm uppercase tracking-[0.15em] text-zinc-300 transition hover:text-gold">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
