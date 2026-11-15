import { NextRequest } from 'next/server';
import { z } from 'zod';
import { farolOrchestrator } from '@/server/ai/FarolOrchestrator';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

const chatSchema = z.object({
  telefone: z.string().min(8),
  mensagem: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = chatSchema.parse(await req.json());
    const resposta = await farolOrchestrator.processarMensagem({
      telefoneRaw: body.telefone,
      texto: body.mensagem,
    });
    return ok(resposta);
  } catch (error) {
    return handleApiError(error);
  }
}
