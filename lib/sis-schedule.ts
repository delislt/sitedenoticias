export const sisDays = [
  {
    id: "sis-2026-dia-1",
    title: "Primeiro dia",
    date: "2026-10-23",
    dateLabel: "23 de outubro",
    weekday: "Sexta-feira",
    starts_at: "2026-10-23T07:30:00-03:00",
    ends_at: "2026-10-23T13:00:00-03:00",
    hours: "7h30 às 13h00",
  },
  {
    id: "sis-2026-dia-2",
    title: "Segundo dia",
    date: "2026-10-24",
    dateLabel: "24 de outubro",
    weekday: "Sábado",
    starts_at: "2026-10-24T07:30:00-03:00",
    ends_at: "2026-10-24T12:00:00-03:00",
    hours: "7h30 às 12h00",
  },
] as const;

export function dayStatus(day: (typeof sisDays)[number], now: number) {
  if (now < Date.parse(day.starts_at)) return "Agendado";
  if (now < Date.parse(day.ends_at)) return "Em andamento";
  return "Encerrado";
}

export function sisStatus(now: number) {
  const [first, second] = sisDays;
  if (now < Date.parse(first.starts_at))
    return {
      phase: "upcoming",
      title: "O SIS está chegando",
      description:
        "Dois dias de debates, encontros e cobertura da nossa simulação acadêmica.",
      nextAt: first.starts_at,
      countdownLabel: "Para o início do SIS",
    };
  if (now < Date.parse(first.ends_at))
    return {
      phase: "first-live",
      title: "O primeiro dia do SIS está acontecendo",
      description:
        "A programação de hoje segue até as 13h00. Acompanhe as notícias da simulação.",
      nextAt: first.ends_at,
      countdownLabel: "Para o fim do primeiro dia",
    };
  if (now < Date.parse(second.starts_at))
    return {
      phase: "between-days",
      title: "O primeiro dia terminou. O SIS continua em 24/10",
      description: "O segundo dia começa às 7h30 e segue até as 12h00.",
      nextAt: second.starts_at,
      countdownLabel: "Para o segundo dia",
    };
  if (now < Date.parse(second.ends_at))
    return {
      phase: "second-live",
      title: "O segundo dia do SIS está acontecendo",
      description:
        "A programação de hoje segue até as 12h00. Acompanhe a cobertura.",
      nextAt: second.ends_at,
      countdownLabel: "Para o encerramento do SIS",
    };
  return {
    phase: "finished",
    title: "O SIS 2026 foi encerrado",
    description:
      "Relembre os debates e os acontecimentos dos dois dias na nossa cobertura.",
    nextAt: null,
    countdownLabel: "",
  };
}

export function countdown(target: string, now: number) {
  const seconds = Math.max(0, Math.ceil((Date.parse(target) - now) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days ? `${days}d ` : ""}${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}min ${String(seconds % 60).padStart(2, "0")}s`;
}

export function generalCalendarDays(
  params: Record<string, string | undefined>,
) {
  if (params.category) return [];
  return sisDays
    .filter((day) => !params.day || day.date === params.day)
    .map((day) => ({
      ...day,
      title: `SIS 2026 · ${day.title}`,
      updated_at: "2026-10-20T15:55:00Z",
      status: "scheduled",
      summary:
        "Programação geral do Simulado Interno Sidarta. Horários de Brasília.",
      urlPath: "/agenda",
    }));
}
