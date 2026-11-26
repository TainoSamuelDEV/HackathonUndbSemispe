/**
 * Geração de arquivo de calendário (.ics, RFC 5545) para adicionar eventos à agenda do usuário.
 */

export interface EventoCalendario {
  id: string;
  titulo: string;
  resumo: string;
  local: string;
  organizacao: string;
  /** Instante ISO (UTC). */
  inicio: string;
  fim: string | null;
}

const DUAS_HORAS_MS = 2 * 60 * 60 * 1000;

/** 20261201T170000Z */
function formatarUtc(data: Date) {
  return data.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Escapa os caracteres especiais de valores de texto (RFC 5545 §3.3.11). */
function escaparTexto(texto: string) {
  return texto.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Quebra linhas com mais de 75 octetos (RFC 5545 §3.1), sem partir caracteres multibyte. */
function dobrarLinha(linha: string) {
  const codificador = new TextEncoder();
  const partes: string[] = [];
  let atual = '';
  let octetos = 0;
  let limite = 75;

  for (const caractere of linha) {
    const tamanho = codificador.encode(caractere).length;
    if (octetos + tamanho > limite) {
      partes.push(atual);
      atual = '';
      octetos = 0;
      limite = 74; // linhas de continuação começam com um espaço
    }
    atual += caractere;
    octetos += tamanho;
  }
  partes.push(atual);
  return partes.join('\r\n ');
}

export function gerarIcs(evento: EventoCalendario, agora: Date = new Date()): string {
  const inicio = new Date(evento.inicio);
  const fim = evento.fim ? new Date(evento.fim) : new Date(inicio.getTime() + DUAS_HORAS_MS);
  const descricao = `${evento.resumo}\n\nRealização: ${evento.organizacao}`;

  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FAROL São Luís//Editais e Eventos//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${evento.id}@farol.slz`,
    `DTSTAMP:${formatarUtc(agora)}`,
    `DTSTART:${formatarUtc(inicio)}`,
    `DTEND:${formatarUtc(fim)}`,
    `SUMMARY:${escaparTexto(evento.titulo)}`,
    `DESCRIPTION:${escaparTexto(descricao)}`,
    `LOCATION:${escaparTexto(evento.local)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return linhas.map(dobrarLinha).join('\r\n') + '\r\n';
}

function nomeDeArquivo(titulo: string) {
  const base = titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'evento'}.ics`;
}

/** Baixa o evento como .ics no navegador. */
export function baixarIcs(evento: EventoCalendario) {
  const blob = new Blob([gerarIcs(evento)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeDeArquivo(evento.titulo);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
