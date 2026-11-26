-- ============================================================================
-- FAROL — Seed Inicial (Dados Demonstrativos Identificados)
-- Senha padrão de demonstração para todos os usuários: "123456"
-- ============================================================================

-- Hash bcrypt de "123456"
INSERT INTO usuarios (id, email, senha_hash, papel, telefone_whatsapp, whatsapp_verificado)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@farol.slz.br', '$2b$10$ogcJqgKAmHXIiPIku56s3ukyDCrDMgqbMxBc1I6xpejzSDAofav2C', 'ADMIN_SEMISPE', NULL, FALSE),
  ('00000000-0000-0000-0000-000000000002', 'rh@portoitacai.com.br', '$2b$10$ogcJqgKAmHXIiPIku56s3ukyDCrDMgqbMxBc1I6xpejzSDAofav2C', 'EMPRESA', NULL, FALSE),
  ('00000000-0000-0000-0000-000000000003', 'contato@inovaslz.com.br', '$2b$10$ogcJqgKAmHXIiPIku56s3ukyDCrDMgqbMxBc1I6xpejzSDAofav2C', 'EMPRESA', NULL, FALSE),
  ('00000000-0000-0000-0000-000000000004', 'marcos.silva@exemplo.com', '$2b$10$ogcJqgKAmHXIiPIku56s3ukyDCrDMgqbMxBc1I6xpejzSDAofav2C', 'CANDIDATO', '5598991234567', TRUE),
  ('00000000-0000-0000-0000-000000000005', 'ana.costa@exemplo.com', '$2b$10$ogcJqgKAmHXIiPIku56s3ukyDCrDMgqbMxBc1I6xpejzSDAofav2C', 'CANDIDATO', '5598992345678', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO empresas (id, usuario_id, cnpj, razao_social, nome_fantasia, eh_mei, setor, bairro, telefone, responsavel_nome, status_validacao)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '12.345.678/0001-90', 'Operações Portuárias Itaqui LTDA', 'Porto Itaqui Logística (Exemplo)', FALSE, 'Logística e Manutenção', 'Itaqui-Bacanga', '9832110000', 'Carla Mendes', 'VERIFICADA'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '98.765.432/0001-10', 'Inova SLZ Soluções Digitais MEI', 'Inova SLZ Startup (Exemplo)', TRUE, 'Tecnologia e Serviços', 'Anjo da Guarda', '98988001122', 'Rafael Sousa', 'VERIFICADA')
ON CONFLICT (id) DO NOTHING;

INSERT INTO candidatos (id, usuario_id, nome_completo, nome_exibicao, bairro, escolaridade, area_interesse, objetivo, resumo_profissional, disponibilidade, consentimento_lgpd, consentimento_em, visivel_servicos, categoria_servicos)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'Marcos Vinícius Silva', 'Marcos Silva', 'Anjo da Guarda', 'MEDIO_COMPLETO', 'Manutenção e mecânica', 'Atuar como ajudante de manutenção ou mecânica industrial no Itaqui-Bacanga.', '6 anos de experiência como ajudante em oficina mecânica e noções práticas de solda.', 'Turnos e escalas', TRUE, NOW(), TRUE, 'Manutenção e Reparos'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'Ana Paula Costa', 'Ana Costa', 'Vila Embratel', 'TECNICO', 'Administrativo e Atendimento', 'Vaga em atendimento, recepção ou apoio administrativo.', 'Técnica em Administração com prática em planilhas, atendimento ao público e organização de estoque.', 'Horário comercial', TRUE, NOW(), TRUE, 'Apoio Administrativo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO candidato_competencias (candidato_id, nome, nome_normalizado, tipo)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'Experiência em oficina', 'experiencia em oficina', 'REQUISITO'),
  ('20000000-0000-0000-0000-000000000001', 'Soldagem básica', 'soldagem basica', 'CONHECIMENTO'),
  ('20000000-0000-0000-0000-000000000002', 'Atendimento ao público', 'atendimento ao publico', 'CONHECIMENTO'),
  ('20000000-0000-0000-0000-000000000002', 'Pacote Office', 'pacote office', 'CONHECIMENTO'),
  ('20000000-0000-0000-0000-000000000002', 'Controle de estoque', 'controle de estoque', 'CONHECIMENTO')
ON CONFLICT (candidato_id, nome_normalizado) DO NOTHING;

INSERT INTO vagas (id, empresa_id, titulo, area, descricao, bairro, modalidade, tipo_contratacao, quantidade_vagas, salario_min, escolaridade_minima, jornada, imagem_capa_url, selo_simulado, status, publicada_em, encerra_em)
VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ajudante de Manutenção Industrial', 'Manutenção e mecânica', 'Apoio às rotinas de manutenção preventiva e corretiva em equipamentos de pátio e oficina.', 'Itaqui-Bacanga', 'PRESENCIAL', 'CLT', 3, 1850.00, 'MEDIO_COMPLETO', '44h semanais (escala)', '/vagas/capas/ajudante-manutencao.jpg', TRUE, 'PUBLICADA', NOW(), NOW() + INTERVAL '30 days'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Auxiliar de Logística e Almoxarifado', 'Logística e transporte', 'Conferência de materiais, organização de estoque e apoio ao carregamento.', 'Vila Maranhão', 'PRESENCIAL', 'CLT', 2, 1750.00, 'MEDIO_COMPLETO', 'Comercial', '/vagas/capas/auxiliar-logistica.jpg', TRUE, 'PUBLICADA', NOW(), NOW() + INTERVAL '25 days'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Assistente de Atendimento Digital', 'Administrativo', 'Atendimento a clientes, organização de planilhas e suporte operacional a startup local.', 'Anjo da Guarda', 'HIBRIDO', 'CLT', 1, 1900.00, 'MEDIO_COMPLETO', 'Segunda a sexta', '/vagas/capas/assistente-atendimento-digital.jpg', TRUE, 'PUBLICADA', NOW(), NOW() + INTERVAL '20 days')
ON CONFLICT (id) DO UPDATE SET imagem_capa_url = EXCLUDED.imagem_capa_url;

INSERT INTO vaga_requisitos (vaga_id, nome, nome_normalizado, tipo, obrigatorio)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'Experiência em oficina', 'experiencia em oficina', 'REQUISITO', TRUE),
  ('30000000-0000-0000-0000-000000000001', 'Curso de NR-12', 'curso de nr-12', 'CERTIFICACAO', FALSE),
  ('30000000-0000-0000-0000-000000000002', 'Controle de estoque', 'controle de estoque', 'CONHECIMENTO', TRUE),
  ('30000000-0000-0000-0000-000000000002', 'Operação de empilhadeira', 'operacao de empilhadeira', 'CERTIFICACAO', FALSE),
  ('30000000-0000-0000-0000-000000000003', 'Atendimento ao público', 'atendimento ao publico', 'CONHECIMENTO', TRUE),
  ('30000000-0000-0000-0000-000000000003', 'Pacote Office', 'pacote office', 'CONHECIMENTO', FALSE);

INSERT INTO cursos (id, titulo, area, descricao, competencias_desenvolvidas, instituicao, modalidade, carga_horaria, tipo, imagem_capa_url, selo_simulado, status)
VALUES
  ('40000000-0000-0000-0000-000000000001', 'NR-12: Segurança no Trabalho em Máquinas e Equipamentos', 'Segurança do trabalho', 'Capacitação gratuita para operação segura de máquinas industriais e prevenção de acidentes.', '["Curso de NR-12", "Segurança industrial"]'::jsonb, 'SEMISPE / Parceiro Técnico', 'PRESENCIAL', 16, 'PROGRAMADO', '/cursos/capas/nr12-seguranca-maquinas.jpg', TRUE, 'ATIVO'),
  ('40000000-0000-0000-0000-000000000002', 'Informática Básica e Pacote Office para o Trabalho', 'Administrativo', 'Uso prático de computador, planilhas, documentos e comunicação profissional.', '["Pacote Office", "Atendimento ao público"]'::jsonb, 'SEMISPE / Polo Itaqui-Bacanga', 'PRESENCIAL', 40, 'PROGRAMADO', '/cursos/capas/informatica-pacote-office.jpg', TRUE, 'ATIVO'),
  ('40000000-0000-0000-0000-000000000003', 'Operador de Empilhadeira e Logística Portuária', 'Logística e transporte', 'Formação sob demanda para movimentação de cargas no eixo Itaqui-Bacanga.', '["Operação de empilhadeira", "Controle de estoque"]'::jsonb, 'SEMISPE (Previsão com parceiros)', 'PRESENCIAL', 60, 'SOB_DEMANDA', '/cursos/capas/operador-empilhadeira-portuaria.jpg', TRUE, 'ATIVO')
ON CONFLICT (id) DO UPDATE SET imagem_capa_url = EXCLUDED.imagem_capa_url;

INSERT INTO turmas (id, curso_id, codigo_turma, local_bairro, vagas_totais, inscricao_inicio, inscricao_fim, data_inicio, data_fim, horario, responsavel, status)
VALUES
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'NR12-IB-2026-01', 'Itaqui-Bacanga', 30, CURRENT_DATE, CURRENT_DATE + 15, CURRENT_DATE + 20, CURRENT_DATE + 24, '18:30 às 21:30', 'Coordenação SEMISPE', 'INSCRICOES_ABERTAS'),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'INFO-AG-2026-01', 'Anjo da Guarda', 25, CURRENT_DATE, CURRENT_DATE + 15, CURRENT_DATE + 22, CURRENT_DATE + 45, '14:00 às 17:00', 'Coordenação SEMISPE', 'INSCRICOES_ABERTAS')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pedidos_cursos (candidato_id, curso_id, tema_desejado, tema_normalizado, motivo, turno_preferido, bairro, origem_canal)
VALUES
  ('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 'Operador de Empilhadeira', 'operador de empilhadeira', 'Exigido em vagas do eixo portuário', 'Noturno', 'Anjo da Guarda', 'WHATSAPP'),
  ('20000000-0000-0000-0000-000000000002', NULL, 'Excel Avançado para Logística', 'excel avancado para logistica', 'Melhorar currículo administrativo', 'Vespertino', 'Vila Embratel', 'WEB');
