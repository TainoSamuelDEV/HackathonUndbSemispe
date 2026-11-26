import { NextRequest } from 'next/server';
import { z } from 'zod';
import { farolService } from '@/server/application/FarolService';
import { handleApiError, ok } from '@/server/infrastructure/http/apiResponse';

const inscricaoBoletimSchema = z.object({
  contato: z.string().trim().min(5, 'Informe seu e-mail ou WhatsApp.').max(160),
  consentimento: z.literal(true, {
    errorMap: () => ({ message: 'É preciso autorizar o uso do contato para receber o boletim.' }),
  }),
});

/** Inscrição pública no boletim de editais e eventos (e-mail ou WhatsApp). */
export async function POST(req: NextRequest) {
  try {
    const body = inscricaoBoletimSchema.parse(await req.json());
    const resultado = await farolService.inscreverNoBoletim({
      contato: body.contato,
      origemCanal: 'WEB',
    });
    return ok(resultado, resultado.jaInscrito ? 200 : 201);
  } catch (error) {
    return handleApiError(error);
  }
}
