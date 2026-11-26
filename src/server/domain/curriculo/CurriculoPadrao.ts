import { normalizarTexto } from '@/server/domain/matching/MatchEngine';
import { sanitizarEntradaCidadao } from '@/server/domain/ai/Guardrails';
import type { CandidatoRecord } from '@/server/infrastructure/repositories/FarolDataStore';
import type { NivelEscolaridade } from '@/types/farol';

export interface ExperienciaCurriculo {
  cargo: string;
  empresa?: string;
  periodo?: string;
  descricao?: string;
  trabalhoInformal?: boolean;
}

export interface FormacaoCurriculo {
  nivel: string;
  curso?: string;
  instituicao?: string;
  anoConclusao?: string;
}

export interface CursoCertificacaoCurriculo {
  titulo: string;
  instituicao?: string;
  cargaHoraria?: string;
}

export interface CurriculoPadraoData {
  nomeCompleto: string;
  bairro: string;
  municipio: string;
  telefoneWhatsApp?: string;
  email?: string;
  escolaridade?: NivelEscolaridade | null;
  escolaridadeTexto?: string;
  areaInteresse?: string;
  objetivo?: string;
  resumoProfissional?: string;
  disponibilidade?: string;
  competencias: string[];
  experiencias: ExperienciaCurriculo[];
  formacoes: FormacaoCurriculo[];
  cursosCertificacoes: CursoCertificacaoCurriculo[];
  observacoesAdicionais: string[];
}

export interface CurriculoArquivoMetadata {
  id: string;
  candidatoId: string;
  origem: 'UPLOAD_PDF' | 'UPLOAD_IMAGEM' | 'GERADO_SISTEMA';
  arquivoUrl: string;
  nomeArquivo: string;
  mimeType: string;
  dadosExtraidosJson: Record<string, unknown> | null;
  confirmadoUsuario: boolean;
  criadoEm: string;
}

export interface CurriculoArquivoRecord extends CurriculoArquivoMetadata {
  arquivoBase64: string;
}

const LABELS_ESCOLARIDADE: Record<NivelEscolaridade, string> = {
  FUNDAMENTAL_INCOMPLETO: 'Ensino Fundamental incompleto',
  FUNDAMENTAL_COMPLETO: 'Ensino Fundamental completo',
  MEDIO_INCOMPLETO: 'Ensino Médio incompleto',
  MEDIO_COMPLETO: 'Ensino Médio completo',
  TECNICO: 'Ensino Técnico',
  SUPERIOR_INCOMPLETO: 'Ensino Superior incompleto',
  SUPERIOR_COMPLETO: 'Ensino Superior completo',
};

export function labelEscolaridade(nivel?: NivelEscolaridade | null): string {
  if (!nivel) return 'Não informada';
  return LABELS_ESCOLARIDADE[nivel] ?? 'Não informada';
}

export function normalizarNivelEscolaridade(valor?: string | null): NivelEscolaridade | null {
  if (!valor) return null;
  const upper = valor.trim().toUpperCase();
  if (upper in LABELS_ESCOLARIDADE) {
    return upper as NivelEscolaridade;
  }

  const norm = normalizarTexto(valor);
  if (!norm) return null;

  if (norm.includes('tecnico') || norm.includes('tecnologo')) return 'TECNICO';
  if (norm.includes('superior') || norm.includes('faculdade') || norm.includes('graduacao')) {
    return norm.includes('incompleto') || norm.includes('cursando')
      ? 'SUPERIOR_INCOMPLETO'
      : 'SUPERIOR_COMPLETO';
  }
  if (norm.includes('medio') || norm.includes('2 grau') || norm.includes('segundo grau')) {
    return norm.includes('incompleto') || norm.includes('cursando')
      ? 'MEDIO_INCOMPLETO'
      : 'MEDIO_COMPLETO';
  }
  if (norm.includes('fundamental') || norm.includes('1 grau') || norm.includes('primeiro grau')) {
    return norm.includes('incompleto') || norm.includes('cursando')
      ? 'FUNDAMENTAL_INCOMPLETO'
      : 'FUNDAMENTAL_COMPLETO';
  }
  return null;
}

function limparTextoSeguro(valor: unknown, maxLen: number): string | undefined {
  if (typeof valor !== 'string') return undefined;
  const { textoLimpo } = sanitizarEntradaCidadao(valor);
  const colapsado = textoLimpo.replace(/\s+/g, ' ').trim();
  if (!colapsado) return undefined;
  return colapsado.slice(0, maxLen);
}

function deduplicarTextos(itens: Array<string | undefined | null>, limite: number, maxItemLen: number): string[] {
  const mapa = new Map<string, string>();
  for (const raw of itens) {
    const limpo = limparTextoSeguro(raw, maxItemLen);
    if (!limpo) continue;
    const key = normalizarTexto(limpo);
    if (key && !mapa.has(key)) {
      mapa.set(key, limpo);
    }
    if (mapa.size >= limite) break;
  }
  return Array.from(mapa.values());
}

function deduplicarExperiencias(lista: ExperienciaCurriculo[]): ExperienciaCurriculo[] {
  const mapa = new Map<string, ExperienciaCurriculo>();
  for (const item of lista) {
    const cargo = limparTextoSeguro(item?.cargo, 140);
    if (!cargo) continue;
    const empresa = limparTextoSeguro(item?.empresa, 140);
    const periodo = limparTextoSeguro(item?.periodo, 80);
    const descricao = limparTextoSeguro(item?.descricao, 300);
    const key = normalizarTexto(`${cargo}|${empresa ?? ''}|${periodo ?? ''}`);
    if (!mapa.has(key)) {
      mapa.set(key, {
        cargo,
        ...(empresa ? { empresa } : {}),
        ...(periodo ? { periodo } : {}),
        ...(descricao ? { descricao } : {}),
        ...(typeof item.trabalhoInformal === 'boolean' ? { trabalhoInformal: item.trabalhoInformal } : {}),
      });
    }
    if (mapa.size >= 12) break;
  }
  return Array.from(mapa.values());
}

function deduplicarFormacoes(lista: FormacaoCurriculo[]): FormacaoCurriculo[] {
  const mapa = new Map<string, FormacaoCurriculo>();
  for (const item of lista) {
    const nivel = limparTextoSeguro(item?.nivel, 120);
    if (!nivel) continue;
    const curso = limparTextoSeguro(item?.curso, 140);
    const instituicao = limparTextoSeguro(item?.instituicao, 140);
    const anoConclusao = limparTextoSeguro(item?.anoConclusao, 20);
    const key = normalizarTexto(`${nivel}|${curso ?? ''}|${instituicao ?? ''}`);
    if (!mapa.has(key)) {
      mapa.set(key, {
        nivel,
        ...(curso ? { curso } : {}),
        ...(instituicao ? { instituicao } : {}),
        ...(anoConclusao ? { anoConclusao } : {}),
      });
    }
    if (mapa.size >= 8) break;
  }
  return Array.from(mapa.values());
}

function deduplicarCursos(lista: CursoCertificacaoCurriculo[]): CursoCertificacaoCurriculo[] {
  const mapa = new Map<string, CursoCertificacaoCurriculo>();
  for (const item of lista) {
    const titulo = limparTextoSeguro(item?.titulo, 160);
    if (!titulo) continue;
    const instituicao = limparTextoSeguro(item?.instituicao, 140);
    const cargaHoraria = limparTextoSeguro(item?.cargaHoraria, 40);
    const key = normalizarTexto(`${titulo}|${instituicao ?? ''}`);
    if (!mapa.has(key)) {
      mapa.set(key, {
        titulo,
        ...(instituicao ? { instituicao } : {}),
        ...(cargaHoraria ? { cargaHoraria } : {}),
      });
    }
    if (mapa.size >= 15) break;
  }
  return Array.from(mapa.values());
}

export function sanitizarCurriculoPadrao(dados: Partial<CurriculoPadraoData>): CurriculoPadraoData {
  const escolaridadeNorm =
    dados.escolaridade ?? normalizarNivelEscolaridade(dados.escolaridadeTexto ?? undefined);
  const escolaridadeTexto =
    limparTextoSeguro(dados.escolaridadeTexto, 120) ??
    (escolaridadeNorm ? labelEscolaridade(escolaridadeNorm) : undefined);

  return {
    nomeCompleto: limparTextoSeguro(dados.nomeCompleto, 180) ?? '',
    bairro: limparTextoSeguro(dados.bairro, 120) ?? '',
    municipio: limparTextoSeguro(dados.municipio, 100) ?? 'São Luís',
    telefoneWhatsApp: limparTextoSeguro(dados.telefoneWhatsApp, 30),
    email: limparTextoSeguro(dados.email, 160),
    escolaridade: escolaridadeNorm ?? null,
    escolaridadeTexto,
    areaInteresse: limparTextoSeguro(dados.areaInteresse, 150),
    objetivo: limparTextoSeguro(dados.objetivo, 400),
    resumoProfissional: limparTextoSeguro(dados.resumoProfissional, 700),
    disponibilidade: limparTextoSeguro(dados.disponibilidade, 200),
    competencias: deduplicarTextos(Array.isArray(dados.competencias) ? dados.competencias : [], 20, 100),
    experiencias: deduplicarExperiencias(Array.isArray(dados.experiencias) ? dados.experiencias : []),
    formacoes: deduplicarFormacoes(Array.isArray(dados.formacoes) ? dados.formacoes : []),
    cursosCertificacoes: deduplicarCursos(
      Array.isArray(dados.cursosCertificacoes) ? dados.cursosCertificacoes : []
    ),
    observacoesAdicionais: deduplicarTextos(
      Array.isArray(dados.observacoesAdicionais) ? dados.observacoesAdicionais : [],
      8,
      200
    ),
  };
}

export function mesclarCurriculoPadrao(
  atual: Partial<CurriculoPadraoData>,
  patch: Partial<CurriculoPadraoData>
): CurriculoPadraoData {
  const base = sanitizarCurriculoPadrao(atual);
  const novo = sanitizarCurriculoPadrao(patch);

  return sanitizarCurriculoPadrao({
    nomeCompleto: novo.nomeCompleto || base.nomeCompleto,
    bairro: novo.bairro || base.bairro,
    municipio: novo.municipio && novo.municipio !== 'São Luís' ? novo.municipio : base.municipio || novo.municipio,
    telefoneWhatsApp: novo.telefoneWhatsApp || base.telefoneWhatsApp,
    email: novo.email || base.email,
    escolaridade: novo.escolaridade ?? base.escolaridade ?? null,
    escolaridadeTexto: novo.escolaridadeTexto || base.escolaridadeTexto,
    areaInteresse: novo.areaInteresse || base.areaInteresse,
    objetivo: novo.objetivo || base.objetivo,
    resumoProfissional: novo.resumoProfissional || base.resumoProfissional,
    disponibilidade: novo.disponibilidade || base.disponibilidade,
    competencias: [...base.competencias, ...novo.competencias],
    experiencias: [...base.experiencias, ...novo.experiencias],
    formacoes: [...base.formacoes, ...novo.formacoes],
    cursosCertificacoes: [...base.cursosCertificacoes, ...novo.cursosCertificacoes],
    observacoesAdicionais: [...base.observacoesAdicionais, ...novo.observacoesAdicionais],
  });
}

export interface EdicaoCurriculoPadrao {
  nomeCompleto?: string;
  bairro?: string;
  municipio?: string;
  telefoneWhatsApp?: string;
  email?: string;
  escolaridade?: NivelEscolaridade | null;
  escolaridadeTexto?: string;
  areaInteresse?: string;
  objetivo?: string;
  resumoProfissional?: string;
  disponibilidade?: string;
  competencias?: string[];
  experiencias?: ExperienciaCurriculo[];
  formacoes?: FormacaoCurriculo[];
  cursosCertificacoes?: CursoCertificacaoCurriculo[];
  observacoesAdicionais?: string[];
  removerCompetencias?: string[];
  removerExperiencias?: string[];
  removerCursosCertificacoes?: string[];
  removerObservacoes?: string[];
  limparCampos?: string[];
}

function correspondeTermoRemocao(valor: string, alvosNormalizados: string[]): boolean {
  const valNorm = normalizarTexto(valor);
  if (!valNorm) return false;
  return alvosNormalizados.some(
    (alvo) =>
      alvo === valNorm ||
      (alvo.length >= 4 && (valNorm.includes(alvo) || alvo.includes(valNorm)))
  );
}

/**
 * Aplica edição explícita no currículo: campos e listas enviados substituem os anteriores,
 * permitindo editar, reescrever, limpar campos ou remover itens específicos.
 */
export function aplicarEdicaoCurriculoPadrao(
  atual: Partial<CurriculoPadraoData>,
  edicao: EdicaoCurriculoPadrao
): CurriculoPadraoData {
  const base = sanitizarCurriculoPadrao(atual);
  const limparSet = new Set(
    (edicao.limparCampos ?? []).map((c) => normalizarTexto(c)).filter(Boolean)
  );

  const limparSeVazioOuMarcado = (
    campoKey: string,
    valorNovo: string | undefined,
    valorAtual: string | undefined
  ): string | undefined => {
    if (limparSet.has(normalizarTexto(campoKey))) return undefined;
    if (valorNovo !== undefined) {
      return valorNovo.trim() ? valorNovo : undefined;
    }
    return valorAtual;
  };

  let competencias =
    edicao.competencias !== undefined ? edicao.competencias : base.competencias;
  let experiencias =
    edicao.experiencias !== undefined ? edicao.experiencias : base.experiencias;
  let formacoes =
    edicao.formacoes !== undefined ? edicao.formacoes : base.formacoes;
  let cursosCertificacoes =
    edicao.cursosCertificacoes !== undefined
      ? edicao.cursosCertificacoes
      : base.cursosCertificacoes;
  let observacoesAdicionais =
    edicao.observacoesAdicionais !== undefined
      ? edicao.observacoesAdicionais
      : base.observacoesAdicionais;

  if (limparSet.has('competencias')) competencias = [];
  if (limparSet.has('experiencias')) experiencias = [];
  if (limparSet.has('formacoes')) formacoes = [];
  if (limparSet.has('cursoscertificacoes') || limparSet.has('cursos')) {
    cursosCertificacoes = [];
  }
  if (limparSet.has('observacoesadicionais') || limparSet.has('observacoes')) {
    observacoesAdicionais = [];
  }

  const remComp = (edicao.removerCompetencias ?? []).map(normalizarTexto).filter(Boolean);
  if (remComp.length > 0) {
    competencias = competencias.filter((c) => !correspondeTermoRemocao(c, remComp));
  }

  const remExp = (edicao.removerExperiencias ?? []).map(normalizarTexto).filter(Boolean);
  if (remExp.length > 0) {
    experiencias = experiencias.filter(
      (e) =>
        !correspondeTermoRemocao(e.cargo, remExp) &&
        !(e.empresa && correspondeTermoRemocao(e.empresa, remExp))
    );
  }

  const remCursos = (edicao.removerCursosCertificacoes ?? [])
    .map(normalizarTexto)
    .filter(Boolean);
  if (remCursos.length > 0) {
    cursosCertificacoes = cursosCertificacoes.filter(
      (c) => !correspondeTermoRemocao(c.titulo, remCursos)
    );
  }

  const remObs = (edicao.removerObservacoes ?? []).map(normalizarTexto).filter(Boolean);
  if (remObs.length > 0) {
    observacoesAdicionais = observacoesAdicionais.filter(
      (o) => !correspondeTermoRemocao(o, remObs)
    );
  }

  const escolaridadeLimpa = limparSet.has('escolaridade');
  const escolaridade = escolaridadeLimpa
    ? null
    : edicao.escolaridade !== undefined
      ? edicao.escolaridade
      : edicao.escolaridadeTexto !== undefined
        ? normalizarNivelEscolaridade(edicao.escolaridadeTexto)
        : base.escolaridade ?? null;

  const escolaridadeTexto = escolaridadeLimpa
    ? undefined
    : edicao.escolaridadeTexto !== undefined
      ? edicao.escolaridadeTexto.trim() || undefined
      : edicao.escolaridade !== undefined
        ? edicao.escolaridade
          ? labelEscolaridade(edicao.escolaridade)
          : undefined
        : base.escolaridadeTexto;

  return sanitizarCurriculoPadrao({
    nomeCompleto:
      edicao.nomeCompleto !== undefined
        ? edicao.nomeCompleto.trim() || base.nomeCompleto
        : base.nomeCompleto,
    bairro:
      edicao.bairro !== undefined ? edicao.bairro.trim() || base.bairro : base.bairro,
    municipio:
      edicao.municipio !== undefined
        ? edicao.municipio.trim() || base.municipio
        : base.municipio,
    telefoneWhatsApp: limparSeVazioOuMarcado(
      'telefoneWhatsApp',
      edicao.telefoneWhatsApp,
      base.telefoneWhatsApp
    ),
    email: limparSeVazioOuMarcado('email', edicao.email, base.email),
    escolaridade,
    escolaridadeTexto,
    areaInteresse: limparSeVazioOuMarcado(
      'areaInteresse',
      edicao.areaInteresse,
      base.areaInteresse
    ),
    objetivo: limparSeVazioOuMarcado('objetivo', edicao.objetivo, base.objetivo),
    resumoProfissional: limparSeVazioOuMarcado(
      'resumoProfissional',
      edicao.resumoProfissional,
      base.resumoProfissional
    ),
    disponibilidade: limparSeVazioOuMarcado(
      'disponibilidade',
      edicao.disponibilidade,
      base.disponibilidade
    ),
    competencias,
    experiencias,
    formacoes,
    cursosCertificacoes,
    observacoesAdicionais,
  });
}

export function calcularCompletudeCurriculo(dados: Partial<CurriculoPadraoData>): {
  prontoParaGerar: boolean;
  percentual: number;
  camposFaltantes: string[];
} {
  const limpo = sanitizarCurriculoPadrao(dados);
  const camposFaltantes: string[] = [];

  if (!limpo.nomeCompleto) camposFaltantes.push('nome completo');
  if (!limpo.bairro) camposFaltantes.push('bairro');
  if (!limpo.escolaridade && !limpo.escolaridadeTexto) camposFaltantes.push('escolaridade');

  const temConteudoProfissional =
    limpo.competencias.length > 0 ||
    limpo.experiencias.length > 0 ||
    Boolean(limpo.objetivo) ||
    Boolean(limpo.resumoProfissional);

  if (!temConteudoProfissional) {
    camposFaltantes.push('habilidades, experiências ou objetivo profissional');
  }

  let pontos = 0;
  if (limpo.nomeCompleto) pontos += 25;
  if (limpo.bairro) pontos += 15;
  if (limpo.escolaridade || limpo.escolaridadeTexto) pontos += 20;
  if (limpo.competencias.length > 0) pontos += 15;
  if (limpo.experiencias.length > 0 || limpo.resumoProfissional) pontos += 15;
  if (limpo.objetivo || limpo.areaInteresse) pontos += 10;

  return {
    prontoParaGerar: camposFaltantes.length === 0,
    percentual: Math.min(100, pontos),
    camposFaltantes,
  };
}

export function montarCurriculoDeCandidato(
  candidato: CandidatoRecord,
  contato?: { telefone?: string | null; email?: string | null }
): CurriculoPadraoData {
  return sanitizarCurriculoPadrao({
    nomeCompleto: candidato.nomeCompleto || candidato.nomeExibicao,
    bairro: candidato.bairro,
    municipio: candidato.municipio || 'São Luís',
    telefoneWhatsApp: contato?.telefone ?? undefined,
    email: contato?.email ?? undefined,
    escolaridade: candidato.escolaridade,
    escolaridadeTexto: candidato.escolaridade ? labelEscolaridade(candidato.escolaridade) : undefined,
    areaInteresse: candidato.areaInteresse ?? undefined,
    objetivo: candidato.objetivo ?? undefined,
    resumoProfissional: candidato.resumoProfissional ?? undefined,
    disponibilidade: candidato.disponibilidade ?? undefined,
    competencias: candidato.competencias ?? [],
    experiencias: (candidato.experiencias ?? []).map((exp) => ({
      cargo: exp.cargoAtividade,
      empresa: exp.empresaOuContexto ?? undefined,
      periodo: exp.periodo ?? undefined,
      trabalhoInformal: exp.trabalhoInformal,
    })),
    formacoes: candidato.escolaridade
      ? [{ nivel: labelEscolaridade(candidato.escolaridade) }]
      : [],
    cursosCertificacoes: [],
    observacoesAdicionais: [],
  });
}

/**
 * Gera um nome de arquivo estritamente seguro contendo apenas [A-Za-z0-9_-].
 */
export function gerarNomeArquivoCurriculo(nomeCompleto: string): string {
  const base = (nomeCompleto || 'Candidato')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  const sufixo = base || 'Candidato';
  return `Curriculo_FAROL_${sufixo}.pdf`;
}
