-- =====================================================================
-- FAROL — Editais, eventos e inscrições no boletim
-- Conteúdo da página pública "Editais e eventos" (/editais-e-eventos).
-- =====================================================================

CREATE TYPE modalidade_evento AS ENUM ('PRESENCIAL', 'ONLINE', 'HIBRIDO');
CREATE TYPE tipo_contato_boletim AS ENUM ('EMAIL', 'WHATSAPP');

-- ----------------------------------------------------------------------------
-- EDITAIS E CHAMADAS
-- ----------------------------------------------------------------------------

CREATE TABLE editais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(220) NOT NULL,
  organizacao VARCHAR(200) NOT NULL,
  resumo TEXT NOT NULL,
  publico_alvo VARCHAR(160),
  beneficio VARCHAR(160),
  -- Data final de inscrição. Nula para chamadas em fluxo contínuo (usar prazo_descricao).
  inscricoes_ate DATE,
  prazo_descricao VARCHAR(160),
  link_url TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  selo_simulado BOOLEAN NOT NULL DEFAULT FALSE,
  publicado BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_editais_link_https CHECK (link_url IS NULL OR link_url ~* '^https://[^[:space:]]+$'),
  CONSTRAINT chk_editais_tags_lista CHECK (jsonb_typeof(tags) = 'array')
);

CREATE TRIGGER trg_editais_atualizado_em
  BEFORE UPDATE ON editais
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();

CREATE INDEX idx_editais_abertos ON editais (inscricoes_ate) WHERE publicado;

-- ----------------------------------------------------------------------------
-- EVENTOS
-- ----------------------------------------------------------------------------

CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(220) NOT NULL,
  organizacao VARCHAR(200) NOT NULL,
  resumo TEXT NOT NULL,
  inicio TIMESTAMPTZ NOT NULL,
  fim TIMESTAMPTZ,
  -- Momento em que o evento sai da agenda (fim, ou o início quando não há fim informado).
  termina_em TIMESTAMPTZ GENERATED ALWAYS AS (COALESCE(fim, inicio)) STORED,
  local VARCHAR(200) NOT NULL,
  modalidade modalidade_evento NOT NULL DEFAULT 'PRESENCIAL',
  gratuito BOOLEAN NOT NULL DEFAULT TRUE,
  link_inscricao TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  selo_simulado BOOLEAN NOT NULL DEFAULT FALSE,
  publicado BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_eventos_periodo CHECK (fim IS NULL OR fim >= inicio),
  CONSTRAINT chk_eventos_link_https CHECK (link_inscricao IS NULL OR link_inscricao ~* '^https://[^[:space:]]+$'),
  CONSTRAINT chk_eventos_tags_lista CHECK (jsonb_typeof(tags) = 'array')
);

CREATE TRIGGER trg_eventos_atualizado_em
  BEFORE UPDATE ON eventos
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();

CREATE INDEX idx_eventos_agenda ON eventos (termina_em, inicio) WHERE publicado;

-- ----------------------------------------------------------------------------
-- INSCRIÇÕES NO BOLETIM
-- Guarda apenas o contato normalizado (e-mail em minúsculas ou WhatsApp só com dígitos, com DDI 55).
-- ----------------------------------------------------------------------------

CREATE TABLE inscricoes_boletim (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contato VARCHAR(160) NOT NULL UNIQUE,
  tipo_contato tipo_contato_boletim NOT NULL,
  consentimento_lgpd BOOLEAN NOT NULL,
  consentimento_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  origem_canal canal_origem NOT NULL DEFAULT 'WEB',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_boletim_consentimento CHECK (consentimento_lgpd)
);

CREATE TRIGGER trg_inscricoes_boletim_atualizado_em
  BEFORE UPDATE ON inscricoes_boletim
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();
