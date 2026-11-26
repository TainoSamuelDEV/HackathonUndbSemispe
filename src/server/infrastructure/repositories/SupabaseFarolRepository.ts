import { getSupabaseAdmin } from '@/server/infrastructure/supabase/client';
import {
  gerarVariacoesTelefoneWhatsApp,
  normalizarTelefoneWhatsApp,
} from '@/server/domain/ai/Guardrails';
import {
  type CurriculoArquivoMetadata,
  type CurriculoArquivoRecord,
  type CurriculoPadraoData,
  sanitizarCurriculoPadrao,
} from '@/server/domain/curriculo/CurriculoPadrao';
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
  EditalRecord,
  EventoRecord,
  InscricaoBoletimRecord,
  InscricaoCursoRecord,
  MensagemWhatsAppRecord,
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
  TipoContatoBoletim,
  TipoContratacao,
  TipoCurso,
} from '@/types/farol';

function listaDeTexto(valor: unknown): string[] {
  return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === 'string') : [];
}

function mapEditalRow(row: any): EditalRecord {
  return {
    id: row.id,
    titulo: row.titulo,
    organizacao: row.organizacao,
    resumo: row.resumo,
    publicoAlvo: row.publico_alvo,
    beneficio: row.beneficio,
    inscricoesAte: row.inscricoes_ate,
    prazoDescricao: row.prazo_descricao,
    linkUrl: row.link_url,
    tags: listaDeTexto(row.tags),
    seloSimulado: Boolean(row.selo_simulado),
    publicado: Boolean(row.publicado),
  };
}

function mapEventoRow(row: any): EventoRecord {
  return {
    id: row.id,
    titulo: row.titulo,
    organizacao: row.organizacao,
    resumo: row.resumo,
    inicio: new Date(row.inicio).toISOString(),
    fim: row.fim ? new Date(row.fim).toISOString() : null,
    local: row.local,
    modalidade: row.modalidade,
    gratuito: Boolean(row.gratuito),
    linkInscricao: row.link_inscricao,
    tags: listaDeTexto(row.tags),
    seloSimulado: Boolean(row.selo_simulado),
    publicado: Boolean(row.publicado),
  };
}

function mapInscricaoBoletimRow(row: any): InscricaoBoletimRecord {
  return {
    id: row.id,
    contato: row.contato,
    tipoContato: row.tipo_contato,
    consentimentoLgpd: Boolean(row.consentimento_lgpd),
    consentimentoEm: row.consentimento_em,
    origemCanal: row.origem_canal,
    ativo: Boolean(row.ativo),
    criadoEm: row.criado_em,
  };
}

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
    imagemCapaUrl: row.imagem_capa_url ?? null,
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

    const telefoneNorm = input.telefoneWhatsapp
      ? normalizarTelefoneWhatsApp(input.telefoneWhatsapp)
      : null;
    const nomeExibicao = input.nomeCompleto.trim().split(/\s+/).slice(0, 2).join(' ');

    // Se o cidadão já interagiu e gerou currículo pelo WhatsApp (usuário sem e-mail), reivindica a conta
    if (telefoneNorm) {
      const variacoes = gerarVariacoesTelefoneWhatsApp(telefoneNorm);
      if (variacoes.length > 0) {
        const { data: usuarioWa } = await this.db()
          .from('usuarios')
          .select('id, email, candidatos(id)')
          .in('telefone_whatsapp', variacoes)
          .is('email', null)
          .limit(1)
          .maybeSingle();

        if (usuarioWa) {
          const { error: updUserErr } = await this.db()
            .from('usuarios')
            .update({
              email: emailNorm,
              senha_hash: input.senhaHash,
              telefone_whatsapp: telefoneNorm,
            })
            .eq('id', usuarioWa.id);
          if (updUserErr) throw new RegraNegocioError(updUserErr.message);

          const candWa = Array.isArray(usuarioWa.candidatos)
            ? usuarioWa.candidatos[0]
            : usuarioWa.candidatos;

          if (candWa?.id) {
            await this.db()
              .from('candidatos')
              .update({
                nome_completo: input.nomeCompleto.trim(),
                nome_exibicao: nomeExibicao,
                bairro: input.bairro.trim(),
              })
              .eq('id', candWa.id);
            return { usuarioId: usuarioWa.id, candidatoId: candWa.id, nomeExibicao };
          }

          const { data: novoCand, error: novoCandErr } = await this.db()
            .from('candidatos')
            .insert({
              usuario_id: usuarioWa.id,
              nome_completo: input.nomeCompleto.trim(),
              nome_exibicao: nomeExibicao,
              bairro: input.bairro.trim(),
              consentimento_lgpd: true,
              consentimento_em: new Date().toISOString(),
            })
            .select('id')
            .single();
          if (novoCandErr) throw new RegraNegocioError(novoCandErr.message);
          return { usuarioId: usuarioWa.id, candidatoId: novoCand.id, nomeExibicao };
        }
      }
    }

    const { data: user, error: uErr } = await this.db()
      .from('usuarios')
      .insert({
        email: emailNorm,
        senha_hash: input.senhaHash,
        papel: 'CANDIDATO',
        telefone_whatsapp: telefoneNorm || null,
        whatsapp_verificado: false,
      })
      .select('id')
      .single();

    if (uErr) throw new RegraNegocioError(uErr.message);

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

    if (dados.experiencias !== undefined) {
      await this.db().from('experiencias_profissionais').delete().eq('candidato_id', candidatoId);
      const expValidas = dados.experiencias.filter((e) => e.cargoAtividade?.trim());
      if (expValidas.length > 0) {
        const { error: expErr } = await this.db()
          .from('experiencias_profissionais')
          .insert(
            expValidas.map((e) => ({
              candidato_id: candidatoId,
              cargo_atividade: e.cargoAtividade.trim(),
              empresa_ou_contexto: e.empresaOuContexto?.trim() || null,
              trabalho_informal: Boolean(e.trabalhoInformal),
              descricao: e.periodo?.trim() || null,
            }))
          );
        if (expErr) throw new Error(expErr.message);
      }
    }

    return this.obterCandidato(candidatoId);
  }

  async buscarCandidatoPorTelefone(telefone: string): Promise<{
    candidato: CandidatoRecord;
    email: string | null;
    telefoneWhatsapp: string | null;
  } | null> {
    const variacoes = gerarVariacoesTelefoneWhatsApp(telefone);
    if (variacoes.length === 0) return null;

    const { data: usuario, error } = await this.db()
      .from('usuarios')
      .select('id, email, telefone_whatsapp, candidatos(id)')
      .in('telefone_whatsapp', variacoes)
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!usuario) return null;

    const cand = Array.isArray(usuario.candidatos) ? usuario.candidatos[0] : usuario.candidatos;
    if (!cand?.id) return null;

    const candidato = await this.obterCandidato(cand.id);
    return {
      candidato,
      email: usuario.email ?? null,
      telefoneWhatsapp: usuario.telefone_whatsapp ?? null,
    };
  }

  async garantirCandidatoPorWhatsApp(input: {
    telefone: string;
    dados: CurriculoPadraoData;
  }): Promise<CandidatoRecord> {
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
        escolaridade: dadosLimpos.escolaridade ?? existente.candidato.escolaridade,
        areaInteresse: dadosLimpos.areaInteresse ?? existente.candidato.areaInteresse,
        objetivo: dadosLimpos.objetivo ?? existente.candidato.objetivo,
        resumoProfissional: dadosLimpos.resumoProfissional ?? existente.candidato.resumoProfissional,
        disponibilidade: dadosLimpos.disponibilidade ?? existente.candidato.disponibilidade,
        competencias:
          dadosLimpos.competencias.length > 0
            ? dadosLimpos.competencias
            : existente.candidato.competencias,
        experiencias:
          experienciasMapped.length > 0 ? experienciasMapped : existente.candidato.experiencias,
      });
    }

    const { data: usuario, error: uErr } = await this.db()
      .from('usuarios')
      .insert({
        email: null,
        senha_hash: null,
        papel: 'CANDIDATO',
        telefone_whatsapp: telefoneNorm,
        whatsapp_verificado: true,
      })
      .select('id')
      .single();

    if (uErr) throw new Error(uErr.message);

    const { data: cand, error: cErr } = await this.db()
      .from('candidatos')
      .insert({
        usuario_id: usuario.id,
        nome_completo: nomeCompleto,
        nome_exibicao: nomeExibicao,
        bairro,
        municipio: dadosLimpos.municipio || 'São Luís',
        escolaridade: dadosLimpos.escolaridade ?? null,
        area_interesse: dadosLimpos.areaInteresse ?? null,
        objetivo: dadosLimpos.objetivo ?? null,
        resumo_profissional: dadosLimpos.resumoProfissional ?? null,
        disponibilidade: dadosLimpos.disponibilidade ?? null,
        consentimento_lgpd: true,
        consentimento_em: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (cErr) throw new Error(cErr.message);

    return this.atualizarCurriculoCandidato(cand.id, {
      competencias: dadosLimpos.competencias,
      experiencias: experienciasMapped,
    });
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
    const { data: created, error: insErr } = await this.db()
      .from('curriculos_arquivos')
      .insert({
        candidato_id: input.candidatoId,
        origem: input.origem,
        arquivo_url: 'pending',
        nome_arquivo: input.nomeArquivo,
        mime_type: input.mimeType,
        arquivo_base64: input.arquivoBase64,
        dados_extraidos_json: input.dadosExtraidosJson,
        confirmado_usuario: input.confirmadoUsuario,
      })
      .select('*')
      .single();

    if (insErr) throw new Error(insErr.message);

    const downloadUrl = `/api/candidato/curriculo/arquivos/${created.id}/download`;
    await this.db()
      .from('curriculos_arquivos')
      .update({ arquivo_url: downloadUrl })
      .eq('id', created.id);

    return {
      id: created.id,
      candidatoId: created.candidato_id,
      origem: created.origem,
      arquivoUrl: downloadUrl,
      nomeArquivo: created.nome_arquivo ?? input.nomeArquivo,
      mimeType: created.mime_type ?? input.mimeType,
      arquivoBase64: created.arquivo_base64 ?? input.arquivoBase64,
      dadosExtraidosJson: created.dados_extraidos_json ?? null,
      confirmadoUsuario: Boolean(created.confirmado_usuario),
      criadoEm: created.criado_em,
    };
  }

  async listarCurriculosArquivosDoCandidato(candidatoId: string): Promise<CurriculoArquivoMetadata[]> {
    const { data, error } = await this.db()
      .from('curriculos_arquivos')
      .select('id, candidato_id, origem, arquivo_url, nome_arquivo, mime_type, dados_extraidos_json, confirmado_usuario, criado_em')
      .eq('candidato_id', candidatoId)
      .order('criado_em', { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
      id: row.id,
      candidatoId: row.candidato_id,
      origem: row.origem,
      arquivoUrl: row.arquivo_url,
      nomeArquivo: row.nome_arquivo ?? 'Curriculo_FAROL.pdf',
      mimeType: row.mime_type ?? 'application/pdf',
      dadosExtraidosJson: row.dados_extraidos_json ?? null,
      confirmadoUsuario: Boolean(row.confirmado_usuario),
      criadoEm: row.criado_em,
    }));
  }

  async obterCurriculoArquivoPorId(arquivoId: string): Promise<CurriculoArquivoRecord | null> {
    const { data, error } = await this.db()
      .from('curriculos_arquivos')
      .select('*')
      .eq('id', arquivoId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      id: data.id,
      candidatoId: data.candidato_id,
      origem: data.origem,
      arquivoUrl: data.arquivo_url,
      nomeArquivo: data.nome_arquivo ?? 'Curriculo_FAROL.pdf',
      mimeType: data.mime_type ?? 'application/pdf',
      arquivoBase64: data.arquivo_base64 ?? '',
      dadosExtraidosJson: data.dados_extraidos_json ?? null,
      confirmadoUsuario: Boolean(data.confirmado_usuario),
      criadoEm: data.criado_em,
    };
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
      imagemCapaUrl?: string | null;
      requisitos: RequisitoVaga[];
    }
  ): Promise<VagaRecord> {
    const { data: vagaRow, error } = await this.db()
      .from('vagas')
      .insert({
        // Só envia a coluna quando houver imagem: mantém compatível com bancos sem a migration 20261125000001
        ...(input.imagemCapaUrl ? { imagem_capa_url: input.imagemCapaUrl } : {}),
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
      imagemCapaUrl: c.imagem_capa_url ?? null,
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

  private mapConversaRow(row: any): ConversaWhatsAppRecord {
    return {
      id: row.id,
      telefone: row.telefone,
      remoteJid: row.remote_jid ?? null,
      pushName: row.push_name ?? null,
      candidatoId: row.candidato_id ?? null,
      estadoAtual: row.estado_atual,
      contextoJson: row.contexto_json ?? {},
      atendimentoHumano: Boolean(row.atendimento_humano),
      botPausedUntil: row.bot_paused_until ?? null,
      topicoAtual: row.topico_atual ?? null,
      turnosSessao: Number(row.turnos_sessao ?? 0),
      ultimaInteracaoEm: row.ultima_interacao_em,
    };
  }

  async obterOuCriarConversaWhatsApp(
    telefone: string,
    meta?: { remoteJid?: string; pushName?: string }
  ): Promise<ConversaWhatsAppRecord> {
    const telefoneNorm = normalizarTelefoneWhatsApp(telefone);
    const { data: existing, error: selErr } = await this.db()
      .from('conversas_whatsapp')
      .select('*')
      .eq('telefone', telefoneNorm)
      .maybeSingle();

    if (selErr) throw new Error(selErr.message);

    if (existing) {
      const pauseExpired =
        Boolean(existing.bot_paused_until) &&
        new Date(existing.bot_paused_until).getTime() <= Date.now();

      const patch: Record<string, unknown> = {};
      if (meta?.remoteJid && meta.remoteJid !== existing.remote_jid) {
        patch.remote_jid = meta.remoteJid;
      }
      if (meta?.pushName && meta.pushName !== existing.push_name) {
        patch.push_name = meta.pushName;
      }
      if (pauseExpired) {
        patch.bot_paused_until = null;
        patch.atendimento_humano = false;
      }
      if (!existing.candidato_id) {
        const encontrado = await this.buscarCandidatoPorTelefone(telefoneNorm);
        if (encontrado?.candidato.id) {
          patch.candidato_id = encontrado.candidato.id;
        }
      }

      if (Object.keys(patch).length > 0) {
        const { data: updated } = await this.db()
          .from('conversas_whatsapp')
          .update(patch)
          .eq('id', existing.id)
          .select('*')
          .single();
        if (updated) return this.mapConversaRow(updated);
      }

      return this.mapConversaRow(existing);
    }

    const variacoes = gerarVariacoesTelefoneWhatsApp(telefoneNorm);
    const { data: usuario } = variacoes.length
      ? await this.db()
          .from('usuarios')
          .select('id, candidatos(id, consentimento_lgpd)')
          .in('telefone_whatsapp', variacoes)
          .limit(1)
          .maybeSingle()
      : { data: null };

    const cand = Array.isArray(usuario?.candidatos) ? usuario?.candidatos[0] : usuario?.candidatos;
    const estadoInicial: EstadoConversaIA = cand?.consentimento_lgpd ? 'MATCH' : 'NOVO';

    const { data: created, error: insErr } = await this.db()
      .from('conversas_whatsapp')
      .insert({
        telefone: telefoneNorm,
        remote_jid: meta?.remoteJid ?? null,
        push_name: meta?.pushName ?? null,
        candidato_id: cand?.id ?? null,
        estado_atual: estadoInicial,
        contexto_json: {},
        atendimento_humano: false,
      })
      .select('*')
      .single();

    if (insErr) throw new Error(insErr.message);

    return this.mapConversaRow(created);
  }

  async atualizarEstadoConversaWhatsApp(
    telefone: string,
    estadoAtual: EstadoConversaIA,
    contextoPatch?: Record<string, unknown>,
    atendimentoHumano?: boolean
  ): Promise<ConversaWhatsAppRecord> {
    const telefoneNorm = normalizarTelefoneWhatsApp(telefone);
    const conv = await this.obterOuCriarConversaWhatsApp(telefoneNorm);
    const novoContexto = contextoPatch ? { ...conv.contextoJson, ...contextoPatch } : conv.contextoJson;

    const { data, error } = await this.db()
      .from('conversas_whatsapp')
      .update({
        estado_atual: estadoAtual,
        contexto_json: novoContexto,
        atendimento_humano: typeof atendimentoHumano === 'boolean' ? atendimentoHumano : conv.atendimentoHumano,
        ultima_interacao_em: new Date().toISOString(),
      })
      .eq('id', conv.id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    return this.mapConversaRow(data);
  }

  async mensagemWhatsAppJaProcessada(evolutionMessageId: string): Promise<boolean> {
    if (!evolutionMessageId) return false;
    const { data, error } = await this.db()
      .from('mensagens_whatsapp')
      .select('id')
      .eq('evolution_message_id', evolutionMessageId)
      .limit(1)
      .maybeSingle();

    if (error) return false;
    return Boolean(data);
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
    const { error } = await this.db()
      .from('mensagens_whatsapp')
      .insert({
        conversa_id: input.conversaId,
        direcao: input.direcao,
        tipo_midia: input.tipoMidia,
        conteudo_texto: input.conteudoTexto ?? null,
        transcricao_audio: input.transcricaoAudio ?? null,
        resumo_midia: input.resumoMidia ?? null,
        metadata_json: input.metadataJson ?? {},
        evolution_message_id: input.evolutionMessageId ?? null,
      });

    if (error) {
      // Unique constraint violation (23505) garante idempotência atômica
      if (error.code === '23505') return false;
      throw new Error(error.message);
    }
    return true;
  }

  async listarHistoricoMensagensWhatsApp(
    conversaId: string,
    limite: number,
    ttlMinutos: number
  ): Promise<MensagemWhatsAppRecord[]> {
    const cutoffIso = new Date(Date.now() - ttlMinutos * 60_000).toISOString();
    const { data, error } = await this.db()
      .from('mensagens_whatsapp')
      .select('*')
      .eq('conversa_id', conversaId)
      .gte('criado_em', cutoffIso)
      .order('criado_em', { ascending: false })
      .limit(limite);

    if (error) throw new Error(error.message);

    return (data ?? []).reverse().map((row: any) => ({
      id: row.id,
      conversaId: row.conversa_id,
      direcao: row.direcao,
      tipoMidia: row.tipo_midia,
      conteudoTexto: row.conteudo_texto ?? null,
      transcricaoAudio: row.transcricao_audio ?? null,
      resumoMidia: row.resumo_midia ?? null,
      metadataJson: row.metadata_json ?? {},
      evolutionMessageId: row.evolution_message_id ?? null,
      criadoEm: row.criado_em,
    }));
  }

  async pausarBotConversaWhatsApp(telefone: string, minutos: number): Promise<void> {
    const conv = await this.obterOuCriarConversaWhatsApp(telefone);
    const pausedUntil = new Date(Date.now() + minutos * 60_000).toISOString();
    const { error } = await this.db()
      .from('conversas_whatsapp')
      .update({
        bot_paused_until: pausedUntil,
        atendimento_humano: true,
        estado_atual: 'ATENDIMENTO_HUMANO',
        ultima_interacao_em: new Date().toISOString(),
      })
      .eq('id', conv.id);

    if (error) throw new Error(error.message);
  }

  async atualizarTopicoConversaWhatsApp(conversaId: string, topico: string | null): Promise<void> {
    const { error } = await this.db()
      .from('conversas_whatsapp')
      .update({ topico_atual: topico })
      .eq('id', conversaId);
    if (error) throw new Error(error.message);
  }

  async vincularCandidatoConversaWhatsApp(conversaId: string, candidatoId: string): Promise<void> {
    const { error } = await this.db()
      .from('conversas_whatsapp')
      .update({ candidato_id: candidatoId })
      .eq('id', conversaId);
    if (error) throw new Error(error.message);
  }

  async incrementarTurnoConversaWhatsApp(conversaId: string): Promise<void> {
    const { error: rpcErr } = await this.db().rpc('fn_incrementar_turno_conversa_whatsapp', {
      p_conversa_id: conversaId,
    });
    if (!rpcErr) return;

    const { data } = await this.db()
      .from('conversas_whatsapp')
      .select('turnos_sessao')
      .eq('id', conversaId)
      .maybeSingle();

    await this.db()
      .from('conversas_whatsapp')
      .update({
        turnos_sessao: Number(data?.turnos_sessao ?? 0) + 1,
        ultima_interacao_em: new Date().toISOString(),
      })
      .eq('id', conversaId);
  }

  // --------------------------------------------------------------------------
  // EDITAIS, EVENTOS E BOLETIM
  // --------------------------------------------------------------------------

  /** Editais publicados com inscrição aberta em `hoje` (aaaa-mm-dd) ou em fluxo contínuo. */
  async listarEditaisAbertos(hoje: string): Promise<EditalRecord[]> {
    const { data, error } = await this.db()
      .from('editais')
      .select('*')
      .eq('publicado', true)
      .or(`inscricoes_ate.is.null,inscricoes_ate.gte.${hoje}`)
      .order('inscricoes_ate', { ascending: true, nullsFirst: false })
      .order('titulo', { ascending: true });

    if (error) throw new Error(`Falha ao listar editais: ${error.message}`);
    return (data ?? []).map(mapEditalRow);
  }

  /** Eventos publicados que ainda não terminaram em `agora` (instante ISO), do mais próximo ao mais distante. */
  async listarProximosEventos(agora: string): Promise<EventoRecord[]> {
    const { data, error } = await this.db()
      .from('eventos')
      .select('*')
      .eq('publicado', true)
      .gte('termina_em', agora)
      .order('inicio', { ascending: true });

    if (error) throw new Error(`Falha ao listar eventos: ${error.message}`);
    return (data ?? []).map(mapEventoRow);
  }

  async buscarInscricaoBoletim(contato: string): Promise<InscricaoBoletimRecord | null> {
    const { data, error } = await this.db()
      .from('inscricoes_boletim')
      .select('*')
      .eq('contato', contato)
      .maybeSingle();

    if (error) throw new Error(`Falha ao consultar inscrição no boletim: ${error.message}`);
    return data ? mapInscricaoBoletimRow(data) : null;
  }

  async criarInscricaoBoletim(input: {
    contato: string;
    tipoContato: TipoContatoBoletim;
    origemCanal: CanalOrigem;
  }): Promise<{ inscricao: InscricaoBoletimRecord | null; duplicada: boolean }> {
    const { data, error } = await this.db()
      .from('inscricoes_boletim')
      .insert({
        contato: input.contato,
        tipo_contato: input.tipoContato,
        consentimento_lgpd: true,
        consentimento_em: new Date().toISOString(),
        origem_canal: input.origemCanal,
        ativo: true,
      })
      .select('*')
      .single();

    // 23505 = violação de unicidade: o mesmo contato foi inscrito em paralelo
    if (error?.code === '23505') return { inscricao: null, duplicada: true };
    if (error) throw new Error(`Falha ao registrar inscrição no boletim: ${error.message}`);
    return { inscricao: mapInscricaoBoletimRow(data), duplicada: false };
  }

  async reativarInscricaoBoletim(id: string, origemCanal: CanalOrigem): Promise<InscricaoBoletimRecord> {
    const { data, error } = await this.db()
      .from('inscricoes_boletim')
      .update({
        ativo: true,
        consentimento_lgpd: true,
        consentimento_em: new Date().toISOString(),
        origem_canal: origemCanal,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Falha ao reativar inscrição no boletim: ${error.message}`);
    return mapInscricaoBoletimRow(data);
  }
}

export const supabaseFarolRepo = new SupabaseFarolRepository();
