import { NextRequest } from 'next/server';
import { farolService } from '@/server/application/FarolService';
import { AcessoNegadoError, NaoAutenticadoError } from '@/server/domain/errors/DomainError';
import { obterSessaoAtual } from '@/server/infrastructure/auth/jwt';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

export async function GET(req: NextRequest) {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) throw new NaoAutenticadoError();
    if (sessao.papel !== 'EMPRESA') {
      throw new AcessoNegadoError('Área exclusiva para empresas cadastradas.');
    }

    const sp = req.nextUrl.searchParams;
    const profissionais = await farolService.buscarProfissionaisServicos({
      busca: sp.get('busca') ?? undefined,
      bairro: sp.get('bairro') ?? undefined,
    });

    return ok({ profissionais });
  } catch (error) {
    return handleApiError(error);
  }
}
