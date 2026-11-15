import { NextRequest } from 'next/server';
import { z } from 'zod';
import { farolService } from '@/server/application/FarolService';
import { AcessoNegadoError, NaoAutenticadoError } from '@/server/domain/errors/DomainError';
import { obterSessaoAtual } from '@/server/infrastructure/auth/jwt';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

const novaVagaSchema = z.object({
  titulo: z.string().min(3),
  area: z.string().min(2),
  descricao: z.string().min(10),
  bairro: z.string().min(2),
  modalidade: z.enum(['PRESENCIAL', 'HIBRIDO', 'REMOTO']),
  tipoContratacao: z.enum(['CLT', 'ESTAGIO', 'JOVEM_APRENDIZ', 'TEMPORARIO', 'AUTONOMO_MEI', 'OUTRO']),
  quantidadeVagas: z.number().int().min(1).default(1),
  salarioMin: z.number().nullable().optional(),
  escolaridadeMinima: z
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
  jornada: z.string().nullable().optional(),
  beneficios: z.array(z.string()).optional(),
  requisitos: z
    .array(
      z.object({
        nome: z.string().min(2),
        tipo: z.enum(['CONHECIMENTO', 'REQUISITO', 'CERTIFICACAO']),
        obrigatorio: z.boolean(),
      })
    )
    .default([]),
});

export async function GET() {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) throw new NaoAutenticadoError();
    if (sessao.papel !== 'EMPRESA' || !sessao.empresaId) {
      throw new AcessoNegadoError();
    }

    const vagas = await farolService.listarVagasDaEmpresa(sessao.empresaId);
    return ok({ vagas });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) throw new NaoAutenticadoError();
    if (sessao.papel !== 'EMPRESA' || !sessao.empresaId) {
      throw new AcessoNegadoError();
    }

    const body = novaVagaSchema.parse(await req.json());
    const vaga = await farolService.publicarVagaEmpresa(sessao.empresaId, body);
    return ok({ vaga }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
