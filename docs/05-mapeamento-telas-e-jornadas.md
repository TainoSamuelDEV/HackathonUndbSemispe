# 05. Mapeamento de Telas, Design System e Jornadas — FAROL

> **Projeto:** **FAROL** — *Formação, Ações e Rede de Oportunidades Locais*  
> **Referência Visual:** Brandbook do **Parque Tecnológico de São Luís (SEMISPE)**  
> **Referência Estrutural:** [GO_Sao_Luis_Mapeamento_Frontend.md](./contexto/GO_Sao_Luis_Mapeamento_Frontend.md)

Este documento consolida o mapa de rotas Next.js App Router, a identidade visual oficial aplicada ao **FAROL** e o catálogo de telas que unem o **Painel de Vagas**, **Candidatos**, **Acesso a Cursos** e **IA FAROL (WhatsApp)**.

---

## 1. Design System Obrigatório (Parque Tecnológico → FAROL)

### 1.1 Tokens Oficiais
```css
:root {
  --color-primary: #0162A7;  /* Azul Institucional — títulos, navegação, links e botões padrão */
  --color-sky: #009CDC;      /* Azul Céu — apenas texto grande >= 24px sobre branco */
  --color-green: #0A7B36;    /* Verde Mata — sucesso, confirmação e WhatsApp */
  --color-leaf: #93C05F;     /* Verde Folha — apoio gráfico (nunca texto) */
  --color-sun: #FADC00;      /* Amarelo Sol — máximo 1 CTA de destaque por tela */
  --color-ink: #0B2540;      /* Texto principal e fundo do Footer */
  --color-mist: #F3F8FC;     /* Fundo suave de seções */
  --color-white: #FFFFFF;
  --font-heading: "Outfit", sans-serif;
  --font-body: "Inter", sans-serif;
  --radius-md: 12px;         /* Botões e inputs */
  --radius-lg: 16px;         /* Cards e imagens */
  --container: 1200px;       /* Grid 12 colunas, gutter 24px */
}
```

### 1.2 Regras Visuais e Acessibilidade
* **Mobile-first obrigatório** (breakpoints: `640px`, `1024px`, `1280px`), dado o uso central via celular e WhatsApp.
* **Alvos de toque:** mínimo de `44px` de altura em botões, links de menu e chips.
* **Sem degradês decorativos ou sombras pesadas:** priorizar espaço em branco, bordas finas e clareza.
* **Selo de Demonstração:** qualquer vaga ou curso fictício usado na apresentação deve exibir badge explícito `"Exemplo / Simulado"`.
* **Formatação Brasileira:** datas `dd/mm/aaaa`, moeda `R$ 1.800,00`, horários `HH:mm`, bairro + `"São Luís – MA"`.

---

## 2. Sitemap e Route Groups (Next.js App Router)

### 2.1 Menu Público (6 entradas fixas)
`Página Principal` (`/`) · `Vagas` (`/vagas`) · `Cursos` (`/cursos`) · `Meu Currículo` (`/meu-curriculo`) · `Sobre o FAROL` (`/sobre`) · `Entrar` (`/entrar`)

| Grupo App Router | Rota | Tela | Acesso | Prioridade |
| :--- | :--- | :--- | :--- | :---: |
| `(publico)` | `/` | Página Principal (Hero, busca rápida, caminhos, destaques, entrada IA FAROL) | Público | P0 |
| `(publico)` | `/vagas` | Catálogo de Vagas com filtros laterais/drawer na URL | Público | P0 |
| `(publico)` | `/vagas/[id]` | Detalhe da Vaga + Painel de Score (somente candidato logado) | Público | P0 |
| `(publico)` | `/cursos` | Catálogo de Cursos (abas: Turmas Abertas vs. Sob Demanda) | Público | P0 |
| `(publico)` | `/cursos/[id]` | Detalhe do Curso / Turma + Solicitar Inscrição ou Interesse | Público | P0 |
| `(publico)` | `/sobre` | Sobre o FAROL, SEMISPE, foco Itaqui-Bacanga e futuro Parque | Público | P0 |
| `(publico)` | `/editais-e-eventos` | Editais abertos, próximos eventos (com .ics) e inscrição no boletim. `/newsletter` redireciona (308) | Público | P1 |
| `(auth)` | `/entrar` | Login próprio (e-mail/senha) | Público | P0 |
| `(auth)` | `/cadastro` | Seleção de perfil (Pessoa Física ou Empresa/Startup) | Público | P0 |
| `(auth)` | `/cadastro/pessoa` | Cadastro de Candidato | Público | P0 |
| `(auth)` | `/cadastro/empresa` | Cadastro de Empresa (CNPJ/MEI) | Público | P0 |
| `(candidato)` | `/painel` | Painel do Candidato (atalhos, perfil, status, CTA WhatsApp) | `CANDIDATO` | P0 |
| `(candidato)` | `/meu-curriculo` | Controle do Currículo (manual, upload ou IA FAROL) + PDF | `CANDIDATO` | P0 |
| `(candidato)` | `/meu-curriculo/editar` | Formulário em etapas (Stepper) do currículo estruturado | `CANDIDATO` | P0 |
| `(candidato)` | `/meu-curriculo/ia` | Vinculação segura com WhatsApp e entrada para a IA FAROL | `CANDIDATO` | P0 |
| `(candidato)` | `/minhas-candidaturas` | Pipeline de candidaturas e linha do tempo de eventos | `CANDIDATO` | P0 |
| `(candidato)` | `/meus-cursos` | Solicitações em turmas, interesses sob demanda e certificados | `CANDIDATO` | P0 |
| `(candidato)` | `/perfil` | Dados de conta, consentimentos LGPD, visibilidade Serviços e WhatsApp | `CANDIDATO` | P0 |
| `(empresa)` | `/empresa` | Visão Geral da Organização (sem métricas globais ou score) | `EMPRESA` | P0 |
| `(empresa)` | `/empresa/vagas` | Gestão de vagas próprias | `EMPRESA` | P0 |
| `(empresa)` | `/empresa/vagas/nova` | Publicar nova vaga com requisitos obrigatórios/desejáveis | `EMPRESA` | P0 |
| `(empresa)` | `/empresa/vagas/[id]/editar` | Editar ou encerrar vaga | `EMPRESA` | P0 |
| `(empresa)` | `/empresa/vagas/[id]/candidatos` | Candidaturas da vaga (**sem exibir score de match**) | `EMPRESA` | P0 |
| `(empresa)` | `/empresa/servicos` | Diretório de busca de profissionais (apenas opt-in autorizado) | `EMPRESA` | P0 |
| `(empresa)` | `/empresa/perfil` | Dados da organização e situação cadastral | `EMPRESA` | P0 |
| `(admin)` | `/admin` | Dashboard Executivo SEMISPE | `ADMIN_SEMISPE` | P0 |
| `(admin)` | `/admin/empresas` | Gestão e validação básica de empresas | `ADMIN_SEMISPE` | P0 |
| `(admin)` | `/admin/usuarios` | Gestão de candidatos/profissionais | `ADMIN_SEMISPE` | P0 |
| `(admin)` | `/admin/vagas` | Monitoramento global de vagas | `ADMIN_SEMISPE` | P0 |
| `(admin)` | `/admin/cursos` | Gestão de cursos, turmas, matrículas, frequência e certificados | `ADMIN_SEMISPE` | P0 |
| `(admin)` | `/admin/cursos/demandas` | Ranking de Pedidos de Cursos (Portal + IA FAROL WhatsApp) | `ADMIN_SEMISPE` | P0 |
| `(admin)` | `/admin/atendimentos` | Fila de encaminhamentos humanos vindos da IA FAROL | `ADMIN_SEMISPE` | P0 |
| `(admin)` | `/admin/indicadores` | Relatórios por período, bairro e área | `ADMIN_SEMISPE` | P1 |

---

## 3. Jornadas Integradas (Portal Web + IA FAROL)

### J1 — Cidadão via WhatsApp (IA FAROL) refletindo no Portal
1. Morador envia mensagem ou áudio para o WhatsApp conectado à **Evolution API**.
2. **IA FAROL** se apresenta, explica a finalidade dos dados e solicita consentimento LGPD (`1 - Sim / 2 - Não`).
3. Conduz triagem rápida (1 pergunta por vez) ou recebe currículo em PDF/foto, confirmando os dados extraídos antes de salvar via `/api/ai/candidatos/[id]/perfil`.
4. Consulta `/api/ai/vagas/match` e apresenta até 3 vagas com explicação clara do que atende e do que falta (sem prometer contratação).
5. Cidadão confirma interesse → IA registra via `POST /api/ai/candidaturas` → candidatura aparece imediatamente em `/minhas-candidaturas` no site e em `/empresa/vagas/[id]/candidatos`.

### J2 — Feedback + Recomendação de Cursos + Pedido de Demanda
1. Se o candidato não for aprovado em uma vaga, a IA FAROL (ou o portal) explica as lacunas reais retornadas pelo motor determinístico.
2. Sistema consulta `/api/ai/cursos/recomendados` cruzando as lacunas com cursos gratuitos da SEMISPE.
3. Caso não exista curso para aquela necessidade, o cidadão registra um **Pedido de Curso** (`POST /api/ai/cursos/pedidos`), que alimenta em tempo real o **Ranking de Demandas** em `/admin/cursos/demandas`.

### J3 — Empresa Publicando Vaga e Recrutando
1. Empresa cadastra-se com CNPJ/MEI e acessa `/empresa/vagas/nova`.
2. Define requisitos estruturados (obrigatórios vs. desejáveis) que alimentam automaticamente o motor 70/30.
3. Visualiza candidatos em `/empresa/vagas/[id]/candidatos` **sem acesso ao score**, gerenciando etapas (`Em análise`, `Entrevista`, `Contratado`, `Não aprovado`), disparando notificações de acompanhamento no portal e no WhatsApp.

---

## 4. Estados Obrigatórios de Interface e Critérios de Aceite

* Toda tela assíncrona deve implementar: `loading` (Skeleton), `success`, `empty` (`EstadoVazio` com CTA claro), `error` (`EstadoErro` com retry), `unauthenticated` e `forbidden` (`/acesso-negado`).
* Botões de submissão crítica (candidatura, inscrição, publicação) devem prevenir duplo clique e só confirmar sucesso após resposta `2xx` da API.
* **Critérios de Aceite Centrais:**
  - [ ] Sistema único Next.js App Router com camadas isoladas (`frontend`, `api`, `domain`, `infrastructure`, `ai`).
  - [ ] Score 70/30 calculado apenas em código e visível exclusivamente ao candidato autenticado (nunca à empresa).
  - [ ] Localização usada apenas em filtros/deslocamento, fora do score numérico.
  - [ ] IA FAROL operando via Evolution API respeitando LGPD, sem coleta de CPF e sem inventar vagas ou cursos.
  - [ ] Pedidos de cursos via WhatsApp e Web consolidados no mesmo ranking do painel SEMISPE.
