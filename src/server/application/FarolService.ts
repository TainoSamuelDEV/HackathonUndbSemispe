import crypto from 'crypto';
import { calcularCompatibilidade, normalizarTexto } from '@/server/domain/matching/MatchEngine';
import {
  AcessoNegadoError,
  RecursoNaoEncontradoError,
  RegraNegocioError,
} from '@/server/domain/errors/DomainError';
import {
  farolMemoryStore,
  type CandidatoRecord,
  type CandidaturaRecord,
  type ConversaWhatsAppRecord,
  type CursoRecord,
  type InscricaoCursoRecord,
  type PedidoCursoRecord,
  type VagaRecord,
} from '@/server/infrastructure/repositories/FarolDataStore';
import { assinarTokenSessao, hashSenha, verificarSenha } from '@/server/infrastructure/auth/jwt';
import type {
  CanalOrigem,
  EstadoConversaIA,
  ModalidadeTrabalho,
  NivelEscolaridade,
  RequisitoVaga,
  ResultadoMatch,
  StatusCandidatura,
  TipoContratacao,
  TipoCurso,
  UsuarioSessao,
} from '@/types/farol';

export class FarolService {
  // --------------------------------------------------------------------------
  // AUTENTICAÇÃO
  // --------------------------------------------------------------------------

  async autenticar(email: string, senha: string): Promise<{ token: string; sessao: UsuarioSessao }> {
    const emailNorm = email.trim().toLowerCase();
    const usuario = farolMemoryStore.usuarios.find(
      (u) => u.email?.toLowerCase() === emailNorm && u.ativo
    );
    if (!usuario || !usuario.senhaHash) {
      throw new RegraNegocioError('E-mail ou senha inválidos.');
    }

    const senhaOk = await verificarSenha(senha, usuario.senhaHash);
    if (!senhaOk) {
      throw new RegraNegocioError('E-mail ou senha inválidos.');
    }

    const candidato = farolMemoryStore.candidatos.find((c) => c.usuarioId === usuario.id);
    const empresa = farolMemoryStore.empresas.find((e) => e.usuarioId === usuario.id);

    const sessao: UsuarioSessao = {
      id: usuario.id,
      email: usuario.email,
      papel: usuario.papel,
      nome:
        candidato?.nomeExibicao ??
        empresa?.nomeFantasia ??
        'Equipe SEMISPE',
      candidatoId: candidato?.id,
      empresaId: empresa?.id,
      whatsappVerificado: usuario.whatsappVerificado,
    };

    return { token: assinarTokenSessao(sessao), sessao };
  }

  async cadastrarCandidato(input: {
    nomeCompleto: string;
    email: string;
    telefoneWhatsapp?: string;
    bairro: string;
    senha: string;
  }): Promise<{ token: string; sessao: UsuarioSessao }> {
    const emailNorm = input.email.trim().toLowerCase();
    if (farolMemoryStore.usuarios.some((u) => u.email?.toLowerCase() === emailNorm)) {
      throw new RegraNegocioError('Este e-mail já está cadastrado.');
    }

    const usuarioId = crypto.randomUUID();
    const candidatoId = crypto.randomUUID();
    const senhaHash = await hashSenha(input.senha);

    farolMemoryStore.usuarios.push({
      id: usuarioId,
      email: emailNorm,
      senhaHash,
      papel: 'CANDIDATO',
      telefoneWhatsapp: input.telefoneWhatsapp || null,
      whatsappVerificado: false,
      ativo: true,
    });

    const nomeExibicao = input.nomeCompleto.trim().split(/\s+/).slice(0, 2).join(' ');
    farolMemoryStore.candidatos.push({
      id: candidatoId,
      usuarioId,
      nomeCompleto: input.nomeCompleto.trim(),
      nomeExibicao,
      bairro: input.bairro.trim(),
      municipio: 'São Luís',
      escolaridade: null,
      areaInteresse: null,
      objetivo: null,
      resumoProfissional: null,
      disponibilidade: null,
      consentimentoLgpd: true,
      consentimentoEm: new Date().toISOString(),
      visivelServicos: false,
      categoriaServicos: null,
      competencias: [],
      experiencias: [],
    });

    const sessao: UsuarioSessao = {
      id: usuarioId,
      email: emailNorm,
      papel: 'CANDIDATO',
      nome: nomeExibicao,
      candidatoId,
      whatsappVerificado: false,
    };

    return { token: assinarTokenSessao(sessao), sessao };
  }

  async cadastrarEmpresa(input: {
    responsavelNome: string;
    email: string;
    cnpj: string;
    razaoSocial: string;
    nomeFantasia?: string;
    ehMei: boolean;
    setor: string;
    bairro: string;
    telefone: string;
    senha: string;
  }): Promise<{ token: string; sessao: UsuarioSessao }> {
    const emailNorm = input.email.trim().toLowerCase();
    if (farolMemoryStore.usuarios.some((u) => u.email?.toLowerCase() === emailNorm)) {
      throw new RegraNegocioError('Este e-mail já está cadastrado.');
    }

    const cnpjLimpo = input.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      throw new RegraNegocioError('CNPJ inválido. Informe os 14 dígitos do CNPJ ativo ou MEI.');
    }

    const usuarioId = crypto.randomUUID();
    const empresaId = crypto.randomUUID();
    const senhaHash = await hashSenha(input.senha);

    farolMemoryStore.usuarios.push({
      id: usuarioId,
      email: emailNorm,
      senhaHash,
      papel: 'EMPRESA',
      telefoneWhatsapp: null,
      whatsappVerificado: false,
      ativo: true,
    });

    const nomeFantasia = input.nomeFantasia?.trim() || input.razaoSocial.trim();
    farolMemoryStore.empresas.push({
      id: empresaId,
      usuarioId,
      cnpj: input.cnpj.trim(),
      razaoSocial: input.razaoSocial.trim(),
      nomeFantasia,
      ehMei: input.ehMei,
      setor: input.setor.trim(),
      bairro: input.bairro.trim(),
      municipio: 'São Luís',
      telefone: input.telefone.trim(),
      responsavelNome: input.responsavelNome.trim(),
      statusValidacao: 'VERIFICADA',
    });

    const sessao: UsuarioSessao = {
      id: usuarioId,
      email: emailNorm,
      papel: 'EMPRESA',
      nome: nomeFantasia,
      empresaId,
      whatsappVerificado: false,
    };

    return { token: assinarTokenSessao(sessao), sessao };
  }

  // --------------------------------------------------------------------------
  // VAGAS E MATCHING (REGRA: SCORE RESTRITO AO CANDIDATO AUTENTICADO)
  // --------------------------------------------------------------------------

  async listarVagasPublicas(filtros?: {
    busca?: string;
    bairro?: string;
    modalidade?: ModalidadeTrabalho;
    area?: string;
  }): Promise<VagaRecord[]> {
    let lista = farolMemoryStore.vagas.filter((v) => v.status === 'PUBLICADA');

    if (filtros?.busca) {
      const q = normalizarTexto(filtros.busca);
      lista = lista.filter(
        (v) =>
          normalizarTexto(v.titulo).includes(q) ||
          normalizarTexto(v.descricao).includes(q) ||
          normalizarTexto(v.area).includes(q)
      );
    }
    if (filtros?.bairro) {
      const b = normalizarTexto(filtros.bairro);
      lista = lista.filter((v) => normalizarTexto(v.bairro).includes(b));
    }
    if (filtros?.modalidade) {
      lista = lista.filter((v) => v.modalidade === filtros.modalidade);
    }
    if (filtros?.area) {
      const a = normalizarTexto(filtros.area);
      lista = lista.filter((v) => normalizarTexto(v.area).includes(a));
    }

    return lista;
  }

  async obterVagaPorId(vagaId: string): Promise<VagaRecord> {
    const vaga = farolMemoryStore.vagas.find((v) => v.id === vagaId);
    if (!vaga) throw new RecursoNaoEncontradoError('Vaga não encontrada.');
    return vaga;
  }

  async calcularMatchParaCandidato(candidatoId: string, vagaId: string): Promise<ResultadoMatch> {
    const candidato = farolMemoryStore.candidatos.find((c) => c.id === candidatoId);
    if (!candidato) throw new RecursoNaoEncontradoError('Candidato não encontrado.');

    const vaga = await this.obterVagaPorId(vagaId);
    return calcularCompatibilidade(
      {
        escolaridade: candidato.escolaridade,
        competencias: candidato.competencias,
      },
      {
        escolaridadeMinima: vaga.escolaridadeMinima,
        requisitos: vaga.requisitos,
      }
    );
  }

  async listarMelhoresVagasParaIA(
    candidatoId: string,
    area?: string,
    limit = 3
  ): Promise<Array<{ vaga: VagaRecord; match: ResultadoMatch }>> {
    const candidato = farolMemoryStore.candidatos.find((c) => c.id === candidatoId);
    if (!candidato) throw new RecursoNaoEncontradoError('Candidato não encontrado.');

    const vagas = await this.listarVagasPublicas({ area });
    const avaliadas = vagas.map((vaga) => ({
      vaga,
      match: calcularCompatibilidade(
        { escolaridade: candidato.escolaridade, competencias: candidato.competencias },
        { escolaridadeMinima: vaga.escolaridadeMinima, requisitos: vaga.requisitos }
      ),
    }));

    avaliadas.sort((a, b) => b.match.percentual - a.match.percentual);
    return avaliadas.slice(0, Math.min(limit, 3));
  }

  async candidatar(input: {
    candidatoId: string;
    vagaId: string;
    origemCanal: CanalOrigem;
  }): Promise<CandidaturaRecord> {
    const vaga = await this.obterVagaPorId(input.vagaId);
    if (vaga.status !== 'PUBLICADA') {
      throw new RegraNegocioError('As inscrições para esta vaga foram encerradas.');
    }

    const jaExiste = farolMemoryStore.candidaturas.find(
      (c) => c.vagaId === input.vagaId && c.candidatoId === input.candidatoId
    );
    if (jaExiste) {
      throw new RegraNegocioError('Você já se candidatou a esta oportunidade.');
    }

    const match = await this.calcularMatchParaCandidato(input.candidatoId, input.vagaId);
    const agora = new Date().toISOString();

    const nova: CandidaturaRecord = {
      id: crypto.randomUUID(),
      vagaId: input.vagaId,
      candidatoId: input.candidatoId,
      origemCanal: input.origemCanal,
      status: 'INSCRITO',
      scoreCalculado: match.percentual,
      detalhesMatch: match,
      criadoEm: agora,
      atualizadoEm: agora,
      eventos: [
        {
          id: crypto.randomUUID(),
          statusAnterior: null,
          statusNovo: 'INSCRITO',
          observacao: `Candidatura registrada via ${input.origemCanal}.`,
          criadoEm: agora,
        },
      ],
    };

    farolMemoryStore.candidaturas.push(nova);
    return nova;
  }

  async listarCandidaturasDoCandidato(candidatoId: string) {
    return farolMemoryStore.candidaturas
      .filter((c) => c.candidatoId === candidatoId)
      .map((c) => ({
        ...c,
        vaga: farolMemoryStore.vagas.find((v) => v.id === c.vagaId) ?? null,
      }));
  }

  // --------------------------------------------------------------------------
  // CURRÍCULO & PERFIL DO CANDIDATO
  // --------------------------------------------------------------------------

  async obterCandidato(candidatoId: string): Promise<CandidatoRecord> {
    const cand = farolMemoryStore.candidatos.find((c) => c.id === candidatoId);
    if (!cand) throw new RecursoNaoEncontradoError('Perfil de candidato não encontrado.');
    return cand;
  }

  async atualizarCurriculoCandidato(
    candidatoId: string,
    dados: Partial<
      Pick<
        CandidatoRecord,
        | 'nomeCompleto'
        | 'nomeExibicao'
        | 'bairro'
        | 'escolaridade'
        | 'areaInteresse'
        | 'objetivo'
        | 'resumoProfissional'
        | 'disponibilidade'
        | 'visivelServicos'
        | 'categoriaServicos'
        | 'competencias'
        | 'experiencias'
      >
    >
  ): Promise<CandidatoRecord> {
    const cand = await this.obterCandidato(candidatoId);
    Object.assign(cand, dados);
    return cand;
  }

  // --------------------------------------------------------------------------
  // EMPRESA (REGRA: NUNCA EXPÕE SCORE DO CANDIDATO)
  // --------------------------------------------------------------------------

  async publicarVagaEmpresa(
    empresaId: string,
    input: {
      titulo: string;
      area: string;
      descricao: string;
      bairro: string;
      modalidade: ModalidadeTrabalho;
      tipoContratacao: TipoContratacao;
      quantidadeVagas: number;
      salarioMin?: number | null;
      escolaridadeMinima?: NivelEscolaridade | null;
      jornada?: string | null;
      beneficios?: string[];
      requisitos: RequisitoVaga[];
    }
  ): Promise<VagaRecord> {
    const empresa = farolMemoryStore.empresas.find((e) => e.id === empresaId);
    if (!empresa) throw new RecursoNaoEncontradoError('Empresa não encontrada.');

    const novaVaga: VagaRecord = {
      id: crypto.randomUUID(),
      empresaId,
      empresaNome: empresa.nomeFantasia,
      titulo: input.titulo,
      area: input.area,
      descricao: input.descricao,
      bairro: input.bairro,
      municipio: 'São Luís',
      modalidade: input.modalidade,
      tipoContratacao: input.tipoContratacao,
      quantidadeVagas: input.quantidadeVagas,
      salarioMin: input.salarioMin ?? null,
      salarioMax: null,
      escolaridadeMinima: input.escolaridadeMinima ?? null,
      jornada: input.jornada ?? null,
      beneficios: input.beneficios ?? [],
      origemTipo: 'INTERNA',
      origemUrl: null,
      seloSimulado: false,
      status: 'PUBLICADA',
      publicadaEm: new Date().toISOString(),
      encerraEm: new Date(Date.now() + 30 * 86400000).toISOString(),
      requisitos: input.requisitos,
    };

    farolMemoryStore.vagas.unshift(novaVaga);
    return novaVaga;
  }

  async listarCandidatosDaVagaParaEmpresa(empresaId: string, vagaId: string) {
    const vaga = await this.obterVagaPorId(vagaId);
    if (vaga.empresaId !== empresaId) {
      throw new AcessoNegadoError('Você só pode visualizar candidaturas de vagas da sua empresa.');
    }

    // Regra rígida: scoreCalculado e detalhesMatch são omitidos para a empresa
    return farolMemoryStore.candidaturas
      .filter((c) => c.vagaId === vagaId)
      .map((c) => {
        const cand = farolMemoryStore.candidatos.find((p) => p.id === c.candidatoId);
        return {
          candidaturaId: c.id,
          status: c.status,
          criadoEm: c.criadoEm,
          candidato: cand
            ? {
                id: cand.id,
                nome: cand.nomeExibicao,
                bairro: cand.bairro,
                escolaridade: cand.escolaridade,
                resumoProfissional: cand.resumoProfissional,
                competencias: cand.competencias,
              }
            : null,
        };
      });
  }

  async atualizarStatusCandidaturaPorEmpresa(
    empresaId: string,
    candidaturaId: string,
    novoStatus: Extract<StatusCandidatura, 'EM_ANALISE' | 'ENTREVISTA' | 'CONTRATADO' | 'NAO_APROVADO'>
  ) {
    const cand = farolMemoryStore.candidaturas.find((c) => c.id === candidaturaId);
    if (!cand) throw new RecursoNaoEncontradoError('Candidatura não encontrada.');

    const vaga = await this.obterVagaPorId(cand.vagaId);
    if (vaga.empresaId !== empresaId) {
      throw new AcessoNegadoError('Permissão negada para alterar esta candidatura.');
    }

    const anterior = cand.status;
    const agora = new Date().toISOString();
    cand.status = novoStatus;
    cand.atualizadoEm = agora;
    cand.eventos.push({
      id: crypto.randomUUID(),
      statusAnterior: anterior,
      statusNovo: novoStatus,
      observacao: 'Status atualizado pela empresa no portal.',
      criadoEm: agora,
    });

    return cand;
  }

  async buscarProfissionaisServicos(filtros?: { busca?: string; bairro?: string }) {
    let lista = farolMemoryStore.candidatos.filter((c) => c.visivelServicos);
    if (filtros?.busca) {
      const q = normalizarTexto(filtros.busca);
      lista = lista.filter(
        (c) =>
          normalizarTexto(c.categoriaServicos ?? '').includes(q) ||
          normalizarTexto(c.resumoProfissional ?? '').includes(q) ||
          c.competencias.some((comp) => normalizarTexto(comp).includes(q))
      );
    }
    if (filtros?.bairro) {
      const b = normalizarTexto(filtros.bairro);
      lista = lista.filter((c) => normalizarTexto(c.bairro).includes(b));
    }

    return lista.map((c) => ({
      id: c.id,
      nomePublico: c.nomeExibicao,
      categoria: c.categoriaServicos ?? c.areaInteresse ?? 'Profissional',
      bairro: c.bairro,
      resumo: c.resumoProfissional,
      competencias: c.competencias,
    }));
  }

  // --------------------------------------------------------------------------
  // CURSOS, INSCRIÇÕES E PEDIDOS SOB DEMANDA
  // --------------------------------------------------------------------------

  async listarCursos(tipo?: TipoCurso): Promise<CursoRecord[]> {
    return farolMemoryStore.cursos.filter(
      (c) => c.status === 'ATIVO' && (!tipo || c.tipo === tipo)
    );
  }

  async recomendarCursosParaLacunas(lacunas: string[], limit = 3): Promise<CursoRecord[]> {
    const termos = lacunas.map(normalizarTexto).filter(Boolean);
    const cursos = await this.listarCursos();

    if (termos.length === 0) return cursos.slice(0, limit);

    const pontuados = cursos.map((curso) => {
      const textoCurso = normalizarTexto(
        `${curso.titulo} ${curso.area} ${curso.competenciasDesenvolvidas.join(' ')}`
      );
      const hits = termos.filter((t) => textoCurso.includes(t) || t.includes(normalizarTexto(curso.area))).length;
      return { curso, hits };
    });

    pontuados.sort((a, b) => b.hits - a.hits);
    return pontuados.filter((p) => p.hits > 0).slice(0, limit).map((p) => p.curso);
  }

  async solicitarInscricaoCurso(input: {
    candidatoId: string;
    turmaId: string;
    origemCanal: CanalOrigem;
  }): Promise<InscricaoCursoRecord> {
    const curso = farolMemoryStore.cursos.find((c) => c.turmas.some((t) => t.id === input.turmaId));
    if (!curso) throw new RecursoNaoEncontradoError('Turma não encontrada.');

    const jaExiste = farolMemoryStore.inscricoesCursos.find(
      (i) => i.turmaId === input.turmaId && i.candidatoId === input.candidatoId
    );
    if (jaExiste) {
      throw new RegraNegocioError('Você já solicitou inscrição nesta turma.');
    }

    const nova: InscricaoCursoRecord = {
      id: crypto.randomUUID(),
      turmaId: input.turmaId,
      cursoId: curso.id,
      candidatoId: input.candidatoId,
      origemCanal: input.origemCanal,
      status: 'AGUARDANDO_CONFIRMACAO',
      frequenciaPercentual: null,
      certificadoUrl: null,
      criadoEm: new Date().toISOString(),
    };
    farolMemoryStore.inscricoesCursos.push(nova);
    return nova;
  }

  async registrarPedidoCurso(input: {
    candidatoId: string | null;
    cursoId?: string | null;
    temaDesejado: string;
    motivo?: string | null;
    turnoPreferido?: string | null;
    bairro?: string | null;
    origemCanal: CanalOrigem;
  }): Promise<PedidoCursoRecord> {
    const pedido: PedidoCursoRecord = {
      id: crypto.randomUUID(),
      candidatoId: input.candidatoId,
      cursoId: input.cursoId ?? null,
      temaDesejado: input.temaDesejado.trim(),
      temaNormalizado: normalizarTexto(input.temaDesejado),
      motivo: input.motivo ?? null,
      turnoPreferido: input.turnoPreferido ?? null,
      bairro: input.bairro ?? null,
      origemCanal: input.origemCanal,
      status: 'REGISTRADO',
      criadoEm: new Date().toISOString(),
    };
    farolMemoryStore.pedidosCursos.unshift(pedido);
    return pedido;
  }

  // --------------------------------------------------------------------------
  // PAINEL SEMISPE & INDICADORES
  // --------------------------------------------------------------------------

  async obterDashboardSemispe() {
    const rankingMap = new Map<string, { tema: string; total: number; bairros: Set<string> }>();
    for (const p of farolMemoryStore.pedidosCursos) {
      const atual = rankingMap.get(p.temaNormalizado) ?? {
        tema: p.temaDesejado,
        total: 0,
        bairros: new Set<string>(),
      };
      atual.total += 1;
      if (p.bairro) atual.bairros.add(p.bairro);
      rankingMap.set(p.temaNormalizado, atual);
    }

    const rankingPedidos = Array.from(rankingMap.values())
      .map((item) => ({
        tema: item.tema,
        totalPedidos: item.total,
        bairros: Array.from(item.bairros),
      }))
      .sort((a, b) => b.totalPedidos - a.totalPedidos);

    return {
      totais: {
        candidatos: farolMemoryStore.candidatos.length,
        empresas: farolMemoryStore.empresas.length,
        vagasAtivas: farolMemoryStore.vagas.filter((v) => v.status === 'PUBLICADA').length,
        candidaturas: farolMemoryStore.candidaturas.length,
        cursos: farolMemoryStore.cursos.length,
        pedidosCurso: farolMemoryStore.pedidosCursos.length,
        atendimentosHumanosPendentes: farolMemoryStore.conversasWhatsApp.filter(
          (c) => c.atendimentoHumano
        ).length,
      },
      rankingPedidos,
    };
  }

  // --------------------------------------------------------------------------
  // CONVERSA WHATSAPP (IA FAROL)
  // --------------------------------------------------------------------------

  async obterOuCriarConversaWhatsApp(telefone: string): Promise<ConversaWhatsAppRecord> {
    let conv = farolMemoryStore.conversasWhatsApp.find((c) => c.telefone === telefone);
    if (!conv) {
      const usuario = farolMemoryStore.usuarios.find((u) => u.telefoneWhatsapp === telefone);
      const candidato = usuario
        ? farolMemoryStore.candidatos.find((c) => c.usuarioId === usuario.id)
        : undefined;

      conv = {
        id: crypto.randomUUID(),
        telefone,
        candidatoId: candidato?.id ?? null,
        estadoAtual: candidato?.consentimentoLgpd ? 'MATCH' : 'NOVO',
        contextoJson: {},
        atendimentoHumano: false,
        ultimaInteracaoEm: new Date().toISOString(),
      };
      farolMemoryStore.conversasWhatsApp.push(conv);
    }
    return conv;
  }

  async atualizarEstadoConversaWhatsApp(
    telefone: string,
    estadoAtual: EstadoConversaIA,
    contextoPatch?: Record<string, unknown>,
    atendimentoHumano?: boolean
  ): Promise<ConversaWhatsAppRecord> {
    const conv = await this.obterOuCriarConversaWhatsApp(telefone);
    conv.estadoAtual = estadoAtual;
    if (contextoPatch) {
      conv.contextoJson = { ...conv.contextoJson, ...contextoPatch };
    }
    if (typeof atendimentoHumano === 'boolean') {
      conv.atendimentoHumano = atendimentoHumano;
    }
    conv.ultimaInteracaoEm = new Date().toISOString();
    return conv;
  }
}

export const farolService = new FarolService();
