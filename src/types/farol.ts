export type PapelUsuario = 'CANDIDATO' | 'EMPRESA' | 'ADMIN_SEMISPE';

export type NivelEscolaridade =
  | 'FUNDAMENTAL_INCOMPLETO'
  | 'FUNDAMENTAL_COMPLETO'
  | 'MEDIO_INCOMPLETO'
  | 'MEDIO_COMPLETO'
  | 'TECNICO'
  | 'SUPERIOR_INCOMPLETO'
  | 'SUPERIOR_COMPLETO';

export type ModalidadeTrabalho = 'PRESENCIAL' | 'HIBRIDO' | 'REMOTO';
export type TipoContratacao = 'CLT' | 'ESTAGIO' | 'JOVEM_APRENDIZ' | 'TEMPORARIO' | 'AUTONOMO_MEI' | 'OUTRO';
export type StatusVaga = 'RASCUNHO' | 'PUBLICADA' | 'ENCERRADA' | 'EXPIRADA';
export type OrigemVaga = 'INTERNA' | 'EXTERNA';
export type CanalOrigem = 'WEB' | 'WHATSAPP';

export type StatusCandidatura =
  | 'INSCRITO'
  | 'EM_ANALISE'
  | 'ENTREVISTA'
  | 'CONTRATADO'
  | 'DESISTENCIA'
  | 'NAO_APROVADO';

export type TipoLacuna = 'CONHECIMENTO' | 'REQUISITO' | 'CERTIFICACAO';

export type TipoCurso = 'PROGRAMADO' | 'SOB_DEMANDA';
export type StatusCurso = 'ATIVO' | 'INATIVO' | 'ENCERRADO';
export type StatusTurma = 'INSCRICOES_ABERTAS' | 'INSCRICOES_ENCERRADAS' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
export type StatusInscricaoCurso =
  | 'AGUARDANDO_CONFIRMACAO'
  | 'CONFIRMADA'
  | 'RECUSADA'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type EstadoConversaIA =
  | 'NOVO'
  | 'CONSENTIMENTO'
  | 'TRIAGEM'
  | 'CURRICULO'
  | 'INTERESSE'
  | 'MATCH'
  | 'CANDIDATURA'
  | 'ACOMPANHAMENTO'
  | 'FEEDBACK'
  | 'CURSOS'
  | 'PEDIDO_CURSO'
  | 'ATENDIMENTO_HUMANO';

export interface RequisitoVaga {
  id?: string;
  nome: string;
  tipo: TipoLacuna;
  obrigatorio: boolean;
}

export interface LacunaMatch {
  item: string;
  tipo: TipoLacuna;
  obrigatorio: boolean;
}

export interface ResultadoMatch {
  percentual: number;
  atendidos: string[];
  naoIdentificados: LacunaMatch[];
  obrigatoriosPendentes: string[];
  avaliadoEm: string;
}

export interface UsuarioSessao {
  id: string;
  email: string | null;
  papel: PapelUsuario;
  nome: string;
  candidatoId?: string;
  empresaId?: string;
  whatsappVerificado: boolean;
}
