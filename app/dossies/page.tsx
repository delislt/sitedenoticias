import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { dossiers } from "@/data/dossiers";

export const metadata: Metadata = {
  title: "Dossiês dos comitês | SIS Jornal",
  description:
    "Materiais de preparação dos comitês Jurídico, CSNU e Histórico do SIS.",
};

export default function DossiersPage() {
  return (
    <div className="container-premium py-10 sm:py-14">
      <section
        className="dossier-panel relative overflow-hidden p-6 sm:p-8 lg:p-10"
        aria-labelledby="dossiers-title"
      >
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl"
        />
        <div className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Materiais de preparação
            </p>
            <h1
              id="dossiers-title"
              className="font-display text-4xl text-zinc-100 sm:text-5xl"
            >
              Dossiês dos comitês
            </h1>
            <p className="max-w-2xl text-zinc-400">
              Acesse o material do seu comitê antes de acompanhar a cobertura do
              SIS.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 lg:items-end">
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              3 comitês
            </span>
            <Link
              href="/sobre#comites"
              className="text-sm font-semibold text-zinc-400 underline decoration-zinc-600 underline-offset-4 transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              Entenda os comitês
            </Link>
          </div>
        </div>

        <div className="relative mt-8 grid gap-4 md:grid-cols-3">
          {dossiers.map((dossier, index) => (
            <Link
              key={dossier.slug}
              href={"/comite/" + dossier.slug}
              className="dossier-card group overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              <span className="relative block aspect-[16/10] overflow-hidden">
                <Image
                  src={dossier.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"
                />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  {dossier.committee}
                  <span className="text-white/60">0{index + 1}</span>
                </span>
              </span>
              <span className="flex min-h-56 flex-col p-5">
                <span className="block font-display text-2xl leading-snug text-zinc-100">
                  {dossier.title}
                </span>
                <span className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-400">
                  {dossier.summary}
                </span>
                <span className="mt-auto flex items-center justify-between pt-6 text-sm font-semibold text-zinc-300">
                  Acessar dossiê
                  <span
                    aria-hidden="true"
                    className="text-lg text-gold transition group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
