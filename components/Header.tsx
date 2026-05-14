'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/categoria/juridico', label: 'Jurídico' },
  { href: '/categoria/csnu', label: 'CSNU' },
  { href: '/categoria/historico', label: 'Histórico' },
  { href: '/sobre', label: 'Sobre o SIS' },
  { href: '/busca', label: 'Busca' },
  { href: '/admin', label: 'Admin' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b border-zinc-800"
        style={{ backgroundColor: '#09090b' }}
      >
        <div className="container-premium flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="font-display text-2xl font-bold tracking-wide text-white">
            SIS <span className="text-gold">Jornal</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden gap-5 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm uppercase tracking-[0.15em] text-zinc-300 transition hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Botão hamburguer */}
          <button
            className="flex flex-col items-center justify-center gap-[5px] p-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
          >
            <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </button>
        </div>
      </header>

      {/* Drawer mobile — fora do <header> para não herdar estilos */}
      {open && (
        <div
          className="fixed inset-0 z-30 flex flex-col md:hidden"
          style={{ top: '65px', backgroundColor: '#09090b' }}
        >
          <nav className="flex flex-col divide-y divide-zinc-800">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-6 py-5 text-base uppercase tracking-[0.15em] text-zinc-100 transition hover:text-gold active:bg-zinc-800"
                style={{ backgroundColor: '#09090b' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
