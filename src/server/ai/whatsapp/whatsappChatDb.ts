import { farolService } from '@/server/application/FarolService';
import type {
  CurriculoArquivoMetadata,
  CurriculoArquivoRecord,
  CurriculoPadraoData,
} from '@/server/domain/curriculo/CurriculoPadrao';
import type {
  CandidatoRecord,
  CandidaturaRecord,
  ConversaWhatsAppRecord,
  CursoRecord,
  EditalRecord,
  EventoRecord,
  MensagemWhatsAppRecord,
  PedidoCursoRecord,
  VagaRecord,
} from '@/server/infrastructure/repositories/FarolDataStore';
import type { EstadoConversaIA, ResultadoMatch } from '@/types/farol';

export type GeminiHistoryMessage = {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
};

export interface FarolWhatsAppChatDb {
  getOrCreateSession(
    telefone: string,
    meta?: { remoteJid?: string; pushName?: string }
  ): Promise<ConversaWhatsAppRecord>;
  updateSessionState(
    telefone: string,
    estadoAtual: EstadoConversaIA,
    contextoPatch?: Record<string, unknown>,
    atendimentoHumano?: boolean
  ): Promise<ConversaWhatsAppRecord>;
  updateSessionTopic(conversaId: string, topico: string | null): Promise<void>;
  linkCandidatoToSession(conversaId: string, candidatoId: string): Promise<void>;
  pauseBot(telefone: string, durationMinutes: number): Promise<void>;
  incrementSessionTurn(conversaId: string): Promise<void>;

  hasMessageBeenProcessed(evolutionMessageId: string): Promise<boolean>;
  saveMessage(input: {
    conversaId: string;
    direcao: 'ENTRADA' | 'SAIDA';
    tipoMidia: 'TEXTO' | 'AUDIO' | 'DOCUMENTO' | 'IMAGEM';
    conteudoTexto?: string | null;
    transcricaoAudio?: string | null;
    resumoMidia?: string | null;
    metadataJson?: Record<string, unknown>;
    evolutionMessageId?: string | null;
  }): Promise<boolean>;
  getRichChatHistory(
    conversaId: string,
    limit?: number,
    ttlMinutes?: number
  ): Promise<GeminiHistoryMessage[]>;

  findCandidatoByTelefone(telefone: string): Promise<{
    candidato: CandidatoRecord;
    email: string | null;
    telefoneWhatsapp: string | null;
  } | null>;
  getCandidatoById(candidatoId: string): Promise<CandidatoRecord>;
  listCurriculoArquivos(candidatoId: string): Promise<CurriculoArquivoMetadata[]>;
  gerarEAnexarCurriculoPadrao(input: {
    candidatoId?: string | null;
    telefone?: string | null;
    dados?: Partial<CurriculoPadraoData>;
    substituirPerfilCompleto?: boolean;
  }): Promise<{
    candidato: CandidatoRecord;
    arquivo: CurriculoArquivoRecord;
    pdfBase64: string;
    fileName: string;
    dadosFinais: CurriculoPadraoData;
  }>;

  listPublicVagas(filtros?: { area?: string; bairro?: string }): Promise<VagaRecord[]>;
  listBestVagasForCandidato(
    candidatoId: string,
    area?: string,
    limit?: number
  ): Promise<Array<{ vaga: VagaRecord; match: ResultadoMatch }>>;
  candidatarVaga(candidatoId: string, vagaId: string): Promise<CandidaturaRecord>;
  listCandidaturas(candidatoId: string): Promise<Array<{ status: string; scoreCalculado: number | null; vaga: VagaRecord | null }>>;
  listCursos(): Promise<CursoRecord[]>;
  recommendCursos(lacunas: string[], limit?: number): Promise<CursoRecord[]>;
  registrarPedidoCurso(input: {
    candidatoId: string | null;
    temaDesejado: string;
    motivo?: string | null;
    turnoPreferido?: string | null;
    bairro?: string | null;
  }): Promise<PedidoCursoRecord>;
  listEditaisAbertos(): Promise<EditalRecord[]>;
  listProximosEventos(): Promise<EventoRecord[]>;
}

function formatMessageForHistory(msg: MensagemWhatsAppRecord): string {
  const parts: string[] = [];

  if (msg.tipoMidia === 'AUDIO' && msg.transcricaoAudio) {
    parts.push(`[Áudio transcrito]: ${msg.transcricaoAudio}`);
  } else if (msg.tipoMidia === 'IMAGEM' && msg.resumoMidia) {
    parts.push(`[Imagem enviada]: ${msg.resumoMidia}`);
    if (msg.conteudoTexto) parts.push(`Legenda: ${msg.conteudoTexto}`);
  } else if (msg.tipoMidia === 'DOCUMENTO' && msg.resumoMidia) {
    parts.push(`[Documento enviado]: ${msg.resumoMidia}`);
    if (msg.conteudoTexto) parts.push(`Legenda: ${msg.conteudoTexto}`);
  } else if (msg.conteudoTexto) {
    parts.push(msg.conteudoTexto);
  }

  const combined = parts.join(' ').replace(/\s+/g, ' ').trim();
  if (!combined) return '';
  return combined.length > 900 ? `${combined.slice(0, 897)}...` : combined;
}

export function createFarolWhatsAppChatDb(): FarolWhatsAppChatDb {
  return {
    getOrCreateSession: (telefone, meta) =>
      farolService.obterOuCriarConversaWhatsApp(telefone, meta),

    updateSessionState: (telefone, estadoAtual, contextoPatch, atendimentoHumano) =>
      farolService.atualizarEstadoConversaWhatsApp(
        telefone,
        estadoAtual,
        contextoPatch,
        atendimentoHumano
      ),

    updateSessionTopic: (conversaId, topico) =>
      farolService.atualizarTopicoConversaWhatsApp(conversaId, topico),

    linkCandidatoToSession: (conversaId, candidatoId) =>
      farolService.vincularCandidatoConversaWhatsApp(conversaId, candidatoId),

    pauseBot: (telefone, durationMinutes) =>
      farolService.pausarBotConversaWhatsApp(telefone, durationMinutes),

    incrementSessionTurn: (conversaId) =>
      farolService.incrementarTurnoConversaWhatsApp(conversaId),

    hasMessageBeenProcessed: (evolutionMessageId) =>
      farolService.mensagemWhatsAppJaProcessada(evolutionMessageId),

    saveMessage: (input) => farolService.salvarMensagemWhatsApp(input),

    async getRichChatHistory(conversaId, limit = 40, ttlMinutes = 10080) {
      const mensagens = await farolService.listarHistoricoMensagensWhatsApp(
        conversaId,
        limit,
        ttlMinutes
      );

      const history: GeminiHistoryMessage[] = [];
      for (const msg of mensagens) {
        const text = formatMessageForHistory(msg);
        if (!text) continue;
        history.push({
          role: msg.direcao === 'SAIDA' ? 'model' : 'user',
          parts: [{ text }],
        });
      }
      return history;
    },

    findCandidatoByTelefone: (telefone) => farolService.buscarCandidatoPorTelefone(telefone),

    getCandidatoById: (candidatoId) => farolService.obterCandidato(candidatoId),

    listCurriculoArquivos: (candidatoId) =>
      farolService.listarCurriculosArquivosDoCandidato(candidatoId),

    gerarEAnexarCurriculoPadrao: (input) =>
      farolService.gerarEAnexarCurriculoPadrao({
        ...input,
        origemCanal: 'WHATSAPP',
      }),

    listPublicVagas: (filtros) => farolService.listarVagasPublicas(filtros),

    listBestVagasForCandidato: (candidatoId, area, limit = 3) =>
      farolService.listarMelhoresVagasParaIA(candidatoId, area, limit),

    candidatarVaga: (candidatoId, vagaId) =>
      farolService.candidatar({ candidatoId, vagaId, origemCanal: 'WHATSAPP' }),

    listCandidaturas: (candidatoId) => farolService.listarCandidaturasDoCandidato(candidatoId),

    listCursos: () => farolService.listarCursos(),

    recommendCursos: (lacunas, limit = 3) =>
      farolService.recomendarCursosParaLacunas(lacunas, limit),

    registrarPedidoCurso: (input) =>
      farolService.registrarPedidoCurso({
        ...input,
        origemCanal: 'WHATSAPP',
      }),

    listEditaisAbertos: () => farolService.listarEditaisAbertos(),

    listProximosEventos: () => farolService.listarProximosEventos(),
  };
}
