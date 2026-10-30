// A API manda datas em UTC; exibimos no fuso de Brasília.
const TZ = 'America/Sao_Paulo';

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: TZ }) : '—';

export const formatDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' }) : '—';

/** Campo só de data (AAAA-MM-DD), sem conversão de fuso. */
export const formatDateOnly = (d: string | null | undefined) => (d ? d.split('-').reverse().join('/') : '—');

/** "2026-11-01T03:00:00.000Z" → "2026-11-01T00:00" para <input type="datetime-local"> (horário de Brasília). */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
  return parts.replace(' ', 'T');
}

/** AAAA-MM-DD de hoje + n dias, no fuso de Brasília. */
export function dateFromToday(days: number): string {
  const d = new Date(Date.now() + days * 86400000);
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(d);
}

export function formatPhone(value: string | null | undefined): string {
  const d = (value ?? '').replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function formatCep(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export const disponibilidadeLabel = {
  disponivel: 'Disponível',
  ultimas_unidades: 'Últimas unidades',
  indisponivel: 'Indisponível',
} as const;
