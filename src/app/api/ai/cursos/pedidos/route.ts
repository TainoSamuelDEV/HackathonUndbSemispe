import { NextRequest } from 'next/server';
import { z } from 'zod';
import { farolService } from '@/server/application/FarolService';
import { validarChaveInternaIA } from '@/server/infrastructure/http/aiAuth';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

const pedidoIaSchema = z.object({
  candidatoId: z.string().nullable().optional(),
  temaDesejado: z.string().min(2),
  motivo: z.string().optional(),
  turnoPreferido: z.string().optional(),
  bairro: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    validarChaveInternaIA(req);
    const body = pedidoIaSchema.parse(await req.json());
    const pedido = await farolService.registrarPedidoCurso({
      candidatoId: body.candidatoId ?? null,
      temaDesejado: body.temaDesejado,
      motivo: body.motivo,
      turnoPreferido: body.turnoPreferido,
      bairro: body.bairro,
      origemCanal: 'WHATSAPP',
    });

    return ok({ pedido }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
