import { NextRequest } from 'next/server';
import { farolOrchestrator } from '@/server/ai/FarolOrchestrator';
import { getServerEnv } from '@/server/config/env';
import { AcessoNegadoError } from '@/server/domain/errors/DomainError';
import { EvolutionClient } from '@/server/infrastructure/evolution/EvolutionClient';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

export async function POST(req: NextRequest) {
  try {
    const env = getServerEnv();
    if (env.EVOLUTION_WEBHOOK_SECRET) {
      const secretHeader = req.headers.get('x-webhook-secret') ?? req.headers.get('apikey');
      if (secretHeader !== env.EVOLUTION_WEBHOOK_SECRET) {
        throw new AcessoNegadoError('Webhook Evolution não autorizado.');
      }
    }

    const payload = await req.json();
    const event = payload?.event;
    if (event !== 'messages.upsert') {
      return ok({ ignorado: true, motivo: 'Evento não processado' });
    }

    const data = payload?.data;
    if (data?.key?.fromMe) {
      return ok({ ignorado: true, motivo: 'Mensagem enviada pelo próprio bot' });
    }

    const remoteJid: string = data?.key?.remoteJid ?? '';
    const texto: string =
      data?.message?.conversation ??
      data?.message?.extendedTextMessage?.text ??
      '';

    if (!remoteJid || !texto) {
      return ok({ ignorado: true, motivo: 'Sem texto processável' });
    }

    const resultado = await farolOrchestrator.processarMensagem({
      telefoneRaw: remoteJid,
      texto,
    });

    // Envia resposta pela Evolution API quando configurada
    if (env.EVOLUTION_API_URL && env.EVOLUTION_API_KEY) {
      const evo = new EvolutionClient();
      await evo.enviarTexto({
        telefone: resultado.telefone,
        texto: resultado.respostaTexto,
      });
    }

    return ok({ processado: true, estadoAtual: resultado.estadoAtual });
  } catch (error) {
    return handleApiError(error);
  }
}
