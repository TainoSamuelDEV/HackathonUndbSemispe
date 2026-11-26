import { NextRequest } from 'next/server';
import { z } from 'zod';
import { farolService } from '@/server/application/FarolService';
import { AcessoNegadoError, NaoAutenticadoError } from '@/server/domain/errors/DomainError';
import { obterSessaoAtual } from '@/server/infrastructure/auth/jwt';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

const experienciaSchema = z.object({
  id: z.string().optional(),
  cargoAtividade: z.string().min(1).max(150),
  empresaOuContexto: z.string().max(150).nullable().optional(),
  trabalhoInformal: z.boolean().optional(),
  periodo: z.string().max(120).nullable().optional(),
});

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
  experiencias: z.array(experienciaSchema).optional(),
});

export async function GET() {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) throw new NaoAutenticadoError();
    if (sessao.papel !== 'CANDIDATO' || !sessao.candidatoId) {
      throw new AcessoNegadoError();
    }

    const [perfil, arquivosCurriculo] = await Promise.all([
      farolService.obterCandidato(sessao.candidatoId),
      farolService.listarCurriculosArquivosDoCandidato(sessao.candidatoId),
    ]);
    return ok({ perfil, arquivosCurriculo });
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
    const { experiencias, ...rest } = body;
    const perfil = await farolService.atualizarCurriculoCandidato(sessao.candidatoId, {
      ...rest,
      ...(experiencias !== undefined
        ? {
            experiencias: experiencias.map((e, idx) => ({
              id: e.id ?? `exp-${idx + 1}`,
              cargoAtividade: e.cargoAtividade.trim(),
              empresaOuContexto: e.empresaOuContexto?.trim() || null,
              trabalhoInformal: Boolean(e.trabalhoInformal),
              periodo: e.periodo?.trim() || null,
            })),
          }
        : {}),
    });
    return ok({ perfil });
  } catch (error) {
    return handleApiError(error);
  }
}
