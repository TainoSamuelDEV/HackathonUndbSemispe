import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  processFarolDirectInput,
  processFarolWebhook,
  type EvolutionWhatsAppTransport,
} from '@/server/ai/whatsapp/whatsappAgent';
import { createFarolWhatsAppChatDb } from '@/server/ai/whatsapp/whatsappChatDb';
import { farolService } from '@/server/application/FarolService';
import { farolMemoryStore } from '@/server/infrastructure/repositories/FarolDataStore';

function createMockTransport(): EvolutionWhatsAppTransport {
  return {
    enviarTexto: vi.fn().mockResolvedValue({ messageId: 'bot-msg-1' }),
    enviarDocumento: vi.fn().mockResolvedValue({ messageId: 'bot-doc-1' }),
    marcarComoLido: vi.fn().mockResolvedValue(undefined),
    garantirConfiguracaoSegura: vi.fn().mockResolvedValue(undefined),
    obterMediaBase64: vi.fn().mockResolvedValue({ base64: '' }),
  };
}

describe('whatsappAgent (Pipeline Completo)', () => {
  beforeEach(() => {
    farolMemoryStore.conversasWhatsApp = [];
    farolMemoryStore.mensagensWhatsApp = [];
    farolMemoryStore.curriculosArquivos = [];
  });

  it('ignora grupos e garante idempotência de mensagens duplicadas', async () => {
    const db = createFarolWhatsAppChatDb();
    const evolution = createMockTransport();

    const grupo = await processFarolWebhook(
      {
        event: 'messages.upsert',
        data: {
          key: { id: 'msg-grp-1', remoteJid: '12036300000@g.us', fromMe: false },
          message: { conversation: 'Oi grupo' },
        },
      },
      { db, evolution, geminiApiKey: '' }
    );
    expect(grupo.action).toBe('ignored_non_user_jid');

    const payload = {
      event: 'messages.upsert',
      data: {
        key: { id: 'msg-unique-1', remoteJid: '5598988887777@s.whatsapp.net', fromMe: false },
        message: { conversation: 'Oi' },
      },
    };
    const primeira = await processFarolWebhook(payload, { db, evolution, geminiApiKey: '' });
    const duplicada = await processFarolWebhook(payload, { db, evolution, geminiApiKey: '' });

    expect(primeira.action).toBe('replied_fallback');
    expect(duplicada.action).toBe('ignored_duplicate_message');
    expect(evolution.enviarTexto).toHaveBeenCalledTimes(1);
  });

  it('pausa bot quando atendente humano responde (fromMe=true) e silencia novas mensagens', async () => {
    const db = createFarolWhatsAppChatDb();
    const evolution = createMockTransport();
    const jid = '5598987654321@s.whatsapp.net';

    const fromAttendant = await processFarolWebhook(
      {
        event: 'messages.upsert',
        data: {
          key: { id: 'att-1', remoteJid: jid, fromMe: true },
          message: { conversation: 'Olá, aqui é a Ana da SEMISPE.' },
        },
      },
      { db, evolution, geminiApiKey: '' }
    );
    expect(fromAttendant.action).toBe('bot_paused_by_human');

    const userDuringPause = await processFarolWebhook(
      {
        event: 'messages.upsert',
        data: {
          key: { id: 'usr-during-pause', remoteJid: jid, fromMe: false },
          message: { conversation: 'Obrigado Ana!' },
        },
      },
      { db, evolution, geminiApiKey: '' }
    );
    expect(userDuringPause.action).toBe('bot_paused_active');
    expect(evolution.enviarTexto).not.toHaveBeenCalled();

    const conv = await db.getOrCreateSession('5598987654321');
    const hist = await db.getRichChatHistory(conv.id, 40, 10080);
    expect(hist.some((m) => m.parts[0].text.includes('Obrigado Ana!'))).toBe(true);
  });

  it('analisa imagem recebida, extrai certificado e gera Currículo Padrão PDF anexado no painel e enviado no WhatsApp', async () => {
    const db = createFarolWhatsAppChatDb();
    const evolution = createMockTransport();
    const pngBase64 = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]).toString('base64');

    // Mock sequencial para: 1) Análise de imagem Gemini, 2) Resposta Gemini com tool gerar_e_enviar_curriculo_pdf, 3) Resposta final pós-tool
    const fetchMock = vi
      .fn()
      // Chamada 1: analisarImagemGemini
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      categoria: 'CERTIFICADO_CURSO',
                      resumoNatural: 'Certificado de curso de NR-12 emitido pela SEMISPE.',
                      informacoesPertinentes: ['Curso NR-12 (16h)', 'Aluno: João Lucas Mendes'],
                      alertaDadosSensiveis: false,
                      dadosCurriculo: {
                        nomeCompleto: 'João Lucas Mendes',
                        bairro: 'Anjo da Guarda',
                        escolaridade: 'MEDIO_COMPLETO',
                        competencias: ['NR-12 Segurança em Máquinas'],
                        cursosCertificacoes: [
                          { titulo: 'NR-12 Segurança em Máquinas', instituicao: 'SEMISPE', cargaHoraria: '16h' },
                        ],
                      },
                    }),
                  },
                ],
              },
            },
          ],
        }),
      })
      // Chamada 2: askFarolGemini solicita tool gerar_e_enviar_curriculo_pdf
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    functionCall: {
                      name: 'gerar_e_enviar_curriculo_pdf',
                      args: { confirmadoUsuario: true },
                    },
                  },
                ],
              },
            },
          ],
        }),
      })
      // Chamada 3: askFarolGemini redige confirmação final
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Li seu certificado de NR-12 e já gerei seu *Currículo Modelo Padrão FAROL* em PDF! Estou enviando por aqui e deixei anexado no seu painel.',
                  },
                ],
              },
            },
          ],
        }),
      });

    // Primeiro registra consentimento prévio para o telefone novo
    const telefoneNovo = '5598994445555';
    await db.updateSessionState(telefoneNovo, 'CURRICULO', {
      consentimentoLgpd: true,
      consentimentoEm: new Date().toISOString(),
    });

    const outcome = await processFarolDirectInput(
      {
        telefoneRaw: telefoneNovo,
        texto: 'Pode gerar meu currículo com esse certificado',
        imagemBase64: pngBase64,
        imagemMimeType: 'image/png',
      },
      {
        db,
        evolution,
        geminiApiKey: 'test-gemini-key',
        fetchFn: fetchMock as unknown as typeof fetch,
        skipDelays: true,
      }
    );

    expect(outcome.action).toBe('replied_ai_natural');
    expect(outcome.curriculoGerado).toBeDefined();
    expect(outcome.curriculoGerado?.fileName).toBe('Curriculo_FAROL_Joao_Lucas_Mendes.pdf');

    // Garante que o documento PDF foi enviado via Evolution API
    expect(evolution.enviarDocumento).toHaveBeenCalledTimes(1);
    expect(evolution.enviarDocumento).toHaveBeenCalledWith(
      expect.objectContaining({
        telefone: telefoneNovo,
        fileName: 'Curriculo_FAROL_Joao_Lucas_Mendes.pdf',
        mimetype: 'application/pdf',
      })
    );

    // Garante que o currículo foi anexado no painel do candidato no DB
    const candInfo = await farolService.buscarCandidatoPorTelefone(telefoneNovo);
    expect(candInfo).not.toBeNull();
    const arquivos = await farolService.listarCurriculosArquivosDoCandidato(
      candInfo!.candidato.id
    );
    expect(arquivos.length).toBe(1);
    expect(arquivos[0].origem).toBe('GERADO_SISTEMA');
    expect(arquivos[0].nomeArquivo).toBe('Curriculo_FAROL_Joao_Lucas_Mendes.pdf');
  });

  it('persiste todas as mensagens no DB e carrega contexto longo (40 mensagens) no histórico', async () => {
    const db = createFarolWhatsAppChatDb();
    const telefone = '5598991234567'; // Marcos Silva (já cadastrado)
    const conv = await db.getOrCreateSession(telefone);

    for (let i = 1; i <= 25; i++) {
      await db.saveMessage({
        conversaId: conv.id,
        direcao: i % 2 === 1 ? 'ENTRADA' : 'SAIDA',
        tipoMidia: 'TEXTO',
        conteudoTexto: `Mensagem histórica número ${i}`,
      });
    }

    const hist = await db.getRichChatHistory(conv.id, 40, 10080);
    expect(hist).toHaveLength(25);
    expect(hist[0].parts[0].text).toBe('Mensagem histórica número 1');
    expect(hist[24].parts[0].text).toBe('Mensagem histórica número 25');
  });

  it('remove competência existente a pedido do usuário e regenera PDF/painel sem ressurreição', async () => {
    const db = createFarolWhatsAppChatDb();
    const evolution = createMockTransport();
    const telefone = '5598997778888';

    // Estado inicial: candidato já cadastrado com a competência indesejada e PDF gerado anteriormente
    const inicial = await farolService.gerarEAnexarCurriculoPadrao({
      telefone,
      origemCanal: 'WHATSAPP',
      dados: {
        nomeCompleto: 'Taino Samuel Lima Ribeiro',
        bairro: 'Anjo da Guarda',
        escolaridade: 'SUPERIOR_INCOMPLETO',
        competencias: [
          'Atendimento via WhatsApp e Plataformas Web',
          'Excelente comunicação verbal e escrita',
          'Help Desk (N1/N2)',
        ],
      },
      substituirPerfilCompleto: true,
    });

    await db.updateSessionState(telefone, 'CURRICULO', {
      consentimentoLgpd: true,
      consentimentoEm: new Date().toISOString(),
      rascunhoCurriculo: inicial.dadosFinais,
    });

    // Simula a IA removendo a competência via tool e regerando o PDF no mesmo fluxo
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    functionCall: {
                      name: 'atualizar_rascunho_curriculo',
                      args: {
                        removerCompetencias: ['Excelente comunicação verbal e escrita'],
                      },
                    },
                  },
                  {
                    functionCall: {
                      name: 'gerar_e_enviar_curriculo_pdf',
                      args: { confirmadoUsuario: true },
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
                parts: [
                  {
                    text: 'Pronto, Taino! Removi "Excelente comunicação verbal e escrita" e já enviei seu novo PDF atualizado.',
                  },
                ],
              },
            },
          ],
        }),
      });

    const outcome = await processFarolDirectInput(
      {
        telefoneRaw: telefone,
        texto: 'Remova "Excelente comunicação verbal e escrita" e gere o novo PDF',
      },
      {
        db,
        evolution,
        geminiApiKey: 'test-gemini-key',
        fetchFn: fetchMock as unknown as typeof fetch,
        skipDelays: true,
      }
    );

    expect(outcome.action).toBe('replied_ai_natural');
    expect(outcome.curriculoGerado).toBeDefined();
    expect(evolution.enviarDocumento).toHaveBeenCalledTimes(1);

    // Verifica que no banco de candidato e no novo arquivo anexado a competência foi definitivamente removida
    const candAtualizado = await farolService.obterCandidato(inicial.candidato.id);
    expect(candAtualizado.competencias).toEqual([
      'Atendimento via WhatsApp e Plataformas Web',
      'Help Desk (N1/N2)',
    ]);

    const arquivos = await farolService.listarCurriculosArquivosDoCandidato(inicial.candidato.id);
    expect(arquivos[0].dadosExtraidosJson?.competencias).toEqual([
      'Atendimento via WhatsApp e Plataformas Web',
      'Help Desk (N1/N2)',
    ]);
  });
});
