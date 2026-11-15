import { NextRequest } from 'next/server';
import { farolService } from '@/server/application/FarolService';
import { AcessoNegadoError, NaoAutenticadoError } from '@/server/domain/errors/DomainError';
import { obterSessaoAtual } from '@/server/infrastructure/auth/jwt';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) throw new NaoAutenticadoError();
    if (sessao.papel !== 'CANDIDATO' || !sessao.candidatoId) {
      throw new AcessoNegadoError('Apenas candidatos podem se candidatar a vagas.');
    }

    const { id } = await context.params;
    const candidatura = await farolService.candidatar({
      candidatoId: sessao.candidatoId,
      vagaId: id,
      origemCanal: 'WEB',
    });

    return ok({ candidatura }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
