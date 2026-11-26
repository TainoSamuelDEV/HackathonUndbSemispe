-- =====================================================================
-- FAROL — Imagem de capa das vagas
-- Exibida como fundo do card no catálogo e no topo da página de detalhe.
-- Opcional: quando nula (ou inválida no navegador), o portal usa a imagem
-- padrão da área da vaga, servida de /public/vagas/capas.
-- =====================================================================

ALTER TABLE vagas
  ADD COLUMN IF NOT EXISTS imagem_capa_url TEXT;

-- Aceita apenas URLs https externas ou caminhos locais do próprio portal (/vagas/capas/...).
ALTER TABLE vagas
  DROP CONSTRAINT IF EXISTS vagas_imagem_capa_url_formato;

ALTER TABLE vagas
  ADD CONSTRAINT vagas_imagem_capa_url_formato
  CHECK (
    imagem_capa_url IS NULL
    OR (
      char_length(imagem_capa_url) <= 2000
      AND imagem_capa_url ~* '^(https://[^[:space:]]+|/[^/[:space:]][^[:space:]]*)$'
    )
  );

COMMENT ON COLUMN vagas.imagem_capa_url IS
  'URL https ou caminho local (/vagas/capas/...) da imagem de capa da vaga. Nulo = imagem padrão da área.';
