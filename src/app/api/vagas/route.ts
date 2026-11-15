import { NextRequest } from 'next/server';
import { farolService } from '@/server/application/FarolService';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';
import type { ModalidadeTrabalho } from '@/types/farol';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const vagas = await farolService.listarVagasPublicas({
      busca: sp.get('busca') ?? undefined,
      bairro: sp.get('bairro') ?? undefined,
      modalidade: (sp.get('modalidade') as ModalidadeTrabalho) || undefined,
      area: sp.get('area') ?? undefined,
    });
    return ok({ vagas }, 200, { total: vagas.length });
  } catch (error) {
    return handleApiError(error);
  }
}
