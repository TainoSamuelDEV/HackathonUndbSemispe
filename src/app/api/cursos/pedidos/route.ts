import { NextRequest } from 'next/server';
import { z } from 'zod';
import { farolService } from '@/server/application/FarolService';
import { NaoAutenticadoError } from '@/server/domain/errors/DomainError';
import { obterSessaoAtual } from '@/server/infrastructure/auth/jwt';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

const pedidoCursoSchema = z.object({
  cursoId: z.string().optional().nullable(),
  temaDesejado: z.string().min(3, 'Informe o tema do curso desejado'),
  motivo: z.string().optional(),
  turnoPreferido: z.string().optional(),
  bairro: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) throw new NaoAutenticadoError();

    const body = pedidoCursoSchema.parse(await req.json());
    const pedido = await farolService.registrarPedidoCurso({
      candidatoId: sessao.candidatoId ?? null,
      cursoId: body.cursoId ?? null,
      temaDesejado: body.temaDesejado,
      motivo: body.motivo,
      turnoPreferido: body.turnoPreferido,
      bairro: body.bairro,
      origemCanal: 'WEB',
    });

    return ok({ pedido }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
