"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
const navItems = [
  { href: "/categoria/geral", label: "Comitê Geral" },
  { href: "/categoria/juridico", label: "Jurídico" },
  { href: "/categoria/csnu", label: "CSNU" },
  { href: "/categoria/historico", label: "Histórico" },
  { href: "/dossies", label: "Dossiês" },
  { href: "/sobre", label: "Entenda o projeto" },
];
const services = [
  {
    href: "/participante",
    label: "Para o SIS",
    description: "Agenda e materiais da simulação",
  },
  {
    href: "/favoritos",
    label: "Favoritos",
    description: "Suas notícias salvas",
  },
  {
    href: "/conta",
    label: "Sua conta",
    description: "Entrar e gerenciar seu perfil",
  },
];
type Panel = "search" | "menu" | null;
export function Header() {
  const pathname = usePathname();
  const [state, setState] = useState<{ pathname: string; panel: Panel }>({
    pathname: "",
    panel: null,
  });
  const panel = state.pathname === pathname ? state.panel : null;
  const header = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  function toggle(next: Exclude<Panel, null>) {
    setState({ pathname, panel: panel === next ? null : next });
  }
  function close() {
    setState({ pathname, panel: null });
  }
  useEffect(() => {
    if (!panel) return;
    const frame =
      panel === "search"
        ? window.requestAnimationFrame(() => searchInput.current?.focus())
        : null;
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setState({ pathname, panel: null });
        (panel === "search" ? searchButton : menuButton).current?.focus();
      }
    };
    const outside = (e: PointerEvent) => {
      if (e.target instanceof Node && !header.current?.contains(e.target))
        setState({ pathname, panel: null });
    };
    const leave = (e: FocusEvent) => {
      if (
        e.relatedTarget instanceof Node &&
        !header.current?.contains(e.relatedTarget)
      )
        setState({ pathname, panel: null });
    };
    const element = header.current;
    window.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    element?.addEventListener("focusout", leave);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
      element?.removeEventListener("focusout", leave);
    };
  }, [panel, pathname]);
  const active = (href: string) =>
    pathname === href ||
    (href === "/dossies" && pathname.startsWith("/comite/"));
  return (
    <header
      ref={header}
      className="site-header sticky top-0 z-40 border-b backdrop-blur-md no-print"
    >
      <div className="container-premium flex min-h-[60px] items-center justify-between gap-3 py-2">
        <Link
          href="/"
          className="site-logo shrink-0 whitespace-nowrap text-2xl tracking-wide sm:text-3xl"
          style={{ fontFamily: "GentleHearts, serif" }}
          onClick={close}
        >
          Jornal <span className="text-gold">SIS</span>
        </Link>
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <nav
            aria-label="Navegação principal"
            className="mr-3 hidden items-center gap-4 xl:flex"
          >
            {navItems.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                onClick={close}
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
          <button
            ref={searchButton}
            type="button"
            className="header-tool"
            aria-label={panel === "search" ? "Fechar busca" : "Abrir busca"}
            title="Buscar notícias e dossiês"
            aria-expanded={panel === "search"}
            aria-controls="header-search-panel"
            onClick={() => toggle("search")}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5" />
            </svg>
          </button>
          <button
            ref={menuButton}
            type="button"
            className="header-tool"
            aria-label={
              panel === "menu"
                ? "Fechar menu e serviços"
                : "Abrir menu e serviços"
            }
            title="Menu e serviços"
            aria-expanded={panel === "menu"}
            aria-controls="header-navigation-panel"
            onClick={() => toggle("menu")}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      {panel === "search" ? (
        <div id="header-search-panel" className="border-t border-zinc-800">
          <form
            action="/busca"
            role="search"
            className="container-premium flex items-center gap-2 py-3"
          >
            <label className="sr-only" htmlFor="header-search">
              Buscar no Jornal SIS
            </label>
            <input
              ref={searchInput}
              id="header-search"
              name="q"
              type="search"
              maxLength={100}
              placeholder="Buscar notícias e dossiês"
              className="sis-input min-h-11 min-w-0 flex-1 text-base"
            />
            <button className="sis-button shrink-0">Buscar</button>
          </form>
        </div>
      ) : null}
      {panel === "menu" ? (
        <nav
          id="header-navigation-panel"
          aria-label="Menu e serviços do SIS"
          className="site-mobile-drawer absolute right-4 top-full z-50 mt-2 max-h-[calc(100dvh-5rem)] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-zinc-800 p-2 shadow-xl sm:right-6 lg:right-8"
        >
          <div className="border-b border-zinc-800 pb-2 xl:hidden">
            <p className="px-3 py-2 text-xs uppercase tracking-widest text-gold">
              Notícias e projeto
            </p>
            {navItems.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                onClick={close}
                aria-current={active(i.href) ? "page" : undefined}
                className="header-menu-link"
              >
                {i.label}
              </Link>
            ))}
          </div>
          <p className="px-3 py-2 text-xs uppercase tracking-widest text-gold">
            Serviços do SIS
          </p>
          {services.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              onClick={close}
              className="header-menu-link header-menu-service"
              aria-current={active(i.href) ? "page" : undefined}
            >
              <span className="text-sm font-medium">{i.label}</span>
              <span className="text-xs text-zinc-400">{i.description}</span>
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-between gap-4 border-t border-zinc-800 px-3 pb-1 pt-3">
            <div>
              <p className="text-sm font-medium">Aparência</p>
              <p className="text-xs text-zinc-400">Modo claro / escuro</p>
            </div>
            <ThemeToggle />
          </div>
        </nav>
      ) : null}
    </header>
  );
}
