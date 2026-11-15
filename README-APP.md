# Vaga Certa SLZ — plataforma de empregabilidade e capacitação

**Projeto demonstrativo e independente para o Hackathon UNDB**. Inspirado nos fluxos públicos do GO Recife e adaptado à proposta de empregabilidade da região Itaqui-Bacanga, São Luís/MA.

> **IMPORTANTE**: todas as empresas, vagas, cursos, pessoas e inscrições fornecidos por padrão são FICTÍCIOS. Não há parceria oficial com SEMISPE, GO Recife, Vale, EMAP ou outras instituições. O nome da plataforma é provisório e pode ser alterado.

## Abrir a plataforma em seu computador

**Opção A: Windows (mais simples)**

1. Instale Python 3.10 ou superior.
2. Extraia o ZIP para uma pasta.
3. Dê dois cliques em `iniciar-windows.bat`.
4. Acesse **http://127.0.0.1:8000**.

**Opção B: terminal Windows, macOS ou Linux**

```bash
python -m pip install -r backend/requirements.txt
python start.py
```

Acesse **http://127.0.0.1:8000**. Não abra `frontend/index.html` diretamente: o frontend depende do servidor Python e da API.

**Opção C: Docker**

```bash
docker compose up --build
```

Acesse http://127.0.0.1:8000. O banco persistirá no volume `conecta_data`.

## Contas para testar

| Área | E-mail | Senha |
|---|---|---|
| Morador/trabalhador | `morador@demo.slz` | `Demo123!` |
| Empresa | `empresa@demo.slz` | `Demo123!` |
| Gestão SEMISPE | `semispe@demo.slz` | `Demo123!` |

Há atalhos dessas contas na tela de login.

## O que já funciona

- **Página inicial** com navegação, vagas em destaque e cursos.
- **Login e cadastro** para trabalhadores e empresas, perfis separados.
- **Currículo editável e visualização para impressão/PDF**.
- **Vagas**: busca, filtros, página detalhada, critérios e candidatura.
- **Match transparente sem IA**: comparação de habilidades, escolaridade e experiência.
- **Área do candidato**: candidaturas, status, devolutiva da empresa, lacunas, cursos relacionados.
- **Cursos**: catálogo, filtros, detalhamento, inscrição e acompanhamento.
- **Solicitação de novos cursos**: realizada pelo trabalhador e visível no painel da SEMISPE.
- **Área da empresa**: publicação/edição de vagas, consulta de candidatos inscritos e atualização de seleção.
- **Gestão SEMISPE**: indicadores, aprovação de empresas, agrupamento de solicitações, análise de competências e abertura de novos cursos.
- **Serviços de autônomos**: vitrine, publicação e contato.
- **Ajuda**, layout responsivo e documentação Swagger em `/docs`.

## O que fica para a próxima etapa

- WhatsApp Business, IA conversacional, criação de currículo pelo chat e notificações automáticas.
- Fontes reais de vagas, integrações com empresas e instituições formadoras.
- Autenticação cidadã oficial, e-mail, múltiplas permissões administrativas e trilha de auditoria.
- Criação de PDF no servidor (hoje use `Imprimir > Salvar como PDF`).
- Regras reais de matrícula e seleção, consentimento LGPD e segurança de produção.

## Mapa rápido de arquivos

| Quero mudar... | Arquivo |
|---|---|
| Marca, menus e links | `frontend/js/main.js` |
| Layout, cores e responsividade | `frontend/assets/styles.css` |
| Página inicial | `frontend/js/pages/home.js` |
| Vagas e filtros | `frontend/js/pages/jobs.js` |
| Cursos | `frontend/js/pages/courses.js` |
| Currículo e área do candidato | `frontend/js/pages/worker.js` |
| Painel da empresa | `frontend/js/pages/company.js` |
| Painel SEMISPE | `frontend/js/pages/admin.js` |
| Cadastro e login | `frontend/js/pages/auth.js` |
| APIs e permissões | `backend/app/main.py` |
| Banco de dados | `backend/app/database.py` |
| Dados fictícios de início | `backend/app/seed.py` |
| Cálculo de compatibilidade | `backend/app/matching.py` |
| WhatsApp futuro | `integrations/whatsapp.py` |

## Documentação

- [Mapeamento da engenharia reversa](docs/MAPEAMENTO_GO_RECIFE.md)
- [Arquitetura e organização](docs/ARQUITETURA.md)
- [Endpoints e score](docs/API.md)
- `http://127.0.0.1:8000/docs` — OpenAPI do projeto rodando

## Testes

```bash
python -m pip install pytest httpx
python -m pytest backend/tests -q
```

## Licença e limites

Implementação original criada para estudos e demonstração. Nenhum código-fonte privado, marca, logo ou dado pessoal do GO Recife foi reproduzido. **Não utilizar este MVP como serviço público real sem revisão jurídica, de segurança, de acessibilidade, LGPD e validação dos processos institucionais.**
