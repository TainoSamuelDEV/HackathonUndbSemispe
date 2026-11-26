import { describe, expect, it, vi } from 'vitest';
import {
  askFarolGemini,
  buildFarolSystemPrompt,
  buildGeminiContents,
  obterContextoTemporalSaoLuis,
  sanitizeGeminiHistory,
} from '@/server/ai/whatsapp/whatsappAi';
import { sanitizarCurriculoPadrao } from '@/server/domain/curriculo/CurriculoPadrao';

describe('whatsappAi', () => {
  it('sanitiza histórico garantindo início em user e alternância estrita', () => {
    const sanitized = sanitizeGeminiHistory([
      { role: 'model', parts: [{ text: 'Olá inicial descartado' }] },
      { role: 'user', parts: [{ text: 'Oi' }] },
      { role: 'user', parts: [{ text: 'Quero vaga' }] },
      { role: 'model', parts: [{ text: 'Claro!' }] },
      { role: 'model', parts: [{ text: 'Claro!' }] },
    ]);

    expect(sanitized).toEqual([
      { role: 'user', parts: [{ text: 'Oi\nQuero vaga' }] },
      { role: 'model', parts: [{ text: 'Claro!' }] },
    ]);

    const contents = buildGeminiContents(sanitized, 'Tenho curso de NR-12');
    expect(contents).toHaveLength(3);
    expect(contents[2]).toEqual({ role: 'user', parts: [{ text: 'Tenho curso de NR-12' }] });
  });

  it('executa loop de function calling preservando thoughtSignature', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  { thought: true, text: 'Preciso buscar vagas', thoughtSignature: 'sig-123' },
                  {
                    functionCall: {
                      name: 'buscar_vagas_compativeis',
                      args: { area: 'Logística' },
                    },
                  },
                ],
              },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Encontrei uma vaga ótima de Auxiliar de Logística!' }],
              },
            },
          ],
        }),
      });

    const buscarSpy = vi.fn().mockResolvedValue({
      vagas: [{ vagaId: 'v1', titulo: 'Auxiliar de Logística', compatibilidadePercentual: 85 }],
    });

    const resposta = await askFarolGemini({
      systemPrompt: 'Prompt',
      userMessage: 'Tem vaga de logística?',
      history: [],
      apiKey: 'fake-key',
      fetchFn: fetchMock as unknown as typeof fetch,
      tools: {
        registrar_consentimento_lgpd: vi.fn(),
        atualizar_rascunho_curriculo: vi.fn(),
        gerar_e_enviar_curriculo_pdf: vi.fn(),
        buscar_vagas_compativeis: buscarSpy,
        candidatar_vaga: vi.fn(),
        listar_cursos_disponiveis: vi.fn(),
        registrar_pedido_curso: vi.fn(),
        consultar_minhas_candidaturas: vi.fn(),
        consultar_editais_e_eventos: vi.fn(),
      },
    });

    expect(buscarSpy).toHaveBeenCalledWith({ area: 'Logística', bairro: undefined, limite: undefined });
    expect(resposta).toContain('Auxiliar de Logística');
    const secondCallBody = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(secondCallBody.contents[1].parts[0].thoughtSignature).toBe('sig-123');
  });

  it('injeta contexto temporal de São Luís e rascunho de currículo no System Prompt', () => {
    const prompt = buildFarolSystemPrompt({
      appUrl: 'https://farol.slz.br',
      dataHoraAtual: obterContextoTemporalSaoLuis(new Date('2026-11-26T13:00:00Z')),
      estadoAtual: 'CURRICULO',
      consentimentoLgpd: true,
      hasPreviousInteraction: true,
      cidadaoNome: 'Marcos',
      candidatoCadastrado: true,
      rascunhoCurriculo: sanitizarCurriculoPadrao({
        nomeCompleto: 'Marcos Vinícius Silva',
        bairro: 'Anjo da Guarda',
        escolaridade: 'MEDIO_COMPLETO',
        competencias: ['Soldagem básica'],
      }),
      curriculosAnexadosCount: 1,
      ultimoCurriculoUrl: '/api/candidato/curriculo/arquivos/123/download',
    });

    expect(prompt).toContain('Marcos Vinícius Silva');
    expect(prompt).toContain('PRONTO PARA GERAR PDF');
    expect(prompt).toContain('Bom dia');
  });
});
