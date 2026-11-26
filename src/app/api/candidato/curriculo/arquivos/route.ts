import { farolService } from '@/server/application/FarolService';
import { AcessoNegadoError, NaoAutenticadoError } from '@/server/domain/errors/DomainError';
import { obterSessaoAtual } from '@/server/infrastructure/auth/jwt';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

export async function GET() {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) throw new NaoAutenticadoError();
    if (sessao.papel !== 'CANDIDATO' || !sessao.candidatoId) {
      throw new AcessoNegadoError();
    }

    const arquivos = await farolService.listarCurriculosArquivosDoCandidato(sessao.candidatoId);
    return ok({ arquivos });
  } catch (error) {
    return handleApiError(error);
  }
}
