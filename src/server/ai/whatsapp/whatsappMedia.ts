import { sanitizarEntradaCidadao } from '@/server/domain/ai/Guardrails';
import {
  type CurriculoPadraoData,
  normalizarNivelEscolaridade,
  sanitizarCurriculoPadrao,
} from '@/server/domain/curriculo/CurriculoPadrao';

export type TipoMidiaSuportada = 'AUDIO' | 'DOCUMENTO' | 'IMAGEM';

export const MAX_MEDIA_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_AUDIO_MIMES = new Set([
  'audio/ogg',
  'audio/opus',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/m4a',
  'audio/aac',
  'audio/webm',
]);

const ALLOWED_DOCUMENT_MIMES = new Set([
  'application/pdf',
  'text/plain',
  'text/csv',
]);

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export interface ValidacaoMidiaResult {
  valido: boolean;
  motivo?: string;
  mimeType: string;
  cleanBase64: string;
  buffer: Buffer;
}

function hasMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  if (mimeType === 'application/pdf') {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (mimeType === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    return buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp';
  }
  if (mimeType === 'audio/ogg' || mimeType === 'audio/opus') {
    return buffer.subarray(0, 4).toString('ascii') === 'OggS';
  }
  if (mimeType === 'audio/wav' || mimeType === 'audio/x-wav') {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WAVE'
    );
  }
  if (mimeType === 'audio/mpeg' || mimeType === 'audio/mp3') {
    const id3 = buffer.subarray(0, 3).toString('ascii') === 'ID3';
    const frameSync = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
    return id3 || frameSync;
  }
  if (mimeType === 'audio/mp4' || mimeType === 'audio/m4a') {
    return buffer.length >= 8 && buffer.subarray(4, 8).toString('ascii') === 'ftyp';
  }
  if (mimeType === 'audio/webm') {
    return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
  }
  if (mimeType === 'audio/aac') {
    return buffer[0] === 0xff && (buffer[1] & 0xf0) === 0xf0;
  }
  if (mimeType === 'text/plain' || mimeType === 'text/csv') {
    // Rejeita binários disfarçados com bytes nulos
    return !buffer.subarray(0, Math.min(buffer.length, 512)).includes(0x00);
  }
  return false;
}

/**
 * Valida allow-list de MIME type, tamanho máximo (10 MB) e assinatura binária (magic bytes).
 * // TODO(security): integrar scanner antivírus/CDR em sandbox antes de armazenamento persistente de uploads de terceiros.
 */
export function validarMidiaSegura(params: {
  base64: string;
  mimeType: string;
  kind: TipoMidiaSuportada;
}): ValidacaoMidiaResult {
  const raw = params.base64.trim();
  const dataUriMime = raw.match(/^data:([^;]+);base64,/)?.[1];
  const cleanBase64 = raw.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
  const mimeNorm = (dataUriMime || params.mimeType || '').split(';')[0].trim().toLowerCase();
  const mimeType = mimeNorm === 'image/jpg' ? 'image/jpeg' : mimeNorm;

  const allowSet =
    params.kind === 'AUDIO'
      ? ALLOWED_AUDIO_MIMES
      : params.kind === 'DOCUMENTO'
        ? ALLOWED_DOCUMENT_MIMES
        : ALLOWED_IMAGE_MIMES;

  if (!allowSet.has(mimeType)) {
    return {
      valido: false,
      motivo: `Tipo de arquivo não suportado (${mimeType || 'desconhecido'}).`,
      mimeType,
      cleanBase64: '',
      buffer: Buffer.alloc(0),
    };
  }

  if (!cleanBase64) {
    return {
      valido: false,
      motivo: 'Conteúdo do arquivo está vazio.',
      mimeType,
      cleanBase64: '',
      buffer: Buffer.alloc(0),
    };
  }

  const buffer = Buffer.from(cleanBase64, 'base64');
  if (buffer.length === 0 || buffer.length > MAX_MEDIA_BYTES) {
    return {
      valido: false,
      motivo: 'O arquivo excede o limite máximo de 10 MB.',
      mimeType,
      cleanBase64: '',
      buffer: Buffer.alloc(0),
    };
  }

  if (!hasMagicBytes(buffer, mimeType)) {
    return {
      valido: false,
      motivo: 'Assinatura do arquivo incompatível com o formato informado.',
      mimeType,
      cleanBase64: '',
      buffer: Buffer.alloc(0),
    };
  }

  return {
    valido: true,
    mimeType,
    cleanBase64,
    buffer,
  };
}

export interface ResultadoAnaliseDocumento {
  tipoDocumento: 'CURRICULO' | 'CERTIFICADO' | 'HISTORICO_ESCOLAR' | 'OUTRO_DOCUMENTO';
  resumoNatural: string;
  dadosCurriculo: Partial<CurriculoPadraoData>;
  alertaDadosSensiveis: boolean;
}

export type CategoriaImagem =
  | 'CURRICULO'
  | 'CERTIFICADO_CURSO'
  | 'DIPLOMA_ESCOLARIDADE'
  | 'CARTEIRA_HABILITACAO'
  | 'PORTFOLIO_TRABALHO'
  | 'ANUNCIO_VAGA'
  | 'COMPROVANTE_ENDERECO'
  | 'OUTRA_IMAGEM';

export interface ResultadoAnaliseImagem {
  categoria: CategoriaImagem;
  resumoNatural: string;
  informacoesPertinentes: string[];
  dadosCurriculo: Partial<CurriculoPadraoData>;
  vagaMencionada?: {
    titulo?: string;
    requisitos?: string[];
    empresa?: string;
  };
  alertaDadosSensiveis: boolean;
}

async function callGeminiMultimodal(params: {
  models: string[];
  apiKey: string;
  parts: Array<Record<string, unknown>>;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
  fetchFn?: typeof fetch;
}): Promise<string> {
  const fetcher = params.fetchFn ?? fetch;
  const uniqueModels = Array.from(new Set(params.models.filter(Boolean)));
  let lastErr: Error | null = null;

  for (const model of uniqueModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

      const res = await fetcher(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: params.parts }],
          generationConfig: {
            temperature: params.temperature ?? 0.1,
            maxOutputTokens: params.maxOutputTokens ?? 2048,
            ...(params.jsonMode ? { responseMimeType: 'application/json' } : {}),
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
        signal: AbortSignal.timeout(25_000),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        lastErr = new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 200)}`);
        continue;
      }

      const json = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string; thought?: boolean }> };
        }>;
      };

      const text =
        json.candidates?.[0]?.content?.parts
          ?.filter((p) => !p.thought && typeof p.text === 'string')
          .map((p) => p.text ?? '')
          .join('')
          .trim() ?? '';

      if (text) return text;
      lastErr = new Error('Gemini retornou resposta vazia.');
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastErr ?? new Error('Falha ao processar mídia no Gemini.');
}

function parseSafeJsonObject(raw: string): Record<string, unknown> {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  return JSON.parse(cleaned) as Record<string, unknown>;
}

function mapParsedCurriculo(raw: Record<string, unknown>): Partial<CurriculoPadraoData> {
  const escolaridadeRaw = typeof raw.escolaridade === 'string' ? raw.escolaridade : undefined;
  const escolaridade = normalizarNivelEscolaridade(escolaridadeRaw);

  const experiencias = Array.isArray(raw.experiencias)
    ? raw.experiencias
        .filter((e): e is Record<string, unknown> => Boolean(e && typeof e === 'object'))
        .map((e) => ({
          cargo: typeof e.cargo === 'string' ? e.cargo : '',
          empresa: typeof e.empresa === 'string' ? e.empresa : undefined,
          periodo: typeof e.periodo === 'string' ? e.periodo : undefined,
          descricao: typeof e.descricao === 'string' ? e.descricao : undefined,
          trabalhoInformal: typeof e.trabalhoInformal === 'boolean' ? e.trabalhoInformal : undefined,
        }))
        .filter((e) => e.cargo.trim().length > 0)
    : [];

  const formacoes = Array.isArray(raw.formacoes)
    ? raw.formacoes
        .filter((f): f is Record<string, unknown> => Boolean(f && typeof f === 'object'))
        .map((f) => ({
          nivel: typeof f.nivel === 'string' ? f.nivel : '',
          curso: typeof f.curso === 'string' ? f.curso : undefined,
          instituicao: typeof f.instituicao === 'string' ? f.instituicao : undefined,
          anoConclusao: typeof f.anoConclusao === 'string' ? f.anoConclusao : undefined,
        }))
        .filter((f) => f.nivel.trim().length > 0)
    : [];

  const cursosCertificacoes = Array.isArray(raw.cursosCertificacoes)
    ? raw.cursosCertificacoes
        .filter((c): c is Record<string, unknown> => Boolean(c && typeof c === 'object'))
        .map((c) => ({
          titulo: typeof c.titulo === 'string' ? c.titulo : '',
          instituicao: typeof c.instituicao === 'string' ? c.instituicao : undefined,
          cargaHoraria: typeof c.cargaHoraria === 'string' ? c.cargaHoraria : undefined,
        }))
        .filter((c) => c.titulo.trim().length > 0)
    : [];

  return sanitizarCurriculoPadrao({
    nomeCompleto: typeof raw.nomeCompleto === 'string' ? raw.nomeCompleto : typeof raw.nome === 'string' ? raw.nome : '',
    bairro: typeof raw.bairro === 'string' ? raw.bairro : '',
    municipio: typeof raw.municipio === 'string' ? raw.municipio : 'São Luís',
    email: typeof raw.email === 'string' ? raw.email : undefined,
    escolaridade,
    escolaridadeTexto: escolaridadeRaw,
    areaInteresse: typeof raw.areaInteresse === 'string' ? raw.areaInteresse : undefined,
    objetivo: typeof raw.objetivo === 'string' ? raw.objetivo : undefined,
    resumoProfissional:
      typeof raw.resumoProfissional === 'string'
        ? raw.resumoProfissional
        : typeof raw.resumo === 'string'
          ? raw.resumo
          : undefined,
    disponibilidade: typeof raw.disponibilidade === 'string' ? raw.disponibilidade : undefined,
    competencias: Array.isArray(raw.habilidades)
      ? raw.habilidades.filter((h): h is string => typeof h === 'string')
      : Array.isArray(raw.competencias)
        ? raw.competencias.filter((h): h is string => typeof h === 'string')
        : [],
    experiencias,
    formacoes,
    cursosCertificacoes,
    observacoesAdicionais: Array.isArray(raw.observacoesAdicionais)
      ? raw.observacoesAdicionais.filter((o): o is string => typeof o === 'string')
      : [],
  });
}

export async function transcreverAudioGemini(params: {
  base64: string;
  mimeType: string;
  apiKey: string;
  primaryModel?: string;
  fetchFn?: typeof fetch;
}): Promise<string> {
  const validacao = validarMidiaSegura({
    base64: params.base64,
    mimeType: params.mimeType,
    kind: 'AUDIO',
  });
  if (!validacao.valido) {
    throw new Error(validacao.motivo || 'Áudio inválido.');
  }

  const rawText = await callGeminiMultimodal({
    models: [params.primaryModel ?? 'gemini-2.5-flash', 'gemini-2.5-flash', 'gemini-flash-latest'],
    apiKey: params.apiKey,
    temperature: 0,
    maxOutputTokens: 1024,
    fetchFn: params.fetchFn,
    parts: [
      {
        inlineData: {
          mimeType: validacao.mimeType,
          data: validacao.cleanBase64,
        },
      },
      {
        text: 'Transcreva exatamente o que a pessoa falou neste áudio de WhatsApp em português do Brasil, de forma limpa e fiel, sem comentários adicionais.',
      },
    ],
  });

  return sanitizarEntradaCidadao(rawText).textoLimpo;
}

export async function analisarDocumentoGemini(params: {
  base64: string;
  mimeType: string;
  fileName?: string;
  caption?: string;
  apiKey: string;
  primaryModel?: string;
  fetchFn?: typeof fetch;
}): Promise<ResultadoAnaliseDocumento> {
  const validacao = validarMidiaSegura({
    base64: params.base64,
    mimeType: params.mimeType,
    kind: 'DOCUMENTO',
  });
  if (!validacao.valido) {
    throw new Error(validacao.motivo || 'Documento inválido.');
  }

  const instrucao = [
    'Analise este documento enviado por um candidato em busca de emprego/qualificação no programa FAROL (São Luís - MA).',
    params.fileName ? `Nome do arquivo: ${params.fileName}` : '',
    params.caption ? `Legenda enviada pelo usuário: ${params.caption}` : '',
    'Retorne APENAS um JSON válido com a estrutura:',
    '{',
    '  "tipoDocumento": "CURRICULO" | "CERTIFICADO" | "HISTORICO_ESCOLAR" | "OUTRO_DOCUMENTO",',
    '  "resumoNatural": "Resumo objetivo e em português simples do que consta no documento",',
    '  "alertaDadosSensiveis": boolean,',
    '  "dadosCurriculo": {',
    '    "nomeCompleto": string | null,',
    '    "bairro": string | null,',
    '    "municipio": string | null,',
    '    "email": string | null,',
    '    "escolaridade": string | null,',
    '    "areaInteresse": string | null,',
    '    "objetivo": string | null,',
    '    "resumoProfissional": string | null,',
    '    "disponibilidade": string | null,',
    '    "competencias": string[],',
    '    "experiencias": [{ "cargo": string, "empresa": string | null, "periodo": string | null, "descricao": string | null, "trabalhoInformal": boolean }],',
    '    "formacoes": [{ "nivel": string, "curso": string | null, "instituicao": string | null, "anoConclusao": string | null }],',
    '    "cursosCertificacoes": [{ "titulo": string, "instituicao": string | null, "cargaHoraria": string | null }],',
    '    "observacoesAdicionais": string[]',
    '  }',
    '}',
    'REGRAS DE PRIVACIDADE: Nunca extraia, copie ou retorne número de CPF, RG, título de eleitor ou dados bancários. Se o documento contiver CPF/RG, marque alertaDadosSensiveis=true e omita os números.',
    'Nunca invente dados que não estejam no documento.',
  ]
    .filter(Boolean)
    .join('\n');

  const parts: Array<Record<string, unknown>> = [{ text: instrucao }];
  if (validacao.mimeType === 'application/pdf') {
    parts.push({
      inlineData: {
        mimeType: validacao.mimeType,
        data: validacao.cleanBase64,
      },
    });
  } else {
    const textoDoc = sanitizarEntradaCidadao(validacao.buffer.toString('utf-8')).textoLimpo.slice(0, 18_000);
    parts.push({ text: `CONTEUDO_DO_DOCUMENTO:\n${textoDoc}` });
  }

  const rawJson = await callGeminiMultimodal({
    models: [params.primaryModel ?? 'gemini-2.5-flash', 'gemini-2.5-flash', 'gemini-flash-latest'],
    apiKey: params.apiKey,
    jsonMode: true,
    maxOutputTokens: 2500,
    fetchFn: params.fetchFn,
    parts,
  });

  const parsed = parseSafeJsonObject(rawJson);
  const tipoRaw = String(parsed.tipoDocumento ?? 'OUTRO_DOCUMENTO').toUpperCase();
  const tipoDocumento: ResultadoAnaliseDocumento['tipoDocumento'] =
    tipoRaw === 'CURRICULO' ||
    tipoRaw === 'CERTIFICADO' ||
    tipoRaw === 'HISTORICO_ESCOLAR'
      ? tipoRaw
      : 'OUTRO_DOCUMENTO';

  const dadosBrutos =
    parsed.dadosCurriculo && typeof parsed.dadosCurriculo === 'object'
      ? (parsed.dadosCurriculo as Record<string, unknown>)
      : parsed;

  return {
    tipoDocumento,
    resumoNatural: sanitizarEntradaCidadao(
      typeof parsed.resumoNatural === 'string' && parsed.resumoNatural.trim()
        ? parsed.resumoNatural
        : 'Documento analisado.'
    ).textoLimpo,
    dadosCurriculo: mapParsedCurriculo(dadosBrutos),
    alertaDadosSensiveis: Boolean(parsed.alertaDadosSensiveis),
  };
}

export async function analisarImagemGemini(params: {
  base64: string;
  mimeType: string;
  caption?: string;
  apiKey: string;
  primaryModel?: string;
  fetchFn?: typeof fetch;
}): Promise<ResultadoAnaliseImagem> {
  const validacao = validarMidiaSegura({
    base64: params.base64,
    mimeType: params.mimeType,
    kind: 'IMAGEM',
  });
  if (!validacao.valido) {
    throw new Error(validacao.motivo || 'Imagem inválida.');
  }

  const instrucao = [
    'Analise com atenção esta imagem enviada por um cidadão via WhatsApp no programa de emprego e qualificação FAROL (São Luís - MA).',
    params.caption ? `Legenda enviada junto com a imagem: "${params.caption}"` : '',
    'Identifique que tipo de imagem é e extraia TODAS as informações profissionais, educacionais, certificações, habilidades, bairro ou detalhes de vaga úteis para o perfil e currículo.',
    'Retorne APENAS um JSON válido com esta estrutura:',
    '{',
    '  "categoria": "CURRICULO" | "CERTIFICADO_CURSO" | "DIPLOMA_ESCOLARIDADE" | "CARTEIRA_HABILITACAO" | "PORTFOLIO_TRABALHO" | "ANUNCIO_VAGA" | "COMPROVANTE_ENDERECO" | "OUTRA_IMAGEM",',
    '  "resumoNatural": "Descrição objetiva e acolhedora do que foi identificado na imagem",',
    '  "informacoesPertinentes": ["lista curta de fatos úteis identificados na imagem"],',
    '  "alertaDadosSensiveis": boolean,',
    '  "dadosCurriculo": {',
    '    "nomeCompleto": string | null,',
    '    "bairro": string | null,',
    '    "municipio": string | null,',
    '    "escolaridade": string | null,',
    '    "areaInteresse": string | null,',
    '    "objetivo": string | null,',
    '    "resumoProfissional": string | null,',
    '    "competencias": string[],',
    '    "experiencias": [{ "cargo": string, "empresa": string | null, "periodo": string | null, "descricao": string | null, "trabalhoInformal": boolean }],',
    '    "formacoes": [{ "nivel": string, "curso": string | null, "instituicao": string | null, "anoConclusao": string | null }],',
    '    "cursosCertificacoes": [{ "titulo": string, "instituicao": string | null, "cargaHoraria": string | null }],',
    '    "observacoesAdicionais": string[]',
    '  },',
    '  "vagaMencionada": { "titulo": string | null, "empresa": string | null, "requisitos": string[] } | null',
    '}',
    'PRIVACIDADE OBRIGATÓRIA:',
    '- Se for foto de RG, CPF, CNH ou documento pessoal, NUNCA transcreva número de CPF, número de RG, número de registro, filiação ou data de nascimento.',
    '- No caso de CNH, extraia apenas a categoria de habilitação (ex: "CNH categoria B") e o nome se visível, marcando alertaDadosSensiveis=true se houver CPF/RG visível.',
    '- Se for foto de certificado, curso, NR (ex: NR-10, NR-12, NR-35), diploma, trabalho/obra/serviço executado ou anúncio de vaga, extraia o máximo de detalhes pertinentes para ajudar o candidato.',
  ]
    .filter(Boolean)
    .join('\n');

  const rawJson = await callGeminiMultimodal({
    models: [params.primaryModel ?? 'gemini-2.5-flash', 'gemini-2.5-flash', 'gemini-flash-latest'],
    apiKey: params.apiKey,
    jsonMode: true,
    maxOutputTokens: 2500,
    fetchFn: params.fetchFn,
    parts: [
      { text: instrucao },
      {
        inlineData: {
          mimeType: validacao.mimeType,
          data: validacao.cleanBase64,
        },
      },
    ],
  });

  const parsed = parseSafeJsonObject(rawJson);
  const categoriasValidas = new Set<CategoriaImagem>([
    'CURRICULO',
    'CERTIFICADO_CURSO',
    'DIPLOMA_ESCOLARIDADE',
    'CARTEIRA_HABILITACAO',
    'PORTFOLIO_TRABALHO',
    'ANUNCIO_VAGA',
    'COMPROVANTE_ENDERECO',
    'OUTRA_IMAGEM',
  ]);
  const catRaw = String(parsed.categoria ?? 'OUTRA_IMAGEM').toUpperCase() as CategoriaImagem;
  const categoria: CategoriaImagem = categoriasValidas.has(catRaw) ? catRaw : 'OUTRA_IMAGEM';

  const infoList = Array.isArray(parsed.informacoesPertinentes)
    ? parsed.informacoesPertinentes
        .filter((i): i is string => typeof i === 'string' && i.trim().length > 0)
        .map((i) => sanitizarEntradaCidadao(i).textoLimpo)
    : [];

  const dadosBrutos =
    parsed.dadosCurriculo && typeof parsed.dadosCurriculo === 'object'
      ? (parsed.dadosCurriculo as Record<string, unknown>)
      : {};

  let vagaMencionada: ResultadoAnaliseImagem['vagaMencionada'];
  if (parsed.vagaMencionada && typeof parsed.vagaMencionada === 'object') {
    const vm = parsed.vagaMencionada as Record<string, unknown>;
    const titulo = typeof vm.titulo === 'string' && vm.titulo.trim() ? vm.titulo.trim() : undefined;
    const empresa = typeof vm.empresa === 'string' && vm.empresa.trim() ? vm.empresa.trim() : undefined;
    const requisitos = Array.isArray(vm.requisitos)
      ? vm.requisitos.filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
      : undefined;
    if (titulo || empresa || (requisitos && requisitos.length > 0)) {
      vagaMencionada = { titulo, empresa, requisitos };
    }
  }

  return {
    categoria,
    resumoNatural: sanitizarEntradaCidadao(
      typeof parsed.resumoNatural === 'string' && parsed.resumoNatural.trim()
        ? parsed.resumoNatural
        : 'Imagem analisada.'
    ).textoLimpo,
    informacoesPertinentes: infoList,
    dadosCurriculo: mapParsedCurriculo(dadosBrutos),
    vagaMencionada,
    alertaDadosSensiveis: Boolean(parsed.alertaDadosSensiveis),
  };
}
