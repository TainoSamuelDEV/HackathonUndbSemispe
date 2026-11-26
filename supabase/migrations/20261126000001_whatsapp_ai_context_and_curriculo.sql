-- ============================================================================
-- Migration UP: 20261126000001_whatsapp_ai_context_and_curriculo.sql
-- Descrição: Evolução do módulo de IA WhatsApp FAROL (contexto grande,
--            idempotência de mensagens, pausa para atendente humano e
--            armazenamento de Currículo Modelo Padrão PDF anexado).
-- ============================================================================

-- 1. Evolução da tabela conversas_whatsapp (sessão rica estilo Anotado)
ALTER TABLE conversas_whatsapp
  ADD COLUMN IF NOT EXISTS remote_jid VARCHAR(80),
  ADD COLUMN IF NOT EXISTS push_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS bot_paused_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS topico_atual VARCHAR(80),
  ADD COLUMN IF NOT EXISTS turnos_sessao INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_conversas_remote_jid
  ON conversas_whatsapp (remote_jid)
  WHERE remote_jid IS NOT NULL;

-- 2. Evolução da tabela mensagens_whatsapp (contexto longo, mídia e idempotência)
ALTER TABLE mensagens_whatsapp
  ADD COLUMN IF NOT EXISTS resumo_midia TEXT,
  ADD COLUMN IF NOT EXISTS metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mensagens_evolution_id_unique
  ON mensagens_whatsapp (evolution_message_id)
  WHERE evolution_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mensagens_conversa_criado
  ON mensagens_whatsapp (conversa_id, criado_em DESC);

-- 3. Evolução da tabela curriculos_arquivos (armazenamento seguro do PDF padrão)
ALTER TABLE curriculos_arquivos
  ADD COLUMN IF NOT EXISTS nome_arquivo VARCHAR(200),
  ADD COLUMN IF NOT EXISTS mime_type VARCHAR(80) NOT NULL DEFAULT 'application/pdf',
  ADD COLUMN IF NOT EXISTS arquivo_base64 TEXT;

CREATE INDEX IF NOT EXISTS idx_curriculos_arquivos_candidato
  ON curriculos_arquivos (candidato_id, criado_em DESC);

-- 4. Função atômica para incrementar turno da conversa e atualizar timestamp
CREATE OR REPLACE FUNCTION fn_incrementar_turno_conversa_whatsapp(
  p_conversa_id UUID
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversas_whatsapp
  SET turnos_sessao = COALESCE(turnos_sessao, 0) + 1,
      ultima_interacao_em = NOW()
  WHERE id = p_conversa_id;
END;
$$;
