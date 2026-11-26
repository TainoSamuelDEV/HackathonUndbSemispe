import { getGeminiApiKey, getServerEnv } from '@/server/config/env';
import {
  normalizarTelefoneWhatsApp,
  sanitizarEntradaCidadao,
} from '@/server/domain/ai/Guardrails';
import {
  calcularCompletudeCurriculo,
  type CurriculoPadraoData,
  mesclarCurriculoPadrao,
  montarCurriculoDeCandidato,
  normalizarNivelEscolaridade,
  sanitizarCurriculoPadrao,
} from '@/server/domain/curriculo/CurriculoPadrao';
import { calcularCompatibilidade } from '@/server/domain/matching/MatchEngine';
import {
  askFarolGemini,
  buildFarolSystemPrompt,
  type FarolGeminiToolHandlers,
  obterContextoTemporalSaoLuis,
} from '@/server/ai/whatsapp/whatsappAi';
import type { FarolWhatsAppChatDb } from '@/server/ai/whatsapp/whatsappChatDb';
import {
  type EvolutionWebhookPayload,
  extractWhatsAppMessageContent,
  isUserWhatsAppJid,
  resolveRemoteJid,
  type TipoMidiaExtraida,
} from '@/server/ai/whatsapp/whatsappExtract';
import { enforceFarolSafety } from '@/server/ai/whatsapp/whatsappGuardrail';
import {
  buildHandoffConfirmationQuestion,
  detectarRespostaConsentimento,
  isAutoResponderMessage,
  isClosingCourtesyIntent,
  isConfirmHandoffIntent,
  isHumanHandoffIntent,
  isRejectHandoffIntent,
} from '@/server/ai/whatsapp/whatsappIntent';
import {
  analisarDocumentoGemini,
  analisarImagemGemini,
  transcreverAudioGemini,
  validarMidiaSegura,
} from '@/server/ai/whatsapp/whatsappMedia';
import { consumeRateLimit, getMemoryRateLimitStore } from '@/server/ai/whatsapp/rateLimit';
import type { EvolutionSendResult } from '@/server/infrastructure/evolution/EvolutionClient';
import type { EstadoConversaIA } from '@/types/farol';

export interface EvolutionWhatsAppTransport {
  enviarTexto(input: {
    telefone: string;
    texto: string;
    delay?: number;
    presence?: 'composing' | 'recording' | 'paused';
  }): Promise<EvolutionSendResult>;
  enviarDocumento(input: {
    telefone: string;
    base64: string;
    fileName: string;
    caption?: string;
    mimetype?: string;
  }): Promise<EvolutionSendResult>;
  marcarComoLido?(remoteJid: string, messageId: string): Promise<void>;
  garantirConfiguracaoSegura?(): Promise<void>;
  obterMediaBase64(key: {
    id: string;
    remoteJid?: string;
    fromMe?: boolean;
  }): Promise<{ base64: string; mimetype?: string }>;
}

export interface DirectWhatsAppInput {
  telefoneRaw: string;
  messageId?: string;
  pushName?: string;
  texto?: string;
  audioBase64?: string;
  audioMimeType?: string;
  documentoBase64?: string;
  documentoMimeType?: string;
  documentoNome?: string;
  imagemBase64?: string;
  imagemMimeType?: string;
}

export interface FarolWhatsAppDeps {
  db: FarolWhatsAppChatDb;
  evolution?: EvolutionWhatsAppTransport | null;
  appUrl?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  historyLimit?: number;
  historyTtlMinutes?: number;
  pauseMinutes?: number;
  skipDelays?: boolean;
  fetchFn?: typeof fetch;
}

export interface CurriculoGeradoInfo {
  arquivoId: string;
  fileName: string;
  downloadUrl: string;
  pdfBase64?: string;
}

export interface FarolAgentOutcome {
  action:
    | 'ignored_invalid_payload'
    | 'ignored_non_user_jid'
    | 'ignored_duplicate_message'
    | 'ignored_bot_echo'
    | 'bot_paused_by_human'
    | 'bot_paused_active'
    | 'rate_limited_user'
    | 'empty_message'
    | 'ignored_auto_responder'
    | 'replied_fast_path'
    | 'replied_ai_natural'
    | 'replied_fallback';
  telefone: string;
  estadoAtual: EstadoConversaIA;
  respostaTexto: string;
  curriculoGerado?: CurriculoGeradoInfo;
}

const inFlightMessageIds = new Set<string>();
const recentBotMessageIds = new Map<string, number>();

function registerBotMessageId(messageId?: string): void {
  if (!messageId) return;
  const now = Date.now();
  if (recentBotMessageIds.size > 300) {
    for (const [id, exp] of recentBotMessageIds.entries()) {
      if (exp <= now) recentBotMessageIds.delete(id);
    }
  }
  recentBotMessageIds.set(messageId, now + 60_000);
}

function isRecentBotEcho(messageId?: string): boolean {
  if (!messageId) return false;
  const exp = recentBotMessageIds.get(messageId);
  if (!exp) return false;
  if (exp <= Date.now()) {
    recentBotMessageIds.delete(messageId);
    return false;
  }
  return true;
}

export function calculateTypingDelay(replyTextLength: number): number {
  return Math.min(Math.max(replyTextLength * 10, 800), 1800);
}

interface NormalizedIncomingTurn {
  messageId: string;
  hasExternalMessageId: boolean;
  remoteJid: string;
  rawRemoteJid: string;
  telefone: string;
  fromMe: boolean;
  pushName?: string;
  text: string;
  caption: string;
  mediaKind: TipoMidiaExtraida;
  mimeType?: string;
  fileName?: string;
  inlineBase64?: string;
}

function readRascunhoFromContext(contextoJson: Record<string, unknown>): CurriculoPadraoData {
  const bruto = contextoJson.rascunhoCurriculo;
  if (bruto && typeof bruto === 'object') {
    return sanitizarCurriculoPadrao(bruto as Partial<CurriculoPadraoData>);
  }

  const legado = contextoJson.curriculoExtraido as Record<string, unknown> | undefined;
  return sanitizarCurriculoPadrao({
    nomeCompleto:
      (typeof contextoJson.nome === 'string' && contextoJson.nome) ||
      (typeof legado?.nome === 'string' ? legado.nome : ''),
    bairro:
      (typeof contextoJson.bairro === 'string' && contextoJson.bairro) ||
      (typeof legado?.bairro === 'string' ? legado.bairro : ''),
    escolaridade:
      (contextoJson.escolaridadeCodigo as CurriculoPadraoData['escolaridade']) ??
      normalizarNivelEscolaridade(
        typeof contextoJson.escolaridade === 'string'
          ? contextoJson.escolaridade
          : typeof legado?.escolaridade === 'string'
            ? legado.escolaridade
            : undefined
      ),
    escolaridadeTexto:
      typeof contextoJson.escolaridade === 'string' ? contextoJson.escolaridade : undefined,
    competencias: Array.isArray(contextoJson.habilidades)
      ? (contextoJson.habilidades as string[])
      : Array.isArray(legado?.habilidades)
        ? (legado.habilidades as string[])
        : [],
  });
}

async function enviarRespostaEvolution(params: {
  evolution?: EvolutionWhatsAppTransport | null;
  telefone: string;
  remoteJid: string;
  incomingMessageId: string;
  hasExternalMessageId: boolean;
  respostaTexto: string;
  marcarLido: boolean;
  skipDelays: boolean;
  curriculoGerado?: CurriculoGeradoInfo;
}): Promise<string | undefined> {
  if (!params.evolution) return undefined;

  if (params.marcarLido && params.hasExternalMessageId && params.evolution.marcarComoLido) {
    await params.evolution.marcarComoLido(params.remoteJid, params.incomingMessageId);
  }

  const delay = params.skipDelays ? 0 : calculateTypingDelay(params.respostaTexto.length);
  const sendRes = await params.evolution.enviarTexto({
    telefone: params.telefone,
    texto: params.respostaTexto,
    delay,
    presence: 'composing',
  });
  registerBotMessageId(sendRes?.messageId);

  if (params.curriculoGerado?.pdfBase64) {
    const docRes = await params.evolution.enviarDocumento({
      telefone: params.telefone,
      base64: params.curriculoGerado.pdfBase64,
      fileName: params.curriculoGerado.fileName,
      mimetype: 'application/pdf',
      caption:
        'Currículo Modelo Padrão FAROL 📄✅\nJá está salvo e anexado também no seu painel do portal.',
    });
    registerBotMessageId(docRes?.messageId);
  }

  return sendRes?.messageId;
}

async function buildDeterministicFallbackReply(params: {
  db: FarolWhatsAppChatDb;
  telefone: string;
  conversaId: string;
  estadoAtual: EstadoConversaIA;
  consentimentoLgpd: boolean;
  userText: string;
  rascunho: CurriculoPadraoData;
  candidatoId: string | null;
  onCurriculoGerado: (info: CurriculoGeradoInfo) => void;
}): Promise<{ estado: EstadoConversaIA; texto: string }> {
  const norm = params.userText.toLowerCase().trim();

  if (!params.consentimentoLgpd && params.estadoAtual === 'NOVO') {
    await params.db.updateSessionState(params.telefone, 'CONSENTIMENTO');
    return {
      estado: 'CONSENTIMENTO',
      texto:
        'Olá! Eu sou a assistente do *FAROL* (Prefeitura de São Luís e SEMISPE). ' +
        'Para montar seu currículo padrão em PDF e buscar vagas e cursos gratuitos para você, preciso da sua autorização para guardar dados como nome, bairro e experiência. Posso começar?',
    };
  }

  if (!params.consentimentoLgpd) {
    const decisao = detectarRespostaConsentimento(params.userText);
    if (decisao === 'ACEITO') {
      await params.db.updateSessionState(params.telefone, 'TRIAGEM', {
        consentimentoLgpd: true,
        consentimentoEm: new Date().toISOString(),
      });
      return {
        estado: 'TRIAGEM',
        texto: 'Combinado! Para começarmos, qual é o seu nome completo?',
      };
    }
    if (decisao === 'RECUSADO') {
      await params.db.updateSessionState(params.telefone, 'NOVO', {
        consentimentoLgpd: false,
      });
      return {
        estado: 'NOVO',
        texto:
          'Tudo bem! Sem sua autorização não salvo nenhum dado. Quando quiser montar seu currículo ou buscar vagas no FAROL, é só chamar.',
      };
    }
    return {
      estado: 'CONSENTIMENTO',
      texto:
        'Seus dados são usados apenas para montar seu currículo e encontrar vagas e cursos gratuitos. Posso guardar suas informações e começar? Responda *Sim* ou *Não*.',
    };
  }

  if (/(curriculo|curr[ií]culo|pdf|gerar)/i.test(norm)) {
    const comp = calcularCompletudeCurriculo(params.rascunho);
    if (comp.prontoParaGerar) {
      const gerado = await params.db.gerarEAnexarCurriculoPadrao({
        candidatoId: params.candidatoId,
        telefone: params.telefone,
        dados: params.rascunho,
      });
      await params.db.linkCandidatoToSession(params.conversaId, gerado.candidato.id);
      await params.db.updateSessionState(params.telefone, 'CURRICULO', {
        rascunhoCurriculo: gerado.dadosFinais,
        ultimoCurriculoArquivoId: gerado.arquivo.id,
      });
      params.onCurriculoGerado({
        arquivoId: gerado.arquivo.id,
        fileName: gerado.fileName,
        downloadUrl: gerado.arquivo.arquivoUrl,
        pdfBase64: gerado.pdfBase64,
      });
      return {
        estado: 'CURRICULO',
        texto:
          `Pronto, ${gerado.candidato.nomeExibicao}! Gerei seu *Currículo Modelo Padrão FAROL* em PDF (${gerado.fileName}) e já deixei anexado no seu painel. Vou enviar o arquivo por aqui agora.`,
      };
    }
    return {
      estado: 'CURRICULO',
      texto: `Para gerar seu currículo padrão em PDF, ainda preciso saber: ${comp.camposFaltantes.join(', ')}. Pode me informar?`,
    };
  }

  if (/(curso|capacita|qualifica)/i.test(norm)) {
    const cursos = await params.db.listCursos();
    const top = cursos.slice(0, 3);
    if (top.length === 0) {
      return {
        estado: 'CURSOS',
        texto: 'No momento não há cursos ativos cadastrados. Qual tema de curso você gostaria de pedir para a SEMISPE?',
      };
    }
    const lista = top
      .map((c, i) => `${i + 1}) *${c.titulo}* (${c.cargaHoraria}h · ${c.modalidade})`)
      .join('\n');
    await params.db.updateSessionState(params.telefone, 'CURSOS');
    return {
      estado: 'CURSOS',
      texto: `Encontrei estes cursos gratuitos da SEMISPE:\n${lista}\nSe quiser outro tema, me diga qual curso você procura.`,
    };
  }

  const vagas = await params.db.listPublicVagas();
  const topVagas = vagas.slice(0, 3);
  if (topVagas.length === 0) {
    return {
      estado: 'MATCH',
      texto: 'Não encontrei vagas abertas neste momento. Posso te mostrar os cursos gratuitos da SEMISPE ou gerar seu currículo padrão em PDF?',
    };
  }

  const lista = topVagas
    .map((v, idx) => {
      const m = calcularCompatibilidade(
        {
          escolaridade: params.rascunho.escolaridade ?? null,
          competencias: params.rascunho.competencias ?? [],
        },
        { escolaridadeMinima: v.escolaridadeMinima, requisitos: v.requisitos }
      );
      const selo = v.seloSimulado ? ' [Exemplo]' : '';
      return `${idx + 1}) *${v.titulo}*${selo} (${v.bairro}) — ${m.percentual}% compatível`;
    })
    .join('\n');

  await params.db.updateSessionState(params.telefone, 'MATCH');
  return {
    estado: 'MATCH',
    texto: `Separei estas oportunidades do FAROL para você:\n${lista}\nQuer saber mais detalhes de alguma delas ou atualizar seu currículo?`,
  };
}

async function runConversationPipeline(
  turn: NormalizedIncomingTurn,
  deps: FarolWhatsAppDeps
): Promise<FarolAgentOutcome> {
  const env = getServerEnv();
  const appUrl = (deps.appUrl ?? env.NEXT_PUBLIC_APP_URL).replace(/\/$/, '');
  const geminiApiKey = deps.geminiApiKey ?? getGeminiApiKey() ?? '';
  const geminiModel = deps.geminiModel ?? env.GEMINI_MODEL;
  const historyLimit = deps.historyLimit ?? env.WHATSAPP_HISTORY_LIMIT;
  const historyTtlMinutes = deps.historyTtlMinutes ?? env.WHATSAPP_HISTORY_TTL_MINUTES;
  const pauseMinutes = deps.pauseMinutes ?? env.WHATSAPP_BOT_PAUSE_MINUTES;
  const skipDelays = deps.skipDelays ?? process.env.NODE_ENV === 'test';

  if (!turn.telefone || !isUserWhatsAppJid(turn.remoteJid)) {
    return {
      action: 'ignored_non_user_jid',
      telefone: turn.telefone,
      estadoAtual: 'NOVO',
      respostaTexto: '',
    };
  }

  if (turn.hasExternalMessageId && isRecentBotEcho(turn.messageId)) {
    return {
      action: 'ignored_bot_echo',
      telefone: turn.telefone,
      estadoAtual: 'NOVO',
      respostaTexto: '',
    };
  }

  if (turn.hasExternalMessageId) {
    const already = await deps.db.hasMessageBeenProcessed(turn.messageId);
    if (already) {
      return {
        action: 'ignored_duplicate_message',
        telefone: turn.telefone,
        estadoAtual: 'NOVO',
        respostaTexto: '',
      };
    }
  }

  if (deps.evolution?.garantirConfiguracaoSegura) {
    void deps.evolution.garantirConfiguracaoSegura().catch(() => {});
  }

  // Intervenção humana pelo aparelho/WhatsApp Web (fromMe = true)
  if (turn.fromMe) {
    const session = await deps.db.getOrCreateSession(turn.telefone, {
      remoteJid: turn.remoteJid,
      pushName: turn.pushName,
    });
    await deps.db.pauseBot(turn.telefone, pauseMinutes);
    const humanText = sanitizarEntradaCidadao(turn.text || turn.caption).textoLimpo;
    if (humanText) {
      await deps.db.saveMessage({
        conversaId: session.id,
        direcao: 'SAIDA',
        tipoMidia: turn.mediaKind,
        conteudoTexto: humanText,
        metadataJson: { origem: 'atendente_humano' },
        evolutionMessageId: turn.hasExternalMessageId ? turn.messageId : null,
      });
    }
    return {
      action: 'bot_paused_by_human',
      telefone: turn.telefone,
      estadoAtual: 'ATENDIMENTO_HUMANO',
      respostaTexto: '',
    };
  }

  const session = await deps.db.getOrCreateSession(turn.telefone, {
    remoteJid: turn.remoteJid,
    pushName: turn.pushName,
  });

  // Se o bot está em pausa ativa para atendimento humano, grava a mensagem e silencia
  const pausedActive =
    (Boolean(session.botPausedUntil) &&
      new Date(session.botPausedUntil!).getTime() > Date.now()) ||
    (session.atendimentoHumano && !session.botPausedUntil);

  // Download e processamento multimodal (Áudio / Documento / Imagem)
  let mediaBase64 = turn.inlineBase64;
  let mediaMime = turn.mimeType;

  if (
    turn.mediaKind !== 'TEXTO' &&
    !mediaBase64 &&
    turn.hasExternalMessageId &&
    deps.evolution?.obterMediaBase64
  ) {
    try {
      const downloaded = await deps.evolution.obterMediaBase64({
        id: turn.messageId,
        remoteJid: turn.rawRemoteJid || turn.remoteJid,
        fromMe: false,
      });
      mediaBase64 = downloaded.base64;
      if (downloaded.mimetype) {
        mediaMime = downloaded.mimetype.split(';')[0].trim().toLowerCase();
      }
    } catch (err) {
      console.warn('[FarolWhatsApp] Falha ao baixar mídia da Evolution API:', err);
    }
  }

  let textoUsuario = sanitizarEntradaCidadao(turn.text).textoLimpo;
  let transcricaoAudio: string | null = null;
  let resumoMidia: string | null = null;
  let mediaContextNotice: string | null = null;
  let extractedCurriculoPatch: Partial<CurriculoPadraoData> | null = null;
  let midiaMetadata: Record<string, unknown> = {};
  let alertaDadosSensiveis = false;

  if (turn.mediaKind === 'AUDIO') {
    if (!mediaBase64 || !geminiApiKey) {
      const reply =
        'Recebi seu áudio, mas no momento não consegui transcrevê-lo automaticamente. Pode escrever sua mensagem por texto, por favor?';
      if (!pausedActive) {
        await enviarRespostaEvolution({
          evolution: deps.evolution,
          telefone: turn.telefone,
          remoteJid: turn.remoteJid,
          incomingMessageId: turn.messageId,
          hasExternalMessageId: turn.hasExternalMessageId,
          respostaTexto: reply,
          marcarLido: true,
          skipDelays,
        });
      }
      return {
        action: pausedActive ? 'bot_paused_active' : 'replied_fast_path',
        telefone: turn.telefone,
        estadoAtual: session.estadoAtual,
        respostaTexto: pausedActive ? '' : reply,
      };
    }

    try {
      transcricaoAudio = await transcreverAudioGemini({
        base64: mediaBase64,
        mimeType: mediaMime || 'audio/ogg',
        apiKey: geminiApiKey,
        primaryModel: geminiModel,
        fetchFn: deps.fetchFn,
      });
      textoUsuario = transcricaoAudio;
      mediaContextNotice = `O cidadão enviou um ÁUDIO cuja transcrição foi: "${transcricaoAudio}".`;
    } catch {
      const reply =
        'Não consegui entender bem esse áudio. Pode tentar gravar novamente ou me contar por texto?';
      await deps.db.saveMessage({
        conversaId: session.id,
        direcao: 'ENTRADA',
        tipoMidia: 'AUDIO',
        conteudoTexto: '[Áudio inaudível]',
        evolutionMessageId: turn.hasExternalMessageId ? turn.messageId : null,
      });
      if (!pausedActive) {
        await enviarRespostaEvolution({
          evolution: deps.evolution,
          telefone: turn.telefone,
          remoteJid: turn.remoteJid,
          incomingMessageId: turn.messageId,
          hasExternalMessageId: turn.hasExternalMessageId,
          respostaTexto: reply,
          marcarLido: true,
          skipDelays,
        });
      }
      return {
        action: pausedActive ? 'bot_paused_active' : 'replied_fast_path',
        telefone: turn.telefone,
        estadoAtual: session.estadoAtual,
        respostaTexto: pausedActive ? '' : reply,
      };
    }
  } else if (turn.mediaKind === 'DOCUMENTO' || turn.mediaKind === 'IMAGEM') {
    const kind = turn.mediaKind;
    const defaultMime = kind === 'DOCUMENTO' ? 'application/pdf' : 'image/jpeg';

    if (!mediaBase64) {
      const reply =
        'Recebi seu arquivo, mas não consegui carregá-lo agora. Pode reenviar o arquivo ou me mandar as informações por texto?';
      if (!pausedActive) {
        await enviarRespostaEvolution({
          evolution: deps.evolution,
          telefone: turn.telefone,
          remoteJid: turn.remoteJid,
          incomingMessageId: turn.messageId,
          hasExternalMessageId: turn.hasExternalMessageId,
          respostaTexto: reply,
          marcarLido: true,
          skipDelays,
        });
      }
      return {
        action: pausedActive ? 'bot_paused_active' : 'replied_fast_path',
        telefone: turn.telefone,
        estadoAtual: session.estadoAtual,
        respostaTexto: pausedActive ? '' : reply,
      };
    }

    const validacao = validarMidiaSegura({
      base64: mediaBase64,
      mimeType: mediaMime || defaultMime,
      kind,
    });

    if (!validacao.valido) {
      const reply = `${validacao.motivo} Envie uma imagem (JPG/PNG/WEBP) ou documento PDF/TXT de até 10 MB.`;
      if (!pausedActive) {
        await enviarRespostaEvolution({
          evolution: deps.evolution,
          telefone: turn.telefone,
          remoteJid: turn.remoteJid,
          incomingMessageId: turn.messageId,
          hasExternalMessageId: turn.hasExternalMessageId,
          respostaTexto: reply,
          marcarLido: true,
          skipDelays,
        });
      }
      return {
        action: pausedActive ? 'bot_paused_active' : 'replied_fast_path',
        telefone: turn.telefone,
        estadoAtual: session.estadoAtual,
        respostaTexto: pausedActive ? '' : reply,
      };
    }

    if (geminiApiKey) {
      try {
        if (kind === 'DOCUMENTO') {
          const analiseDoc = await analisarDocumentoGemini({
            base64: validacao.cleanBase64,
            mimeType: validacao.mimeType,
            fileName: turn.fileName,
            caption: turn.caption,
            apiKey: geminiApiKey,
            primaryModel: geminiModel,
            fetchFn: deps.fetchFn,
          });
          resumoMidia = analiseDoc.resumoNatural;
          extractedCurriculoPatch = analiseDoc.dadosCurriculo;
          alertaDadosSensiveis = analiseDoc.alertaDadosSensiveis;
          midiaMetadata = {
            tipoDocumento: analiseDoc.tipoDocumento,
            fileName: turn.fileName ?? null,
            mimeType: validacao.mimeType,
          };
          mediaContextNotice =
            `O cidadão enviou um DOCUMENTO (${analiseDoc.tipoDocumento}). ` +
            `Resumo extraído: ${analiseDoc.resumoNatural}` +
            (analiseDoc.alertaDadosSensiveis
              ? ' (ATENÇÃO: o documento continha CPF/RG que foi descartado por segurança LGPD — avise gentilmente que não armazenamos documentos pessoais sensíveis).'
              : '');
          if (!textoUsuario) {
            textoUsuario = `Enviei um documento (${analiseDoc.tipoDocumento}): ${analiseDoc.resumoNatural}`;
          }
        } else {
          const analiseImg = await analisarImagemGemini({
            base64: validacao.cleanBase64,
            mimeType: validacao.mimeType,
            caption: turn.caption,
            apiKey: geminiApiKey,
            primaryModel: geminiModel,
            fetchFn: deps.fetchFn,
          });
          resumoMidia = [
            analiseImg.resumoNatural,
            ...analiseImg.informacoesPertinentes.slice(0, 4),
          ]
            .filter(Boolean)
            .join(' | ');
          extractedCurriculoPatch = analiseImg.dadosCurriculo;
          alertaDadosSensiveis = analiseImg.alertaDadosSensiveis;
          midiaMetadata = {
            categoriaImagem: analiseImg.categoria,
            informacoesPertinentes: analiseImg.informacoesPertinentes,
            vagaMencionada: analiseImg.vagaMencionada ?? null,
            mimeType: validacao.mimeType,
          };
          mediaContextNotice =
            `O cidadão enviou uma IMAGEM classificada como ${analiseImg.categoria}. ` +
            `Análise visual: ${analiseImg.resumoNatural}. ` +
            (analiseImg.informacoesPertinentes.length > 0
              ? `Pontos pertinentes: ${analiseImg.informacoesPertinentes.join('; ')}. `
              : '') +
            (analiseImg.vagaMencionada
              ? `Vaga identificada na imagem: ${JSON.stringify(analiseImg.vagaMencionada)}. `
              : '') +
            (analiseImg.alertaDadosSensiveis
              ? 'ATENÇÃO: dados sensíveis (CPF/RG) detectados na imagem foram descartados por segurança LGPD.'
              : '');
          if (!textoUsuario) {
            textoUsuario = `Enviei uma imagem (${analiseImg.categoria}): ${resumoMidia}`;
          }
        }
      } catch (err) {
        console.warn(`[FarolWhatsApp] Falha ao analisar ${kind} com Gemini:`, err);
        resumoMidia = `${kind === 'DOCUMENTO' ? 'Documento' : 'Imagem'} recebido, mas não foi possível extrair os detalhes automaticamente.`;
        if (!textoUsuario) {
          textoUsuario = resumoMidia;
        }
      }
    } else {
      resumoMidia = `${kind === 'DOCUMENTO' ? 'Documento' : 'Imagem'} recebido (análise automática indisponível sem GEMINI_API_KEY).`;
      if (!textoUsuario) textoUsuario = resumoMidia;
    }
  }

  if (!textoUsuario && !resumoMidia) {
    return {
      action: 'empty_message',
      telefone: turn.telefone,
      estadoAtual: session.estadoAtual,
      respostaTexto: '',
    };
  }

  // Se o bot estiver em pausa ativa, apenas registra a entrada no histórico
  if (pausedActive) {
    await deps.db.saveMessage({
      conversaId: session.id,
      direcao: 'ENTRADA',
      tipoMidia: turn.mediaKind,
      conteudoTexto: textoUsuario || null,
      transcricaoAudio,
      resumoMidia,
      metadataJson: midiaMetadata,
      evolutionMessageId: turn.hasExternalMessageId ? turn.messageId : null,
    });
    return {
      action: 'bot_paused_active',
      telefone: turn.telefone,
      estadoAtual: session.estadoAtual,
      respostaTexto: '',
    };
  }

  // Rate limit por usuário (15 msgs/min)
  const rl = consumeRateLimit({
    store: getMemoryRateLimitStore(),
    key: `farol-wa:${turn.telefone}`,
    limit: 15,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return {
      action: 'rate_limited_user',
      telefone: turn.telefone,
      estadoAtual: session.estadoAtual,
      respostaTexto: '',
    };
  }

  // Anti-loop de respostas automáticas
  if (isAutoResponderMessage(textoUsuario)) {
    return {
      action: 'ignored_auto_responder',
      telefone: turn.telefone,
      estadoAtual: session.estadoAtual,
      respostaTexto: '',
    };
  }

  // Sanitiza CPF/RG do texto original antes de persistir no DB
  const sanitEntrada = sanitizarEntradaCidadao(turn.text || textoUsuario);
  const textoSeguroEntrada = sanitEntrada.textoLimpo || textoUsuario;

  // Claim atômico da mensagem recebida no DB
  const saved = await deps.db.saveMessage({
    conversaId: session.id,
    direcao: 'ENTRADA',
    tipoMidia: turn.mediaKind,
    conteudoTexto: textoSeguroEntrada,
    transcricaoAudio,
    resumoMidia,
    metadataJson: midiaMetadata,
    evolutionMessageId: turn.hasExternalMessageId ? turn.messageId : null,
  });
  if (!saved && turn.hasExternalMessageId) {
    return {
      action: 'ignored_duplicate_message',
      telefone: turn.telefone,
      estadoAtual: session.estadoAtual,
      respostaTexto: '',
    };
  }

  // Alerta imediato se enviou CPF/RG em texto puro sem outra informação
  if ((sanitEntrada.detectouCpf || sanitEntrada.detectouRg) && !extractedCurriculoPatch) {
    if (textoSeguroEntrada.replace(/\[DADO_REMOVIDO_LGPD\]/g, '').trim().length < 3) {
      const piiReply =
        'Por segurança (LGPD), não preciso do seu CPF ou RG e já descartei esses números. Pode me contar sua experiência ou mandar os demais dados sem documentos pessoais?';
      const botMsgId = await enviarRespostaEvolution({
        evolution: deps.evolution,
        telefone: turn.telefone,
        remoteJid: turn.remoteJid,
        incomingMessageId: turn.messageId,
        hasExternalMessageId: turn.hasExternalMessageId,
        respostaTexto: piiReply,
        marcarLido: true,
        skipDelays,
      });
      await deps.db.saveMessage({
        conversaId: session.id,
        direcao: 'SAIDA',
        tipoMidia: 'TEXTO',
        conteudoTexto: piiReply,
        evolutionMessageId: botMsgId ?? null,
      });
      return {
        action: 'replied_fast_path',
        telefone: turn.telefone,
        estadoAtual: session.estadoAtual,
        respostaTexto: piiReply,
      };
    }
  }

  // Carrega histórico rico (últimas 40 mensagens / 7 dias) ANTES de responder
  const fullHistory = await deps.db.getRichChatHistory(
    session.id,
    historyLimit,
    historyTtlMinutes
  );
  // Remove a última mensagem se ela for exatamente a mensagem recém-salva neste turno
  const history =
    fullHistory.length > 0 && fullHistory[fullHistory.length - 1].role === 'user'
      ? fullHistory.slice(0, -1)
      : fullHistory;

  const hasPreviousInteraction = (session.turnosSessao ?? 0) > 0 || history.length > 0;
  const dataHoraAtual = obterContextoTemporalSaoLuis();

  // Carrega dados reais do candidato se vinculado ou encontrado por telefone
  let candidatoInfo = session.candidatoId
    ? {
        candidato: await deps.db.getCandidatoById(session.candidatoId).catch(() => null),
        email: null as string | null,
        telefoneWhatsapp: turn.telefone as string | null,
      }
    : await deps.db.findCandidatoByTelefone(turn.telefone);

  if (candidatoInfo?.candidato && !session.candidatoId) {
    await deps.db.linkCandidatoToSession(session.id, candidatoInfo.candidato.id);
    session.candidatoId = candidatoInfo.candidato.id;
  }

  let rascunhoAtual = readRascunhoFromContext(session.contextoJson);
  if (candidatoInfo?.candidato) {
    rascunhoAtual = mesclarCurriculoPadrao(
      montarCurriculoDeCandidato(candidatoInfo.candidato, {
        telefone: candidatoInfo.telefoneWhatsapp ?? turn.telefone,
        email: candidatoInfo.email,
      }),
      rascunhoAtual
    );
  }
  if (extractedCurriculoPatch) {
    rascunhoAtual = mesclarCurriculoPadrao(rascunhoAtual, extractedCurriculoPatch);
    await deps.db.updateSessionState(
      turn.telefone,
      session.estadoAtual === 'NOVO' ? 'CURRICULO' : session.estadoAtual,
      { rascunhoCurriculo: rascunhoAtual }
    );
  }

  const consentimentoLgpd =
    Boolean(session.contextoJson.consentimentoLgpd) ||
    Boolean(session.contextoJson.consentimentoEm) ||
    Boolean(candidatoInfo?.candidato?.consentimentoLgpd) ||
    session.estadoAtual !== 'NOVO' && session.estadoAtual !== 'CONSENTIMENTO';

  const cidadaoNomePrimeiro =
    (rascunhoAtual.nomeCompleto || candidatoInfo?.candidato?.nomeExibicao || '')
      .trim()
      .split(/\s+/)[0] || null;

  const isAwaitingHandoff = session.topicoAtual === 'aguardando_confirmacao_humano';

  // Fast-path 1: Confirmação em 2 etapas para atendimento humano SEMISPE
  if (isAwaitingHandoff) {
    if (isConfirmHandoffIntent(textoUsuario)) {
      await deps.db.pauseBot(turn.telefone, pauseMinutes);
      await deps.db.updateSessionTopic(session.id, null);
      const handoffMsg =
        `Perfeito${cidadaoNomePrimeiro ? `, ${cidadaoNomePrimeiro}` : ''}! Passei seu atendimento para a equipe da SEMISPE. Em breve um atendente vai falar com você por aqui.`;
      const botMsgId = await enviarRespostaEvolution({
        evolution: deps.evolution,
        telefone: turn.telefone,
        remoteJid: turn.remoteJid,
        incomingMessageId: turn.messageId,
        hasExternalMessageId: turn.hasExternalMessageId,
        respostaTexto: handoffMsg,
        marcarLido: false, // preserva notificação para a equipe humana
        skipDelays,
      });
      await deps.db.saveMessage({
        conversaId: session.id,
        direcao: 'SAIDA',
        tipoMidia: 'TEXTO',
        conteudoTexto: handoffMsg,
        evolutionMessageId: botMsgId ?? null,
      });
      return {
        action: 'replied_fast_path',
        telefone: turn.telefone,
        estadoAtual: 'ATENDIMENTO_HUMANO',
        respostaTexto: handoffMsg,
      };
    }

    if (isRejectHandoffIntent(textoUsuario)) {
      await deps.db.updateSessionTopic(session.id, null);
      const rejectMsg = `Combinado${cidadaoNomePrimeiro ? `, ${cidadaoNomePrimeiro}` : ''}! Continuamos por aqui. Como posso te ajudar com seu currículo, vagas ou cursos?`;
      const botMsgId = await enviarRespostaEvolution({
        evolution: deps.evolution,
        telefone: turn.telefone,
        remoteJid: turn.remoteJid,
        incomingMessageId: turn.messageId,
        hasExternalMessageId: turn.hasExternalMessageId,
        respostaTexto: rejectMsg,
        marcarLido: true,
        skipDelays,
      });
      await deps.db.saveMessage({
        conversaId: session.id,
        direcao: 'SAIDA',
        tipoMidia: 'TEXTO',
        conteudoTexto: rejectMsg,
        evolutionMessageId: botMsgId ?? null,
      });
      await deps.db.incrementSessionTurn(session.id);
      return {
        action: 'replied_fast_path',
        telefone: turn.telefone,
        estadoAtual: session.estadoAtual,
        respostaTexto: rejectMsg,
      };
    }

    await deps.db.updateSessionTopic(session.id, null);
  }

  if (isHumanHandoffIntent(textoUsuario)) {
    await deps.db.updateSessionTopic(session.id, 'aguardando_confirmacao_humano');
    const question = buildHandoffConfirmationQuestion(cidadaoNomePrimeiro);
    const botMsgId = await enviarRespostaEvolution({
      evolution: deps.evolution,
      telefone: turn.telefone,
      remoteJid: turn.remoteJid,
      incomingMessageId: turn.messageId,
      hasExternalMessageId: turn.hasExternalMessageId,
      respostaTexto: question,
      marcarLido: true,
      skipDelays,
    });
    await deps.db.saveMessage({
      conversaId: session.id,
      direcao: 'SAIDA',
      tipoMidia: 'TEXTO',
      conteudoTexto: question,
      evolutionMessageId: botMsgId ?? null,
    });
    await deps.db.incrementSessionTurn(session.id);
    return {
      action: 'replied_fast_path',
      telefone: turn.telefone,
      estadoAtual: session.estadoAtual,
      respostaTexto: question,
    };
  }

  // Fast-path 2: Cortesias puras de despedida em conversa já iniciada (sem reiniciar atendimento)
  if (hasPreviousInteraction && isClosingCourtesyIntent(textoUsuario) && !extractedCurriculoPatch) {
    const nomeParte = cidadaoNomePrimeiro ? `, ${cidadaoNomePrimeiro}` : '';
    const byeMsg =
      dataHoraAtual.periodo === 'manha'
        ? `Bom dia${nomeParte}! Tenha um excelente dia. Quando precisar do FAROL, estou por aqui!`
        : dataHoraAtual.periodo === 'tarde'
          ? `Boa tarde${nomeParte}! Tenha uma ótima tarde. Sempre que precisar, é só chamar!`
          : `Boa noite${nomeParte}! Bom descanso. Quando quiser ver vagas ou atualizar seu currículo, é só chamar!`;

    const botMsgId = await enviarRespostaEvolution({
      evolution: deps.evolution,
      telefone: turn.telefone,
      remoteJid: turn.remoteJid,
      incomingMessageId: turn.messageId,
      hasExternalMessageId: turn.hasExternalMessageId,
      respostaTexto: byeMsg,
      marcarLido: true,
      skipDelays,
    });
    await deps.db.saveMessage({
      conversaId: session.id,
      direcao: 'SAIDA',
      tipoMidia: 'TEXTO',
      conteudoTexto: byeMsg,
      evolutionMessageId: botMsgId ?? null,
    });
    await deps.db.incrementSessionTurn(session.id);
    return {
      action: 'replied_fast_path',
      telefone: turn.telefone,
      estadoAtual: session.estadoAtual,
      respostaTexto: byeMsg,
    };
  }

  const arquivosExistentes = session.candidatoId
    ? await deps.db.listCurriculoArquivos(session.candidatoId).catch(() => [])
    : [];

  let estadoMutavel: EstadoConversaIA = session.estadoAtual;
  let consentimentoMutavel = consentimentoLgpd;
  let curriculoGeradoNesteTurno: CurriculoGeradoInfo | undefined;

  const tools: FarolGeminiToolHandlers = {
    registrar_consentimento_lgpd: async ({ aceito }) => {
      consentimentoMutavel = aceito;
      estadoMutavel = aceito ? 'TRIAGEM' : 'NOVO';
      await deps.db.updateSessionState(turn.telefone, estadoMutavel, {
        consentimentoLgpd: aceito,
        ...(aceito ? { consentimentoEm: new Date().toISOString() } : {}),
      });
      return {
        consentimentoRegistrado: aceito,
        estadoAtual: estadoMutavel,
      };
    },

    atualizar_rascunho_curriculo: async (args) => {
      if (!consentimentoMutavel) {
        return {
          erro: 'Consentimento LGPD ainda não foi confirmado pelo cidadão.',
        };
      }
      const patch = sanitizarCurriculoPadrao({
        nomeCompleto: typeof args.nomeCompleto === 'string' ? args.nomeCompleto : undefined,
        bairro: typeof args.bairro === 'string' ? args.bairro : undefined,
        municipio: typeof args.municipio === 'string' ? args.municipio : undefined,
        email: typeof args.email === 'string' ? args.email : undefined,
        escolaridade: normalizarNivelEscolaridade(
          typeof args.escolaridade === 'string' ? args.escolaridade : undefined
        ),
        escolaridadeTexto: typeof args.escolaridade === 'string' ? args.escolaridade : undefined,
        areaInteresse: typeof args.areaInteresse === 'string' ? args.areaInteresse : undefined,
        objetivo: typeof args.objetivo === 'string' ? args.objetivo : undefined,
        resumoProfissional:
          typeof args.resumoProfissional === 'string' ? args.resumoProfissional : undefined,
        disponibilidade: typeof args.disponibilidade === 'string' ? args.disponibilidade : undefined,
        competencias: Array.isArray(args.competencias)
          ? args.competencias.filter((c): c is string => typeof c === 'string')
          : [],
        experiencias: Array.isArray(args.experiencias)
          ? (args.experiencias as CurriculoPadraoData['experiencias'])
          : [],
        cursosCertificacoes: Array.isArray(args.cursosCertificacoes)
          ? (args.cursosCertificacoes as CurriculoPadraoData['cursosCertificacoes'])
          : [],
        observacoesAdicionais: Array.isArray(args.observacoesAdicionais)
          ? args.observacoesAdicionais.filter((o): o is string => typeof o === 'string')
          : [],
      });

      rascunhoAtual = mesclarCurriculoPadrao(rascunhoAtual, patch);
      estadoMutavel = 'CURRICULO';
      await deps.db.updateSessionState(turn.telefone, estadoMutavel, {
        rascunhoCurriculo: rascunhoAtual,
      });

      const comp = calcularCompletudeCurriculo(rascunhoAtual);
      return {
        atualizado: true,
        rascunhoCurriculo: rascunhoAtual,
        completude: comp,
      };
    },

    gerar_e_enviar_curriculo_pdf: async ({ confirmadoUsuario }) => {
      if (!consentimentoMutavel) {
        return {
          gerado: false,
          motivo: 'É necessário obter o consentimento LGPD antes de gerar e salvar o currículo.',
        };
      }
      if (!confirmadoUsuario) {
        return {
          gerado: false,
          motivo: 'Peça a confirmação do cidadão antes de gerar o PDF definitivo.',
        };
      }

      const comp = calcularCompletudeCurriculo(rascunhoAtual);
      if (!comp.prontoParaGerar) {
        return {
          gerado: false,
          motivo: `Ainda faltam informações obrigatórias: ${comp.camposFaltantes.join(', ')}.`,
          camposFaltantes: comp.camposFaltantes,
        };
      }

      const resultado = await deps.db.gerarEAnexarCurriculoPadrao({
        candidatoId: session.candidatoId,
        telefone: turn.telefone,
        dados: rascunhoAtual,
      });

      session.candidatoId = resultado.candidato.id;
      await deps.db.linkCandidatoToSession(session.id, resultado.candidato.id);
      estadoMutavel = 'CURRICULO';
      await deps.db.updateSessionState(turn.telefone, estadoMutavel, {
        rascunhoCurriculo: resultado.dadosFinais,
        ultimoCurriculoArquivoId: resultado.arquivo.id,
      });

      curriculoGeradoNesteTurno = {
        arquivoId: resultado.arquivo.id,
        fileName: resultado.fileName,
        downloadUrl: resultado.arquivo.arquivoUrl,
        pdfBase64: resultado.pdfBase64,
      };

      return {
        gerado: true,
        arquivoId: resultado.arquivo.id,
        fileName: resultado.fileName,
        painelUrl: `${appUrl}/painel`,
        downloadUrl: `${appUrl}${resultado.arquivo.arquivoUrl}`,
        observacao: 'O PDF será enviado automaticamente pelo WhatsApp logo após sua mensagem e já está anexado no painel.',
      };
    },

    buscar_vagas_compativeis: async ({ area, bairro, limite }) => {
      const maxItens = Math.min(Math.max(limite ?? 3, 1), 3);

      if (session.candidatoId) {
        const melhores = await deps.db.listBestVagasForCandidato(
          session.candidatoId,
          area,
          maxItens
        );
        estadoMutavel = 'MATCH';
        await deps.db.updateSessionState(turn.telefone, estadoMutavel, {
          ultimasVagasSugeridas: melhores.map((m) => m.vaga.id),
        });
        return {
          vagas: melhores.map(({ vaga, match }) => ({
            vagaId: vaga.id,
            titulo: vaga.titulo,
            empresa: vaga.empresaNome,
            bairro: vaga.bairro,
            modalidade: vaga.modalidade,
            tipoContratacao: vaga.tipoContratacao,
            salarioMin: vaga.salarioMin,
            seloSimulado: vaga.seloSimulado,
            compatibilidadePercentual: match.percentual,
            atendidos: match.atendidos.slice(0, 3),
            faltaParaVaga: match.naoIdentificados.slice(0, 2).map((n) => n.item),
          })),
        };
      }

      const vagas = await deps.db.listPublicVagas({ area, bairro });
      const avaliadas = vagas
        .map((vaga) => ({
          vaga,
          match: calcularCompatibilidade(
            {
              escolaridade: rascunhoAtual.escolaridade ?? null,
              competencias: rascunhoAtual.competencias ?? [],
            },
            {
              escolaridadeMinima: vaga.escolaridadeMinima,
              requisitos: vaga.requisitos,
            }
          ),
        }))
        .sort((a, b) => b.match.percentual - a.match.percentual)
        .slice(0, maxItens);

      estadoMutavel = 'MATCH';
      await deps.db.updateSessionState(turn.telefone, estadoMutavel, {
        ultimasVagasSugeridas: avaliadas.map((m) => m.vaga.id),
      });

      return {
        vagas: avaliadas.map(({ vaga, match }) => ({
          vagaId: vaga.id,
          titulo: vaga.titulo,
          empresa: vaga.empresaNome,
          bairro: vaga.bairro,
          modalidade: vaga.modalidade,
          tipoContratacao: vaga.tipoContratacao,
          salarioMin: vaga.salarioMin,
          seloSimulado: vaga.seloSimulado,
          compatibilidadePercentual: match.percentual,
          atendidos: match.atendidos.slice(0, 3),
          faltaParaVaga: match.naoIdentificados.slice(0, 2).map((n) => n.item),
        })),
      };
    },

    candidatar_vaga: async ({ vagaId }) => {
      if (!consentimentoMutavel) {
        return { ok: false, motivo: 'Consentimento LGPD necessário antes de candidatar.' };
      }
      if (!vagaId) {
        return { ok: false, motivo: 'Informe o vagaId da vaga escolhida.' };
      }

      if (!session.candidatoId) {
        const comp = calcularCompletudeCurriculo(rascunhoAtual);
        if (!rascunhoAtual.nomeCompleto || !rascunhoAtual.bairro) {
          return {
            ok: false,
            motivo: 'Preciso pelo menos do nome completo e bairro antes de registrar a candidatura.',
            camposFaltantes: comp.camposFaltantes,
          };
        }
        const criado = await deps.db.gerarEAnexarCurriculoPadrao({
          telefone: turn.telefone,
          dados: rascunhoAtual,
        });
        session.candidatoId = criado.candidato.id;
        await deps.db.linkCandidatoToSession(session.id, criado.candidato.id);
        curriculoGeradoNesteTurno = {
          arquivoId: criado.arquivo.id,
          fileName: criado.fileName,
          downloadUrl: criado.arquivo.arquivoUrl,
          pdfBase64: criado.pdfBase64,
        };
      }

      try {
        const candidatura = await deps.db.candidatarVaga(session.candidatoId!, vagaId);
        estadoMutavel = 'CANDIDATURA';
        await deps.db.updateSessionState(turn.telefone, estadoMutavel);
        return {
          ok: true,
          candidaturaId: candidatura.id,
          status: candidatura.status,
          scoreCalculado: candidatura.scoreCalculado,
        };
      } catch (err) {
        return {
          ok: false,
          motivo: err instanceof Error ? err.message : 'Não foi possível registrar candidatura.',
        };
      }
    },

    listar_cursos_disponiveis: async ({ area, lacunas }) => {
      const cursos =
        lacunas && lacunas.length > 0
          ? await deps.db.recommendCursos(lacunas, 3)
          : await deps.db.listCursos();

      const filtrados = area
        ? cursos.filter((c) => c.area.toLowerCase().includes(area.toLowerCase()))
        : cursos;
      const lista = (filtrados.length > 0 ? filtrados : cursos).slice(0, 3);

      estadoMutavel = 'CURSOS';
      await deps.db.updateSessionState(turn.telefone, estadoMutavel);

      return {
        cursos: lista.map((c) => ({
          cursoId: c.id,
          titulo: c.titulo,
          area: c.area,
          cargaHoraria: c.cargaHoraria,
          tipo: c.tipo,
          modalidade: c.modalidade,
          instituicao: c.instituicao,
          turmasAbertas: c.turmas
            .filter((t) => t.status === 'INSCRICOES_ABERTAS')
            .map((t) => ({
              codigo: t.codigoTurma,
              bairro: t.localBairro,
              horario: t.horario,
              dataInicio: t.dataInicio,
            })),
        })),
      };
    },

    registrar_pedido_curso: async ({ temaDesejado, turnoPreferido, motivo }) => {
      if (!temaDesejado.trim()) {
        return { ok: false, motivo: 'Informe o tema do curso desejado.' };
      }
      const pedido = await deps.db.registrarPedidoCurso({
        candidatoId: session.candidatoId,
        temaDesejado,
        turnoPreferido: turnoPreferido ?? null,
        motivo: motivo ?? null,
        bairro: rascunhoAtual.bairro || null,
      });
      estadoMutavel = 'PEDIDO_CURSO';
      await deps.db.updateSessionState(turn.telefone, estadoMutavel);
      return {
        ok: true,
        pedidoId: pedido.id,
        temaDesejado: pedido.temaDesejado,
        status: pedido.status,
      };
    },

    consultar_minhas_candidaturas: async () => {
      if (!session.candidatoId) {
        return { candidaturas: [], observacao: 'Cidadão ainda não possui candidaturas registradas.' };
      }
      const lista = await deps.db.listCandidaturas(session.candidatoId);
      estadoMutavel = 'ACOMPANHAMENTO';
      await deps.db.updateSessionState(turn.telefone, estadoMutavel);
      return {
        candidaturas: lista.slice(0, 5).map((c) => ({
          vaga: c.vaga?.titulo ?? 'Vaga',
          empresa: c.vaga?.empresaNome ?? '',
          status: c.status,
          scoreCalculado: c.scoreCalculado,
        })),
      };
    },

    consultar_editais_e_eventos: async () => {
      const [editais, eventos] = await Promise.all([
        deps.db.listEditaisAbertos(),
        deps.db.listProximosEventos(),
      ]);
      return {
        editais: editais.slice(0, 3).map((e) => ({
          titulo: e.titulo,
          organizacao: e.organizacao,
          beneficio: e.beneficio,
          prazo: e.inscricoesAte ?? e.prazoDescricao ?? 'Fluxo contínuo',
        })),
        eventos: eventos.slice(0, 3).map((ev) => ({
          titulo: ev.titulo,
          organizacao: ev.organizacao,
          local: ev.local,
          modalidade: ev.modalidade,
          gratuito: ev.gratuito,
          inicio: ev.inicio,
        })),
      };
    },
  };

  let respostaBruta = '';
  let actionResult: FarolAgentOutcome['action'] = 'replied_ai_natural';

  if (geminiApiKey) {
    try {
      const systemPrompt = buildFarolSystemPrompt({
        appUrl,
        dataHoraAtual,
        estadoAtual: estadoMutavel,
        consentimentoLgpd: consentimentoMutavel,
        hasPreviousInteraction,
        cidadaoNome: cidadaoNomePrimeiro,
        candidatoCadastrado: Boolean(candidatoInfo?.candidato),
        rascunhoCurriculo: rascunhoAtual,
        curriculosAnexadosCount: arquivosExistentes.length,
        ultimoCurriculoUrl: arquivosExistentes[0]?.arquivoUrl ?? null,
        mediaContextNotice,
      });

      const mensagemParaIa = alertaDadosSensiveis
        ? `${textoUsuario}\n[SISTEMA: documentos sensíveis (CPF/RG) detectados na mídia foram removidos; avise gentilmente que não armazenamos CPF/RG.]`
        : textoUsuario;

      respostaBruta = await askFarolGemini({
        systemPrompt,
        userMessage: mensagemParaIa,
        history,
        apiKey: geminiApiKey,
        model: geminiModel,
        tools,
        fetchFn: deps.fetchFn,
      });
    } catch (err) {
      console.error('[FarolWhatsApp] Falha no Gemini, acionando fallback determinístico:', err);
      actionResult = 'replied_fallback';
    }
  } else {
    actionResult = 'replied_fallback';
  }

  if (!respostaBruta) {
    const fb = await buildDeterministicFallbackReply({
      db: deps.db,
      telefone: turn.telefone,
      conversaId: session.id,
      estadoAtual: estadoMutavel,
      consentimentoLgpd: consentimentoMutavel,
      userText: textoUsuario,
      rascunho: rascunhoAtual,
      candidatoId: session.candidatoId,
      onCurriculoGerado: (info) => {
        curriculoGeradoNesteTurno = info;
      },
    });
    estadoMutavel = fb.estado;
    respostaBruta = fb.texto;
  }

  const guarded = enforceFarolSafety({
    reply: respostaBruta,
    userText: textoUsuario,
    hasPreviousInteraction,
    cidadaoNome: cidadaoNomePrimeiro,
    periodo: dataHoraAtual.periodo,
  });

  const respostaFinal = guarded.text;
  const botMsgId = await enviarRespostaEvolution({
    evolution: deps.evolution,
    telefone: turn.telefone,
    remoteJid: turn.remoteJid,
    incomingMessageId: turn.messageId,
    hasExternalMessageId: turn.hasExternalMessageId,
    respostaTexto: respostaFinal,
    marcarLido: true,
    skipDelays,
    curriculoGerado: curriculoGeradoNesteTurno,
  });

  await deps.db.saveMessage({
    conversaId: session.id,
    direcao: 'SAIDA',
    tipoMidia: 'TEXTO',
    conteudoTexto: respostaFinal,
    metadataJson: curriculoGeradoNesteTurno
      ? { curriculoGeradoId: curriculoGeradoNesteTurno.arquivoId }
      : {},
    evolutionMessageId: botMsgId ?? null,
  });

  if (curriculoGeradoNesteTurno) {
    await deps.db.saveMessage({
      conversaId: session.id,
      direcao: 'SAIDA',
      tipoMidia: 'DOCUMENTO',
      conteudoTexto: `Currículo enviado em PDF: ${curriculoGeradoNesteTurno.fileName}`,
      resumoMidia: `PDF ${curriculoGeradoNesteTurno.fileName} anexado ao painel`,
      metadataJson: {
        arquivoId: curriculoGeradoNesteTurno.arquivoId,
        downloadUrl: curriculoGeradoNesteTurno.downloadUrl,
      },
    });
  }

  await deps.db.incrementSessionTurn(session.id);

  return {
    action: actionResult,
    telefone: turn.telefone,
    estadoAtual: estadoMutavel,
    respostaTexto: respostaFinal,
    ...(curriculoGeradoNesteTurno ? { curriculoGerado: curriculoGeradoNesteTurno } : {}),
  };
}

export async function processFarolWebhook(
  rawPayload: unknown,
  deps: FarolWhatsAppDeps
): Promise<FarolAgentOutcome> {
  const payload = rawPayload as EvolutionWebhookPayload;
  const event = String(payload?.event ?? '')
    .toLowerCase()
    .replace(/_/g, '.');

  if (event && event !== 'messages.upsert') {
    return {
      action: 'ignored_invalid_payload',
      telefone: '',
      estadoAtual: 'NOVO',
      respostaTexto: '',
    };
  }

  const rawMessageId = payload?.data?.key?.id?.trim();
  const rawJid = payload?.data?.key?.remoteJid?.trim() ?? '';
  const remoteJid = resolveRemoteJid(rawJid, payload?.data?.key?.remoteJidAlt);

  if (!rawMessageId || !remoteJid) {
    return {
      action: 'ignored_invalid_payload',
      telefone: '',
      estadoAtual: 'NOVO',
      respostaTexto: '',
    };
  }

  if (inFlightMessageIds.has(rawMessageId)) {
    return {
      action: 'ignored_duplicate_message',
      telefone: normalizarTelefoneWhatsApp(remoteJid),
      estadoAtual: 'NOVO',
      respostaTexto: '',
    };
  }

  const extracted = extractWhatsAppMessageContent(
    payload?.data?.message,
    payload?.data?.messageType,
    payload?.data?.base64
  );

  inFlightMessageIds.add(rawMessageId);
  try {
    return await runConversationPipeline(
      {
        messageId: rawMessageId,
        hasExternalMessageId: true,
        remoteJid,
        rawRemoteJid: rawJid,
        telefone: normalizarTelefoneWhatsApp(remoteJid),
        fromMe: Boolean(payload?.data?.key?.fromMe),
        pushName: payload?.data?.pushName,
        text: extracted.text,
        caption: extracted.caption,
        mediaKind: extracted.mediaKind,
        mimeType: extracted.mimeType,
        fileName: extracted.fileName,
        inlineBase64: extracted.inlineBase64,
      },
      deps
    );
  } finally {
    inFlightMessageIds.delete(rawMessageId);
  }
}

export async function processFarolDirectInput(
  entrada: DirectWhatsAppInput,
  deps: FarolWhatsAppDeps
): Promise<FarolAgentOutcome> {
  const telefone = normalizarTelefoneWhatsApp(entrada.telefoneRaw);
  const remoteJid = telefone ? `${telefone}@s.whatsapp.net` : '';

  let mediaKind: TipoMidiaExtraida = 'TEXTO';
  let mimeType: string | undefined;
  let inlineBase64: string | undefined;

  if (entrada.audioBase64) {
    mediaKind = 'AUDIO';
    mimeType = entrada.audioMimeType ?? 'audio/ogg';
    inlineBase64 = entrada.audioBase64;
  } else if (entrada.imagemBase64) {
    mediaKind = 'IMAGEM';
    mimeType = entrada.imagemMimeType ?? 'image/jpeg';
    inlineBase64 = entrada.imagemBase64;
  } else if (entrada.documentoBase64) {
    mediaKind = 'DOCUMENTO';
    mimeType = entrada.documentoMimeType ?? 'application/pdf';
    inlineBase64 = entrada.documentoBase64;
  }

  return runConversationPipeline(
    {
      messageId: entrada.messageId ?? '',
      hasExternalMessageId: Boolean(entrada.messageId),
      remoteJid,
      rawRemoteJid: remoteJid,
      telefone,
      fromMe: false,
      pushName: entrada.pushName,
      text: (entrada.texto ?? '').trim(),
      caption: (entrada.texto ?? '').trim(),
      mediaKind,
      mimeType,
      fileName: entrada.documentoNome,
      inlineBase64,
    },
    deps
  );
}
