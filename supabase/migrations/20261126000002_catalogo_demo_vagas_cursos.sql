-- ============================================================================
-- FAROL — Catálogo Completo de Demonstração (Empresas, Vagas, Cursos e Turmas)
-- Migration idempotente: pode ser aplicada sobre bancos com ou sem seed.sql.
-- Todos os registros demonstrativos recebem selo_simulado = TRUE.
-- ============================================================================

-- 1. Usuários e Empresas parceiras de demonstração (hash bcrypt de "123456")
INSERT INTO usuarios (id, email, senha_hash, papel, telefone_whatsapp, whatsapp_verificado)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'rh@portoitacai.com.br', '$2b$10$ogcJqgKAmHXIiPIku56s3ukyDCrDMgqbMxBc1I6xpejzSDAofav2C', 'EMPRESA', NULL, FALSE),
  ('00000000-0000-0000-0000-000000000003', 'contato@inovaslz.com.br', '$2b$10$ogcJqgKAmHXIiPIku56s3ukyDCrDMgqbMxBc1I6xpejzSDAofav2C', 'EMPRESA', NULL, FALSE),
  ('00000000-0000-0000-0000-000000000006', 'rh@atacadaobacanga.com.br', '$2b$10$ogcJqgKAmHXIiPIku56s3ukyDCrDMgqbMxBc1I6xpejzSDAofav2C', 'EMPRESA', NULL, FALSE),
  ('00000000-0000-0000-0000-000000000007', 'talentos@maretech.com.br', '$2b$10$ogcJqgKAmHXIiPIku56s3ukyDCrDMgqbMxBc1I6xpejzSDAofav2C', 'EMPRESA', NULL, FALSE),
  ('00000000-0000-0000-0000-000000000008', 'obras@ilhaforte.com.br', '$2b$10$ogcJqgKAmHXIiPIku56s3ukyDCrDMgqbMxBc1I6xpejzSDAofav2C', 'EMPRESA', NULL, FALSE),
  ('00000000-0000-0000-0000-000000000009', 'gestao@saudedopovo.com.br', '$2b$10$ogcJqgKAmHXIiPIku56s3ukyDCrDMgqbMxBc1I6xpejzSDAofav2C', 'EMPRESA', NULL, FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO empresas (id, usuario_id, cnpj, razao_social, nome_fantasia, eh_mei, setor, bairro, telefone, responsavel_nome, status_validacao)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '12.345.678/0001-90', 'Operações Portuárias Itaqui LTDA', 'Porto Itaqui Logística (Exemplo)', FALSE, 'Logística e Manutenção', 'Itaqui-Bacanga', '9832110000', 'Carla Mendes', 'VERIFICADA'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '98.765.432/0001-10', 'Inova SLZ Soluções Digitais MEI', 'Inova SLZ Startup (Exemplo)', TRUE, 'Tecnologia e Serviços', 'Anjo da Guarda', '98988001122', 'Rafael Sousa', 'VERIFICADA'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000006', '23.456.789/0001-21', 'Atacadão Bacanga Distribuidora LTDA', 'Atacadão Bacanga (Exemplo)', FALSE, 'Comércio e Varejo', 'Vila Embratel', '9832224400', 'Fernanda Lima', 'VERIFICADA'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000007', '34.567.890/0001-32', 'Maré Tech Sistemas LTDA', 'Maré Tech Sistemas (Exemplo)', FALSE, 'Tecnologia e Inovação', 'Renascença', '9832357788', 'Lucas Bastos', 'VERIFICADA'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000008', '45.678.901/0001-43', 'Construtora Ilha Forte Engenharia LTDA', 'Ilha Forte Engenharia (Exemplo)', FALSE, 'Construção Civil e Elétrica', 'Maracanã', '9832449911', 'Roberto Farias', 'VERIFICADA'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000009', '56.789.012/0001-54', 'Clínica Saúde do Povo Itaqui MEI', 'Clínica Saúde do Povo (Exemplo)', TRUE, 'Saúde e Bem-Estar', 'Anjo da Guarda', '98991550022', 'Patrícia Nogueira', 'VERIFICADA')
ON CONFLICT (id) DO NOTHING;

-- 2. Vagas variadas (CLT, Estágio, Jovem Aprendiz, Temporário, Autônomo/MEI; Presencial, Híbrido, Remoto)
INSERT INTO vagas (
  id, empresa_id, titulo, area, descricao, bairro, modalidade, tipo_contratacao,
  quantidade_vagas, salario_min, salario_max, escolaridade_minima, jornada,
  beneficios, aceita_pcd, imagem_capa_url, selo_simulado, status, publicada_em, encerra_em
)
VALUES
  (
    '30000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000004',
    'Analista de Suporte Técnico (Help Desk N1/N2)',
    'Tecnologia da Informação',
    'Atendimento de chamados técnicos N1 e N2 via WhatsApp e plataforma web, diagnóstico de erros em sistemas SaaS e orientação didática a clientes.',
    'Renascença', 'HIBRIDO', 'CLT', 2, 2400.00, 3100.00, 'TECNICO', '40h semanais (segunda a sexta)',
    '["Vale-alimentação", "Auxílio home office", "Plano de saúde"]'::jsonb, TRUE,
    '/vagas/capas/tecnologia.jpg', TRUE, 'PUBLICADA', NOW(), NOW() + INTERVAL '35 days'
  ),
  (
    '30000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000004',
    'Desenvolvedor(a) Front-End Júnior (React / Next.js)',
    'Tecnologia da Informação',
    'Desenvolvimento de interfaces responsivas com React, Next.js e Tailwind CSS, integração com APIs REST e versionamento em Git.',
    'São Luís', 'REMOTO', 'CLT', 2, 3200.00, 4200.00, 'SUPERIOR_INCOMPLETO', '40h semanais (flexível)',
    '["Vale-alimentação", "Auxílio equipamento", "Plano odontológico"]'::jsonb, TRUE,
    '/vagas/capas/tecnologia.jpg', TRUE, 'PUBLICADA', NOW(), NOW() + INTERVAL '40 days'
  ),
  (
    '30000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000002',
    'Estágio em Desenvolvimento Web e Dados',
    'Tecnologia da Informação',
    'Apoio à criação de dashboards, automações de planilhas e manutenção de páginas web da startup no Parque Tecnológico.',
    'Anjo da Guarda', 'HIBRIDO', 'ESTAGIO', 2, 1100.00, NULL, 'SUPERIOR_INCOMPLETO', '30h semanais (6h/dia)',
    '["Bolsa-auxílio", "Vale-transporte", "Mentoria técnica"]'::jsonb, TRUE,
    '/vagas/capas/assistente-atendimento-digital.jpg', TRUE, 'PUBLICADA', NOW(), NOW() + INTERVAL '30 days'
  ),
  (
    '30000000-0000-0000-0000-000000000007',
    '10000000-0000-0000-0000-000000000003',
    'Operador(a) de Caixa e Atendimento ao Cliente',
    'Comércio e vendas',
    'Registro de compras no PDV, fechamento de caixa, recebimento via PIX/cartão e atendimento cordial aos clientes da loja.',
    'Vila Embratel', 'PRESENCIAL', 'CLT', 4, 1620.00, 1850.00, 'MEDIO_COMPLETO', '44h semanais (escala 6x1)',
    '["Vale-transporte", "Vale-alimentação", "Premiação por metas"]'::jsonb, TRUE,
    '/vagas/capas/comercio.jpg', TRUE, 'PUBLICADA', NOW(), NOW() + INTERVAL '25 days'
  ),
  (
    '30000000-0000-0000-0000-000000000008',
    '10000000-0000-0000-0000-000000000003',
    'Jovem Aprendiz — Administrativo e Estoque',
    'Administrativo',
    'Primeira oportunidade profissional com apoio à conferência de mercadorias, organização de documentos e uso básico de planilhas.',
    'Vila Embratel', 'PRESENCIAL', 'JOVEM_APRENDIZ', 3, 920.00, NULL, 'MEDIO_INCOMPLETO', '20h semanais (manhã ou tarde)',
    '["Vale-transporte", "Capacitação teórica certificada"]'::jsonb, TRUE,
    '/vagas/capas/escritorio.jpg', TRUE, 'PUBLICADA', NOW(), NOW() + INTERVAL '30 days'
  ),
  (
    '30000000-0000-0000-0000-000000000009',
    '10000000-0000-0000-0000-000000000005',
    'Eletricista Industrial e Predial',
    'Manutenção e mecânica',
    'Instalação e manutenção de quadros elétricos, motores, iluminação industrial e inspeções preventivas seguindo normas de segurança.',
    'Maracanã', 'PRESENCIAL', 'CLT', 2, 2650.00, 3200.00, 'TECNICO', '44h semanais (segunda a sexta)',
    '["Vale-transporte", "Refeitório no local", "Adicional de periculosidade"]'::jsonb, FALSE,
    '/vagas/capas/industria.jpg', TRUE, 'PUBLICADA', NOW(), NOW() + INTERVAL '35 days'
  ),
  (
    '30000000-0000-0000-0000-000000000010',
    '10000000-0000-0000-0000-000000000001',
    'Operador(a) de Empilhadeira Portuária',
    'Logística e transporte',
    'Movimentação, empilhamento e carregamento de paletes e cargas em pátio logístico próximo ao Porto do Itaqui.',
    'Itaqui-Bacanga', 'PRESENCIAL', 'CLT', 3, 2550.00, 2950.00, 'MEDIO_COMPLETO', 'Turnos / escala',
    '["Vale-transporte", "Vale-alimentação", "Plano de saúde"]'::jsonb, FALSE,
    '/vagas/capas/porto.jpg', TRUE, 'PUBLICADA', NOW(), NOW() + INTERVAL '28 days'
  ),
  (
    '30000000-0000-0000-0000-000000000011',
    '10000000-0000-0000-0000-000000000003',
    'Motorista Entregador(a) — Rotas Urbanas',
    'Logística e transporte',
    'Entrega de pedidos em bairros de São Luís, conferência de romaneio e zelo pelo veículo utilitário da distribuidora.',
    'Cidade Operária', 'PRESENCIAL', 'CLT', 2, 2150.00, 2450.00, 'FUNDAMENTAL_COMPLETO', 'Comercial (segunda a sábado)',
    '["Vale-alimentação", "Seguro de vida", "Ajuda de custo"]'::jsonb, FALSE,
    '/vagas/capas/logistica.jpg', TRUE, 'PUBLICADA', NOW(), NOW() + INTERVAL '30 days'
  ),
  (
    '30000000-0000-0000-0000-000000000012',
    '10000000-0000-0000-0000-000000000006',
    'Recepcionista de Clínica e Agendamento',
    'Administrativo',
    'Recepção humanizada de pacientes, confirmação de consultas via WhatsApp, atualização de cadastro e organização da agenda médica.',
    'Anjo da Guarda', 'PRESENCIAL', 'CLT', 1, 1720.00, NULL, 'MEDIO_COMPLETO', '44h semanais (comercial)',
    '["Vale-transporte", "Vale-alimentação"]'::jsonb, TRUE,
    '/vagas/capas/escritorio.jpg', TRUE, 'PUBLICADA', NOW(), NOW() + INTERVAL '25 days'
  ),
  (
    '30000000-0000-0000-0000-000000000013',
    '10000000-0000-0000-0000-000000000005',
    'Auxiliar de Obras e Manutenção Predial',
    'Construção civil',
    'Apoio em serviços de alvenaria, pintura, reparos hidráulicos e organização de canteiro de obras com uso obrigatório de EPIs.',
    'Maracanã', 'PRESENCIAL', 'TEMPORARIO', 5, 1680.00, NULL, 'FUNDAMENTAL_COMPLETO', '44h semanais',
    '["Vale-transporte", "Refeitório no local", "Kit EPI completo"]'::jsonb, FALSE,
    '/vagas/capas/industria.jpg', TRUE, 'PUBLICADA', NOW(), NOW() + INTERVAL '22 days'
  ),
  (
    '30000000-0000-0000-0000-000000000014',
    '10000000-0000-0000-0000-000000000002',
    'Social Media e Criação de Conteúdo Digital (MEI)',
    'Marketing e comunicação',
    'Produção de artes, vídeos curtos e calendário de postagens para divulgação de pequenos negócios locais em São Luís.',
    'São Luís', 'REMOTO', 'AUTONOMO_MEI', 1, 2000.00, 2600.00, 'MEDIO_COMPLETO', 'Por entregas / flexível',
    '["Trabalho remoto", "Bônus por campanhas"]'::jsonb, TRUE,
    '/vagas/capas/assistente-atendimento-digital.jpg', TRUE, 'PUBLICADA', NOW(), NOW() + INTERVAL '30 days'
  ),
  (
    '30000000-0000-0000-0000-000000000015',
    '10000000-0000-0000-0000-000000000001',
    'Soldador(a) Industrial (Eletrodo / MIG-MAG)',
    'Manutenção e mecânica',
    'Soldagem de estruturas metálicas, reparo de equipamentos portuários e leitura básica de desenhos técnicos industriais.',
    'Itaqui-Bacanga', 'PRESENCIAL', 'CLT', 2, 2900.00, 3500.00, 'MEDIO_COMPLETO', '44h semanais',
    '["Vale-transporte", "Refeitório no local", "Plano de saúde", "Adicional de insalubridade"]'::jsonb, FALSE,
    '/vagas/capas/ajudante-manutencao.jpg', TRUE, 'PUBLICADA', NOW(), NOW() + INTERVAL '35 days'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Requisitos estruturados das novas vagas
INSERT INTO vaga_requisitos (id, vaga_id, nome, nome_normalizado, tipo, obrigatorio)
VALUES
  ('31000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'Atendimento via WhatsApp e Plataformas Web', 'atendimento via whatsapp e plataformas web', 'CONHECIMENTO', TRUE),
  ('31000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', 'Help Desk (N1/N2)', 'help desk (n1/n2)', 'CONHECIMENTO', TRUE),
  ('31000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004', 'Ferramentas de CRM/Tickets', 'ferramentas de crm/tickets', 'CONHECIMENTO', FALSE),
  ('31000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000005', 'React e Next.js', 'react e next.js', 'CONHECIMENTO', TRUE),
  ('31000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 'HTML, CSS e JavaScript', 'html, css e javascript', 'CONHECIMENTO', TRUE),
  ('31000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000005', 'Git e GitHub', 'git e github', 'CONHECIMENTO', FALSE),
  ('31000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000006', 'HTML, CSS e JavaScript', 'html, css e javascript', 'CONHECIMENTO', TRUE),
  ('31000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000006', 'Pacote Office', 'pacote office', 'CONHECIMENTO', FALSE),
  ('31000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000007', 'Atendimento ao público', 'atendimento ao publico', 'CONHECIMENTO', TRUE),
  ('31000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000007', 'Operação de caixa', 'operacao de caixa', 'REQUISITO', FALSE),
  ('31000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000008', 'Informática básica', 'informatica basica', 'CONHECIMENTO', TRUE),
  ('31000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000008', 'Organização e vontade de aprender', 'organizacao e vontade de aprender', 'REQUISITO', FALSE),
  ('31000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000009', 'Instalações elétricas', 'instalacoes eletricas', 'REQUISITO', TRUE),
  ('31000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000009', 'Curso de NR-10', 'curso de nr-10', 'CERTIFICACAO', TRUE),
  ('31000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000009', 'Curso de NR-35', 'curso de nr-35', 'CERTIFICACAO', FALSE),
  ('31000000-0000-0000-0000-000000000016', '30000000-0000-0000-0000-000000000010', 'Operação de empilhadeira', 'operacao de empilhadeira', 'CERTIFICACAO', TRUE),
  ('31000000-0000-0000-0000-000000000017', '30000000-0000-0000-0000-000000000010', 'Controle de estoque', 'controle de estoque', 'CONHECIMENTO', FALSE),
  ('31000000-0000-0000-0000-000000000018', '30000000-0000-0000-0000-000000000011', 'CNH categoria B', 'cnh categoria b', 'REQUISITO', TRUE),
  ('31000000-0000-0000-0000-000000000019', '30000000-0000-0000-0000-000000000011', 'Conhecimento de rotas em São Luís', 'conhecimento de rotas em sao luis', 'CONHECIMENTO', FALSE),
  ('31000000-0000-0000-0000-000000000020', '30000000-0000-0000-0000-000000000012', 'Atendimento ao público', 'atendimento ao publico', 'CONHECIMENTO', TRUE),
  ('31000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000012', 'WhatsApp Business', 'whatsapp business', 'CONHECIMENTO', FALSE),
  ('31000000-0000-0000-0000-000000000022', '30000000-0000-0000-0000-000000000013', 'Noções de obras e manutenção predial', 'nocoes de obras e manutencao predial', 'REQUISITO', TRUE),
  ('31000000-0000-0000-0000-000000000023', '30000000-0000-0000-0000-000000000013', 'Curso de NR-35', 'curso de nr-35', 'CERTIFICACAO', FALSE),
  ('31000000-0000-0000-0000-000000000024', '30000000-0000-0000-0000-000000000014', 'Marketing digital e redes sociais', 'marketing digital e redes sociais', 'CONHECIMENTO', TRUE),
  ('31000000-0000-0000-0000-000000000025', '30000000-0000-0000-0000-000000000014', 'Edição básica de imagens e vídeos', 'edicao basica de imagens e videos', 'CONHECIMENTO', FALSE),
  ('31000000-0000-0000-0000-000000000026', '30000000-0000-0000-0000-000000000015', 'Soldagem básica', 'soldagem basica', 'REQUISITO', TRUE),
  ('31000000-0000-0000-0000-000000000027', '30000000-0000-0000-0000-000000000015', 'Curso de NR-12', 'curso de nr-12', 'CERTIFICACAO', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 4. Cursos variados (Programados com turmas abertas + Sob demanda; Presencial, Híbrido, Remoto)
INSERT INTO cursos (
  id, titulo, area, descricao, competencias_desenvolvidas, instituicao,
  modalidade, carga_horaria, pre_requisitos, tipo, imagem_capa_url, selo_simulado, status
)
VALUES
  (
    '40000000-0000-0000-0000-000000000004',
    'NR-10: Segurança em Instalações e Serviços em Eletricidade',
    'Segurança do trabalho',
    'Formação obrigatória para atuação segura em painéis, redes e manutenção elétrica industrial e predial.',
    '["Curso de NR-10", "Instalações elétricas", "Segurança industrial"]'::jsonb,
    'SEMISPE / SENAI Parceiro', 'PRESENCIAL', 40, 'Ensino Fundamental completo',
    'PROGRAMADO', '/cursos/capas/seguranca.jpg', TRUE, 'ATIVO'
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    'NR-35: Trabalho em Altura com Segurança',
    'Segurança do trabalho',
    'Treinamento teórico e prático sobre uso de cintos, linhas de vida, prevenção de quedas e resgate em altura.',
    '["Curso de NR-35", "Segurança industrial"]'::jsonb,
    'SEMISPE / Parceiro Técnico', 'PRESENCIAL', 8, 'Ensino Fundamental completo',
    'PROGRAMADO', '/cursos/capas/seguranca.jpg', TRUE, 'ATIVO'
  ),
  (
    '40000000-0000-0000-0000-000000000006',
    'Excel Aplicado à Logística e Controle de Estoque',
    'Logística e transporte',
    'Planilhas práticas para inventário, curva ABC, entrada e saída de mercadorias e indicadores de almoxarifado.',
    '["Controle de estoque", "Pacote Office", "Planilhas"]'::jsonb,
    'SEMISPE / Polo Vila Embratel', 'HIBRIDO', 32, 'Informática básica',
    'PROGRAMADO', '/cursos/capas/logistica.jpg', TRUE, 'ATIVO'
  ),
  (
    '40000000-0000-0000-0000-000000000007',
    'Atendimento ao Público, WhatsApp Business e CRM',
    'Administrativo',
    'Técnicas de atendimento humanizado, comunicação clara, organização de mensagens e uso de CRM para pequenas empresas.',
    '["Atendimento ao público", "WhatsApp Business", "Ferramentas de CRM/Tickets"]'::jsonb,
    'SEMISPE / Parque Tecnológico', 'HIBRIDO', 24, NULL,
    'PROGRAMADO', '/cursos/capas/capacitacao.jpg', TRUE, 'ATIVO'
  ),
  (
    '40000000-0000-0000-0000-000000000008',
    'Suporte Técnico em TI e Help Desk (N1/N2)',
    'Tecnologia da Informação',
    'Triagem de incidentes, diagnóstico de sistemas web, redes básicas, registro de tickets e atendimento técnico ao usuário.',
    '["Help Desk (N1/N2)", "Atendimento via WhatsApp e Plataformas Web", "Ferramentas de CRM/Tickets"]'::jsonb,
    'SEMISPE / Comunidade Tech SLZ', 'HIBRIDO', 60, 'Ensino Médio completo ou cursando',
    'PROGRAMADO', '/cursos/capas/informatica.jpg', TRUE, 'ATIVO'
  ),
  (
    '40000000-0000-0000-0000-000000000009',
    'Introdução ao Desenvolvimento Web (HTML, CSS, JS e Git)',
    'Tecnologia da Informação',
    'Trilha prática para construir páginas responsivas, lógica em JavaScript e publicar projetos no GitHub.',
    '["HTML, CSS e JavaScript", "Git e GitHub", "React e Next.js"]'::jsonb,
    'SEMISPE / Parque Tecnológico Digital', 'REMOTO', 80, 'Informática básica',
    'PROGRAMADO', '/cursos/capas/informatica.jpg', TRUE, 'ATIVO'
  ),
  (
    '40000000-0000-0000-0000-000000000010',
    'Operação de Caixa, Vendas e Varejo Moderno',
    'Comércio e vendas',
    'Rotinas de PDV, abertura e fechamento de caixa, pagamentos digitais, prevenção de perdas e abordagem de vendas.',
    '["Operação de caixa", "Atendimento ao público"]'::jsonb,
    'SEMISPE / Polo Cidade Operária', 'PRESENCIAL', 30, NULL,
    'PROGRAMADO', '/vagas/capas/comercio.jpg', TRUE, 'ATIVO'
  ),
  (
    '40000000-0000-0000-0000-000000000011',
    'Soldagem Industrial (Eletrodo Revestido e MIG/MAG)',
    'Manutenção e mecânica',
    'Capacitação prática sob demanda voltada para oficinas, manutenção industrial e cadeia portuária.',
    '["Soldagem básica", "Experiência em oficina"]'::jsonb,
    'SEMISPE (Previsão com parceiros)', 'PRESENCIAL', 80, 'Ensino Fundamental completo',
    'SOB_DEMANDA', '/vagas/capas/industria.jpg', TRUE, 'ATIVO'
  ),
  (
    '40000000-0000-0000-0000-000000000012',
    'Marketing Digital, Redes Sociais e Empreendedorismo MEI',
    'Marketing e comunicação',
    'Criação de conteúdo pelo celular, posicionamento local, precificação e formalização como MEI em São Luís.',
    '["Marketing digital e redes sociais", "Edição básica de imagens e vídeos"]'::jsonb,
    'SEMISPE / SEBRAE Parceiro', 'REMOTO', 20, NULL,
    'SOB_DEMANDA', '/cursos/capas/capacitacao.jpg', TRUE, 'ATIVO'
  )
ON CONFLICT (id) DO NOTHING;

-- 5. Turmas com inscrições abertas para os novos cursos programados
INSERT INTO turmas (
  id, curso_id, codigo_turma, local_bairro, endereco, vagas_totais,
  inscricao_inicio, inscricao_fim, data_inicio, data_fim, horario, responsavel, status
)
VALUES
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', 'NR10-IB-2026-01', 'Itaqui-Bacanga', 'Polo Técnico Itaqui-Bacanga', 25, CURRENT_DATE, CURRENT_DATE + 18, CURRENT_DATE + 24, CURRENT_DATE + 38, '18:30 às 21:30', 'Coordenação SEMISPE', 'INSCRICOES_ABERTAS'),
  ('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000005', 'NR35-MC-2026-01', 'Maracanã', 'Centro Comunitário Maracanã', 30, CURRENT_DATE, CURRENT_DATE + 12, CURRENT_DATE + 16, CURRENT_DATE + 17, '08:00 às 17:00', 'Coordenação SEMISPE', 'INSCRICOES_ABERTAS'),
  ('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000006', 'EXCL-VE-2026-01', 'Vila Embratel', 'Estação Tech Vila Embratel', 35, CURRENT_DATE, CURRENT_DATE + 14, CURRENT_DATE + 20, CURRENT_DATE + 35, '19:00 às 21:00', 'Coordenação SEMISPE', 'INSCRICOES_ABERTAS'),
  ('50000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000007', 'ATD-AG-2026-01', 'Anjo da Guarda', 'Polo Anjo da Guarda', 30, CURRENT_DATE, CURRENT_DATE + 15, CURRENT_DATE + 21, CURRENT_DATE + 32, '14:00 às 17:00', 'Coordenação SEMISPE', 'INSCRICOES_ABERTAS'),
  ('50000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000008', 'HDK-PQT-2026-01', 'Itaqui-Bacanga', 'Parque Tecnológico de São Luís', 25, CURRENT_DATE, CURRENT_DATE + 20, CURRENT_DATE + 25, CURRENT_DATE + 55, '19:00 às 21:30', 'Coordenação SEMISPE', 'INSCRICOES_ABERTAS'),
  ('50000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000009', 'WEB-ON-2026-01', 'São Luís (Online)', 'Ambiente Virtual FAROL', 60, CURRENT_DATE, CURRENT_DATE + 20, CURRENT_DATE + 26, CURRENT_DATE + 75, '19:30 às 21:30', 'Coordenação SEMISPE', 'INSCRICOES_ABERTAS'),
  ('50000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000010', 'CXA-CO-2026-01', 'Cidade Operária', 'Polo Cidade Operária', 30, CURRENT_DATE, CURRENT_DATE + 14, CURRENT_DATE + 19, CURRENT_DATE + 34, '08:30 às 11:30', 'Coordenação SEMISPE', 'INSCRICOES_ABERTAS')
ON CONFLICT (id) DO NOTHING;

-- 6. Pedidos sob demanda extras para enriquecer o ranking do painel SEMISPE
INSERT INTO pedidos_cursos (id, candidato_id, curso_id, tema_desejado, tema_normalizado, motivo, turno_preferido, bairro, origem_canal)
VALUES
  ('80000000-0000-0000-0000-000000000001', NULL, '40000000-0000-0000-0000-000000000011', 'Soldagem Industrial MIG/MAG', 'soldagem industrial mig/mag', 'Alta demanda em oficinas do Itaqui-Bacanga', 'Noturno', 'Itaqui-Bacanga', 'WHATSAPP'),
  ('80000000-0000-0000-0000-000000000002', NULL, '40000000-0000-0000-0000-000000000012', 'Marketing Digital para MEI', 'marketing digital para mei', 'Divulgar pequenos serviços pelo Instagram e WhatsApp', 'Noturno', 'Anjo da Guarda', 'WEB'),
  ('80000000-0000-0000-0000-000000000003', NULL, '40000000-0000-0000-0000-000000000003', 'Operador de Empilhadeira', 'operador de empilhadeira', 'Exigência de vagas portuárias', 'Matutino', 'Vila Maranhão', 'WHATSAPP'),
  ('80000000-0000-0000-0000-000000000004', NULL, NULL, 'Manutenção de Ar-Condicionado Split', 'manutencao de ar-condicionado split', 'Trabalhar como autônomo na região', 'Vespertino', 'Cidade Operária', 'WHATSAPP')
ON CONFLICT (id) DO NOTHING;
