import { NextRequest } from 'next/server';
import { farolService } from '@/server/application/FarolService';
import { validarChaveInternaIA } from '@/server/infrastructure/http/aiAuth';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

export async function GET(req: NextRequest) {
  try {
    validarChaveInternaIA(req);
    const sp = req.nextUrl.searchParams;
    const lacunasRaw = sp.get('lacunas') ?? '';
    const lacunas = lacunasRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const limit = Math.min(Number(sp.get('limit') ?? '3') || 3, 3);

    const cursos = await farolService.recomendarCursosParaLacunas(lacunas, limit);
    return ok({
      cursos: cursos.map((c) => ({
        cursoId: c.id,
        titulo: c.titulo,
        area: c.area,
        cargaHoraria: c.cargaHoraria,
        tipo: c.tipo,
        instituicao: c.instituicao,
        seloSimulado: c.seloSimulado,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
