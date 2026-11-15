export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code = 'DOMAIN_ERROR', statusCode = 400, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class RegraNegocioError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 'REGRA_NEGOCIO', 422, details);
  }
}

export class AcessoNegadoError extends DomainError {
  constructor(message = 'Você não tem permissão para realizar esta ação.') {
    super(message, 'ACESSO_NEGADO', 403);
  }
}

export class NaoAutenticadoError extends DomainError {
  constructor(message = 'Autenticação necessária.') {
    super(message, 'NAO_AUTENTICADO', 401);
  }
}

export class RecursoNaoEncontradoError extends DomainError {
  constructor(message = 'Recurso não encontrado.') {
    super(message, 'NAO_ENCONTRADO', 404);
  }
}

export class ValidacaoError extends DomainError {
  constructor(message = 'Dados inválidos.', details?: unknown) {
    super(message, 'VALIDACAO', 400, details);
  }
}
