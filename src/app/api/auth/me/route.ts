import { obterSessaoAtual } from '@/server/infrastructure/auth/jwt';
import { ok } from '@/server/infrastructure/http/apiResponse';

export async function GET() {
  const sessao = await obterSessaoAtual();
  return ok({ usuario: sessao });
}
