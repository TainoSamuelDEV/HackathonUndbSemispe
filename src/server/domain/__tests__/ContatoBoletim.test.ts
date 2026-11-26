import { describe, expect, it } from 'vitest';
import { normalizarContatoBoletim } from '../boletim/contatoBoletim';

describe('normalizarContatoBoletim', () => {
  it('normaliza e-mail para minúsculas', () => {
    expect(normalizarContatoBoletim('  Maria.Silva@Exemplo.COM ')).toEqual({
      contato: 'maria.silva@exemplo.com',
      tipo: 'EMAIL',
    });
  });

  it('recusa e-mail malformado', () => {
    expect(normalizarContatoBoletim('maria@exemplo')).toBeNull();
    expect(normalizarContatoBoletim('maria silva@exemplo.com')).toBeNull();
  });

  it('aceita WhatsApp com DDD e formatação, adicionando o DDI 55', () => {
    expect(normalizarContatoBoletim('(98) 99123-4567')).toEqual({
      contato: '5598991234567',
      tipo: 'WHATSAPP',
    });
    expect(normalizarContatoBoletim('98 3221-4567')).toEqual({ contato: '559832214567', tipo: 'WHATSAPP' });
  });

  it('mantém número que já tem DDI 55', () => {
    expect(normalizarContatoBoletim('+55 98 99123-4567')).toEqual({
      contato: '5598991234567',
      tipo: 'WHATSAPP',
    });
  });

  it('recusa telefone sem DDD, com DDD inválido ou com letras', () => {
    expect(normalizarContatoBoletim('99123-4567')).toBeNull();
    expect(normalizarContatoBoletim('(08) 99123-4567')).toBeNull();
    expect(normalizarContatoBoletim('98 9912A-4567')).toBeNull();
    expect(normalizarContatoBoletim('')).toBeNull();
  });
});
