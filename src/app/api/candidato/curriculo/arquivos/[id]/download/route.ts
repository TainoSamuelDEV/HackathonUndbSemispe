import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { farolService } from '@/server/application/FarolService';
import {
  AcessoNegadoError,
  NaoAutenticadoError,
  RecursoNaoEncontradoError,
} from '@/server/domain/errors/DomainError';
import { obterSessaoAtual } from '@/server/infrastructure/auth/jwt';
import { handleApiError } from '@/server/infrastructure/http/apiResponse';

function sanitizeDownloadFilename(raw: string): string {
  const base = path.basename(raw || 'Curriculo_FAROL.pdf');
  const safe = base.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 100);
  return safe.toLowerCase().endsWith('.pdf') ? safe : `${safe || 'Curriculo_FAROL'}.pdf`;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) throw new NaoAutenticadoError();
    if (sessao.papel !== 'CANDIDATO' || !sessao.candidatoId) {
      throw new AcessoNegadoError();
    }

    const { id } = await context.params;
    const arquivo = await farolService.obterCurriculoArquivoPorId(id);
    if (!arquivo) {
      throw new RecursoNaoEncontradoError('Arquivo de currículo não encontrado.');
    }

    // Controle estrito de propriedade (IDOR protection)
    if (arquivo.candidatoId !== sessao.candidatoId) {
      throw new AcessoNegadoError('Você não tem permissão para acessar este currículo.');
    }

    if (!arquivo.arquivoBase64) {
      throw new RecursoNaoEncontradoError('Conteúdo do PDF indisponível para download.');
    }

    const cleanBase64 = arquivo.arquivoBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const fileName = sanitizeDownloadFilename(arquivo.nomeArquivo);
    const inline = req.nextUrl.searchParams.get('view') === '1';

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${fileName}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
        'Content-Length': String(buffer.length),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
