import { farolService } from '@/server/application/FarolService';
import { AcessoNegadoError, NaoAutenticadoError } from '@/server/domain/errors/DomainError';
import { obterSessaoAtual } from '@/server/infrastructure/auth/jwt';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

export async function POST() {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) throw new NaoAutenticadoError();
    if (sessao.papel !== 'CANDIDATO' || !sessao.candidatoId) {
      throw new AcessoNegadoError();
    }

    const gerado = await farolService.gerarEAnexarCurriculoPadrao({
      candidatoId: sessao.candidatoId,
      origemCanal: 'WEB',
    });

    const { arquivoBase64: _omitBase64, ...arquivoMeta } = gerado.arquivo;

    return ok(
      {
        arquivo: arquivoMeta,
        candidato: gerado.candidato,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
