import { NextRequest } from 'next/server';
import { z } from 'zod';
import { farolOrchestrator } from '@/server/ai/FarolOrchestrator';
import { consumeRateLimit, getMemoryRateLimitStore } from '@/server/ai/whatsapp/rateLimit';
import { normalizarTelefoneWhatsApp } from '@/server/domain/ai/Guardrails';
import { RegraNegocioError, ValidacaoError } from '@/server/domain/errors/DomainError';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

const chatSchema = z.object({
  telefone: z.string().min(8),
  mensagem: z.string().optional(),
  imagemBase64: z.string().optional(),
  imagemMimeType: z.string().optional(),
  documentoBase64: z.string().optional(),
  documentoMimeType: z.string().optional(),
  documentoNome: z.string().max(180).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = chatSchema.parse(await req.json());
    const temTexto = Boolean(body.mensagem?.trim());
    const temMidia = Boolean(body.imagemBase64 || body.documentoBase64);

    if (!temTexto && !temMidia) {
      throw new ValidacaoError('Envie uma mensagem de texto ou um arquivo (imagem/documento).');
    }

    const telefoneNorm = normalizarTelefoneWhatsApp(body.telefone);
    const rl = consumeRateLimit({
      store: getMemoryRateLimitStore(),
      key: `api-ai-chat:${telefoneNorm || body.telefone}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!rl.ok) {
      throw new RegraNegocioError('Muitas mensagens em sequência. Aguarde alguns segundos.');
    }

    const resposta = await farolOrchestrator.processarMensagem({
      telefoneRaw: body.telefone,
      texto: body.mensagem,
      imagemBase64: body.imagemBase64,
      imagemMimeType: body.imagemMimeType,
      documentoBase64: body.documentoBase64,
      documentoMimeType: body.documentoMimeType,
      documentoNome: body.documentoNome,
    });

    return ok(resposta);
  } catch (error) {
    return handleApiError(error);
  }
}
