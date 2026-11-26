-- =====================================================================
-- FAROL — Imagem de capa dos cursos
-- Exibida como fundo do card no catálogo de cursos e na página principal.
-- Opcional: quando nula (ou inválida no navegador), o portal usa a imagem
-- padrão do tema do curso, servida de /public/cursos/capas.
-- =====================================================================

ALTER TABLE cursos
  ADD COLUMN IF NOT EXISTS imagem_capa_url TEXT;

-- Mesma regra das vagas: apenas URLs https externas ou caminhos locais do portal (/cursos/capas/...).
ALTER TABLE cursos
  DROP CONSTRAINT IF EXISTS cursos_imagem_capa_url_formato;

ALTER TABLE cursos
  ADD CONSTRAINT cursos_imagem_capa_url_formato
  CHECK (
    imagem_capa_url IS NULL
    OR (
      char_length(imagem_capa_url) <= 2000
      AND imagem_capa_url ~* '^(https://[^[:space:]]+|/[^/[:space:]][^[:space:]]*)$'
    )
  );

COMMENT ON COLUMN cursos.imagem_capa_url IS
  'URL https ou caminho local (/cursos/capas/...) da imagem de capa do curso. Nulo = imagem padrão do tema.';
