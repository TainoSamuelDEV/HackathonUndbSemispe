import { getSupabaseAdmin } from '@/server/infrastructure/supabase/client';
import { normalizarTexto } from '@/server/domain/matching/MatchEngine';
import {
  RecursoNaoEncontradoError,
  RegraNegocioError,
} from '@/server/domain/errors/DomainError';
import type {
  CandidatoRecord,
  CandidaturaRecord,
  ConversaWhatsAppRecord,
  CursoRecord,
  InscricaoCursoRecord,
  PedidoCursoRecord,
  UsuarioRecord,
  VagaRecord,
} from '@/server/infrastructure/repositories/FarolDataStore';
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
} from '@/types/farol';

function mapVagaRow(row: any): VagaRecord {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    empresaNome: row.empresas?.nome_fantasia ?? row.empresas?.razao_social ?? 'Empresa Parceira',
    titulo: row.titulo,
    area: row.area,
    descricao: row.descricao,
    bairro: row.bairro,
    municipio: row.municipio,
    modalidade: row.modalidade,
    tipoContratacao: row.tipo_contratacao,
    quantidadeVagas: row.quantidade_vagas,
    salarioMin: row.salario_min !== null ? Number(row.salario_min) : null,
    salarioMax: row.salario_max !== null ? Number(row.salario_max) : null,
    escolaridadeMinima: row.escolaridade_minima,
    jornada: row.jornada,
    beneficios: Array.isArray(row.beneficios) ? row.beneficios : [],
    origemTipo: row.origem_tipo,
    origemUrl: row.origem_url,
    seloSimulado: Boolean(row.selo_simulado),
    status: row.status,
    publicadaEm: row.publicada_em ?? row.criado_em,
    encerraEm: row.encerra_em,
    requisitos: Array.isArray(row.vaga_requisitos)
      ? row.vaga_requisitos.map((r: any) => ({
          id: r.id,
          nome: r.nome,
          tipo: r.tipo,
          obrigatorio: Boolean(r.obrigatorio),
        }))
      : [],
  };
}

function mapCandidatoRow(row: any): CandidatoRecord {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    nomeCompleto: row.nome_completo,
    nomeExibicao: row.nome_exibicao ?? row.nome_completo,
    bairro: row.bairro,
    municipio: row.municipio,
    escolaridade: row.escolaridade,
    areaInteresse: row.area_interesse,
    objetivo: row.objetivo,
    resumoProfissional: row.resumo_profissional,
    disponibilidade: row.disponibilidade,
    consentimentoLgpd: Boolean(row.consentimento_lgpd),
    consentimentoEm: row.consentimento_em,
    visivelServicos: Boolean(row.visivel_servicos),
    categoriaServicos: row.categoria_servicos,
    competencias: Array.isArray(row.candidato_competencias)
      ? row.candidato_competencias.map((c: any) => c.nome)
      : [],
    experiencias: Array.isArray(row.experiencias_profissionais)
      ? row.experiencias_profissionais.map((e: any) => ({
          id: e.id,
          cargoAtividade: e.cargo_atividade,
          empresaOuContexto: e.empresa_ou_contexto,
          trabalhoInformal: Boolean(e.trabalho_informal),
          periodo: e.descricao ?? null,
        }))
      : [],
  };
}

export class SupabaseFarolRepository {
  private db() {
    return getSupabaseAdmin();
  }

  async buscarUsuarioPorEmail(email: string): Promise<{
    usuario: UsuarioRecord;
    nome: string;
    candidatoId?: string;
    empresaId?: string;
  } | null> {
    const { data, error } = await this.db()
      .from('usuarios')
      .select('*, candidatos(id, nome_exibicao, nome_completo), empresas(id, nome_fantasia, razao_social)')
      .ilike('email', email.trim())
      .eq('ativo', true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const cand = Array.isArray(data.candidatos) ? data.candidatos[0] : data.candidatos;
    const emp = Array.isArray(data.empresas) ? data.empresas[0] : data.empresas;

    return {
      usuario: {
        id: data.id,
        email: data.email,
        senhaHash: data.senha_hash,
        papel: data.papel,
        telefoneWhatsapp: data.telefone_whatsapp,
        whatsappVerificado: Boolean(data.whatsapp_verificado),
        ativo: Boolean(data.ativo),
      },
      nome: cand?.nome_exibicao ?? cand?.nome_completo ?? emp?.nome_fantasia ?? emp?.razao_social ?? 'Equipe SEMISPE',
      candidatoId: cand?.id,
      empresaId: emp?.id,
    };
  }

  async criarCandidato(input: {
    nomeCompleto: string;
    email: string;
    telefoneWhatsapp?: string;
    bairro: string;
    senhaHash: string;
  }): Promise<{ usuarioId: string; candidatoId: string; nomeExibicao: string }> {
    const emailNorm = input.email.trim().toLowerCase();
    const existente = await this.buscarUsuarioPorEmail(emailNorm);
    if (existente) throw new RegraNegocioError('Este e-mail já está cadastrado.');

    const { data: user, error: uErr } = await this.db()
      .from('usuarios')
      .insert({
        email: emailNorm,
        senha_hash: input.senhaHash,
        papel: 'CANDIDATO',
        telefone_whatsapp: input.telefoneWhatsapp || null,
        whatsapp_verificado: false,
      })
      .select('id')
      .single();

    if (uErr) throw new RegraNegocioError(uErr.message);

    const nomeExibicao = input.nomeCompleto.trim().split(/\s+/).slice(0, 2).join(' ');
    const { data: cand, error: cErr } = await this.db()
      .from('candidatos')
      .insert({
        usuario_id: user.id,
        nome_completo: input.nomeCompleto.trim(),
        nome_exibicao: nomeExibicao,
        bairro: input.bairro.trim(),
        consentimento_lgpd: true,
        consentimento_em: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (cErr) throw new RegraNegocioError(cErr.message);

    return { usuarioId: user.id, candidatoId: cand.id, nomeExibicao };
  }

  async criarEmpresa(input: {
    responsavelNome: string;
    email: string;
    cnpj: string;
    razaoSocial: string;
    nomeFantasia?: string;
    ehMei: boolean;
    setor: string;
    bairro: string;
    telefone: string;
    senhaHash: string;
  }): Promise<{ usuarioId: string; empresaId: string; nomeFantasia: string }> {
    const emailNorm = input.email.trim().toLowerCase();
    const existente = await this.buscarUsuarioPorEmail(emailNorm);
    if (existente) throw new RegraNegocioError('Este e-mail já está cadastrado.');

    const { data: user, error: uErr } = await this.db()
      .from('usuarios')
      .insert({
        email: emailNorm,
        senha_hash: input.senhaHash,
        papel: 'EMPRESA',
      })
      .select('id')
      .single();

    if (uErr) throw new RegraNegocioError(uErr.message);

    const nomeFantasia = input.nomeFantasia?.trim() || input.razaoSocial.trim();
    const { data: emp, error: eErr } = await this.db()
      .from('empresas')
      .insert({
        usuario_id: user.id,
        cnpj: input.cnpj.trim(),
        razao_social: input.razaoSocial.trim(),
        nome_fantasia: nomeFantasia,
        eh_mei: input.ehMei,
        setor: input.setor.trim(),
        bairro: input.bairro.trim(),
        telefone: input.telefone.trim(),
        responsavel_nome: input.responsavelNome.trim(),
        status_validacao: 'VERIFICADA',
      })
      .select('id')
      .single();

    if (eErr) throw new RegraNegocioError(eErr.message);
    return { usuarioId: user.id, empresaId: emp.id, nomeFantasia };
  }

  async listarVagasPublicas(filtros?: {
    busca?: string;
    bairro?: string;
    modalidade?: ModalidadeTrabalho;
    area?: string;
  }): Promise<VagaRecord[]> {
    let query = this.db()
      .from('vagas')
      .select('*, empresas(nome_fantasia, razao_social), vaga_requisitos(*)')
      .eq('status', 'PUBLICADA')
      .order('publicada_em', { ascending: false });

    if (filtros?.modalidade) {
      query = query.eq('modalidade', filtros.modalidade);
    }
    if (filtros?.bairro) {
      query = query.ilike('bairro', `%${filtros.bairro.trim()}%`);
    }
    if (filtros?.area) {
      query = query.ilike('area', `%${filtros.area.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let vagas = (data ?? []).map(mapVagaRow);
    if (filtros?.busca) {
      const q = normalizarTexto(filtros.busca);
      vagas = vagas.filter(
        (v) =>
          normalizarTexto(v.titulo).includes(q) ||
          normalizarTexto(v.descricao).includes(q) ||
          normalizarTexto(v.area).includes(q)
      );
    }
    return vagas;
  }

  async listarVagasDaEmpresa(empresaId: string): Promise<VagaRecord[]> {
    const { data, error } = await this.db()
      .from('vagas')
      .select('*, empresas(nome_fantasia, razao_social), vaga_requisitos(*)')
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapVagaRow);
  }

  async obterVagaPorId(vagaId: string): Promise<VagaRecord> {
    const { data, error } = await this.db()
      .from('vagas')
      .select('*, empresas(nome_fantasia, razao_social), vaga_requisitos(*)')
      .eq('id', vagaId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new RecursoNaoEncontradoError('Vaga não encontrada.');
    return mapVagaRow(data);
  }

  async obterCandidato(candidatoId: string): Promise<CandidatoRecord> {
    const { data, error } = await this.db()
      .from('candidatos')
      .select('*, candidato_competencias(*), experiencias_profissionais(*)')
      .eq('id', candidatoId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new RecursoNaoEncontradoError('Perfil de candidato não encontrado.');
    return mapCandidatoRow(data);
  }

  async atualizarCurriculoCandidato(
    candidatoId: string,
    dados: Partial<CandidatoRecord>
  ): Promise<CandidatoRecord> {
    const updatePayload: Record<string, unknown> = {};
    if (dados.nomeCompleto !== undefined) updatePayload.nome_completo = dados.nomeCompleto;
    if (dados.nomeExibicao !== undefined) updatePayload.nome_exibicao = dados.nomeExibicao;
    if (dados.bairro !== undefined) updatePayload.bairro = dados.bairro;
    if (dados.escolaridade !== undefined) updatePayload.escolaridade = dados.escolaridade;
    if (dados.areaInteresse !== undefined) updatePayload.area_interesse = dados.areaInteresse;
    if (dados.objetivo !== undefined) updatePayload.objetivo = dados.objetivo;
    if (dados.resumoProfissional !== undefined) updatePayload.resumo_profissional = dados.resumoProfissional;
    if (dados.disponibilidade !== undefined) updatePayload.disponibilidade = dados.disponibilidade;
    if (dados.visivelServicos !== undefined) updatePayload.visivel_servicos = dados.visivelServicos;
    if (dados.categoriaServicos !== undefined) updatePayload.categoria_servicos = dados.categoriaServicos;

    if (Object.keys(updatePayload).length > 0) {
      const { error } = await this.db()
        .from('candidatos')
        .update(updatePayload)
        .eq('id', candidatoId);
      if (error) throw new Error(error.message);
    }

    if (dados.competencias !== undefined) {
      await this.db().from('candidato_competencias').delete().eq('candidato_id', candidatoId);
      const unicas = Array.from(
        new Map(
          dados.competencias
            .map((c) => c.trim())
            .filter(Boolean)
            .map((c) => [normalizarTexto(c), c])
        ).entries()
      );

      if (unicas.length > 0) {
        const { error: compErr } = await this.db()
          .from('candidato_competencias')
          .insert(
            unicas.map(([nomeNormalizado, nome]) => ({
              candidato_id: candidatoId,
              nome,
              nome_normalizado: nomeNormalizado,
              tipo: 'CONHECIMENTO',
            }))
          );
        if (compErr) throw new Error(compErr.message);
      }
    }

    return this.obterCandidato(candidatoId);
  }

  async criarCandidatura(input: {
    candidatoId: string;
    vagaId: string;
    origemCanal: CanalOrigem;
    match: ResultadoMatch;
  }): Promise<CandidaturaRecord> {
    const { data: existente } = await this.db()
      .from('candidaturas')
      .select('id')
      .eq('vaga_id', input.vagaId)
      .eq('candidato_id', input.candidatoId)
      .maybeSingle();

    if (existente) {
      throw new RegraNegocioError('Você já se candidatou a esta oportunidade.');
    }

    const { data, error } = await this.db()
      .from('candidaturas')
      .insert({
        vaga_id: input.vagaId,
        candidato_id: input.candidatoId,
        origem_canal: input.origemCanal,
        status: 'INSCRITO',
        score_calculado: input.match.percentual,
        detalhes_match_json: input.match,
      })
      .select('*')
      .single();

    if (error) throw new RegraNegocioError(error.message);

    const { data: evento } = await this.db()
      .from('candidatura_eventos')
      .insert({
        candidatura_id: data.id,
        status_anterior: null,
        status_novo: 'INSCRITO',
        observacao: `Candidatura registrada via ${input.origemCanal}.`,
      })
      .select('*')
      .single();

    return {
      id: data.id,
      vagaId: data.vaga_id,
      candidatoId: data.candidato_id,
      origemCanal: data.origem_canal,
      status: data.status,
      scoreCalculado: data.score_calculado,
      detalhesMatch: data.detalhes_match_json,
      criadoEm: data.criado_em,
      atualizadoEm: data.atualizado_em,
      eventos: evento
        ? [
            {
              id: evento.id,
              statusAnterior: evento.status_anterior,
              statusNovo: evento.status_novo,
              observacao: evento.observacao,
              criadoEm: evento.criado_em,
            },
          ]
        : [],
    };
  }

  async listarCandidaturasDoCandidato(candidatoId: string) {
    const { data, error } = await this.db()
      .from('candidaturas')
      .select('*, vagas(*, empresas(nome_fantasia, razao_social)), candidatura_eventos(*)')
      .eq('candidato_id', candidatoId)
      .order('criado_em', { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
      id: row.id,
      vagaId: row.vaga_id,
      candidatoId: row.candidato_id,
      origemCanal: row.origem_canal as CanalOrigem,
      status: row.status as StatusCandidatura,
      scoreCalculado: row.score_calculado,
      detalhesMatch: row.detalhes_match_json,
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em,
      vaga: row.vagas ? mapVagaRow(row.vagas) : null,
      eventos: (row.candidatura_eventos ?? []).map((e: any) => ({
        id: e.id,
        statusAnterior: e.status_anterior,
        statusNovo: e.status_novo,
        observacao: e.observacao,
        criadoEm: e.criado_em,
      })),
    }));
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
      requisitos: RequisitoVaga[];
    }
  ): Promise<VagaRecord> {
    const { data: vagaRow, error } = await this.db()
      .from('vagas')
      .insert({
        empresa_id: empresaId,
        titulo: input.titulo,
        area: input.area,
        descricao: input.descricao,
        bairro: input.bairro,
        modalidade: input.modalidade,
        tipo_contratacao: input.tipoContratacao,
        quantidade_vagas: input.quantidadeVagas,
        salario_min: input.salarioMin ?? null,
        escolaridade_minima: input.escolaridadeMinima ?? null,
        jornada: input.jornada ?? null,
        beneficios: input.beneficios ?? [],
        status: 'PUBLICADA',
        publicada_em: new Date().toISOString(),
        encerra_em: new Date(Date.now() + 30 * 86400000).toISOString(),
      })
      .select('id')
      .single();

    if (error) throw new RegraNegocioError(error.message);

    if (input.requisitos.length > 0) {
      const { error: reqErr } = await this.db()
        .from('vaga_requisitos')
        .insert(
          input.requisitos.map((r) => ({
            vaga_id: vagaRow.id,
            nome: r.nome,
            nome_normalizado: normalizarTexto(r.nome),
            tipo: r.tipo,
            obrigatorio: r.obrigatorio,
          }))
        );
      if (reqErr) throw new Error(reqErr.message);
    }

    return this.obterVagaPorId(vagaRow.id);
  }

  async listarCandidatosDaVagaParaEmpresa(vagaId: string) {
    // Regra rígida: nunca selecionar score_calculado nem detalhes_match_json para empresas
    const { data, error } = await this.db()
      .from('candidaturas')
      .select(
        'id, status, criado_em, candidatos(id, nome_exibicao, bairro, escolaridade, resumo_profissional, candidato_competencias(nome))'
      )
      .eq('vaga_id', vagaId)
      .order('criado_em', { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
      candidaturaId: row.id,
      status: row.status,
      criadoEm: row.criado_em,
      candidato: row.candidatos
        ? {
            id: row.candidatos.id,
            nome: row.candidatos.nome_exibicao,
            bairro: row.candidatos.bairro,
            escolaridade: row.candidatos.escolaridade,
            resumoProfissional: row.candidatos.resumo_profissional,
            competencias: (row.candidatos.candidato_competencias ?? []).map((c: any) => c.nome),
          }
        : null,
    }));
  }

  async buscarProfissionaisServicos(filtros?: { busca?: string; bairro?: string }) {
    let query = this.db()
      .from('candidatos')
      .select('id, nome_exibicao, categoria_servicos, area_interesse, bairro, resumo_profissional, candidato_competencias(nome)')
      .eq('visivel_servicos', true);

    if (filtros?.bairro) {
      query = query.ilike('bairro', `%${filtros.bairro.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let lista = (data ?? []).map((c: any) => ({
      id: c.id,
      nomePublico: c.nome_exibicao,
      categoria: c.categoria_servicos ?? c.area_interesse ?? 'Profissional',
      bairro: c.bairro,
      resumo: c.resumo_profissional,
      competencias: (c.candidato_competencias ?? []).map((comp: any) => comp.nome),
    }));

    if (filtros?.busca) {
      const q = normalizarTexto(filtros.busca);
      lista = lista.filter(
        (c) =>
          normalizarTexto(c.categoria).includes(q) ||
          normalizarTexto(c.resumo ?? '').includes(q) ||
          c.competencias.some((comp: string) => normalizarTexto(comp).includes(q))
      );
    }
    return lista;
  }

  async listarCursos(tipo?: TipoCurso): Promise<CursoRecord[]> {
    let query = this.db()
      .from('cursos')
      .select('*, turmas(*)')
      .eq('status', 'ATIVO');

    if (tipo) query = query.eq('tipo', tipo);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? []).map((c: any) => ({
      id: c.id,
      titulo: c.titulo,
      area: c.area,
      descricao: c.descricao,
      competenciasDesenvolvidas: Array.isArray(c.competencias_desenvolvidas)
        ? c.competencias_desenvolvidas
        : [],
      instituicao: c.instituicao,
      modalidade: c.modalidade,
      cargaHoraria: c.carga_horaria,
      preRequisitos: c.pre_requisitos,
      tipo: c.tipo,
      seloSimulado: Boolean(c.selo_simulado),
      status: c.status,
      turmas: (c.turmas ?? []).map((t: any) => ({
        id: t.id,
        codigoTurma: t.codigo_turma,
        localBairro: t.local_bairro,
        vagasTotais: t.vagas_totais,
        dataInicio: t.data_inicio,
        horario: t.horario,
        status: t.status,
      })),
    }));
  }

  async solicitarInscricaoCurso(input: {
    candidatoId: string;
    turmaId: string;
    origemCanal: CanalOrigem;
  }): Promise<InscricaoCursoRecord> {
    const { data: turma } = await this.db()
      .from('turmas')
      .select('id, curso_id')
      .eq('id', input.turmaId)
      .maybeSingle();

    if (!turma) throw new RecursoNaoEncontradoError('Turma não encontrada.');

    const { data: jaExiste } = await this.db()
      .from('inscricoes_cursos')
      .select('id')
      .eq('turma_id', input.turmaId)
      .eq('candidato_id', input.candidatoId)
      .maybeSingle();

    if (jaExiste) throw new RegraNegocioError('Você já solicitou inscrição nesta turma.');

    const { data, error } = await this.db()
      .from('inscricoes_cursos')
      .insert({
        turma_id: input.turmaId,
        candidato_id: input.candidatoId,
        origem_canal: input.origemCanal,
        status: 'AGUARDANDO_CONFIRMACAO',
      })
      .select('*')
      .single();

    if (error) throw new RegraNegocioError(error.message);

    return {
      id: data.id,
      turmaId: data.turma_id,
      cursoId: turma.curso_id,
      candidatoId: data.candidato_id,
      origemCanal: data.origem_canal,
      status: data.status,
      frequenciaPercentual: data.frequencia_percentual,
      certificadoUrl: data.certificado_url,
      criadoEm: data.criado_em,
    };
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
    const { data, error } = await this.db()
      .from('pedidos_cursos')
      .insert({
        candidato_id: input.candidatoId,
        curso_id: input.cursoId ?? null,
        tema_desejado: input.temaDesejado.trim(),
        tema_normalizado: normalizarTexto(input.temaDesejado),
        motivo: input.motivo ?? null,
        turno_preferido: input.turnoPreferido ?? null,
        bairro: input.bairro ?? null,
        origem_canal: input.origemCanal,
        status: 'REGISTRADO',
      })
      .select('*')
      .single();

    if (error) throw new RegraNegocioError(error.message);

    return {
      id: data.id,
      candidatoId: data.candidato_id,
      cursoId: data.curso_id,
      temaDesejado: data.tema_desejado,
      temaNormalizado: data.tema_normalizado,
      motivo: data.motivo,
      turnoPreferido: data.turno_preferido,
      bairro: data.bairro,
      origemCanal: data.origem_canal,
      status: data.status,
      criadoEm: data.criado_em,
    };
  }

  async obterDashboardSemispe() {
    const [candCount, empCount, vagasCount, candiCount, cursosCount, pedidosCount, atendCount, rankingRes] =
      await Promise.all([
        this.db().from('candidatos').select('id', { count: 'exact', head: true }),
        this.db().from('empresas').select('id', { count: 'exact', head: true }),
        this.db().from('vagas').select('id', { count: 'exact', head: true }).eq('status', 'PUBLICADA'),
        this.db().from('candidaturas').select('id', { count: 'exact', head: true }),
        this.db().from('cursos').select('id', { count: 'exact', head: true }),
        this.db().from('pedidos_cursos').select('id', { count: 'exact', head: true }),
        this.db().from('conversas_whatsapp').select('id', { count: 'exact', head: true }).eq('atendimento_humano', true),
        this.db().from('vw_ranking_pedidos_cursos').select('*'),
      ]);

    const rankingPedidos = (rankingRes.data ?? []).map((r: any) => ({
      tema: r.tema_exemplo,
      totalPedidos: Number(r.total_pedidos),
      bairros: r.bairros_interessados ?? [],
    }));

    return {
      totais: {
        candidatos: candCount.count ?? 0,
        empresas: empCount.count ?? 0,
        vagasAtivas: vagasCount.count ?? 0,
        candidaturas: candiCount.count ?? 0,
        cursos: cursosCount.count ?? 0,
        pedidosCurso: pedidosCount.count ?? 0,
        atendimentosHumanosPendentes: atendCount.count ?? 0,
      },
      rankingPedidos,
    };
  }

  async obterOuCriarConversaWhatsApp(telefone: string): Promise<ConversaWhatsAppRecord> {
    const { data: existing, error: selErr } = await this.db()
      .from('conversas_whatsapp')
      .select('*')
      .eq('telefone', telefone)
      .maybeSingle();

    if (selErr) throw new Error(selErr.message);

    if (existing) {
      return {
        id: existing.id,
        telefone: existing.telefone,
        candidatoId: existing.candidato_id,
        estadoAtual: existing.estado_atual,
        contextoJson: existing.contexto_json ?? {},
        atendimentoHumano: Boolean(existing.atendimento_humano),
        ultimaInteracaoEm: existing.ultima_interacao_em,
      };
    }

    const { data: usuario } = await this.db()
      .from('usuarios')
      .select('id, candidatos(id, consentimento_lgpd)')
      .eq('telefone_whatsapp', telefone)
      .maybeSingle();

    const cand = Array.isArray(usuario?.candidatos) ? usuario?.candidatos[0] : usuario?.candidatos;
    const estadoInicial: EstadoConversaIA = cand?.consentimento_lgpd ? 'MATCH' : 'NOVO';

    const { data: created, error: insErr } = await this.db()
      .from('conversas_whatsapp')
      .insert({
        telefone,
        candidato_id: cand?.id ?? null,
        estado_atual: estadoInicial,
        contexto_json: {},
        atendimento_humano: false,
      })
      .select('*')
      .single();

    if (insErr) throw new Error(insErr.message);

    return {
      id: created.id,
      telefone: created.telefone,
      candidatoId: created.candidato_id,
      estadoAtual: created.estado_atual,
      contextoJson: created.contexto_json ?? {},
      atendimentoHumano: Boolean(created.atendimento_humano),
      ultimaInteracaoEm: created.ultima_interacao_em,
    };
  }

  async atualizarEstadoConversaWhatsApp(
    telefone: string,
    estadoAtual: EstadoConversaIA,
    contextoPatch?: Record<string, unknown>,
    atendimentoHumano?: boolean
  ): Promise<ConversaWhatsAppRecord> {
    const conv = await this.obterOuCriarConversaWhatsApp(telefone);
    const novoContexto = contextoPatch ? { ...conv.contextoJson, ...contextoPatch } : conv.contextoJson;

    const { data, error } = await this.db()
      .from('conversas_whatsapp')
      .update({
        estado_atual: estadoAtual,
        contexto_json: novoContexto,
        atendimento_humano: typeof atendimentoHumano === 'boolean' ? atendimentoHumano : conv.atendimentoHumano,
        ultima_interacao_em: new Date().toISOString(),
      })
      .eq('telefone', telefone)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      telefone: data.telefone,
      candidatoId: data.candidato_id,
      estadoAtual: data.estado_atual,
      contextoJson: data.contexto_json ?? {},
      atendimentoHumano: Boolean(data.atendimento_humano),
      ultimaInteracaoEm: data.ultima_interacao_em,
    };
  }
}

export const supabaseFarolRepo = new SupabaseFarolRepository();
