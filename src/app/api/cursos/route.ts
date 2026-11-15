import { NextRequest } from 'next/server';
import { farolService } from '@/server/application/FarolService';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';
import type { TipoCurso } from '@/types/farol';

export async function GET(req: NextRequest) {
  try {
    const tipo = (req.nextUrl.searchParams.get('tipo') as TipoCurso) || undefined;
    const cursos = await farolService.listarCursos(tipo);
    return ok({ cursos }, 200, { total: cursos.length });
  } catch (error) {
    return handleApiError(error);
  }
}
