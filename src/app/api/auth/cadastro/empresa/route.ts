import { NextRequest } from 'next/server';
import { z } from 'zod';
import { farolService } from '@/server/application/FarolService';
import { COOKIE_SESSAO } from '@/server/infrastructure/auth/jwt';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

const cadastroEmpresaSchema = z.object({
  responsavelNome: z.string().min(3),
  email: z.string().email(),
  cnpj: z.string().min(14),
  razaoSocial: z.string().min(3),
  nomeFantasia: z.string().optional(),
  ehMei: z.boolean().default(false),
  setor: z.string().min(2),
  bairro: z.string().min(2),
  telefone: z.string().min(8),
  senha: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = cadastroEmpresaSchema.parse(await req.json());
    const { token, sessao } = await farolService.cadastrarEmpresa(body);

    const res = ok({ usuario: sessao }, 201);
    res.cookies.set(COOKIE_SESSAO, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (error) {
    return handleApiError(error);
  }
}
