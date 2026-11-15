import { farolService } from '@/server/application/FarolService';
import { AcessoNegadoError, NaoAutenticadoError } from '@/server/domain/errors/DomainError';
import { obterSessaoAtual } from '@/server/infrastructure/auth/jwt';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

export async function GET() {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) throw new NaoAutenticadoError();
    if (sessao.papel !== 'ADMIN_SEMISPE') {
      throw new AcessoNegadoError('Acesso restrito à equipe SEMISPE.');
    }

    const dashboard = await farolService.obterDashboardSemispe();
    return ok({ dashboard });
  } catch (error) {
    return handleApiError(error);
  }
}
