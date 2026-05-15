'use client';

interface DateDisplayProps {
  dateStr: string;
  className?: string;
}

/**
 * Converte e exibe a data no cliente (browser),
 * onde o fuso America/Sao_Paulo funciona corretamente.
 */
export function DateDisplay({ dateStr, className }: DateDisplayProps) {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return <span className={className}>{dateStr}</span>;

  const formatted = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(date);

  return <span className={className}>{formatted}</span>;
}
