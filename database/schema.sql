-- ============================================================================
-- FAROL — Formação, Ações e Rede de Oportunidades Locais
-- Script DDL Oficial — PostgreSQL 15+ (Supabase Self-Hosted)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ----------------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS (ENUMS)
-- ----------------------------------------------------------------------------

CREATE TYPE papel_usuario AS ENUM ('CANDIDATO', 'EMPRESA', 'ADMIN_SEMISPE');

CREATE TYPE nivel_escolaridade AS ENUM (
  'FUNDAMENTAL_INCOMPLETO',
  'FUNDAMENTAL_COMPLETO',
  'MEDIO_INCOMPLETO',
  'MEDIO_COMPLETO',
  'TECNICO',
  'SUPERIOR_INCOMPLETO',
  'SUPERIOR_COMPLETO'
);

CREATE TYPE modalidade_trabalho AS ENUM ('PRESENCIAL', 'HIBRIDO', 'REMOTO');
CREATE TYPE tipo_contratacao AS ENUM ('CLT', 'ESTAGIO', 'JOVEM_APRENDIZ', 'TEMPORARIO', 'AUTONOMO_MEI', 'OUTRO');
CREATE TYPE status_vaga AS ENUM ('RASCUNHO', 'PUBLICADA', 'ENCERRADA', 'EXPIRADA');
CREATE TYPE origem_vaga AS ENUM ('INTERNA', 'EXTERNA');

CREATE TYPE status_validacao_empresa AS ENUM ('PENDENTE', 'VERIFICADA', 'INDISPONIVEL', 'BLOQUEADA');

CREATE TYPE canal_origem AS ENUM ('WEB', 'WHATSAPP');
CREATE TYPE status_candidatura AS ENUM ('INSCRITO', 'EM_ANALISE', 'ENTREVISTA', 'CONTRATADO', 'DESISTENCIA', 'NAO_APROVADO');

CREATE TYPE tipo_lacuna AS ENUM ('CONHECIMENTO', 'REQUISITO', 'CERTIFICACAO');

CREATE TYPE tipo_curso AS ENUM ('PROGRAMADO', 'SOB_DEMANDA');
CREATE TYPE status_curso AS ENUM ('ATIVO', 'INATIVO', 'ENCERRADO');
CREATE TYPE status_turma AS ENUM ('INSCRICOES_ABERTAS', 'INSCRICOES_ENCERRADAS', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');
CREATE TYPE status_inscricao_curso AS ENUM ('AGUARDANDO_CONFIRMACAO', 'CONFIRMADA', 'RECUSADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');
CREATE TYPE status_pedido_curso AS ENUM ('REGISTRADO', 'EM_ANALISE', 'TURMA_ABERTA', 'ATENDIDO');

CREATE TYPE estado_conversa_ia AS ENUM (
  'NOVO',
  'CONSENTIMENTO',
  'TRIAGEM',
  'CURRICULO',
  'INTERESSE',
  'MATCH',
  'CANDIDATURA',
  'ACOMPANHAMENTO',
  'FEEDBACK',
  'CURSOS',
  'PEDIDO_CURSO',
  'ATENDIMENTO_HUMANO'
);

CREATE TYPE direcao_mensagem AS ENUM ('ENTRADA', 'SAIDA');
CREATE TYPE tipo_midia_mensagem AS ENUM ('TEXTO', 'AUDIO', 'DOCUMENTO', 'IMAGEM');

-- ----------------------------------------------------------------------------
-- 2. FUNÇÕES AUXILIARES E TRIGGERS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_bloquear_mutacao_historico()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Registros de auditoria em candidatura_eventos são imutáveis.';
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. USUÁRIOS E VINCULAÇÃO WHATSAPP
-- ----------------------------------------------------------------------------

CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  senha_hash TEXT,
  papel papel_usuario NOT NULL,
  telefone_whatsapp VARCHAR(20) UNIQUE,
  whatsapp_verificado BOOLEAN NOT NULL DEFAULT FALSE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_usuario_identificador CHECK (email IS NOT NULL OR telefone_whatsapp IS NOT NULL)
);

CREATE TRIGGER trg_usuarios_atualizado_em
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();

CREATE TABLE vinculos_whatsapp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  codigo VARCHAR(12) NOT NULL UNIQUE,
  telefone_destino VARCHAR(20),
  expira_em TIMESTAMPTZ NOT NULL,
  usado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. CANDIDATOS E CURRÍCULO ESTRUTURADO
-- ----------------------------------------------------------------------------

CREATE TABLE candidatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  nome_completo VARCHAR(180) NOT NULL,
  nome_exibicao VARCHAR(120),
  bairro VARCHAR(120) NOT NULL,
  municipio VARCHAR(100) NOT NULL DEFAULT 'São Luís',
  escolaridade nivel_escolaridade,
  area_interesse VARCHAR(150),
  objetivo TEXT,
  resumo_profissional TEXT,
  disponibilidade VARCHAR(200),
  forma_contato_preferida VARCHAR(40) DEFAULT 'WHATSAPP',
  consentimento_lgpd BOOLEAN NOT NULL DEFAULT FALSE,
  consentimento_em TIMESTAMPTZ,
  visivel_servicos BOOLEAN NOT NULL DEFAULT FALSE,
  categoria_servicos VARCHAR(120),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_candidatos_atualizado_em
  BEFORE UPDATE ON candidatos
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();

CREATE TABLE experiencias_profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  cargo_atividade VARCHAR(150) NOT NULL,
  empresa_ou_contexto VARCHAR(150),
  trabalho_informal BOOLEAN NOT NULL DEFAULT FALSE,
  data_inicio DATE,
  data_fim DATE,
  atual BOOLEAN NOT NULL DEFAULT FALSE,
  descricao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE formacoes_academicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  nivel nivel_escolaridade NOT NULL,
  curso VARCHAR(160),
  instituicao VARCHAR(160),
  status_conclusao VARCHAR(40) NOT NULL DEFAULT 'CONCLUIDO',
  ano_conclusao SMALLINT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE candidato_competencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  nome VARCHAR(120) NOT NULL,
  nome_normalizado VARCHAR(120) NOT NULL,
  tipo tipo_lacuna NOT NULL DEFAULT 'CONHECIMENTO',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (candidato_id, nome_normalizado)
);

CREATE TABLE curriculos_arquivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  origem VARCHAR(30) NOT NULL CHECK (origem IN ('UPLOAD_PDF', 'UPLOAD_IMAGEM', 'GERADO_SISTEMA')),
  arquivo_url TEXT NOT NULL,
  dados_extraidos_json JSONB,
  confirmado_usuario BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. EMPRESAS E VAGAS
-- ----------------------------------------------------------------------------

CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  cnpj VARCHAR(18) NOT NULL UNIQUE,
  razao_social VARCHAR(200) NOT NULL,
  nome_fantasia VARCHAR(200),
  eh_mei BOOLEAN NOT NULL DEFAULT FALSE,
  setor VARCHAR(120) NOT NULL,
  bairro VARCHAR(120) NOT NULL,
  municipio VARCHAR(100) NOT NULL DEFAULT 'São Luís',
  telefone VARCHAR(20) NOT NULL,
  responsavel_nome VARCHAR(150) NOT NULL,
  status_validacao status_validacao_empresa NOT NULL DEFAULT 'PENDENTE',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_empresas_atualizado_em
  BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();

CREATE TABLE vagas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  titulo VARCHAR(180) NOT NULL,
  area VARCHAR(120) NOT NULL,
  descricao TEXT NOT NULL,
  bairro VARCHAR(120) NOT NULL,
  municipio VARCHAR(100) NOT NULL DEFAULT 'São Luís',
  modalidade modalidade_trabalho NOT NULL DEFAULT 'PRESENCIAL',
  tipo_contratacao tipo_contratacao NOT NULL DEFAULT 'CLT',
  quantidade_vagas SMALLINT NOT NULL DEFAULT 1 CHECK (quantidade_vagas > 0),
  salario_min NUMERIC(10, 2),
  salario_max NUMERIC(10, 2),
  escolaridade_minima nivel_escolaridade,
  jornada VARCHAR(120),
  beneficios JSONB NOT NULL DEFAULT '[]'::jsonb,
  aceita_pcd BOOLEAN NOT NULL DEFAULT FALSE,
  origem_tipo origem_vaga NOT NULL DEFAULT 'INTERNA',
  origem_url TEXT,
  selo_simulado BOOLEAN NOT NULL DEFAULT FALSE,
  status status_vaga NOT NULL DEFAULT 'RASCUNHO',
  publicada_em TIMESTAMPTZ,
  encerra_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_vagas_atualizado_em
  BEFORE UPDATE ON vagas
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();

CREATE TABLE vaga_requisitos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id UUID NOT NULL REFERENCES vagas(id) ON DELETE CASCADE,
  nome VARCHAR(140) NOT NULL,
  nome_normalizado VARCHAR(140) NOT NULL,
  tipo tipo_lacuna NOT NULL DEFAULT 'CONHECIMENTO',
  obrigatorio BOOLEAN NOT NULL DEFAULT TRUE
);

-- ----------------------------------------------------------------------------
-- 6. CANDIDATURAS E HISTÓRICO IMUTÁVEL
-- ----------------------------------------------------------------------------

CREATE TABLE candidaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id UUID NOT NULL REFERENCES vagas(id) ON DELETE CASCADE,
  candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  origem_canal canal_origem NOT NULL DEFAULT 'WEB',
  status status_candidatura NOT NULL DEFAULT 'INSCRITO',
  score_calculado SMALLINT CHECK (score_calculado BETWEEN 0 AND 100),
  detalhes_match_json JSONB,
  observacao_empresa TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vaga_id, candidato_id)
);

CREATE TRIGGER trg_candidaturas_atualizado_em
  BEFORE UPDATE ON candidaturas
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();

CREATE TABLE candidatura_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidatura_id UUID NOT NULL REFERENCES candidaturas(id) ON DELETE CASCADE,
  ator_usuario_id UUID REFERENCES usuarios(id),
  status_anterior status_candidatura,
  status_novo status_candidatura NOT NULL,
  observacao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_candidatura_eventos_imutavel
  BEFORE UPDATE OR DELETE ON candidatura_eventos
  FOR EACH ROW EXECUTE FUNCTION fn_bloquear_mutacao_historico();

-- ----------------------------------------------------------------------------
-- 7. CURSOS, TURMAS, INSCRIÇÕES E PEDIDOS SOB DEMANDA
-- ----------------------------------------------------------------------------

CREATE TABLE cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(180) NOT NULL,
  area VARCHAR(120) NOT NULL,
  descricao TEXT NOT NULL,
  competencias_desenvolvidas JSONB NOT NULL DEFAULT '[]'::jsonb,
  instituicao VARCHAR(160) NOT NULL DEFAULT 'SEMISPE / Parceiros',
  modalidade modalidade_trabalho NOT NULL DEFAULT 'PRESENCIAL',
  carga_horaria SMALLINT NOT NULL CHECK (carga_horaria > 0),
  pre_requisitos TEXT,
  tipo tipo_curso NOT NULL,
  selo_simulado BOOLEAN NOT NULL DEFAULT FALSE,
  status status_curso NOT NULL DEFAULT 'ATIVO',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_cursos_atualizado_em
  BEFORE UPDATE ON cursos
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();

CREATE TABLE turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  codigo_turma VARCHAR(60) NOT NULL,
  local_bairro VARCHAR(120) NOT NULL,
  endereco TEXT,
  vagas_totais SMALLINT NOT NULL CHECK (vagas_totais > 0),
  inscricao_inicio DATE,
  inscricao_fim DATE,
  data_inicio DATE,
  data_fim DATE,
  horario VARCHAR(80),
  responsavel VARCHAR(140),
  status status_turma NOT NULL DEFAULT 'INSCRICOES_ABERTAS',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inscricoes_cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  origem_canal canal_origem NOT NULL DEFAULT 'WEB',
  status status_inscricao_curso NOT NULL DEFAULT 'AGUARDANDO_CONFIRMACAO',
  frequencia_percentual SMALLINT CHECK (frequencia_percentual BETWEEN 0 AND 100),
  concluido_em TIMESTAMPTZ,
  certificado_url TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (turma_id, candidato_id)
);

CREATE TRIGGER trg_inscricoes_cursos_atualizado_em
  BEFORE UPDATE ON inscricoes_cursos
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();

CREATE TABLE pedidos_cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID REFERENCES candidatos(id) ON DELETE SET NULL,
  curso_id UUID REFERENCES cursos(id) ON DELETE SET NULL,
  tema_desejado VARCHAR(180) NOT NULL,
  tema_normalizado VARCHAR(180) NOT NULL,
  motivo TEXT,
  turno_preferido VARCHAR(40),
  bairro VARCHAR(120),
  origem_canal canal_origem NOT NULL DEFAULT 'WEB',
  status status_pedido_curso NOT NULL DEFAULT 'REGISTRADO',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. CONVERSAS E ESTADO DA IA FAROL (EVOLUTION API / WHATSAPP)
-- ----------------------------------------------------------------------------

CREATE TABLE conversas_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone VARCHAR(20) NOT NULL UNIQUE,
  candidato_id UUID REFERENCES candidatos(id) ON DELETE SET NULL,
  estado_atual estado_conversa_ia NOT NULL DEFAULT 'NOVO',
  contexto_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  atendimento_humano BOOLEAN NOT NULL DEFAULT FALSE,
  ultima_interacao_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE mensagens_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES conversas_whatsapp(id) ON DELETE CASCADE,
  direcao direcao_mensagem NOT NULL,
  tipo_midia tipo_midia_mensagem NOT NULL DEFAULT 'TEXTO',
  conteudo_texto TEXT,
  transcricao_audio TEXT,
  evolution_message_id VARCHAR(120),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. ÍNDICES DE PERFORMANCE E VIEW DE DEMANDA
-- ----------------------------------------------------------------------------

CREATE INDEX idx_vagas_ativas ON vagas (status, bairro, modalidade) WHERE status = 'PUBLICADA';
CREATE INDEX idx_vaga_requisitos_vaga ON vaga_requisitos (vaga_id, obrigatorio);
CREATE INDEX idx_candidato_comp_norm ON candidato_competencias (candidato_id, nome_normalizado);
CREATE INDEX idx_candidaturas_candidato ON candidaturas (candidato_id, status);
CREATE INDEX idx_candidaturas_vaga ON candidaturas (vaga_id, status);
CREATE INDEX idx_pedidos_cursos_tema ON pedidos_cursos (tema_normalizado, bairro);
CREATE INDEX idx_conversas_telefone ON conversas_whatsapp (telefone);
CREATE INDEX idx_mensagens_conversa_data ON mensagens_whatsapp (conversa_id, criado_em DESC);

-- View oficial para o Painel SEMISPE e consulta da IA FAROL
CREATE OR REPLACE VIEW vw_ranking_pedidos_cursos AS
SELECT
  tema_normalizado,
  MIN(tema_desejado) AS tema_exemplo,
  COUNT(*) AS total_pedidos,
  COUNT(DISTINCT candidato_id) AS total_candidatos_unicos,
  ARRAY_AGG(DISTINCT bairro) FILTER (WHERE bairro IS NOT NULL) AS bairros_interessados,
  MAX(criado_em) AS ultimo_pedido_em
FROM pedidos_cursos
WHERE status IN ('REGISTRADO', 'EM_ANALISE')
GROUP BY tema_normalizado
ORDER BY total_pedidos DESC, ultimo_pedido_em DESC;
