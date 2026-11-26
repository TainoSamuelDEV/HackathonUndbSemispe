import {
  type CurriculoGeradoInfo,
  type DirectWhatsAppInput,
  type FarolAgentOutcome,
  processFarolDirectInput,
  processFarolWebhook,
} from '@/server/ai/whatsapp/whatsappAgent';
import { createFarolWhatsAppChatDb } from '@/server/ai/whatsapp/whatsappChatDb';
import { getServerEnv } from '@/server/config/env';
import { EvolutionClient } from '@/server/infrastructure/evolution/EvolutionClient';

export type MensagemEntradaWhatsApp = DirectWhatsAppInput;

export interface RespostaFarolAI {
  telefone: string;
  estadoAtual: string;
  respostaTexto: string;
  action?: FarolAgentOutcome['action'];
  curriculoGerado?: Omit<CurriculoGeradoInfo, 'pdfBase64'>;
}

/**
 * Orquestrador da IA FAROL (WhatsApp via Evolution API + Simulador Web).
 * Delega o pipeline completo ao módulo `src/server/ai/whatsapp/*`.
 */
export class FarolOrchestrator {
  private criarEvolutionSeConfigurado(): EvolutionClient | null {
    const env = getServerEnv();
    if (!env.EVOLUTION_API_URL || !env.EVOLUTION_API_KEY) {
      return null;
    }
    return new EvolutionClient();
  }

  async processarMensagem(entrada: MensagemEntradaWhatsApp): Promise<RespostaFarolAI> {
    const outcome = await processFarolDirectInput(entrada, {
      db: createFarolWhatsAppChatDb(),
      evolution: null,
      skipDelays: true,
    });

    return {
      telefone: outcome.telefone,
      estadoAtual: outcome.estadoAtual,
      respostaTexto: outcome.respostaTexto,
      action: outcome.action,
      ...(outcome.curriculoGerado
        ? {
            curriculoGerado: {
              arquivoId: outcome.curriculoGerado.arquivoId,
              fileName: outcome.curriculoGerado.fileName,
              downloadUrl: outcome.curriculoGerado.downloadUrl,
            },
          }
        : {}),
    };
  }

  async processarWebhookEvolution(rawPayload: unknown): Promise<FarolAgentOutcome> {
    return processFarolWebhook(rawPayload, {
      db: createFarolWhatsAppChatDb(),
      evolution: this.criarEvolutionSeConfigurado(),
    });
  }
}

export const farolOrchestrator = new FarolOrchestrator();
