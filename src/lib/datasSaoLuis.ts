/**
 * Datas no fuso de São Luís (UTC-3, sem horário de verão).
 * Usar sempre estes utilitários para que servidor e navegador mostrem o mesmo dia e horário.
 */

export const FUSO_SAO_LUIS = 'America/Fortaleza';

function partes(data: Date, opcoes: Intl.DateTimeFormatOptions) {
  const mapa: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO_SAO_LUIS, ...opcoes }).formatToParts(data)) {
    mapa[p.type] = p.value;
  }
  return mapa;
}

/** Data de hoje em São Luís no formato aaaa-mm-dd. */
export function hojeEmSaoLuis(agora: Date = new Date()): string {
  const p = partes(agora, { year: 'numeric', month: '2-digit', day: '2-digit' });
  return `${p.year}-${p.month}-${p.day}`;
}

/** Soma dias a uma data aaaa-mm-dd (sem conversão de fuso). */
export function somarDias(dataIso: string, dias: number): string {
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia + dias));
  return d.toISOString().slice(0, 10);
}

/** Diferença em dias entre duas datas aaaa-mm-dd (fim - inicio). */
export function diasEntre(inicio: string, fim: string): number {
  const [a1, m1, d1] = inicio.split('-').map(Number);
  const [a2, m2, d2] = fim.split('-').map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000);
}

/** Monta um instante ISO a partir de data (aaaa-mm-dd) e hora (HH:mm) locais de São Luís. */
export function instanteEmSaoLuis(dataIso: string, hora: string): string {
  return new Date(`${dataIso}T${hora}:00-03:00`).toISOString();
}

/** dd/mm/aaaa a partir de aaaa-mm-dd. */
export function formatarDataCurta(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}/${ano}`;
}

/** "9h", "14h" ou "18h30". */
function horaCurta(instante: Date): string {
  const p = partes(instante, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const hora = String(Number(p.hour));
  return p.minute === '00' ? `${hora}h` : `${hora}h${p.minute}`;
}

export interface DataEvento {
  /** "04" */
  dia: string;
  /** "dez" */
  mes: string;
  /** "qui" */
  diaSemanaCurto: string;
  /** "quinta-feira, 4 de dezembro" */
  dataPorExtenso: string;
  /** "14h às 18h" ou "14h" */
  horario: string;
}

export function formatarDataEvento(inicioIso: string, fimIso: string | null): DataEvento {
  const inicio = new Date(inicioIso);
  const p = partes(inicio, { day: '2-digit', month: 'short', weekday: 'short' });
  const extenso = new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO_SAO_LUIS,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(inicio);

  return {
    dia: p.day,
    mes: p.month.replace('.', ''),
    diaSemanaCurto: p.weekday.replace('.', ''),
    dataPorExtenso: extenso,
    horario: fimIso ? `${horaCurta(inicio)} às ${horaCurta(new Date(fimIso))}` : horaCurta(inicio),
  };
}
