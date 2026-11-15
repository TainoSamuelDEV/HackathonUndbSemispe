import { describe, expect, it } from 'vitest';
import { normalizarTelefoneWhatsApp, sanitizarEntradaCidadao } from '@/server/domain/ai/Guardrails';

describe('Guardrails da IA FAROL', () => {
  it('detecta e remove CPF antes de qualquer persistência (LGPD)', () => {
    const res = sanitizarEntradaCidadao('Oi, meu nome é Marcos e meu CPF é 123.456.789-00');
    expect(res.detectouCpf).toBe(true);
    expect(res.textoLimpo).not.toContain('123.456.789-00');
    expect(res.textoLimpo).toContain('[DADO_REMOVIDO_LGPD]');
  });

  it('não marca falso positivo em textos normais', () => {
    const res = sanitizarEntradaCidadao('Trabalhei 3 anos como ajudante de manutenção');
    expect(res.detectouCpf).toBe(false);
    expect(res.textoLimpo).toBe('Trabalhei 3 anos como ajudante de manutenção');
  });

  it('normaliza telefone WhatsApp vindo da Evolution API', () => {
    expect(normalizarTelefoneWhatsApp('5598991234567@s.whatsapp.net')).toBe('5598991234567');
    expect(normalizarTelefoneWhatsApp('(98) 99123-4567')).toBe('5598991234567');
  });
});
