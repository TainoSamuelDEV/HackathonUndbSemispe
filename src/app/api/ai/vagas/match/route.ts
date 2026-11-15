import { NextRequest } from 'next/server';
import { farolService } from '@/server/application/FarolService';
import { ValidacaoError } from '@/server/domain/errors/DomainError';
import { validarChaveInternaIA } from '@/server/infrastructure/http/aiAuth';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

export async function GET(req: NextRequest) {
  try {
    validarChaveInternaIA(req);
    const sp = req.nextUrl.searchParams;
    const candidatoId = sp.get('candidatoId');
    if (!candidatoId) throw new ValidacaoError('Parâmetro candidatoId é obrigatório.');

    const area = sp.get('area') ?? undefined;
    const limit = Math.min(Number(sp.get('limit') ?? '3') || 3, 3);

    const resultados = await farolService.listarMelhoresVagasParaIA(candidatoId, area, limit);

    return ok({
      vagas: resultados.map(({ vaga, match }) => ({
        vagaId: vaga.id,
        titulo: vaga.titulo,
        empresa: vaga.empresaNome,
        bairro: vaga.bairro,
        score: match.percentual,
        atende: match.atendidos,
        falta: match.naoIdentificados,
        origemTipo: vaga.origemTipo,
        origemUrl: vaga.origemUrl,
        seloSimulado: vaga.seloSimulado,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
