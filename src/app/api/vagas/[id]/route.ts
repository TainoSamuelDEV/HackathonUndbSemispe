import { NextRequest } from 'next/server';
import { farolService } from '@/server/application/FarolService';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const vaga = await farolService.obterVagaPorId(id);
    return ok({ vaga });
  } catch (error) {
    return handleApiError(error);
  }
}
