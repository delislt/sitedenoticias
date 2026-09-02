'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'sis-introduction-seen-v1';

export function FirstVisitIntro() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let shouldOpen = true;

    try {
      shouldOpen = window.localStorage.getItem(STORAGE_KEY) !== 'true';
    } catch {
      // A apresentação deve aparecer quando o armazenamento está indisponível.
    }

    const frame = window.requestAnimationFrame(() => setOpen(shouldOpen));
    return () => window.cancelAnimationFrame(frame);
  }, []);

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
    <aside
      className="border-b border-gold/30 bg-coal"
      aria-label="Orientação para novos visitantes"
    >
      <div className="container-premium flex items-start gap-3 py-3 sm:items-center">
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-zinc-300">
          <span className="font-semibold text-zinc-100">Primeira vez por aqui?</span>{' '}
          Entenda o projeto, conheça os comitês e descubra quem faz a cobertura.{' '}
          <Link
            href="/sobre"
            onClick={dismiss}
            className="font-semibold text-gold underline decoration-gold/50 underline-offset-4 transition hover:decoration-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            Entender o projeto
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-xl leading-none text-zinc-400 transition hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          aria-label="Fechar orientação para novos visitantes"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </aside>
  );
}
