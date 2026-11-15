import { NextRequest } from 'next/server';
import { z } from 'zod';
import { farolService } from '@/server/application/FarolService';
import { COOKIE_SESSAO } from '@/server/infrastructure/auth/jwt';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

const cadastroPessoaSchema = z.object({
  nomeCompleto: z.string().min(3, 'Informe seu nome completo'),
  email: z.string().email('E-mail inválido'),
  telefoneWhatsapp: z.string().optional(),
  bairro: z.string().min(2, 'Informe seu bairro'),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export async function POST(req: NextRequest) {
  try {
    const body = cadastroPessoaSchema.parse(await req.json());
    const { token, sessao } = await farolService.cadastrarCandidato(body);

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
