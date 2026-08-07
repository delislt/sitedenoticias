'use client';

import { useRouter } from 'next/navigation';

export function BackButton() {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/');
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400 transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      aria-label="Voltar à página anterior"
    >
      <span aria-hidden="true">←</span>
      Voltar
    </button>
  );
}
