import { NextRequest } from 'next/server';
import { z } from 'zod';
import { farolService } from '@/server/application/FarolService';
import { AcessoNegadoError, NaoAutenticadoError } from '@/server/domain/errors/DomainError';
import { obterSessaoAtual } from '@/server/infrastructure/auth/jwt';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

const curriculoSchema = z.object({
  nomeCompleto: z.string().min(3).optional(),
  nomeExibicao: z.string().min(2).optional(),
  bairro: z.string().min(2).optional(),
  escolaridade: z
    .enum([
      'FUNDAMENTAL_INCOMPLETO',
      'FUNDAMENTAL_COMPLETO',
      'MEDIO_INCOMPLETO',
      'MEDIO_COMPLETO',
      'TECNICO',
      'SUPERIOR_INCOMPLETO',
      'SUPERIOR_COMPLETO',
    ])
    .nullable()
    .optional(),
  areaInteresse: z.string().nullable().optional(),
  objetivo: z.string().nullable().optional(),
  resumoProfissional: z.string().nullable().optional(),
  disponibilidade: z.string().nullable().optional(),
  visivelServicos: z.boolean().optional(),
  categoriaServicos: z.string().nullable().optional(),
  competencias: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) throw new NaoAutenticadoError();
    if (sessao.papel !== 'CANDIDATO' || !sessao.candidatoId) {
      throw new AcessoNegadoError();
    }

    const perfil = await farolService.obterCandidato(sessao.candidatoId);
    return ok({ perfil });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) throw new NaoAutenticadoError();
    if (sessao.papel !== 'CANDIDATO' || !sessao.candidatoId) {
      throw new AcessoNegadoError();
    }

    const body = curriculoSchema.parse(await req.json());
    const perfil = await farolService.atualizarCurriculoCandidato(sessao.candidatoId, body);
    return ok({ perfil });
  } catch (error) {
    return handleApiError(error);
  }
}
