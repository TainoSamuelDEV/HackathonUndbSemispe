import { NextRequest } from 'next/server';
import { isGeminiConfigured } from '@/server/config/env';
import {
  AcessoNegadoError,
  NaoAutenticadoError,
  RegraNegocioError,
  ValidacaoError,
} from '@/server/domain/errors/DomainError';
import { geminiClient } from '@/server/infrastructure/ai/GeminiClient';
import { obterSessaoAtual } from '@/server/infrastructure/auth/jwt';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(req: NextRequest) {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) {
      throw new NaoAutenticadoError('Faça login para extrair seu currículo.');
    }
    if (sessao.papel !== 'CANDIDATO') {
      throw new AcessoNegadoError('Apenas candidatos podem extrair currículo.');
    }

    if (!isGeminiConfigured()) {
      throw new RegraNegocioError(
        'A extração automática por IA não está configurada no servidor (GEMINI_API_KEY ausente).'
      );
    }

    const contentType = req.headers.get('content-type') ?? '';
    let base64 = '';
    let mimeType = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const arquivo = formData.get('arquivo') ?? formData.get('file');
      if (!(arquivo instanceof File)) {
        throw new ValidacaoError('Envie um arquivo PDF ou imagem no campo "arquivo".');
      }
      if (arquivo.size === 0 || arquivo.size > MAX_BYTES) {
        throw new ValidacaoError('O arquivo deve ter entre 1 byte e 8 MB.');
      }
      mimeType = arquivo.type.split(';')[0].trim();
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        throw new ValidacaoError('Formato não suportado. Envie PDF, JPG, PNG ou WEBP.');
      }
      const buffer = Buffer.from(await arquivo.arrayBuffer());
      base64 = buffer.toString('base64');
    } else {
      const body = (await req.json().catch(() => null)) as {
        base64?: string;
        mimeType?: string;
      } | null;
      if (!body?.base64 || !body?.mimeType) {
        throw new ValidacaoError('Envie "base64" e "mimeType" ou um formulário multipart.');
      }
      mimeType = body.mimeType.split(';')[0].trim();
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        throw new ValidacaoError('Formato não suportado. Envie PDF, JPG, PNG ou WEBP.');
      }
      base64 = body.base64;
    }

    const extraido = await geminiClient.extrairCurriculo(base64, mimeType);
    return ok({
      extraido,
      requerConfirmacao: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
