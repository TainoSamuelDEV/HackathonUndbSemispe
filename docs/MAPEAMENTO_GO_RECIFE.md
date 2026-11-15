# Engenharia reversa funcional — GO Recife → Vaga Certa SLZ

**Data da análise:** 14/11/2026
**Abordagem:** estudo das páginas e descrições publicamente acessíveis, incluindo documentação oficial municipal. **Não houve acesso autorizado ao código privado, infraestrutura, banco de dados, endpoints privados, painéis restritos ou segredos da plataforma de Recife.**

## 1. Funcionalidades observáveis, evidências e adaptação

| Funcionalidade do GO Recife | Evidência pública | Implementação Vaga Certa SLZ | Onde modificar |
|---|---|---|---|
| Página inicial e rotas por público | https://gorecife.recife.pe.gov.br/ | Página inicial, navegação e chamadas para ação | `frontend/js/pages/home.js` |
| Listagem, filtros e detalhes de vagas | https://gorecife.recife.pe.gov.br/oportunidades | Listagem com busca, bairro, escolaridade, modalidade, experiência e PcD, além de detalhes | `frontend/js/pages/jobs.js`, `/api/jobs` |
| Perfil e currículo do trabalhador | https://conecta.recife.pe.gov.br/servico/768 | Cadastro, edição de currículo e impressão em PDF pelo navegador | `frontend/js/pages/worker.js`, `/api/profile` |
| Inscrição nas vagas e acompanhamento | https://gorecife.recife.pe.gov.br/ajuda | Candidaturas e estados do processo seletivo | `/api/applications`, `worker.js` |
| Empresa cadastra vagas e gerencia seleção | https://solucoes.emprel.gov.br/servico/go-recife/ | Portal da empresa, criação/edição de vaga e avaliação de candidaturas | `frontend/js/pages/company.js`, `/api/company` |
| Catálogo de cursos e inscrições | https://gorecife.recife.pe.gov.br/cursos | Cursos, filtros, inscrições, painéis pessoais | `frontend/js/pages/courses.js`, `/api/courses` |
| Vitrine de autônomos e contratação | https://gorecife.recife.pe.gov.br/cidadao/encontrar-profissionais | Catálogo de serviços, divulgação e envio de mensagem | `frontend/js/pages/services.js`, `/api/services` |
| Perguntas frequentes | https://gorecife.recife.pe.gov.br/ajuda | Central de ajuda adaptada | `frontend/js/pages/info.js` |
| Notificação de seleção por WhatsApp | https://gorecife.recife.pe.gov.br/ajuda | **Planejada, não implementada nesta versão** | `integrations/whatsapp.py` |
| Busca por localização, similaridade e voz (lançamento de set/2026) | https://www2.recife.pe.gov.br/noticias/03/09/2026/plataforma-go-recife-estreia-novas-funcionalidades-para-populacao-encontrar | Filtros geográficos de bairro e score determinístico local, **sem voz, GPS ou IA** | `backend/app/matching.py` |

## 2. Diferenciais do Vaga Certa SLZ

- Fluxos centrados nas necessidades do **Itaqui-Bacanga e de São Luís**.
- Explicação auditável de compatibilidade com vagas (70% competências, 20% escolaridade, 10% experiência), **não é probabilidade de contratação**.
- Devolutiva real registrada pela empresa; caso não haja motivo, o produto mostra apenas requisitos faltantes.
- Recomendações de cursos a partir das competências declaradas como ausentes.
- Solicitação de novos cursos por moradores e consolidação por interesse de pessoas únicas.
- Painel SEMISPE com dados fictícios de demonstração de demanda empresarial e formação.
- Área de validação de empresas, para evitar auto publicação imediata por perfis não verificados.

## 3. Elementos NÃO inspecionados / não reproduzidos

- Código-fonte original, CSS, scripts, banco de dados e algoritmos do GO Recife.
- Autenticação governamental Conecta Recife, facial/biometria, integrações com SINE e parceiros.
- Algoritmo real de classificação de candidatos e score do GO Recife (não disponível).
- Notificações reais via WhatsApp, integração com vagas reais e processos externos.
- Fluxos reais de MEI, compras públicas, agendamento, serviços municipais e sites gerados com IA (fora do escopo prioritário).
- Regras e processos de matrícula em cursos de fornecedores reais.
- Interface pixel-perfect: aplicação original é protegida por direitos autorais, identidade visual é própria.

## 4. Delimitação de segurança

Não utilizar scraping de dados pessoais de candidatos, burlar autenticação, acessar API interna sem permissão, copiar marcas/logos/código de terceiros ou cadastrar vagas de empresas reais sem fontes oficiais/parcerias. Para implantação pública, documentar LGPD, consentimento, retenção e requisitos de acessibilidade.

## 5. Auditoria e fontes verificáveis

- https://gorecife.recife.pe.gov.br/
- https://gorecife.recife.pe.gov.br/oportunidades
- https://gorecife.recife.pe.gov.br/cursos
- https://gorecife.recife.pe.gov.br/ajuda
- https://conecta.recife.pe.gov.br/servico/768
- https://conecta.recife.pe.gov.br/servico/483
- https://conecta.recife.pe.gov.br/servico/769
- https://solucoes.emprel.gov.br/servico/go-recife/
- https://www2.recife.pe.gov.br/noticias/03/09/2026/plataforma-go-recife-estreia-novas-funcionalidades-para-populacao-encontrar

Estas fontes sustentam as capacidades e fluxos descritos acima; campos internos não foram inferidos como fatos.
