import { NextRequest } from 'next/server';
import { z } from 'zod';
import { farolService } from '@/server/application/FarolService';
import { ValidacaoError } from '@/server/domain/errors/DomainError';
import { validarChaveInternaIA } from '@/server/infrastructure/http/aiAuth';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

const candidaturaIaSchema = z.object({
  candidatoId: z.string().min(1),
  vagaId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    validarChaveInternaIA(req);
    const candidatoId = req.nextUrl.searchParams.get('candidatoId');
    if (!candidatoId) throw new ValidacaoError('Parâmetro candidatoId é obrigatório.');

    const candidaturas = await farolService.listarCandidaturasDoCandidato(candidatoId);
    return ok({
      candidaturas: candidaturas.map((c) => ({
        candidaturaId: c.id,
        vagaTitulo: c.vaga?.titulo ?? 'Vaga',
        status: c.status,
        atualizadoEm: c.atualizadoEm,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    validarChaveInternaIA(req);
    const body = candidaturaIaSchema.parse(await req.json());
    const candidatura = await farolService.candidatar({
      candidatoId: body.candidatoId,
      vagaId: body.vagaId,
      origemCanal: 'WHATSAPP',
    });

    return ok({ candidatura }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
