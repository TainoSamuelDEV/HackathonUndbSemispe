import { describe, expect, it } from 'vitest';
import { gerarIcs } from '../calendarioIcs';

const evento = {
  id: 'evt-1',
  titulo: 'Meetup: do código ao produto, com startups; edição 1',
  resumo: 'Painel aberto.\nTraga suas dúvidas.',
  local: 'Parque Tecnológico, São Luís',
  organizacao: 'SEMISPE',
  inicio: '2026-12-04T22:00:00.000Z',
  fim: '2026-12-05T00:30:00.000Z',
};

describe('gerarIcs', () => {
  const ics = gerarIcs(evento, new Date('2026-11-25T12:00:00.000Z'));
  const desdobrado = ics.replace(/\r\n /g, '');

  it('usa CRLF e inclui os campos obrigatórios', () => {
    expect(ics.endsWith('\r\n')).toBe(true);
    expect(ics).not.toMatch(/[^\r]\n/);
    expect(desdobrado).toContain('UID:evt-1@farol.slz');
    expect(desdobrado).toContain('DTSTAMP:20261125T120000Z');
    expect(desdobrado).toContain('DTSTART:20261204T220000Z');
    expect(desdobrado).toContain('DTEND:20261205T003000Z');
  });

  it('escapa vírgulas, ponto e vírgula e quebras de linha', () => {
    expect(desdobrado).toContain('SUMMARY:Meetup: do código ao produto\\, com startups\\; edição 1');
    expect(desdobrado).toContain('DESCRIPTION:Painel aberto.\\nTraga suas dúvidas.');
    expect(desdobrado).toContain('LOCATION:Parque Tecnológico\\, São Luís');
  });

  it('quebra linhas longas em no máximo 75 octetos', () => {
    const codificador = new TextEncoder();
    for (const linha of ics.split('\r\n')) {
      expect(codificador.encode(linha).length).toBeLessThanOrEqual(75);
    }
  });

  it('assume duas horas de duração quando o fim não é informado', () => {
    const semFim = gerarIcs({ ...evento, fim: null }).replace(/\r\n /g, '');
    expect(semFim).toContain('DTEND:20261205T000000Z');
  });
});
