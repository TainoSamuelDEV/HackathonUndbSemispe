import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getServerEnv } from '@/server/config/env';
import type { UsuarioSessao } from '@/types/farol';

export const COOKIE_SESSAO = 'farol_session';

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export function assinarTokenSessao(payload: UsuarioSessao): string {
  const { JWT_SECRET } = getServerEnv();
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verificarTokenSessao(token: string): UsuarioSessao | null {
  try {
    const { JWT_SECRET } = getServerEnv();
    return jwt.verify(token, JWT_SECRET) as UsuarioSessao;
  } catch {
    return null;
  }
}

export async function obterSessaoAtual(): Promise<UsuarioSessao | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  return verificarTokenSessao(token);
}
