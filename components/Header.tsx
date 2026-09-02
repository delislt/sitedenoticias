'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  { href: '/categoria/juridico', label: 'Jurídico' },
  { href: '/categoria/csnu', label: 'CSNU' },
  { href: '/categoria/historico', label: 'Histórico' },
  { href: '/dossies', label: 'Dossiês' },
  { href: '/sobre', label: 'Entenda o projeto' },
];

export function Header() {
  const pathname = usePathname();
  const [menuState, setMenuState] = useState({ pathname: '', open: false });
  const open = menuState.pathname === pathname && menuState.open;

  function isActive(href: string) {
    if (href === '/dossies') {
      return pathname === href || pathname.startsWith('/comite/');
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <header className="site-header sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="container-premium flex items-center justify-between py-4">
          <Link
            href="/"
            className="site-logo text-3xl tracking-wide"
            style={{ fontFamily: 'GentleHearts, serif' }}
          >
            Jornal <span className="text-gold">SIS</span>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            <nav aria-label="Navegação principal" className="hidden items-center gap-5 lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={`text-sm uppercase tracking-[0.15em] transition hover:text-gold ${
                    isActive(item.href) ? 'text-gold' : 'text-zinc-300'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <ThemeToggle />

            <button
              type="button"
              className="menu-toggle flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-full lg:hidden"
              onClick={() => setMenuState({ pathname, open: !open })}
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={open}
              aria-controls="mobile-navigation"
            >
              <span className={'block h-0.5 w-5 bg-current transition-all duration-300 ' + (open ? 'translate-y-[7px] rotate-45' : '')} />
              <span className={'block h-0.5 w-5 bg-current transition-all duration-300 ' + (open ? 'opacity-0' : '')} />
              <span className={'block h-0.5 w-5 bg-current transition-all duration-300 ' + (open ? '-translate-y-[7px] -rotate-45' : '')} />
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div
          id="mobile-navigation"
          className="site-mobile-drawer fixed inset-x-0 bottom-0 top-[69px] z-30 flex flex-col lg:hidden"
        >
          <nav aria-label="Navegação móvel" className="flex flex-col divide-y divide-zinc-800">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`site-mobile-link px-6 py-5 text-base uppercase tracking-[0.15em] transition hover:text-gold ${
                  isActive(item.href) ? 'text-gold' : 'text-zinc-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  );
}
