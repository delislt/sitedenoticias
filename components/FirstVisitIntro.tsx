'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { committeeOrder, categoryLabels } from '@/data/news';

const STORAGE_KEY = 'sis-introduction-seen-v1';

export function FirstVisitIntro() {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(STORAGE_KEY) !== 'true');
    } catch {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // A introdução ainda pode ser fechada quando o armazenamento está indisponível.
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-ink/95 px-4 py-6 backdrop-blur-xl sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sis-intro-title"
      aria-describedby="sis-intro-description"
    >
      <div className="mx-auto flex min-h-full max-w-6xl items-center justify-center">
        <section className="relative w-full overflow-hidden border border-gold/40 bg-coal px-5 py-8 shadow-2xl shadow-black/40 sm:px-10 sm:py-12 lg:px-16">
          <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={dismiss}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-2xl text-zinc-300 transition hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold sm:right-6 sm:top-6"
            aria-label="Fechar apresentação do SIS"
          >
            <span aria-hidden="true">×</span>
          </button>

          <div className="relative max-w-3xl space-y-5 pr-12">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Simulado Interno Sidarta</p>
            <h1 id="sis-intro-title" className="font-display text-4xl leading-tight text-zinc-100 sm:text-6xl">
              Bem-vindo ao Jornal SIS
            </h1>
            <p id="sis-intro-description" className="max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
              O SIS é um simulado acadêmico inspirado nas dinâmicas da ONU. Este portal reúne a cobertura dos debates e os dossiês de preparação dos três comitês.
            </p>
          </div>

          <div className="relative mt-9 grid gap-3 md:grid-cols-3">
            {committeeOrder.map((slug, index) => (
              <Link
                key={slug}
                href={'/comite/' + slug}
                onClick={dismiss}
                className="group flex min-h-36 flex-col justify-between border border-zinc-700 bg-zinc-900/80 p-5 transition hover:-translate-y-1 hover:border-gold hover:bg-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Dossiê 0{index + 1}</span>
                <span className="mt-6 flex items-end justify-between gap-4">
                  <span className="font-display text-2xl text-zinc-100">{categoryLabels[slug]}</span>
                  <span aria-hidden="true" className="text-xl text-gold transition group-hover:translate-x-1">→</span>
                </span>
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="relative mt-7 text-sm font-semibold text-zinc-400 underline decoration-zinc-600 underline-offset-4 transition hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            Continuar para a página inicial
          </button>
        </section>
      </div>
    </div>
  );
}
