-- =====================================================================
-- FAROL — Conteúdo de demonstração da página "Editais e eventos"
-- Todos os registros são marcados com selo_simulado = TRUE (badge "Exemplo" no portal).
-- Datas relativas ao dia em que a migration é aplicada, no horário de São Luís (UTC-3).
-- =====================================================================

INSERT INTO editais (id, titulo, organizacao, resumo, publico_alvo, beneficio, inscricoes_ate, prazo_descricao, link_url, tags, selo_simulado)
VALUES
  ('60000000-0000-0000-0000-000000000001',
   'CPSI Porto do Itaqui — Contratação Pública de Soluções Inovadoras',
   'EMAP · Porto do Itaqui',
   'Chamada para startups e empresas apresentarem soluções tecnológicas para desafios logísticos, operacionais e de sustentabilidade do Porto do Itaqui.',
   'Startups, empresas e ICTs', 'Até R$ 100 mil por contrato',
   NULL, 'Chamada em fluxo contínuo',
   'https://www.portodoitaqui.com', '["Startups", "Inovação aberta", "Porto do Itaqui"]'::jsonb, TRUE),
  ('60000000-0000-0000-0000-000000000002',
   'Residência em Inovação Portuária',
   'FAPEMA · Porto do Itaqui',
   'Seleção de residentes para projetos de pesquisa aplicada e transformação digital no ecossistema portuário de São Luís, com duração de 12 meses.',
   'Estudantes e recém-formados', 'Bolsas de R$ 3.000 a R$ 5.500 por mês',
   CURRENT_DATE + 20, NULL,
   'https://www.fapema.br', '["Bolsas", "Pesquisa aplicada", "Itaqui-Bacanga"]'::jsonb, TRUE),
  ('60000000-0000-0000-0000-000000000003',
   'PISIM — Programa de Incubação de Startups Inova Maranhão',
   'SECTI-MA · FAPEMA',
   'Programa estadual que acompanha startups maranhenses da validação da ideia ao mercado, com incubação, mentorias e rede de parceiros.',
   'Empreendedores e startups', 'Incubação e mentorias',
   CURRENT_DATE + 45, NULL,
   'https://www.fapema.br', '["Incubação", "Startups", "Mentoria"]'::jsonb, TRUE),
  ('60000000-0000-0000-0000-000000000004',
   'Banco de Talentos e Vagas de Estágio',
   'IEL Maranhão · Sistema FIEMA',
   'Cadastro de estudantes de nível técnico e superior para oportunidades de estágio em empresas e indústrias do Maranhão.',
   'Estudantes de nível técnico e superior', 'Estágio remunerado',
   NULL, 'Cadastro em fluxo contínuo',
   'https://carreiras.iel.org.br', '["Estágio", "Primeiro emprego", "Indústria"]'::jsonb, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO eventos (id, titulo, organizacao, resumo, inicio, fim, local, modalidade, gratuito, tags, selo_simulado)
VALUES
  ('70000000-0000-0000-0000-000000000001',
   'Imersão Tech e IA na Prática',
   'SECTI · SEBRAE · Comunidade Tech SLZ',
   'Oficinas práticas de inteligência artificial generativa e prototipagem rápida, com espaço para conexão entre estudantes, desenvolvedores e startups locais.',
   ((CURRENT_DATE + 6) + TIME '14:00') AT TIME ZONE 'America/Fortaleza',
   ((CURRENT_DATE + 6) + TIME '18:00') AT TIME ZONE 'America/Fortaleza',
   'Centro Histórico, São Luís', 'PRESENCIAL', TRUE, '["IA", "Oficina", "Networking"]'::jsonb, TRUE),
  ('70000000-0000-0000-0000-000000000002',
   'Meetup Ecossistema SLZ: do código ao produto',
   'Comunidades tech de São Luís',
   'Painel com fundadores de startups maranhenses sobre produto, contratação de talentos em início de carreira e oportunidades de mercado.',
   ((CURRENT_DATE + 9) + TIME '19:00') AT TIME ZONE 'America/Fortaleza',
   ((CURRENT_DATE + 9) + TIME '21:30') AT TIME ZONE 'America/Fortaleza',
   'Parque Tecnológico de São Luís · Itaqui-Bacanga', 'PRESENCIAL', TRUE, '["Startups", "Comunidade", "Carreira"]'::jsonb, TRUE),
  ('70000000-0000-0000-0000-000000000003',
   'Encontro da Governança do Ecossistema de Inovação',
   'SEMISPE e instituições parceiras',
   'Alinhamento dos grupos de trabalho de academia, empresas, governo e sociedade civil para o plano de ações de inovação da capital.',
   ((CURRENT_DATE + 14) + TIME '09:00') AT TIME ZONE 'America/Fortaleza',
   ((CURRENT_DATE + 14) + TIME '12:00') AT TIME ZONE 'America/Fortaleza',
   'Cidade Operária, São Luís', 'HIBRIDO', TRUE, '["Governança", "Políticas públicas"]'::jsonb, TRUE),
  ('70000000-0000-0000-0000-000000000004',
   'Trilha de Qualificação: negócios digitais e mercado de trabalho',
   'SEMISPE',
   'Orientação sobre currículo, competências digitais mais procuradas pelas empresas de São Luís e caminhos para empreender.',
   ((CURRENT_DATE + 21) + TIME '18:30') AT TIME ZONE 'America/Fortaleza',
   ((CURRENT_DATE + 21) + TIME '20:30') AT TIME ZONE 'America/Fortaleza',
   'Transmissão online', 'ONLINE', TRUE, '["Qualificação", "Empregabilidade"]'::jsonb, TRUE)
ON CONFLICT (id) DO NOTHING;
