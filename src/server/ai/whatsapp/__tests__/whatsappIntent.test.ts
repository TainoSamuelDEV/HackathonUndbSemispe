import { describe, expect, it } from 'vitest';
import {
  detectarRespostaConsentimento,
  isAutoResponderMessage,
  isClosingCourtesyIntent,
  isConfirmHandoffIntent,
  isHumanHandoffIntent,
  isRejectHandoffIntent,
} from '@/server/ai/whatsapp/whatsappIntent';
import { enforceFarolSafety } from '@/server/ai/whatsapp/whatsappGuardrail';

describe('whatsappIntent & whatsappGuardrail', () => {
  it('detecta pedido humano, confirmação em 2 etapas e recusa corretamente', () => {
    expect(isHumanHandoffIntent('Quero falar com um atendente')).toBe(true);
    expect(isHumanHandoffIntent('Quero ver vagas de logística')).toBe(false);

    expect(isConfirmHandoffIntent('Sim, quero atendente')).toBe(true);
    expect(isConfirmHandoffIntent('Tem vaga de motorista?')).toBe(false);

    expect(isRejectHandoffIntent('Pode ser por aqui mesmo')).toBe(true);
  });

  it('não confunde conectivos com pergunta como cortesia de encerramento', () => {
    expect(isClosingCourtesyIntent('Valeu, boa noite!')).toBe(true);
    expect(isClosingCourtesyIntent('Obrigado!')).toBe(true);
    expect(isClosingCourtesyIntent('Show, quero saber das vagas')).toBe(false);
    expect(isAutoResponderMessage('Esta é uma mensagem automática de ausência.')).toBe(true);
    expect(detectarRespostaConsentimento('Sim')).toBe('ACEITO');
    expect(detectarRespostaConsentimento('Não quero')).toBe('RECUSADO');
  });

  it('remove promessas de emprego garantido, PII e reinício de boas-vindas', () => {
    const res1 = enforceFarolSafety({
      reply: 'Olá! Eu sou a assistente do FAROL. Seja bem-vindo! Como posso ajudar hoje?',
      userText: 'Obrigado, boa noite',
      hasPreviousInteraction: true,
      cidadaoNome: 'Marcos',
      periodo: 'noite',
    });
    expect(res1.corrected).toBe(true);
    expect(res1.reasons).toContain('abrupt_greeting_removed');
    expect(res1.text).toContain('Boa noite, Marcos');

    const res2 = enforceFarolSafety({
      reply: 'Com certeza **vaga garantida**! Seu CPF 123.456.789-00 está anotado.',
      userText: 'Vou conseguir emprego?',
      hasPreviousInteraction: true,
      cidadaoNome: 'Marcos',
    });
    expect(res2.corrected).toBe(true);
    expect(res2.text).not.toContain('123.456.789-00');
    expect(res2.text).not.toContain('vaga garantida');
  });
});
