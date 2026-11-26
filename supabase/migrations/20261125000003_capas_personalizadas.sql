-- =====================================================================
-- FAROL — Capas personalizadas das vagas e cursos de demonstração
-- Cada registro recebe uma foto específica do seu cargo/curso (antes usavam a capa genérica da área).
--
-- Fotos — Unsplash License (uso comercial livre, sem atribuição obrigatória):
--  vagas/capas/ajudante-manutencao.jpg            → unsplash.com/photos/LMb98OOtoYU (colsan ltda)
--  vagas/capas/assistente-atendimento-digital.jpg → unsplash.com/photos/wnpf3Q5pkXA (BaljkanN4)
--  vagas/capas/auxiliar-logistica.jpg             → unsplash.com/photos/ZlOlRnWk8zU (Centre for Ageing Better)
--  cursos/capas/informatica-pacote-office.jpg     → unsplash.com/photos/hpbduAj7wew (Rodrigo Rodrigues | WOLF Λ R T)
--  cursos/capas/nr12-seguranca-maquinas.jpg       → unsplash.com/photos/ZJzv93F6F1U (TECNIC Bioprocess Solutions)
--  cursos/capas/operador-empilhadeira-portuaria.jpg → unsplash.com/photos/yx20mpDyr2I (Timelab)
-- =====================================================================

UPDATE vagas SET imagem_capa_url = '/vagas/capas/ajudante-manutencao.jpg'
WHERE id = '30000000-0000-0000-0000-000000000001';

UPDATE vagas SET imagem_capa_url = '/vagas/capas/auxiliar-logistica.jpg'
WHERE id = '30000000-0000-0000-0000-000000000002';

UPDATE vagas SET imagem_capa_url = '/vagas/capas/assistente-atendimento-digital.jpg'
WHERE id = '30000000-0000-0000-0000-000000000003';

UPDATE cursos SET imagem_capa_url = '/cursos/capas/nr12-seguranca-maquinas.jpg'
WHERE id = '40000000-0000-0000-0000-000000000001';

UPDATE cursos SET imagem_capa_url = '/cursos/capas/informatica-pacote-office.jpg'
WHERE id = '40000000-0000-0000-0000-000000000002';

UPDATE cursos SET imagem_capa_url = '/cursos/capas/operador-empilhadeira-portuaria.jpg'
WHERE id = '40000000-0000-0000-0000-000000000003';
