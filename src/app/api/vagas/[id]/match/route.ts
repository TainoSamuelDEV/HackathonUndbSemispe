import { NextRequest } from 'next/server';
import { farolService } from '@/server/application/FarolService';
import { AcessoNegadoError, NaoAutenticadoError } from '@/server/domain/errors/DomainError';
import { obterSessaoAtual } from '@/server/infrastructure/auth/jwt';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) throw new NaoAutenticadoError();
    if (sessao.papel !== 'CANDIDATO' || !sessao.candidatoId) {
      throw new AcessoNegadoError('Apenas candidatos autenticados podem visualizar o score de compatibilidade.');
    }

    const { id } = await context.params;
    const match = await farolService.calcularMatchParaCandidato(sessao.candidatoId, id);
    return ok({ match });
  } catch (error) {
    return handleApiError(error);
  }
}
