import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { DomainError } from '@/server/domain/errors/DomainError';

export function ok<T>(data: T, status = 200, meta?: Record<string, unknown>) {
  return NextResponse.json(meta ? { data, meta } : { data }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof DomainError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDACAO',
          message: 'Dados de entrada inválidos.',
          details: error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  console.error('[FAROL API Error]', error);
  return NextResponse.json(
    {
      error: {
        code: 'ERRO_INTERNO',
        message: 'Ocorreu um erro interno no servidor.',
      },
    },
    { status: 500 }
  );
}
