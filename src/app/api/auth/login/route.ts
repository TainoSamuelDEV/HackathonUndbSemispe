import { NextRequest } from 'next/server';
import { z } from 'zod';
import { farolService } from '@/server/application/FarolService';
import { COOKIE_SESSAO } from '@/server/infrastructure/auth/jwt';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(4, 'Senha inválida'),
});

export async function POST(req: NextRequest) {
  try {
    const body = loginSchema.parse(await req.json());
    const { token, sessao } = await farolService.autenticar(body.email, body.senha);

    const res = ok({ usuario: sessao });
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
