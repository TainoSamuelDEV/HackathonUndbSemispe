import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { farolOrchestrator } from '@/server/ai/FarolOrchestrator';
import { getServerEnv } from '@/server/config/env';
import { AcessoNegadoError } from '@/server/domain/errors/DomainError';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

function safeSecretEquals(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const hashProvided = crypto.createHash('sha256').update(provided).digest();
  const hashExpected = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(hashProvided, hashExpected);
}

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

      if (!safeSecretEquals(providedSecret, env.EVOLUTION_WEBHOOK_SECRET)) {
        throw new AcessoNegadoError('Webhook Evolution não autorizado.');
      }
    }

    const resultado = await farolOrchestrator.processarWebhookEvolution(payload);

    return ok({
      processado: resultado.action.startsWith('replied_'),
      action: resultado.action,
      estadoAtual: resultado.estadoAtual,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
