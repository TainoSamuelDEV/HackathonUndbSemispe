import type { EditalRecord, EventoRecord } from '@/server/infrastructure/repositories/FarolDataStore';
import type { ModalidadeEvento } from '@/types/farol';
import { diasEntre, formatarDataCurta, formatarDataEvento, type DataEvento } from '@/lib/datasSaoLuis';

/** Dados de um edital prontos para exibição (serializáveis para o componente cliente). */
export interface EditalView {
  id: string;
  titulo: string;
  organizacao: string;
  resumo: string;
  publicoAlvo: string | null;
  beneficio: string | null;
  /** "Até 15/12/2026" ou a descrição do prazo (ex.: "Chamada em fluxo contínuo"). */
  prazo: string | null;
  /** Dias até o fim das inscrições; nulo em fluxo contínuo. */
  diasParaEncerrar: number | null;
  linkUrl: string | null;
  tags: string[];
  seloSimulado: boolean;
  textoBusca: string;
}

export interface EventoView {
  id: string;
  titulo: string;
  organizacao: string;
  resumo: string;
  local: string;
  modalidade: string;
  gratuito: boolean;
  linkInscricao: string | null;
  tags: string[];
  seloSimulado: boolean;
  inicio: string;
  fim: string | null;
  data: DataEvento;
  textoBusca: string;
}

const ROTULO_MODALIDADE_EVENTO: Record<ModalidadeEvento, string> = {
  PRESENCIAL: 'Presencial',
  ONLINE: 'Online',
  HIBRIDO: 'Híbrido',
};

/** Minúsculas e sem acentos, para busca tolerante. */
export function normalizarBusca(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function paraEditalView(edital: EditalRecord, hoje: string): EditalView {
  return {
    id: edital.id,
    titulo: edital.titulo,
    organizacao: edital.organizacao,
    resumo: edital.resumo,
    publicoAlvo: edital.publicoAlvo,
    beneficio: edital.beneficio,
    prazo: edital.inscricoesAte ? `Até ${formatarDataCurta(edital.inscricoesAte)}` : edital.prazoDescricao,
    diasParaEncerrar: edital.inscricoesAte ? diasEntre(hoje, edital.inscricoesAte) : null,
    linkUrl: edital.linkUrl,
    tags: edital.tags,
    seloSimulado: edital.seloSimulado,
    textoBusca: normalizarBusca(
      [edital.titulo, edital.organizacao, edital.resumo, edital.publicoAlvo ?? '', ...edital.tags].join(' ')
    ),
  };
}

export function paraEventoView(evento: EventoRecord): EventoView {
  const data = formatarDataEvento(evento.inicio, evento.fim);
  return {
    id: evento.id,
    titulo: evento.titulo,
    organizacao: evento.organizacao,
    resumo: evento.resumo,
    local: evento.local,
    modalidade: ROTULO_MODALIDADE_EVENTO[evento.modalidade] ?? evento.modalidade,
    gratuito: evento.gratuito,
    linkInscricao: evento.linkInscricao,
    tags: evento.tags,
    seloSimulado: evento.seloSimulado,
    inicio: evento.inicio,
    fim: evento.fim,
    data: { ...data, dataPorExtenso: capitalizar(data.dataPorExtenso) },
    textoBusca: normalizarBusca([evento.titulo, evento.organizacao, evento.resumo, evento.local, ...evento.tags].join(' ')),
  };
}
