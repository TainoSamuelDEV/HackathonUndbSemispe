import { NextRequest } from 'next/server';
import { farolOrchestrator } from '@/server/ai/FarolOrchestrator';
import { getServerEnv } from '@/server/config/env';
import { AcessoNegadoError } from '@/server/domain/errors/DomainError';
import { EvolutionClient } from '@/server/infrastructure/evolution/EvolutionClient';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

export async function POST(req: NextRequest) {
  try {
    const env = getServerEnv();
    const payload = await req.json();

    if (env.EVOLUTION_WEBHOOK_SECRET) {
      const providedSecret =
        req.headers.get('x-webhook-secret') ??
        req.headers.get('apikey') ??
        req.headers.get('x-api-key') ??
        req.nextUrl.searchParams.get('secret') ??
        (typeof payload?.apikey === 'string' ? payload.apikey : null);

      if (providedSecret !== env.EVOLUTION_WEBHOOK_SECRET) {
        throw new AcessoNegadoError('Webhook Evolution não autorizado.');
      }
    }

    const event = String(payload?.event ?? '')
      .toLowerCase()
      .replace(/_/g, '.');
    if (event !== 'messages.upsert') {
      return ok({ ignorado: true, motivo: 'Evento não processado' });
    }

    const data = payload?.data;
    if (data?.key?.fromMe) {
      return ok({ ignorado: true, motivo: 'Mensagem enviada pelo próprio bot' });
    }

    const remoteJid: string = data?.key?.remoteJid ?? '';
    const message = data?.message ?? {};
    const texto: string =
      message?.conversation ??
      message?.extendedTextMessage?.text ??
      message?.imageMessage?.caption ??
      message?.documentMessage?.caption ??
      '';

    const audioMsg = message?.audioMessage;
    const documentMsg =
      message?.documentMessage ?? message?.documentWithCaptionMessage?.message?.documentMessage;
    const imageMsg = message?.imageMessage;

    if (!remoteJid || (!texto && !audioMsg && !documentMsg && !imageMsg)) {
      return ok({ ignorado: true, motivo: 'Sem texto ou mídia processável' });
    }

    let audioBase64: string | undefined;
    let audioMimeType: string | undefined;
    let documentoBase64: string | undefined;
    let documentoMimeType: string | undefined;

    const evo = env.EVOLUTION_API_URL && env.EVOLUTION_API_KEY ? new EvolutionClient() : null;
    const inlineBase64: string | undefined =
      message?.base64 ??
      data?.base64 ??
      audioMsg?.base64 ??
      documentMsg?.base64 ??
      imageMsg?.base64;

    if (audioMsg) {
      audioMimeType = String(audioMsg.mimetype ?? 'audio/ogg').split(';')[0].trim();
      if (inlineBase64) {
        audioBase64 = inlineBase64;
      } else if (evo && data?.key?.id) {
        const media = await evo.obterMediaBase64(data.key);
        audioBase64 = media.base64;
        if (media.mimetype) {
          audioMimeType = media.mimetype.split(';')[0].trim();
        }
      }
    } else if (documentMsg || imageMsg) {
      const targetMsg = documentMsg ?? imageMsg;
      documentoMimeType = String(
        targetMsg?.mimetype ?? (documentMsg ? 'application/pdf' : 'image/jpeg')
      )
        .split(';')[0]
        .trim();
      if (inlineBase64) {
        documentoBase64 = inlineBase64;
      } else if (evo && data?.key?.id) {
        const media = await evo.obterMediaBase64(data.key);
        documentoBase64 = media.base64;
        if (media.mimetype) {
          documentoMimeType = media.mimetype.split(';')[0].trim();
        }
      }
    }

    const resultado = await farolOrchestrator.processarMensagem({
      telefoneRaw: remoteJid,
      texto,
      audioBase64,
      audioMimeType,
      documentoBase64,
      documentoMimeType,
    });

    // Envia resposta pela Evolution API quando configurada
    if (evo) {
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
