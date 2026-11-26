import crypto from 'crypto';
import { isSupabaseConfigured } from '@/server/config/env';
import { calcularCompatibilidade, normalizarTexto } from '@/server/domain/matching/MatchEngine';
import {
  AcessoNegadoError,
  RecursoNaoEncontradoError,
  RegraNegocioError,
  ValidacaoError,
} from '@/server/domain/errors/DomainError';
import {
  gerarVariacoesTelefoneWhatsApp,
  normalizarTelefoneWhatsApp,
} from '@/server/domain/ai/Guardrails';
import {
  aplicarEdicaoCurriculoPadrao,
  type CurriculoArquivoMetadata,
  type CurriculoArquivoRecord,
  type CurriculoPadraoData,
  montarCurriculoDeCandidato,
  sanitizarCurriculoPadrao,
} from '@/server/domain/curriculo/CurriculoPadrao';
import { gerarCurriculoPadraoPdf } from '@/server/domain/curriculo/CurriculoPdfGenerator';
import { normalizarContatoBoletim } from '@/server/domain/boletim/contatoBoletim';
import { hojeEmSaoLuis } from '@/lib/datasSaoLuis';
import {
  farolMemoryStore,
  type CandidatoRecord,
  type CandidaturaRecord,
  type ConversaWhatsAppRecord,
  type CursoRecord,
  type EditalRecord,
  type EventoRecord,
  type InscricaoCursoRecord,
  type MensagemWhatsAppRecord,
  type PedidoCursoRecord,
  type VagaRecord,
} from '@/server/infrastructure/repositories/FarolDataStore';
import { supabaseFarolRepo } from '@/server/infrastructure/repositories/SupabaseFarolRepository';
import { assinarTokenSessao, hashSenha, verificarSenha } from '@/server/infrastructure/auth/jwt';
import type {
  CanalOrigem,
  EstadoConversaIA,
  ModalidadeTrabalho,
  NivelEscolaridade,
  RequisitoVaga,
  ResultadoMatch,
  StatusCandidatura,
  TipoContatoBoletim,
  TipoContratacao,
  TipoCurso,
  UsuarioSessao,
} from '@/types/farol';

export class FarolService {
  private usarSupabase(): boolean {
    return isSupabaseConfigured();
  }

  // --------------------------------------------------------------------------
  // AUTENTICAÇÃO
  // --------------------------------------------------------------------------

  async autenticar(email: string, senha: string): Promise<{ token: string; sessao: UsuarioSessao }> {
    const emailNorm = email.trim().toLowerCase();

    if (this.usarSupabase()) {
      const encontrado = await supabaseFarolRepo.buscarUsuarioPorEmail(emailNorm);
      if (!encontrado || !encontrado.usuario.senhaHash) {
        throw new RegraNegocioError('E-mail ou senha inválidos.');
      }

      const senhaOk = await verificarSenha(senha, encontrado.usuario.senhaHash);
      if (!senhaOk) {
        throw new RegraNegocioError('E-mail ou senha inválidos.');
      }

      const sessao: UsuarioSessao = {
        id: encontrado.usuario.id,
        email: encontrado.usuario.email,
        papel: encontrado.usuario.papel,
        nome: encontrado.nome,
        candidatoId: encontrado.candidatoId,
        empresaId: encontrado.empresaId,
        whatsappVerificado: encontrado.usuario.whatsappVerificado,
      };
      return { token: assinarTokenSessao(sessao), sessao };
    }

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
      nome: candidato?.nomeExibicao ?? empresa?.nomeFantasia ?? 'Equipe SEMISPE',
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
    const senhaHash = await hashSenha(input.senha);

    if (this.usarSupabase()) {
      const { usuarioId, candidatoId, nomeExibicao } = await supabaseFarolRepo.criarCandidato({
        ...input,
        senhaHash,
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

    if (farolMemoryStore.usuarios.some((u) => u.email?.toLowerCase() === emailNorm)) {
      throw new RegraNegocioError('Este e-mail já está cadastrado.');
    }

    const telefoneNorm = input.telefoneWhatsapp
      ? normalizarTelefoneWhatsApp(input.telefoneWhatsapp)
      : null;
    const nomeExibicao = input.nomeCompleto.trim().split(/\s+/).slice(0, 2).join(' ');

    if (telefoneNorm) {
      const variacoes = gerarVariacoesTelefoneWhatsApp(telefoneNorm);
      const usuarioWa = farolMemoryStore.usuarios.find(
        (u) => !u.email && u.telefoneWhatsapp && variacoes.includes(u.telefoneWhatsapp)
      );
      if (usuarioWa) {
        usuarioWa.email = emailNorm;
        usuarioWa.senhaHash = senhaHash;
        usuarioWa.telefoneWhatsapp = telefoneNorm;

        let candWa = farolMemoryStore.candidatos.find((c) => c.usuarioId === usuarioWa.id);
        if (candWa) {
          candWa.nomeCompleto = input.nomeCompleto.trim();
          candWa.nomeExibicao = nomeExibicao;
          candWa.bairro = input.bairro.trim();
        } else {
          candWa = {
            id: crypto.randomUUID(),
            usuarioId: usuarioWa.id,
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
          };
          farolMemoryStore.candidatos.push(candWa);
        }

        const sessao: UsuarioSessao = {
          id: usuarioWa.id,
          email: emailNorm,
          papel: 'CANDIDATO',
          nome: nomeExibicao,
          candidatoId: candWa.id,
          whatsappVerificado: usuarioWa.whatsappVerificado,
        };
        return { token: assinarTokenSessao(sessao), sessao };
      }
    }

    const usuarioId = crypto.randomUUID();
    const candidatoId = crypto.randomUUID();

    farolMemoryStore.usuarios.push({
      id: usuarioId,
      email: emailNorm,
      senhaHash,
      papel: 'CANDIDATO',
      telefoneWhatsapp: telefoneNorm || null,
      whatsappVerificado: false,
      ativo: true,
    });

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
    const cnpjLimpo = input.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      throw new RegraNegocioError('CNPJ inválido. Informe os 14 dígitos do CNPJ ativo ou MEI.');
    }

    const emailNorm = input.email.trim().toLowerCase();
    const senhaHash = await hashSenha(input.senha);

    if (this.usarSupabase()) {
      const { usuarioId, empresaId, nomeFantasia } = await supabaseFarolRepo.criarEmpresa({
        ...input,
        senhaHash,
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

    if (farolMemoryStore.usuarios.some((u) => u.email?.toLowerCase() === emailNorm)) {
      throw new RegraNegocioError('Este e-mail já está cadastrado.');
    }

    const usuarioId = crypto.randomUUID();
    const empresaId = crypto.randomUUID();

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
    if (this.usarSupabase()) {
      return supabaseFarolRepo.listarVagasPublicas(filtros);
    }

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
    if (this.usarSupabase()) {
      return supabaseFarolRepo.obterVagaPorId(vagaId);
    }

    const vaga = farolMemoryStore.vagas.find((v) => v.id === vagaId);
    if (!vaga) throw new RecursoNaoEncontradoError('Vaga não encontrada.');
    return vaga;
  }

  async calcularMatchParaCandidato(candidatoId: string, vagaId: string): Promise<ResultadoMatch> {
    const candidato = await this.obterCandidato(candidatoId);
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
    const candidato = await this.obterCandidato(candidatoId);
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

    const match = await this.calcularMatchParaCandidato(input.candidatoId, input.vagaId);

    if (this.usarSupabase()) {
      return supabaseFarolRepo.criarCandidatura({
        ...input,
        match,
      });
    }

    const jaExiste = farolMemoryStore.candidaturas.find(
      (c) => c.vagaId === input.vagaId && c.candidatoId === input.candidatoId
    );
    if (jaExiste) {
      throw new RegraNegocioError('Você já se candidatou a esta oportunidade.');
    }

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
    if (this.usarSupabase()) {
      return supabaseFarolRepo.listarCandidaturasDoCandidato(candidatoId);
    }

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
    if (this.usarSupabase()) {
      return supabaseFarolRepo.obterCandidato(candidatoId);
    }

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
    if (this.usarSupabase()) {
      return supabaseFarolRepo.atualizarCurriculoCandidato(candidatoId, dados);
    }

    const cand = await this.obterCandidato(candidatoId);
    Object.assign(cand, dados);
    return cand;
  }

  // --------------------------------------------------------------------------
  // EMPRESA (REGRA: NUNCA EXPÕE SCORE DO CANDIDATO)
  // --------------------------------------------------------------------------

  async listarVagasDaEmpresa(empresaId: string): Promise<VagaRecord[]> {
    if (this.usarSupabase()) {
      return supabaseFarolRepo.listarVagasDaEmpresa(empresaId);
    }
    return farolMemoryStore.vagas.filter((v) => v.empresaId === empresaId);
  }

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
      imagemCapaUrl?: string | null;
      requisitos: RequisitoVaga[];
    }
  ): Promise<VagaRecord> {
    if (this.usarSupabase()) {
      return supabaseFarolRepo.publicarVagaEmpresa(empresaId, input);
    }

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
      imagemCapaUrl: input.imagemCapaUrl ?? null,
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

    if (this.usarSupabase()) {
      return supabaseFarolRepo.listarCandidatosDaVagaParaEmpresa(vagaId);
    }

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
    if (this.usarSupabase()) {
      return supabaseFarolRepo.buscarProfissionaisServicos(filtros);
    }

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
    if (this.usarSupabase()) {
      return supabaseFarolRepo.listarCursos(tipo);
    }

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
      const hits = termos.filter(
        (t) => textoCurso.includes(t) || t.includes(normalizarTexto(curso.area))
      ).length;
      return { curso, hits };
    });

    pontuados.sort((a, b) => b.hits - a.hits);
    return pontuados
      .filter((p) => p.hits > 0)
      .slice(0, limit)
      .map((p) => p.curso);
  }

  async solicitarInscricaoCurso(input: {
    candidatoId: string;
    turmaId: string;
    origemCanal: CanalOrigem;
  }): Promise<InscricaoCursoRecord> {
    if (this.usarSupabase()) {
      return supabaseFarolRepo.solicitarInscricaoCurso(input);
    }

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
    if (this.usarSupabase()) {
      return supabaseFarolRepo.registrarPedidoCurso(input);
    }

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
  // EDITAIS, EVENTOS E BOLETIM
  // --------------------------------------------------------------------------

  /** Editais publicados com inscrições abertas hoje (horário de São Luís) ou em fluxo contínuo. */
  async listarEditaisAbertos(): Promise<EditalRecord[]> {
    const hoje = hojeEmSaoLuis();
    if (this.usarSupabase()) {
      return supabaseFarolRepo.listarEditaisAbertos(hoje);
    }

    return farolMemoryStore.editais
      .filter((e) => e.publicado && (!e.inscricoesAte || e.inscricoesAte >= hoje))
      .sort((a, b) => {
        if (a.inscricoesAte && b.inscricoesAte) return a.inscricoesAte.localeCompare(b.inscricoesAte);
        if (a.inscricoesAte) return -1;
        if (b.inscricoesAte) return 1;
        return a.titulo.localeCompare(b.titulo, 'pt-BR');
      });
  }

  /** Eventos publicados que ainda não terminaram, do mais próximo ao mais distante. */
  async listarProximosEventos(): Promise<EventoRecord[]> {
    const agora = new Date().toISOString();
    if (this.usarSupabase()) {
      return supabaseFarolRepo.listarProximosEventos(agora);
    }

    return farolMemoryStore.eventos
      .filter((e) => e.publicado && (e.fim ?? e.inicio) >= agora)
      .sort((a, b) => a.inicio.localeCompare(b.inicio));
  }

  /**
   * Inscreve um e-mail ou WhatsApp no boletim. Idempotente: um contato já inscrito
   * não é duplicado, e uma inscrição desativada é reativada com novo consentimento.
   */
  async inscreverNoBoletim(input: {
    contato: string;
    origemCanal: CanalOrigem;
  }): Promise<{ tipoContato: TipoContatoBoletim; jaInscrito: boolean }> {
    const normalizado = normalizarContatoBoletim(input.contato);
    if (!normalizado) {
      throw new ValidacaoError('Informe um e-mail válido ou um WhatsApp com DDD.');
    }

    if (this.usarSupabase()) {
      const existente = await supabaseFarolRepo.buscarInscricaoBoletim(normalizado.contato);
      if (existente?.ativo) return { tipoContato: existente.tipoContato, jaInscrito: true };
      if (existente) {
        await supabaseFarolRepo.reativarInscricaoBoletim(existente.id, input.origemCanal);
        return { tipoContato: existente.tipoContato, jaInscrito: false };
      }
      const { duplicada } = await supabaseFarolRepo.criarInscricaoBoletim({
        contato: normalizado.contato,
        tipoContato: normalizado.tipo,
        origemCanal: input.origemCanal,
      });
      return { tipoContato: normalizado.tipo, jaInscrito: duplicada };
    }

    const agora = new Date().toISOString();
    const existente = farolMemoryStore.inscricoesBoletim.find((i) => i.contato === normalizado.contato);
    if (existente?.ativo) return { tipoContato: existente.tipoContato, jaInscrito: true };
    if (existente) {
      Object.assign(existente, {
        ativo: true,
        consentimentoLgpd: true,
        consentimentoEm: agora,
        origemCanal: input.origemCanal,
      });
      return { tipoContato: existente.tipoContato, jaInscrito: false };
    }

    farolMemoryStore.inscricoesBoletim.push({
      id: crypto.randomUUID(),
      contato: normalizado.contato,
      tipoContato: normalizado.tipo,
      consentimentoLgpd: true,
      consentimentoEm: agora,
      origemCanal: input.origemCanal,
      ativo: true,
      criadoEm: agora,
    });
    return { tipoContato: normalizado.tipo, jaInscrito: false };
  }

  // --------------------------------------------------------------------------
  // PAINEL SEMISPE & INDICADORES
  // --------------------------------------------------------------------------

  async obterDashboardSemispe() {
    if (this.usarSupabase()) {
      return supabaseFarolRepo.obterDashboardSemispe();
    }

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
  // CONVERSA WHATSAPP (IA FAROL) & CURRÍCULO PADRÃO
  // --------------------------------------------------------------------------

  async buscarCandidatoPorTelefone(telefone: string): Promise<{
    candidato: CandidatoRecord;
    email: string | null;
    telefoneWhatsapp: string | null;
  } | null> {
    if (this.usarSupabase()) {
      return supabaseFarolRepo.buscarCandidatoPorTelefone(telefone);
    }

    const variacoes = gerarVariacoesTelefoneWhatsApp(telefone);
    if (variacoes.length === 0) return null;

    const usuario = farolMemoryStore.usuarios.find(
      (u) => u.telefoneWhatsapp && variacoes.includes(u.telefoneWhatsapp)
    );
    if (!usuario) return null;

    const candidato = farolMemoryStore.candidatos.find((c) => c.usuarioId === usuario.id);
    if (!candidato) return null;

    return {
      candidato,
      email: usuario.email,
      telefoneWhatsapp: usuario.telefoneWhatsapp,
    };
  }

  async garantirCandidatoPorWhatsApp(input: {
    telefone: string;
    dados: CurriculoPadraoData;
  }): Promise<CandidatoRecord> {
    if (this.usarSupabase()) {
      return supabaseFarolRepo.garantirCandidatoPorWhatsApp(input);
    }

    const telefoneNorm = normalizarTelefoneWhatsApp(input.telefone);
    const dadosLimpos = sanitizarCurriculoPadrao(input.dados);
    const existente = await this.buscarCandidatoPorTelefone(telefoneNorm);

    const nomeCompleto = dadosLimpos.nomeCompleto || existente?.candidato.nomeCompleto || 'Cidadão FAROL';
    const nomeExibicao = nomeCompleto.trim().split(/\s+/).slice(0, 2).join(' ');
    const bairro = dadosLimpos.bairro || existente?.candidato.bairro || 'São Luís';

    const experienciasMapped = dadosLimpos.experiencias.map((exp, idx) => ({
      id: `exp-${idx + 1}`,
      cargoAtividade: exp.cargo,
      empresaOuContexto: exp.empresa ?? null,
      trabalhoInformal: Boolean(exp.trabalhoInformal),
      periodo: [exp.periodo, exp.descricao].filter(Boolean).join(' — ') || null,
    }));

    if (existente) {
      return this.atualizarCurriculoCandidato(existente.candidato.id, {
        nomeCompleto,
        nomeExibicao,
        bairro,
        escolaridade: dadosLimpos.escolaridade ?? null,
        areaInteresse: dadosLimpos.areaInteresse ?? null,
        objetivo: dadosLimpos.objetivo ?? null,
        resumoProfissional: dadosLimpos.resumoProfissional ?? null,
        disponibilidade: dadosLimpos.disponibilidade ?? null,
        competencias: dadosLimpos.competencias,
        experiencias: experienciasMapped,
      });
    }

    const usuarioId = crypto.randomUUID();
    const candidatoId = crypto.randomUUID();

    farolMemoryStore.usuarios.push({
      id: usuarioId,
      email: null,
      senhaHash: null,
      papel: 'CANDIDATO',
      telefoneWhatsapp: telefoneNorm,
      whatsappVerificado: true,
      ativo: true,
    });

    const novoCandidato: CandidatoRecord = {
      id: candidatoId,
      usuarioId,
      nomeCompleto,
      nomeExibicao,
      bairro,
      municipio: dadosLimpos.municipio || 'São Luís',
      escolaridade: dadosLimpos.escolaridade ?? null,
      areaInteresse: dadosLimpos.areaInteresse ?? null,
      objetivo: dadosLimpos.objetivo ?? null,
      resumoProfissional: dadosLimpos.resumoProfissional ?? null,
      disponibilidade: dadosLimpos.disponibilidade ?? null,
      consentimentoLgpd: true,
      consentimentoEm: new Date().toISOString(),
      visivelServicos: false,
      categoriaServicos: null,
      competencias: dadosLimpos.competencias,
      experiencias: experienciasMapped,
    };

    farolMemoryStore.candidatos.push(novoCandidato);
    return novoCandidato;
  }

  async salvarCurriculoArquivo(input: {
    candidatoId: string;
    origem: 'UPLOAD_PDF' | 'UPLOAD_IMAGEM' | 'GERADO_SISTEMA';
    nomeArquivo: string;
    mimeType: string;
    arquivoBase64: string;
    dadosExtraidosJson: Record<string, unknown> | null;
    confirmadoUsuario: boolean;
  }): Promise<CurriculoArquivoRecord> {
    if (this.usarSupabase()) {
      return supabaseFarolRepo.salvarCurriculoArquivo(input);
    }

    const id = crypto.randomUUID();
    const arquivoUrl = `/api/candidato/curriculo/arquivos/${id}/download`;
    const record: CurriculoArquivoRecord = {
      id,
      candidatoId: input.candidatoId,
      origem: input.origem,
      arquivoUrl,
      nomeArquivo: input.nomeArquivo,
      mimeType: input.mimeType,
      arquivoBase64: input.arquivoBase64,
      dadosExtraidosJson: input.dadosExtraidosJson,
      confirmadoUsuario: input.confirmadoUsuario,
      criadoEm: new Date().toISOString(),
    };
    farolMemoryStore.curriculosArquivos.unshift(record);
    return record;
  }

  async listarCurriculosArquivosDoCandidato(candidatoId: string): Promise<CurriculoArquivoMetadata[]> {
    if (this.usarSupabase()) {
      return supabaseFarolRepo.listarCurriculosArquivosDoCandidato(candidatoId);
    }

    return farolMemoryStore.curriculosArquivos
      .filter((a) => a.candidatoId === candidatoId)
      .map(({ arquivoBase64: _omit, ...meta }) => meta);
  }

  async obterCurriculoArquivoPorId(arquivoId: string): Promise<CurriculoArquivoRecord | null> {
    if (this.usarSupabase()) {
      return supabaseFarolRepo.obterCurriculoArquivoPorId(arquivoId);
    }
    return farolMemoryStore.curriculosArquivos.find((a) => a.id === arquivoId) ?? null;
  }

  async gerarEAnexarCurriculoPadrao(input: {
    candidatoId?: string | null;
    telefone?: string | null;
    dados?: Partial<CurriculoPadraoData>;
    substituirPerfilCompleto?: boolean;
    origemCanal: CanalOrigem;
  }): Promise<{
    candidato: CandidatoRecord;
    arquivo: CurriculoArquivoRecord;
    pdfBase64: string;
    fileName: string;
    dadosFinais: CurriculoPadraoData;
  }> {
    let candidatoExistente: CandidatoRecord | null = null;
    let contato: { telefone?: string | null; email?: string | null } = {
      telefone: input.telefone ?? null,
    };

    if (input.candidatoId) {
      candidatoExistente = await this.obterCandidato(input.candidatoId);
      if (!this.usarSupabase()) {
        const usuario = farolMemoryStore.usuarios.find(
          (u) => u.id === candidatoExistente?.usuarioId
        );
        contato = {
          telefone: usuario?.telefoneWhatsapp ?? input.telefone ?? null,
          email: usuario?.email ?? null,
        };
      }
    } else if (input.telefone) {
      const encontrado = await this.buscarCandidatoPorTelefone(input.telefone);
      if (encontrado) {
        candidatoExistente = encontrado.candidato;
        contato = {
          telefone: encontrado.telefoneWhatsapp ?? input.telefone,
          email: encontrado.email,
        };
      }
    }

    const base = candidatoExistente ? montarCurriculoDeCandidato(candidatoExistente, contato) : {};
    const dadosFinais = input.substituirPerfilCompleto && input.dados
      ? sanitizarCurriculoPadrao({
          ...input.dados,
          telefoneWhatsApp: input.dados.telefoneWhatsApp || contato.telefone || undefined,
          email: input.dados.email || contato.email || undefined,
        })
      : aplicarEdicaoCurriculoPadrao(base, {
          ...(input.dados ?? {}),
          ...(contato.telefone ? { telefoneWhatsApp: contato.telefone } : {}),
          ...(contato.email ? { email: contato.email } : {}),
        });

    if (!dadosFinais.nomeCompleto) {
      throw new ValidacaoError('Informe o nome completo para gerar o currículo padrão.');
    }

    let candidato: CandidatoRecord;
    if (candidatoExistente) {
      const experienciasMapped = dadosFinais.experiencias.map((exp, idx) => ({
        id: `exp-${idx + 1}`,
        cargoAtividade: exp.cargo,
        empresaOuContexto: exp.empresa ?? null,
        trabalhoInformal: Boolean(exp.trabalhoInformal),
        periodo: [exp.periodo, exp.descricao].filter(Boolean).join(' — ') || null,
      }));
      candidato = await this.atualizarCurriculoCandidato(candidatoExistente.id, {
        nomeCompleto: dadosFinais.nomeCompleto,
        nomeExibicao: dadosFinais.nomeCompleto.split(/\s+/).slice(0, 2).join(' '),
        bairro: dadosFinais.bairro || candidatoExistente.bairro,
        escolaridade: dadosFinais.escolaridade ?? null,
        areaInteresse: dadosFinais.areaInteresse ?? null,
        objetivo: dadosFinais.objetivo ?? null,
        resumoProfissional: dadosFinais.resumoProfissional ?? null,
        disponibilidade: dadosFinais.disponibilidade ?? null,
        competencias: dadosFinais.competencias,
        experiencias: experienciasMapped,
      });
    } else if (input.telefone) {
      candidato = await this.garantirCandidatoPorWhatsApp({
        telefone: input.telefone,
        dados: dadosFinais,
      });
    } else {
      throw new ValidacaoError('Candidato ou telefone é obrigatório para gerar currículo.');
    }

    const pdf = gerarCurriculoPadraoPdf(dadosFinais);
    const arquivo = await this.salvarCurriculoArquivo({
      candidatoId: candidato.id,
      origem: 'GERADO_SISTEMA',
      nomeArquivo: pdf.fileName,
      mimeType: pdf.mimeType,
      arquivoBase64: pdf.base64,
      dadosExtraidosJson: {
        ...dadosFinais,
        canalOrigem: input.origemCanal,
        geradoEm: new Date().toISOString(),
      },
      confirmadoUsuario: true,
    });

    return {
      candidato,
      arquivo,
      pdfBase64: pdf.base64,
      fileName: pdf.fileName,
      dadosFinais,
    };
  }

  async obterOuCriarConversaWhatsApp(
    telefone: string,
    meta?: { remoteJid?: string; pushName?: string }
  ): Promise<ConversaWhatsAppRecord> {
    const telefoneNorm = normalizarTelefoneWhatsApp(telefone);
    if (this.usarSupabase()) {
      return supabaseFarolRepo.obterOuCriarConversaWhatsApp(telefoneNorm, meta);
    }

    let conv = farolMemoryStore.conversasWhatsApp.find((c) => c.telefone === telefoneNorm);
    if (!conv) {
      const variacoes = gerarVariacoesTelefoneWhatsApp(telefoneNorm);
      const usuario = farolMemoryStore.usuarios.find(
        (u) => u.telefoneWhatsapp && variacoes.includes(u.telefoneWhatsapp)
      );
      const candidato = usuario
        ? farolMemoryStore.candidatos.find((c) => c.usuarioId === usuario.id)
        : undefined;

      conv = {
        id: crypto.randomUUID(),
        telefone: telefoneNorm,
        remoteJid: meta?.remoteJid ?? null,
        pushName: meta?.pushName ?? null,
        candidatoId: candidato?.id ?? null,
        estadoAtual: candidato?.consentimentoLgpd ? 'MATCH' : 'NOVO',
        contextoJson: {},
        atendimentoHumano: false,
        botPausedUntil: null,
        topicoAtual: null,
        turnosSessao: 0,
        ultimaInteracaoEm: new Date().toISOString(),
      };
      farolMemoryStore.conversasWhatsApp.push(conv);
    } else {
      if (meta?.remoteJid) conv.remoteJid = meta.remoteJid;
      if (meta?.pushName) conv.pushName = meta.pushName;
      if (conv.botPausedUntil && new Date(conv.botPausedUntil).getTime() <= Date.now()) {
        conv.botPausedUntil = null;
        conv.atendimentoHumano = false;
      }
      if (!conv.candidatoId) {
        const encontrado = await this.buscarCandidatoPorTelefone(telefoneNorm);
        if (encontrado?.candidato.id) conv.candidatoId = encontrado.candidato.id;
      }
    }
    return conv;
  }

  async atualizarEstadoConversaWhatsApp(
    telefone: string,
    estadoAtual: EstadoConversaIA,
    contextoPatch?: Record<string, unknown>,
    atendimentoHumano?: boolean
  ): Promise<ConversaWhatsAppRecord> {
    const telefoneNorm = normalizarTelefoneWhatsApp(telefone);
    if (this.usarSupabase()) {
      return supabaseFarolRepo.atualizarEstadoConversaWhatsApp(
        telefoneNorm,
        estadoAtual,
        contextoPatch,
        atendimentoHumano
      );
    }

    const conv = await this.obterOuCriarConversaWhatsApp(telefoneNorm);
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

  async mensagemWhatsAppJaProcessada(evolutionMessageId: string): Promise<boolean> {
    if (!evolutionMessageId) return false;
    if (this.usarSupabase()) {
      return supabaseFarolRepo.mensagemWhatsAppJaProcessada(evolutionMessageId);
    }
    return farolMemoryStore.mensagensWhatsApp.some(
      (m) => m.evolutionMessageId === evolutionMessageId
    );
  }

  async salvarMensagemWhatsApp(input: {
    conversaId: string;
    direcao: 'ENTRADA' | 'SAIDA';
    tipoMidia: 'TEXTO' | 'AUDIO' | 'DOCUMENTO' | 'IMAGEM';
    conteudoTexto?: string | null;
    transcricaoAudio?: string | null;
    resumoMidia?: string | null;
    metadataJson?: Record<string, unknown>;
    evolutionMessageId?: string | null;
  }): Promise<boolean> {
    if (this.usarSupabase()) {
      return supabaseFarolRepo.salvarMensagemWhatsApp(input);
    }

    if (
      input.evolutionMessageId &&
      farolMemoryStore.mensagensWhatsApp.some((m) => m.evolutionMessageId === input.evolutionMessageId)
    ) {
      return false;
    }

    farolMemoryStore.mensagensWhatsApp.push({
      id: crypto.randomUUID(),
      conversaId: input.conversaId,
      direcao: input.direcao,
      tipoMidia: input.tipoMidia,
      conteudoTexto: input.conteudoTexto ?? null,
      transcricaoAudio: input.transcricaoAudio ?? null,
      resumoMidia: input.resumoMidia ?? null,
      metadataJson: input.metadataJson ?? {},
      evolutionMessageId: input.evolutionMessageId ?? null,
      criadoEm: new Date().toISOString(),
    });
    return true;
  }

  async listarHistoricoMensagensWhatsApp(
    conversaId: string,
    limite = 40,
    ttlMinutos = 10080
  ): Promise<MensagemWhatsAppRecord[]> {
    if (this.usarSupabase()) {
      return supabaseFarolRepo.listarHistoricoMensagensWhatsApp(conversaId, limite, ttlMinutos);
    }

    const cutoff = Date.now() - ttlMinutos * 60_000;
    return farolMemoryStore.mensagensWhatsApp
      .filter((m) => m.conversaId === conversaId && new Date(m.criadoEm).getTime() >= cutoff)
      .slice(-limite);
  }

  async pausarBotConversaWhatsApp(telefone: string, minutos: number): Promise<void> {
    const telefoneNorm = normalizarTelefoneWhatsApp(telefone);
    if (this.usarSupabase()) {
      return supabaseFarolRepo.pausarBotConversaWhatsApp(telefoneNorm, minutos);
    }

    const conv = await this.obterOuCriarConversaWhatsApp(telefoneNorm);
    conv.botPausedUntil = new Date(Date.now() + minutos * 60_000).toISOString();
    conv.atendimentoHumano = true;
    conv.estadoAtual = 'ATENDIMENTO_HUMANO';
    conv.ultimaInteracaoEm = new Date().toISOString();
  }

  async atualizarTopicoConversaWhatsApp(conversaId: string, topico: string | null): Promise<void> {
    if (this.usarSupabase()) {
      return supabaseFarolRepo.atualizarTopicoConversaWhatsApp(conversaId, topico);
    }
    const conv = farolMemoryStore.conversasWhatsApp.find((c) => c.id === conversaId);
    if (conv) conv.topicoAtual = topico;
  }

  async vincularCandidatoConversaWhatsApp(conversaId: string, candidatoId: string): Promise<void> {
    if (this.usarSupabase()) {
      return supabaseFarolRepo.vincularCandidatoConversaWhatsApp(conversaId, candidatoId);
    }
    const conv = farolMemoryStore.conversasWhatsApp.find((c) => c.id === conversaId);
    if (conv) conv.candidatoId = candidatoId;
  }

  async incrementarTurnoConversaWhatsApp(conversaId: string): Promise<void> {
    if (this.usarSupabase()) {
      return supabaseFarolRepo.incrementarTurnoConversaWhatsApp(conversaId);
    }
    const conv = farolMemoryStore.conversasWhatsApp.find((c) => c.id === conversaId);
    if (conv) {
      conv.turnosSessao = (conv.turnosSessao ?? 0) + 1;
      conv.ultimaInteracaoEm = new Date().toISOString();
    }
  }
}

export const farolService = new FarolService();
