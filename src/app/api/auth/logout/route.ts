import { COOKIE_SESSAO } from '@/server/infrastructure/auth/jwt';
import { ok } from '@/server/infrastructure/http/apiResponse';

export async function POST() {
  const res = ok({ deslogado: true });
  res.cookies.set(COOKIE_SESSAO, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
