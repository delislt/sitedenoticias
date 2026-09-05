"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
const navItems = [
  { href: "/categoria/juridico", label: "Jurídico" },
  { href: "/categoria/csnu", label: "CSNU" },
  { href: "/categoria/historico", label: "Histórico" },
  { href: "/dossies", label: "Dossiês" },
  { href: "/sobre", label: "Entenda o projeto" },
];
export function Header() {
  const pathname = usePathname();
  const [menu, setMenu] = useState({ pathname: "", open: false });
  const open = menu.pathname === pathname && menu.open;
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu({ pathname, open: false });
        button.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open, pathname]);
  const active = (href: string) =>
    pathname === href ||
    (href === "/dossies" && pathname.startsWith("/comite/"));
  return (
    <header className="site-header sticky top-0 z-40 border-b backdrop-blur-md no-print">
      <div className="container-premium flex items-center justify-between gap-4 py-4">
        <Link
          href="/"
          className="site-logo whitespace-nowrap text-3xl tracking-wide"
          style={{ fontFamily: "GentleHearts, serif" }}
        >
          Jornal <span className="text-gold">SIS</span>
        </Link>
        <div className="flex items-center gap-3">
          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-5 lg:flex"
          >
            {navItems.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                aria-current={active(i.href) ? "page" : undefined}
                className={
                  "text-xs uppercase tracking-[0.12em] hover:text-gold " +
                  (active(i.href) ? "text-gold" : "text-zinc-300")
                }
              >
                {i.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
          <button
            ref={button}
            type="button"
            className="menu-toggle rounded-full px-3 py-2 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setMenu({ pathname, open: !open })}
          >
            {open ? "Fechar" : "Menu"}
          </button>
        </div>
      </div>
      <div className="container-premium flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-t border-zinc-800 py-3">
        <form
          action="/busca"
          role="search"
          className="flex min-w-0 basis-full gap-2 sm:basis-auto sm:flex-1 sm:max-w-xs"
        >
          <label className="sr-only" htmlFor="header-search">
            Buscar no Jornal SIS
          </label>
          <input
            id="header-search"
            name="q"
            maxLength={100}
            placeholder="Buscar notícias e dossiês"
            className="sis-input min-w-0 flex-1 py-1.5 text-sm"
          />
          <button className="min-h-11 text-sm font-semibold text-gold">
            Buscar
          </button>
        </form>
        <nav
          aria-label="Serviços do SIS"
          className="flex flex-wrap gap-x-4 gap-y-2 text-sm"
        >
          <Link href="/participante">Para o SIS</Link>
          <Link href="/favoritos">Favoritos</Link>
          <Link href="/conta">Sua conta</Link>
        </nav>
      </div>
      {open ? (
        <nav
          id="mobile-navigation"
          aria-label="Navegação móvel"
          className="site-mobile-drawer max-h-[65vh] overflow-y-auto border-t border-zinc-800 lg:hidden"
        >
          {navItems.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              onClick={() => setMenu({ pathname, open: false })}
              className="site-mobile-link block border-b border-zinc-800 px-6 py-4"
              aria-current={active(i.href) ? "page" : undefined}
            >
              {i.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
