import { NextRequest } from 'next/server';
import { getServerEnv } from '@/server/config/env';
import { AcessoNegadoError } from '@/server/domain/errors/DomainError';

export function validarChaveInternaIA(req: NextRequest): void {
  const { AI_INTERNAL_API_KEY } = getServerEnv();
  const key = req.headers.get('x-ai-api-key');
  if (!key || key !== AI_INTERNAL_API_KEY) {
    throw new AcessoNegadoError('Chave de acesso da IA FAROL inválida ou ausente.');
  }
}
