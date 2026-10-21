"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { countdown, dayStatus, sisDays, sisStatus } from "@/lib/sis-schedule";

export function SisEventBanner({
  serverNow,
  agenda = false,
  day,
}: {
  serverNow: number;
  agenda?: boolean;
  day?: string;
}) {
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    // Keep time against the server, even if the visitor's clock is incorrect.
    let anchor = serverNow;
    let measuredAt = performance.now();
    let disposed = false;
    let pending = false;
    const controller = new AbortController();
    const tick = () => setNow(anchor + performance.now() - measuredAt);
    const sync = async () => {
      if (document.hidden || pending) return;
      pending = true;
      const startedAt = performance.now();
      try {
        const response = await fetch("/api/sis-clock", {
          cache: "no-store",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(10000),
          ]),
        });
        if (!response.ok) return;
        const clock = await response.json();
        if (!disposed && Number.isFinite(clock.now)) {
          measuredAt = performance.now();
          anchor = clock.now + (measuredAt - startedAt) / 2;
          tick();
        }
      } catch {
        // Offline: continue from the last server time until reconnection.
      } finally {
        pending = false;
      }
    };
    const refresh = () => {
      tick();
      void sync();
    };
    void sync();
    const ticker = window.setInterval(tick, 1000);
    const resync = window.setInterval(() => void sync(), 60000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(ticker);
      window.clearInterval(resync);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [serverNow]);

  const status = sisStatus(now);
  const live = status.phase === "first-live" || status.phase === "second-live";
  const visibleDays = sisDays.filter(
    (item) => !agenda || !day || item.date === day,
  );

  return (
    <section
      aria-label={agenda ? "Programação geral do SIS 2026" : "SIS 2026"}
      className="card-border relative overflow-hidden border-t-2 border-t-gold p-6 sm:p-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-gold/10 blur-3xl"
      />
      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">
            SIS 2026 · 23 e 24 de outubro
          </p>
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="space-y-3"
          >
            <p
              className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest ${live ? "text-emerald-400" : "text-gold"}`}
            >
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full bg-current ${live ? "motion-safe:animate-pulse" : ""}`}
              />
              {live
                ? "Em andamento"
                : status.phase === "finished"
                  ? "Evento encerrado"
                  : status.phase === "between-days"
                    ? "Intervalo entre os dias"
                    : "Reserve as datas"}
            </p>
            <h2 className="font-display text-3xl leading-tight sm:text-4xl">
              {status.title}
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
              {status.description}
            </p>
          </div>
          {status.nextAt ? (
            <div className="space-y-1">
              <p className="text-xs text-zinc-400">{status.countdownLabel}</p>
              <p
                role="timer"
                aria-live="off"
                className="text-xl font-medium tabular-nums text-gold"
              >
                {countdown(status.nextAt, now)}
              </p>
            </div>
          ) : null}
          {agenda ? null : (
            <Link href="/sobre" className="sis-button">
              Entenda o projeto por trás das notícias{" "}
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
        <div className="space-y-3">
          {visibleDays.map((item) => (
            <article
              key={item.id}
              className="border-l-2 border-gold bg-gold/5 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gold">
                  {item.title}
                </h3>
                <span className="text-xs text-zinc-400">
                  {dayStatus(item, now)}
                </span>
              </div>
              <p className="mt-2 font-display text-2xl">
                <time dateTime={item.date}>{item.dateLabel}</time>
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                {item.weekday} · {item.hours}
              </p>
            </article>
          ))}
          {visibleDays.length === 0 ? (
            <p className="text-sm text-zinc-400">
              Não há programação geral do SIS para o dia selecionado.
            </p>
          ) : null}
          <p className="text-xs text-zinc-400">
            Horários de Brasília · Atualização automática conforme a
            programação.
          </p>
        </div>
      </div>
    </section>
  );
}
