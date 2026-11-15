import { NextRequest } from 'next/server';
import { farolService } from '@/server/application/FarolService';
import { AcessoNegadoError, NaoAutenticadoError } from '@/server/domain/errors/DomainError';
import { obterSessaoAtual } from '@/server/infrastructure/auth/jwt';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) throw new NaoAutenticadoError();
    if (sessao.papel !== 'EMPRESA' || !sessao.empresaId) {
      throw new AcessoNegadoError();
    }

    const { id } = await context.params;
    const candidatos = await farolService.listarCandidatosDaVagaParaEmpresa(sessao.empresaId, id);
    return ok({ candidatos });
  } catch (error) {
    return handleApiError(error);
  }
}
