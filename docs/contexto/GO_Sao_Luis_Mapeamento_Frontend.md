# GO São Luís — Mapeamento de Frontend

> **Projeto:** Hackathon UNDB + SEMISPE — São Luís do Futuro · Desafio 4: Dificuldade de Conexão entre Talentos, Startups e Empresas  
> **Versão:** 1.0 · **Data:** 14/11/2026  
> **Público deste documento:** integrante responsável por desenhar, desenvolver ou gerar o frontend.  
> **Status:** especificação de telas e navegação; **não** é ainda a documentação formal de requisitos funcionais/não funcionais ou da arquitetura de backend.

---

## 1. Leia antes de desenvolver

### 1.1 Objetivo do produto

O **GO São Luís** é um portal gratuito para conectar moradores de São Luís — com implantação inicial priorizando a **região Itaqui-Bacanga** — a vagas de emprego, oportunidades profissionais e cursos de capacitação. O ecossistema também atende empresas/startups e a administração da SEMISPE. O foco do desafio é conectar talentos, empresas e startups, com ênfase inicial na jornada de empregabilidade e qualificação.

O produto **será desenvolvido como portal próprio no hackathon**. No pitch, será apresentado como **futuro serviço integrado ao site do Parque Tecnológico de São Luís**; não é necessário desenvolver esse site institucional agora.

### 1.2 Duas referências — com papéis diferentes

| Referência | Usar para | Não usar para |
|---|---|---|
| **Brandbook do Parque Tecnológico de São Luís**, arquivo HTML fornecido pela equipe | **Identidade visual:** paleta, fontes, logo, grid, espaçamento, componentes, acessibilidade, linguagem de marca | Presumir que o site do Parque já esteja publicado ou que suas páginas precisem ser reproduzidas |
| **GO Recife** — https://gorecife.recife.pe.gov.br/ | **Estrutura e funcionamento:** início, vagas, detalhes, cursos, currículos, caminhos para empresas/profissionais, organização de conteúdo | Copiar cores, logos, fotografias, textos institucionais, ativos gráficos ou código do GO Recife |

O frontend deve **parecer visualmente parte do Parque Tecnológico**, ainda que o GO São Luís seja um portal independente durante o hackathon.

### 1.3 Decisões já aprovadas (não alterar sem alinhamento)

- **Nome provisório:** GO São Luís.
- **Cadastro próprio** do GO São Luís, com perfis de pessoa física e empresa. Não usar CadÚnico federal como autenticação.
- **Pessoas físicas:** currículo manual, importado ou gerado com IA; consulta de vagas e cursos; inscrição nas vagas; solicitação de inscrição em turmas; manifestação de interesse em cursos sob demanda.
- **Empresas/startups:** cadastradas gratuitamente com **CNPJ ativo** (MEI atende ao mínimo para startups), com validação cadastral básica; publicam vagas, gerenciam oportunidades e podem pesquisar profissionais na área **Serviços**.
- **SEMISPE:** administra cursos, cadastros e indicadores; acompanha frequência, conclusão e certificação.
- **Matching:** score só pode ser solicitado/visualizado pela pessoa física **autenticada**; empresas **não veem o score** dos candidatos nesta versão.
- **Localização:** região/bairro/distância ajudam na busca e viabilidade de deslocamento, **não entram no score técnico** de compatibilidade.
- **Cursos:** turma programada exige **solicitação de inscrição sujeita a confirmação**; curso sob demanda aceita **registro de interesse**, sem matrícula automática.
- **Candidaturas:** estados previstos `Inscrito`, `Em análise`, `Entrevista`, `Contratado`, `Desistência` e `Não aprovação`.
- **WhatsApp:** a integração com IA deverá estar **funcional ao final do hackathon**; o site precisa oferecer entrada clara e permitir vinculação segura da conta.
- **Gov.br:** não considerar a integração oficial funcional como algo já garantido; o cadastro próprio é o caminho confirmado para o MVP.

### 1.4 Convenções de escopo

- **P0:** telas e fluxos essenciais para uma demonstração funcional do MVP.
- **P1:** necessário ao produto, mas pode ser implementado depois da jornada central se houver restrição de tempo.
- **P2:** evolução futura; não deve impedir a entrega de P0.
- **[DEFINIR]**: regra ainda não aprovada; o frontend pode preparar a estrutura, mas **não deve presumir comportamento definitivo**.
- Os exemplos de vagas, cursos, empresas e indicadores utilizados no protótipo devem estar identificados como **dados demonstrativos** quando não forem reais.

---

## 2. Design system obrigatório — Parque Tecnológico

Fonte: **Brandbook — Parque Tecnológico de São Luís (site).html**, versão 1.0, fornecido pela equipe.

### 2.1 Tokens oficiais

```css
:root {
  --color-primary: #0162A7;  /* Azul Institucional */
  --color-sky: #009CDC;      /* Azul Céu */
  --color-green: #0A7B36;    /* Verde Mata */
  --color-leaf: #93C05F;     /* Verde Folha */
  --color-sun: #FADC00;      /* Amarelo Sol */
  --color-ink: #0B2540;      /* Texto corrido / rodapé */
  --color-mist: #F3F8FC;     /* Fundo de seções */
  --color-white: #FFFFFF;
  --font-heading: "Outfit", sans-serif;
  --font-body: "Inter", sans-serif;
  --radius-md: 12px;
  --radius-lg: 16px;
  --space: 8px;
  --container: 1200px;
}
```

### 2.2 Tipografia, medidas e layout

| Elemento | Especificação |
|---|---|
| Heading / marca | **Outfit** 700/800 |
| Corpo / formulários | **Inter** 400/500/600 |
| Escala desktop de referência | H1 56/60; H2 40/44; H3 28/34; texto 18/28; apoio 14/20 (px/line-height) |
| Largura de leitura | Texto corrido idealmente até 70 caracteres por linha |
| Grid | 12 colunas, **container 1200 px**, gutter 24 px |
| Breakpoints do brandbook | 640 px, 1024 px e 1280 px; implementação **mobile-first** |
| Espaçamentos | Múltiplos de 8 px: 8, 16, 24, 32, 48, 64, 96 |
| Espaço vertical de seção | 96 px no desktop; 56 px no celular |
| Botões e inputs | Radius **12 px** |
| Cards e fotos | Radius **16 px** |
| Header | Branco, fixo, identificação à esquerda, CTA amarelo à direita quando fizer sentido |
| Footer | Fundo **Tinta #0B2540**, versão negativa da logo quando disponibilizada |

### 2.3 Regras de uso visual

1. **Azul institucional** é a cor principal para títulos, navegação, links e botões comuns.
2. **Amarelo sol** é reservado ao CTA de maior destaque — **evitar mais de um botão amarelo por tela**.
3. **Verde mata** para sucesso, confirmação e indicadores pertinentes; não representar significado somente com cor.
4. **Azul céu** somente em texto grande (24 px ou mais) sobre branco; **amarelo** e **verde folha** nunca como cor de texto. Sobre fundos amarelos ou azul céu, usar texto Tinta.
5. Usar **muito espaço em branco**, bordas finas e sombras sutis; **não utilizar degradês decorativos nem sombras pesadas**.
6. Ilustrações podem se inspirar nas **camadas translúcidas** do símbolo do Parque; não modificar a logo oficial.
7. Usar fotos reais e autorizadas de pessoas/território quando disponíveis. No protótipo, preferir imagens próprias/licenciadas ou placeholders neutros.
8. **Logo oficial:** não esticar, girar, recolorir, sombrear ou alterar camadas. Versão completa com largura mínima de **160 px**. Área de proteção mínima equivalente à altura do “P” do wordmark. Favicon/avatar: símbolo isolado. Para fundos escuros, utilizar versão negativa **somente se fornecida/aprovada**; não improvisar inversão da marca.
9. Texto claro, direto e acolhedor: “Encontre vagas”, “Crie seu currículo”, “Conheça os cursos”; evitar jargão sem explicação.
10. Foco visível, navegação por teclado, rótulos de campos, texto alternativo em imagens e **alvos de toque de pelo menos 44 px**.

> **Atenção à aplicação no GO São Luís:** usar o brandbook como sistema de design, mas desenvolver uma identificação própria “GO São Luís” **compatível** com a marca institucional. Não assumir que a logo do Parque já pode ser alterada para formar a logo do GO.

### 2.4 Componentes globais reutilizáveis

`HeaderPublico`, `HeaderAutenticado`, `MenuMobile`, `FooterInstitucional`, `BotaoPrimario`, `BotaoDestaque`, `BotaoSecundario`, `CampoTexto`, `CampoSenha`, `Selecao`, `Autocomplete`, `AreaTexto`, `CampoData`, `UploaderArquivo`, `BarraBusca`, `FiltroLateral`, `FiltrosMobile`, `CardVaga`, `CardCurso`, `CardProfissional`, `CardIndicador`, `TagStatus`, `Breadcrumb`, `ModalConfirmacao`, `ModalAutenticacao`, `Toast`, `EstadoVazio`, `EstadoCarregamento`, `EstadoErro`, `Paginacao`, `StepperFormulario`, `TabelaResponsiva`, `PainelScore`, `LinhaDoTempoStatus`, `CTAWhatsApp`, `ControleAcessibilidade`.

Usar componentes de formulários, cards e tabelas reutilizáveis para evitar divergência entre áreas de candidato, empresa e SEMISPE.

---

## 3. Perfis, permissões e navegação

### 3.1 Perfis de usuário

| Perfil | Acesso principal |
|---|---|
| **Visitante** | Início, listagem/detalhe públicos de vagas e cursos, Sobre, Entrar, Criar conta; sem visualizar score nem efetivar inscrição |
| **Pessoa física** | Perfil pessoal, Meu Currículo, oportunidades e score, candidaturas, cursos e inscrições, vinculação WhatsApp |
| **Empresa/startup** | Perfil da organização, publicação/gestão de vagas, candidaturas vinculadas às próprias vagas, área Serviços (busca de profissionais), configurações |
| **Administrador SEMISPE** | Painel administrativo, gestão de usuários/empresas, vagas, cursos, solicitações, frequência, conclusão, certificados, indicadores |

**Mesmo site, diferentes menus.** Não criar quatro produtos desconectados.

**Nota de permissão sobre candidaturas:** a decisão recebida estabelece visualização da trajetória pelo **próprio candidato e pela SEMISPE**. A empresa precisa ao menos receber as candidaturas da **sua vaga** para conduzir recrutamento, mas o grau de acesso ao histórico e quem pode alterar cada estado ainda precisa de validação ([DEFINIR]). No protótipo, **não exibir histórico de outras empresas nem score**, e aplicar controle de escopo por vaga/organização.

### 3.2 Menu público — manter exatamente as seis entradas acordadas

`Página Principal` · `Vagas` · `Cursos` · `Meu Currículo` · `Sobre o GO` · `Entrar`

- “Meu Currículo” para visitante abre login/cadastro e preserva o destino pós-login.
- “Entrar” para usuário logado vira menu/avatar de perfil.
- Menu hambúrguer no mobile; botão de acessibilidade e WhatsApp não devem esconder navegação básica.

### 3.3 Menu da pessoa física (após login)

- **Painel / Início**
- **Vagas**
- **Cursos**
- **Meu Currículo**
- **Minhas candidaturas**
- **Meus cursos**
- **Meu perfil** (inclui WhatsApp e preferências)

As entradas que não couberem no menu superior podem ficar no menu da conta. Não eliminar as seis entradas públicas como rotas.

### 3.4 Menu da empresa

- Visão geral
- Minhas vagas
- Publicar vaga
- Candidaturas
- **Serviços / Buscar profissionais**
- Perfil da empresa

### 3.5 Menu da SEMISPE

- Visão geral / Dashboard
- Empresas
- Usuários / Profissionais
- Vagas
- Cursos e turmas
- Inscrições e acompanhamento
- Indicadores
- Configurações administrativas (P1)

---

## 4. Sitemap e rotas sugeridas

> As URLs são **propostas de frontend**, não contratos fechados com o backend. `:id` é identificador dinâmico. Rotas privadas precisam de guarda de autenticação/autorização.

| Prioridade | Rota | Tela | Acesso |
|---|---|---|---|
| P0 | `/` | Página principal | Público |
| P0 | `/vagas` | Catálogo de vagas | Público |
| P0 | `/vagas/:id` | Detalhe da vaga | Público; candidatura exige login |
| P0 | `/cursos` | Catálogo de cursos | Público |
| P0 | `/cursos/:id` | Detalhe de curso/turma | Público; inscrição/interesse exige login |
| P0 | `/sobre` | Sobre o GO São Luís | Público |
| P0 | `/entrar` | Login da plataforma | Público |
| P0 | `/cadastro` | Escolher pessoa física/empresa | Público |
| P0 | `/cadastro/pessoa` | Cadastrar pessoa física | Público |
| P0 | `/cadastro/empresa` | Cadastrar empresa | Público |
| P0 | `/esqueci-senha` | Solicitar recuperação de senha | Público |
| P1 | `/redefinir-senha` | Definir nova senha por fluxo seguro | Público com token válido |
| P0 | `/painel` | Painel da pessoa física | Pessoa física |
| P0 | `/meu-curriculo` | Currículo e perfil profissional | Pessoa física |
| P0 | `/meu-curriculo/editar` | Formulário de currículo | Pessoa física |
| P0 | `/meu-curriculo/ia` | Criação assistida por IA / entrada para WhatsApp | Pessoa física |
| P0 | `/minhas-candidaturas` | Minhas candidaturas e status | Pessoa física |
| P0 | `/meus-cursos` | Minhas inscrições/interesses em cursos | Pessoa física |
| P0 | `/perfil` | Meus dados, preferências e WhatsApp | Pessoa física |
| P0 | `/empresa` | Visão geral da empresa | Empresa |
| P0 | `/empresa/vagas` | Gestão de vagas próprias | Empresa |
| P0 | `/empresa/vagas/nova` | Formulário de nova vaga | Empresa |
| P0 | `/empresa/vagas/:id/editar` | Editar vaga própria | Empresa |
| P0 | `/empresa/vagas/:id/candidatos` | Inscrições vinculadas à vaga | Empresa, escopo limitado |
| P0 | `/empresa/servicos` | Busca de profissionais/categorias | Empresa |
| P1 | `/empresa/servicos/:id` | Detalhes do profissional pesquisável | Empresa com permissão |
| P0 | `/empresa/perfil` | Dados e verificação da empresa | Empresa |
| P0 | `/admin` | Dashboard SEMISPE | Administrador |
| P0 | `/admin/empresas` | Lista/validação básica de empresas | Administrador |
| P0 | `/admin/usuarios` | Cadastros de pessoas físicas | Administrador |
| P0 | `/admin/vagas` | Gestão/monitoramento de vagas | Administrador |
| P0 | `/admin/cursos` | Lista e gestão de cursos | Administrador |
| P0 | `/admin/cursos/novo` | Cadastro de curso / turma / demanda | Administrador |
| P0 | `/admin/cursos/:id` | Gestão de turma, inscrições e resultados | Administrador |
| P0 | `/admin/indicadores` | Visões agregadas e relatórios básicos | Administrador |
| P1 | `/admin/configuracoes` | Configurações e permissões | Administrador |
| P0 | `/acesso-negado` | Permissão insuficiente | Todos |
| P0 | `*` | Página 404 / recurso não encontrado | Todos |

**Redirecionamento pós-login:** após autenticar, levar à rota originalmente solicitada se o perfil tiver permissão; caso contrário, enviar ao painel do seu perfil. Usuário já autenticado não deve acessar indefinidamente a página de login.

---

## 5. Telas públicas — descrição de implementação

### T01 — Página principal (`/`) · P0

**Objetivo:** comunicar o propósito e oferecer um caminho imediato para candidatos, empresas e cursos.

**Ordem sugerida de seções:**

1. Header branco fixo, com logotipo/identificação “GO São Luís”, menu público e acesso de conta.
2. **Hero** com título objetivo: “Oportunidades e qualificação para São Luís”; texto curto e imagem/elemento alinhado ao brandbook; CTA amarelo **“Encontrar vagas”**; ação secundária “Conhecer cursos”.
3. **Busca rápida de vagas** por cargo, palavra-chave e bairro/localização (pode direcionar para `/vagas` com filtros na URL).
4. **Como funciona:** “Crie seu perfil → Encontre oportunidades → Candidate-se / Capacite-se → Acompanhe”.
5. **Escolha seu caminho:** três cards “Procuro emprego”, “Sou empresa”, “Quero me capacitar”; links para cadastro ou páginas correspondentes.
6. **Vagas em destaque:** cards selecionados das vagas ativas (não inventar métricas); botão “Ver todas”.
7. **Cursos em destaque:** turmas programadas e/ou cursos sob demanda com diferenciação visual explícita.
8. **Currículo com IA:** descrição curta; entrada para criar/importar currículo e CTA/atalho do WhatsApp.
9. **Sobre o programa / foco Itaqui-Bacanga:** atuação inicial local e abrangência de São Luís, sem dizer que só moradores da região podem entrar se isso não estiver bloqueado.
10. Rodapé institucional com links e acesso à informação de privacidade/termos.

**Estados:** dados carregando, nenhuma vaga/curso publicado, falha de carregamento. Não mostrar contadores falsos de empregabilidade.

### T02 — Catálogo de vagas (`/vagas`) · P0

**Estrutura:** título, resumo do resultado, busca, filtros, ordenação, cards, paginação/“carregar mais”. Em desktop, filtros laterais; no mobile, filtros em drawer/modal.

**Filtros iniciais sugeridos:** cargo/palavra-chave, bairro/região, modalidade (presencial/híbrida/remota), nível de escolaridade, tipo de contratação, faixa salarial se informada, experiência exigida, “sem experiência” e inclusão PcD **somente se houver campo correspondente confiável**. Não exigir que cada vaga tenha todos esses atributos.

**Card de vaga:** cargo, empresa, bairro/cidade, modalidade, quantidade de vagas, publicação, prazo de inscrição, salário ou “Não informado”, resumo da vaga, tags de requisitos e ação “Ver detalhes”. **Não exibir score ao visitante**. Ao candidato autenticado, opcionalmente exibir ação “Ver compatibilidade” que calcula sob demanda.

**Ações:** buscar, filtrar, limpar filtros, ordenar e abrir detalhes. Busca e filtros devem ser refletidos na URL sempre que viável, permitindo compartilhar a consulta.

**Estados:** carregamento por skeleton, sem resultados com “Limpar filtros”, erro com “Tentar novamente”, vaga expirada removida do catálogo ativo.

### T03 — Detalhe da vaga (`/vagas/:id`) · P0

**Cabeçalho:** cargo, empresa, local, modalidade, prazo, status, salário, quantidade de vagas.

**Seções:** descrição/atividades; requisitos obrigatórios; requisitos desejáveis; escolaridade/experiência/certificações; benefícios; informações da empresa; orientações de candidatura.

**Ações principais:**

- **Candidatar-me**: se visitante, autenticar e retornar à vaga; se autenticado como pessoa física, solicitar confirmação e registrar candidatura; se já inscrito, mostrar “Você já se candidatou” e link para acompanhamento.
- **Ver minha compatibilidade**: somente pessoa física autenticada e com perfil profissional suficiente; exibir `PainelScore` com justificativas.
- **Melhorar meu currículo** / **Ver cursos relacionados**: se relevante, link para currículo/cursos.

**Bloqueios:** vaga encerrada (“Inscrições encerradas”); usuário empresa/admin não pode se candidatar nesse papel; erro de ação deve ser tratado sem falsa confirmação.

**Painel de score:** percentual ilustrado por barra + lista de “Requisitos atendidos”, “Não identificados” e “Atenção aos obrigatórios”. Orientação não deve garantir “100%” nem contratação; distância **fora** do score. **Empresa não visualiza score.**

### T04 — Catálogo de cursos (`/cursos`) · P0

**Componentes:** busca por título/área, filtros por tipo, instituição, modalidade, bairro e disponibilidade; abas ou chips: **“Turmas abertas”** e **“Cursos sob demanda”** (podem coexistir em listagem com tags claras).

**Card de turma programada:** título, instituição, modalidade, local, carga horária, início, período de inscrições, vagas se informado, selo “Inscrições abertas”/“Encerradas”, ações “Ver detalhes” e “Solicitar inscrição”.

**Card de curso sob demanda:** título, área, instituição prevista (se definida), descrição, selo **“Turma ainda não aberta”**, contador de interessados **somente se houver dado real**, ação “Registrar interesse”. Não mostrar uma data inventada.

**Estados:** sem cursos, sem vagas, filtros sem resultado e período de inscrição encerrado.

### T05 — Detalhe do curso (`/cursos/:id`) · P0

**Informações:** título, tipo (programado/sob demanda), objetivo, competências desenvolvidas, carga horária, instituição, modalidade, local, pré-requisitos, cronograma/datas **somente se definidos**, número de vagas **se houver**, prazo de inscrição e orientações.

**Se turma programada:** botão **“Solicitar inscrição”** → confirmação → status **“Solicitação enviada — aguardando confirmação da SEMISPE”**. Não usar “Matrícula confirmada” antes da aprovação.

**Se sob demanda:** botão **“Tenho interesse”** → confirmação → status **“Interesse registrado”**. Não representar interesse como vaga reservada.

**Se visitante:** login com redirecionamento de volta ao curso.

### T06 — Sobre o GO (`/sobre`) · P0

Incluir: o que é o GO São Luís, público atendido, relação com SEMISPE e futuro Parque Tecnológico, foco territorial inicial, como a plataforma funciona, gratuidade, benefícios para pessoas e empresas, dúvidas frequentes básicas e contato institucional **apenas quando autorizado/fornecido**.

**Não afirmar** que o GO já está conectado ao portal institucional do Parque. Usar linguagem de integração futura.

### T07 — Autenticação e cadastro (`/entrar`, `/cadastro`, `/cadastro/pessoa`, `/cadastro/empresa`) · P0

**Login:** e-mail (ou identificador escolhido pela equipe) e senha; mostrar/ocultar senha; “Esqueci minha senha”; “Criar conta”.

**Escolha de cadastro:** dois cards “Sou pessoa física” e “Sou empresa/startup”.

**Pessoa física — campos mínimos de conta (proposta de interface):** nome, e-mail, telefone/WhatsApp, senha, confirmação de senha, bairro/localidade de residência, aceite de termos e ciência de privacidade. CPF, data de nascimento e outros dados pessoais ficam **[DEFINIR]** conforme necessidade/validação; evitar coleta desnecessária. Experiências e formação pertencem ao **perfil profissional**, não precisam bloquear o primeiro cadastro.

**Empresa — campos mínimos de conta:** nome de responsável, e-mail de acesso, senha, CNPJ, razão social, nome fantasia (se houver), telefone, bairro/endereço de atuação, setor de atividade; aceites; feedback do processo de validação básica de CNPJ ativo. Não presumir que a verificação está concluída se houver falha na consulta.

**Erros e validação:** campo inválido, e-mail já cadastrado, CNPJ inválido/inativo, senha fraca, falha na rede, submissão duplicada e confirmação visual pós-cadastro.

**Gov.br:** não criar botão que simule autorização real. Só adicionar integração oficial quando houver aprovação e implementação legítima; para o MVP, cadastro próprio é o fluxo válido.

---

## 6. Área da pessoa física — telas e interações

### T08 — Painel pessoal (`/painel`) · P0

**Objetivo:** visão resumida e atalhos personalizados após login.

Blocos: saudação, conclusão do perfil/currículo, vagas recomendadas (somente após solicitação/resultado de matching, se aplicável), últimas candidaturas e estados, cursos em andamento/inscrições, cursos que podem ajudar, CTA para WhatsApp.

Se o currículo estiver vazio, priorizar **“Criar meu currículo”**; se estiver completo, priorizar **“Encontrar vagas”**. Não apresentar score calculado como se fosse fato se não houver resultado real.

### T09 — Meu Currículo (`/meu-curriculo`) · P0

**Tela de controle** com:

- Resumo do perfil profissional e status de preenchimento.
- Ações **“Preencher manualmente”**, **“Enviar currículo existente”** e **“Criar com ajuda da IA”**.
- Pré-visualização do currículo estruturado, **“Editar informações”**, **“Gerar PDF”** e **“Baixar PDF”**.
- Informação da última atualização do perfil e da versão do arquivo, se disponível.
- Recomendação de vincular WhatsApp ao perfil para atendimento conversacional.

**Regra principal:** o **perfil estruturado** é a fonte de dados do matching; o PDF é um documento derivado. PDF importado deve passar por extração e **confirmação do usuário** antes de atualizar o perfil.

### T10 — Edição de currículo (`/meu-curriculo/editar`) · P0

Usar formulário em etapas com indicador de progresso e salvamento seguro:

| Etapa | Campos |
|---|---|
| Identificação | Nome de exibição no currículo, e-mail profissional, telefone, cidade/bairro; endereço completo **não é necessário no currículo** |
| Objetivo | Cargo/área desejada, breve apresentação, disponibilidade/modalidade de trabalho |
| Experiência | Empregador/atividade, função, datas de início/fim, atividades, resultados; permitir “sem experiência formal” |
| Escolaridade | Nível, curso, instituição, status (concluído/em andamento), período quando pertinente |
| Cursos e certificações | Nome, instituição, conclusão, carga horária e certificado opcional |
| Competências | Competências técnicas/operacionais e outras habilidades relevantes, com possibilidade de adicionar várias |
| Idiomas e adicionais | Idioma/nível, certificados e informações profissionais facultativas |
| Revisão | Resumo completo, editar seções, salvar perfil e gerar PDF |

**Regras de UX:** não obrigar experiência anterior; permitir adicionar/remover experiências e formações; validar datas; apontar campos obrigatórios; evitar apagar trabalho ao navegar entre etapas; exibir consentimentos de publicação de perfil separadamente.

### T11 — Currículo assistido por IA (`/meu-curriculo/ia`) · P0

Esta tela funciona como **entrada e acompanhamento** do fluxo de IA, cuja experiência principal será pelo WhatsApp.

**Elementos:** explicação simples do processo; botão **“Continuar pelo WhatsApp”**; estado de vinculação da conta; opção **“Enviar currículo existente”**; informação de que a IA fará perguntas e pedirá confirmação dos dados; link para edição manual.

**Fluxo esperado:** conta logada → vínculo seguro com número WhatsApp → conversa guiada → envio de texto/áudio/documento → pré-visualização dos dados extraídos → **confirmação** → perfil estruturado salvo → PDF gerado → currículo acessível em `/meu-curriculo`.

**Não inserir senha em conversa.** Se vínculo não existir, encaminhar ao processo de autenticação por link/código seguro definido pela equipe.

**Estados:** número não vinculado, vinculando, vinculado, IA em processamento, dados pendentes de revisão, perfil atualizado, erro de extração, arquivo inválido.

### T12 — Minhas candidaturas (`/minhas-candidaturas`) · P0

**Lista:** cargo, empresa, data da candidatura, status atual, próxima ação e link para a vaga. Filtro por status.

**Estados de negócio a representar:**

`Inscrito` → `Em análise` → `Entrevista` → `Contratado`  
Saídas alternativas: `Desistência` e `Não aprovação`.

O diagrama acima é **ilustrativo**; transições exatas e atores autorizados a modificá-las permanecem **[DEFINIR]**.

**Detalhe/expansão:** linha do tempo dos eventos disponíveis; data da última atualização; mensagens de resultado quando autorizadas. A candidatura deve ser visível ao seu próprio candidato e à SEMISPE.

### T13 — Meus cursos (`/meus-cursos`) · P0

Separar visualmente:

- **Solicitações de turmas programadas:** enviada, aguardando confirmação, confirmada/recusada, em andamento, concluída, cancelada (**estados de interface propostos; política final [DEFINIR]**).
- **Interesses em cursos sob demanda:** registrado, turma aberta/notificado, convertido em solicitação se usuário escolher.
- **Curso em andamento/concluído:** acompanhar frequência, status de conclusão e certificado, quando disponibilizados pela SEMISPE.

Não atribuir certificado ou confirmação de matrícula automaticamente após mero registro de interesse.

### T14 — Meu perfil (`/perfil`) · P0

Seções: dados de conta, residência/bairro, contato, preferências de vagas e deslocamento, senha/segurança, preferências de notificações, autorização para visibilidade a empresas, WhatsApp vinculado, privacidade/consentimentos.

**Privacidade:** CPF, telefone, dados detalhados e PDF não devem ficar visíveis em catálogos de pesquisa por padrão. Para a aba Serviços, prever configuração explícita de visibilidade e quais dados podem ser divulgados. **Regra final de opt-in [DEFINIR].**

---

## 7. Área da empresa / startup

### T15 — Painel da empresa (`/empresa`) · P0

Cards de indicadores **da própria organização**: vagas ativas, vagas encerradas, candidaturas recebidas, vagas aguardando término; atalhos **“Publicar vaga”**, **“Ver minhas vagas”**, **“Buscar profissionais”**.

Não mostrar métricas globais da SEMISPE nem score de candidatos.

### T16 — Minhas vagas (`/empresa/vagas`) · P0

Tabela/cards com cargo, local, quantidade, publicação, prazo final, status, número de candidaturas e ações: ver, editar, encerrar e abrir inscritos.

**Estados de publicação sugeridos:** rascunho, publicada/ativa, encerrada, expirada. Validações de publicação devem impedir vaga com campos obrigatórios incompletos.

### T17 — Criar/editar vaga (`/empresa/vagas/nova`, `/empresa/vagas/:id/editar`) · P0

Campos organizados por bloco:

| Bloco | Campos de interface |
|---|---|
| Identificação | Cargo/título, descrição, organização vinculada |
| Local | Município, bairro/local, modalidade presencial/híbrida/remota, local de atuação (endereço completo apenas se necessário) |
| Oferta | Número de vagas, tipo de contratação, jornada/horário **se informado**, salário/intervalo ou “Não informado” |
| Datas | Data de publicação (preenchimento do sistema), data final para inscrições |
| Benefícios | Lista textual de benefícios |
| Requisitos | Escolaridade, experiência, competências, cursos/certificações, distinção entre **obrigatório** e **desejável** |
| Revisão | Prévia do anúncio, salvar rascunho, publicar |

**Comportamento:** adicionar/remover requisitos, revisar antes de publicar, validação de prazo, mensagem de sucesso com link da vaga. Campos de matching devem ser estruturados, não apenas um grande texto livre, mesmo que a descrição continue disponível.

### T18 — Candidatos da vaga (`/empresa/vagas/:id/candidatos`) · P0

Lista restrita às candidaturas recebidas na **vaga da empresa**. Elementos: nome/identificação permitida, resumo do perfil, currículo autorizado, data de inscrição, dados de contato conforme permissão, estado operacional permitido.

**Não mostrar score de match.** Não expor candidaturas de outras organizações ou informações sensíveis não autorizadas.

**[DEFINIR]** Quem pode atualizar as etapas do processo seletivo (empresa, SEMISPE ou ambos) e que informações a empresa verá além das candidaturas que recebeu. Até a decisão, a interface pode ter **visualização das inscrições próprias** e controles de andamento preparados, sem prometer permissões definitivas.

### T19 — Serviços / Buscar profissionais (`/empresa/servicos`) · P0

**Aba solicitada pela equipe.** Objetivo: permitir à empresa buscar **profissionais** pelo termo de pesquisa e/ou **categoria de atuação**.

**Interface:** busca por nome de atividade/competência, filtros por categoria profissional, bairro e disponibilidade **apenas se cadastrada**, listagem em cards; acesso a detalhe de perfil quando autorizado.

**Card:** nome público/identificação, categoria, breve descrição, competências principais, localidade aproximada, botão “Ver perfil” ou “Demonstrar interesse/entrar em contato” **quando habilitado**.

**Ponto aberto importante:** esta funcionalidade pode ser entendida como *diretório de profissionais* ou como *contratação de serviços autônomos*. A versão acordada só confirma **pesquisa de profissionais por categoria**. **Não implementar orçamentos, pagamentos, contratação de serviços ou marketplace** sem nova decisão.

**Proteção:** diretório deve exibir apenas perfis que tenham autorizado sua divulgação; caso ainda não exista regra operacional, usar estrutura e dados fictícios no MVP, sem expor dados reais por padrão.

### T20 — Perfil da empresa (`/empresa/perfil`) · P0

Dados cadastrais da organização, CNPJ, endereço/contato, setor, responsável e indicação de situação cadastral verificada/pendente/indisponível **conforme retorno real da validação**. Edição conforme regras que não permitam trocar identidade do CNPJ sem verificação.

---

## 8. Administração SEMISPE

### T21 — Dashboard (`/admin`) · P0

**Layout administrativo:** sidebar no desktop, menu recolhível no mobile, cabeçalho com contexto da SEMISPE e seleção de período.

**Indicadores sugeridos (somente dados existentes):** total de profissionais cadastrados, empresas cadastradas, vagas ativas, candidaturas, cursos programados, demandas por cursos, solicitações pendentes, certificados/conclusões registrados.

**Visualizações:** séries por período, participação por região/bairro, cursos mais procurados, estados de candidaturas, demanda por competências **se houver dados estruturados suficientes**. Diferenciar claramente contagem de candidaturas e contagem de contratações.

**Sem dados reais:** cards com “Sem dados ainda” ou *dataset demonstrativo identificado*. Nunca inventar evolução salarial nem impacto do programa.

### T22 — Empresas (`/admin/empresas`) · P0

Lista com busca por nome/CNPJ, filtro por situação, ficha resumida, dados de validação básica, vagas publicadas e ações administrativas autorizadas (ex.: bloquear denúncia ou revisar inconsistência) **[DEFINIR]**.

**Atenção:** o cadastro é livre para empresas com CNPJ ativo; não inventar um processo de aprovação manual obrigatório se a regra é apenas validação básica.

### T23 — Usuários / Profissionais (`/admin/usuarios`) · P0

Lista com busca, filtros por bairro, perfil profissional, escolaridade/competência **quando declarados**, histórico básico de participação e link para informações administrativas autorizadas.

Aplicar privacidade por função: administrador não é sinônimo de acesso irrestrito a qualquer dado pessoal.

### T24 — Vagas (`/admin/vagas`) · P0

Listagem global de vagas com filtros por empresa, situação, bairro, período e expiração; abertura de detalhe; visão de volume de candidaturas; medidas administrativas autorizadas **[DEFINIR]**.

### T25 — Cursos e turmas (`/admin/cursos`, `/admin/cursos/novo`, `/admin/cursos/:id`) · P0

**Tabela de cursos:** título, instituição parceira, tipo, modalidade, região, situação, quantidade de interessados/inscritos, ações editar/abrir detalhes.

**Cadastro de curso:**

- Dados comuns: título, área, descrição, competências desenvolvidas, instituição/parceiro, modalidade, pré-requisitos, carga horária.
- **Programado:** turma, local, período de inscrição, início/fim, horário, capacidade, responsável.
- **Sob demanda:** sem datas obrigatórias, permite manifestação de interesse, descrição da demanda e eventual expectativa de abertura sem promessa.

**Detalhe da turma programada:** candidatos que solicitaram inscrição, ação de confirmar/recusar inscrição, lista de matriculados, registro de frequência, conclusão e certificação.

**Detalhe sob demanda:** interessados, quantidade, distribuição territorial agregada quando possível, opção administrativa de criar turma a partir da demanda **P1**.

**Estados:** sucesso, erros de validação, sem inscritos, curso encerrado, solicitação já tratada.

### T26 — Indicadores (`/admin/indicadores`) · P0/P1

Filtros por período, bairro/região e curso. Cards/gráficos de cadastros, oportunidades, solicitações, matrículas confirmadas, frequência, conclusão e certificados. Acompanhamento longitudinal pós-curso e evolução de renda é objetivo estratégico, mas **não deve ser exibido como já mensurado no MVP** se não houver coleta autorizada e dados suficientes.

---

## 9. Jornadas completas de usuário (o que os cliques devem fazer)

### J1 — Visitante → cadastro → currículo → candidatura

1. Abre `/` e clica “Criar currículo”.
2. É encaminhado para `/entrar` com opção “Criar conta”.
3. Escolhe pessoa física, conclui `/cadastro/pessoa` e entra na conta.
4. Abre `/meu-curriculo`; escolhe preenchimento manual, upload ou IA via WhatsApp.
5. Confirma/salva as informações estruturadas e, se desejar, gera PDF.
6. Abre `/vagas`, seleciona uma vaga e solicita compatibilidade.
7. Visualiza score explicado (requisitos atendidos e lacunas) **somente no seu acesso autenticado**.
8. Clica “Candidatar-me”, revisa e confirma.
9. Recebe retorno **após a operação** e pode acompanhar em `/minhas-candidaturas`.

### J2 — Empresa → publicação de vaga

1. Escolhe cadastro empresa, informa CNPJ ativo/MEI e dados básicos.
2. Após validação cadastral básica, acessa `/empresa`.
3. Abre “Publicar vaga”, preenche dados e requisitos obrigatórios/desejáveis.
4. Revisa anúncio e publica.
5. A vaga fica disponível no catálogo público **se a publicação for confirmada**.
6. Empresa visualiza candidaturas **às próprias vagas**, sem o score dos candidatos.

### J3 — Curso com turma programada

1. Usuário pesquisa em `/cursos` e abre curso programado.
2. Clica “Solicitar inscrição” (autentica se necessário).
3. Acompanha status “Aguardando confirmação” em `/meus-cursos`.
4. SEMISPE analisa solicitação e confirma/recusa.
5. A pessoa visualiza a situação atualizada.
6. Na administração, SEMISPE pode registrar frequência, conclusão e certificação.

### J4 — Curso sob demanda

1. Usuário abre curso sinalizado “Turma ainda não aberta”.
2. Clica “Tenho interesse” e confirma.
3. A demanda é registrada para a SEMISPE sem criar matrícula.
4. Usuário acompanha o registro em `/meus-cursos`.
5. Se houver futura turma, comunicação e conversão em inscrição dependerão de fluxo próprio.

### J5 — Currículo e vaga pelo WhatsApp (integração funcional)

1. Usuário acessa “Continuar pelo WhatsApp” no portal.
2. Verifica/vincula de forma segura sua conta ao número (sem solicitar senha no chat).
3. IA conduz perguntas ou recebe currículo/documento/áudio.
4. Usuário valida informações estruturadas → perfil atualizado → PDF disponível no portal.
5. Usuário pergunta pelas vagas mais compatíveis.
6. IA consulta oportunidades reais cadastradas e apresenta links + score individual explicado; distância/localização é tratada separadamente.
7. Usuário escolhe uma vaga, confirma interesse e a candidatura é registrada no **mesmo sistema** do portal.
8. Usuário pergunta sobre cursos; IA recomenda cursos cadastrados e permite **registrar interesse** pela conversa (e confirmar solicitações em turmas programadas **somente se definido no escopo do bot**).
9. Site mostra os mesmos registros, sem duplicação.

**O frontend não precisa conter a interface integral do bot**, mas deve disponibilizar os pontos de entrada, estados de vinculação e feedback de ações refletidas na conta.

### J6 — Empresa → Serviços

1. Empresa entra no painel e clica “Serviços”.
2. Pesquisa profissionais pelo nome da atividade ou categoria.
3. Recebe cards apenas com perfis autorizados para divulgação.
4. Abre detalhe e utiliza a opção de contato **se habilitada**.
5. Não tem acesso a scores, candidaturas de outras empresas ou dados privados.

---

## 10. Estados, feedback e consistência

### 10.1 Estados de interface obrigatórios por tela de dados

Cada listagem, tabela e página de detalhe deverá prever: `loading` (skeleton ou indicador), `success`, `empty`, `error`, `unauthenticated`, `forbidden` quando aplicável. Cada operação deverá prever `submitting`, `success` e `failure` com mensagem clara.

**Não apresentar sucesso antes de a operação ser confirmada.** Botões de confirmação devem evitar envio duplicado.

### 10.2 Textos padronizados para ações críticas

| Situação | Exemplo de mensagem |
|---|---|
| Candidatura enviada | “Sua candidatura foi registrada.” |
| Já inscrito na vaga | “Você já se candidatou a esta oportunidade.” |
| Inscrição em curso solicitada | “Solicitação enviada. Aguarde a confirmação da SEMISPE.” |
| Interesse sob demanda | “Seu interesse foi registrado. Isso ainda não é uma matrícula.” |
| Vaga encerrada | “As inscrições para esta vaga foram encerradas.” |
| Currículo sem dados suficientes | “Complete seu perfil profissional para analisar sua compatibilidade.” |
| Score indisponível | “Não foi possível calcular a compatibilidade agora. Tente novamente.” |
| WhatsApp não vinculado | “Vincule sua conta para consultar seus dados pelo WhatsApp.” |

### 10.3 Formatação brasileira

Datas `dd/mm/aaaa`, moeda `R$ 1.800,00`, horário `HH:mm`, bairro + “São Luís – MA”, número de vagas singular/plural, linguagem inclusiva e compreensível. Exibir “Não informado” quando dado opcional estiver ausente; **não inventar valores**.

### 10.4 Score e localização

O score representa compatibilidade **entre competências/requisitos e perfil**, não probabilidade de contratação. Apresentar fatores do score de forma transparente. Não usar bairro, distância ou CEP como penalidade numérica do score. Localização pode aparecer em filtro, chip de preferência ou indicação de deslocamento — **separadamente**.

---

## 11. Dados de interface e contratos esperados (sem impor backend)

Para facilitar mocks, componentes e posterior integração, cada entidade deve disponibilizar pelo menos estes campos **conceituais**; nomes de propriedades são exemplos e poderão ser ajustados à API.

| Entidade | Campos relevantes ao frontend |
|---|---|
| `Pessoa` | id, nome, email, telefone, bairro, tipoPerfil, preferencias, whatsappVinculado |
| `PerfilProfissional` | pessoaId, objetivo, resumo, experiencias[], escolaridade[], cursos[], competencias[], idiomas[], atualizadoEm, curriculoPdfUrl |
| `Empresa` | id, cnpj, razaoSocial, nomeFantasia, setor, bairro, contato, situacaoCadastral |
| `Vaga` | id, empresaId, titulo, descricao, bairro, municipio, modalidade, quantidade, publicadaEm, encerraEm, salario, beneficios[], requisitosObrigatorios[], requisitosDesejaveis[], status |
| `Candidatura` | id, pessoaId, vagaId, status, criadaEm, atualizadaEm, eventos[] |
| `Curso` | id, titulo, descricao, instituicao, competencias[], cargaHoraria, modalidade, bairro, tipo (programado/sob_demanda), status |
| `Turma` | id, cursoId, vagas, periodoInscricoes, inicio, fim, horario, local, status |
| `InscricaoCurso` | id, pessoaId, turmaId, status, frequencia, concluidoEm, certificadoUrl |
| `InteresseCurso` | id, pessoaId, cursoId, registradoEm, status |
| `Compatibilidade` | vagaId, pessoaId, percentual, atendidos[], naoIdentificados[], requisitosObrigatoriosPendentes[], avaliadoEm |
| `ProfissionalPublico` | pessoaId, nomePublico, categorias[], resumo, competencias[], bairro, visibilidadeAutorizada |

**Boas práticas para desenvolvimento em paralelo:** criar um arquivo/módulo de **mocks centralizados** por entidade, uma camada de serviços intercambiável (mock → API) e tipos/contratos compartilháveis. Evitar fixar listas de vagas, cursos ou scores diretamente dentro dos componentes.

**Dados demonstrativos recomendados:** pelo menos 3 vagas de áreas distintas, 2 cursos programados, 2 cursos sob demanda, 2 candidatos com perfis diferentes, 1 empresa/MEI e 1 conta SEMISPE, todos identificados como fictícios no ambiente de apresentação. Esses números são **sugestão para testes de interface**, não indicadores de São Luís.

---

## 12. Responsividade e acessibilidade

**Mobile-first é obrigatório**, pois o uso pelo celular e a integração ao WhatsApp são centrais à jornada.

- Header desktop com navegação horizontal; no mobile, menu hambúrguer acessível.
- Cards em uma coluna no mobile, grid de 2–3 colunas quando houver espaço.
- Filtros laterais no desktop e painel recolhível no celular.
- Formulários longos divididos em etapas; botão de próxima ação sempre identificável.
- Tabelas administrativas com adaptação para cards ou rolagem horizontal controlada.
- Estados de erro anunciados junto aos campos; foco encaminhado ao primeiro erro após submissão.
- Contraste conforme o brandbook; sem texto pequeno sobre amarelo/verde-folha; foco visível.
- Clique/toque de pelo menos 44 px; navegação por teclado e rótulos explícitos.
- Acesso a documentos/PDF e links do WhatsApp com descrição clara de destino.
- Nunca depender só de cor para indicar status, match ou matrícula.

---

## 13. Ordem sugerida de execução do frontend

Esta ordem reduz retrabalho, mesmo que diferentes integrantes trabalhem em paralelo.

| Etapa | Entrega | Prioridade |
|---|---|---|
| 1 | Tokens do Parque, tipografia, componentes, headers, footers, layouts e responsividade | P0 |
| 2 | Home, listagens e detalhes de vagas/cursos com mocks | P0 |
| 3 | Login/cadastro, seleção de perfil e guards de rotas | P0 |
| 4 | Área pessoa física: currículo, candidaturas e cursos | P0 |
| 5 | Área empresa: cadastro de vagas, listagem, candidaturas e Serviços | P0 |
| 6 | SEMISPE: dashboard, cadastro/gestão de cursos, inscrições e dados básicos | P0 |
| 7 | Entrada e vinculação WhatsApp, atualização de currículo/matching e feedback no portal | P0 |
| 8 | Refinamento dos gráficos, preferências, telas secundárias e demais funcionalidades | P1/P2 |

A funcionalidade de WhatsApp precisa ser trabalhada **em paralelo com o backend/integrador**. Ela não deve ser deixada como um link decorativo se a equipe se comprometeu a demonstrar uma integração real.

---

## 14. Critérios de aceite do frontend

- [ ] O site segue **cores, fontes, espaçamentos, cantos e princípios visuais** do Brandbook do Parque.
- [ ] As seis entradas do menu público estão presentes e funcionais.
- [ ] Páginas públicas de vagas e cursos permitem navegar, pesquisar e abrir detalhes.
- [ ] Visitante é encaminhado ao login antes de candidatar-se, solicitar inscrição ou consultar score.
- [ ] Cadastro próprio de pessoa física e empresa funciona com validação visível.
- [ ] Currículo pode ser criado/editado, importado com revisão e gerado em PDF após integração funcional correspondente.
- [ ] Match só aparece para candidato logado e **não aparece para empresa**.
- [ ] Distância/localidade não interfere na exibição do percentual técnico do score.
- [ ] A candidatura exige confirmação, impede duplicidade e mostra status real.
- [ ] Cursos programados diferenciam solicitação de matrícula confirmada.
- [ ] Cursos sob demanda permitem interesse sem simular matrícula.
- [ ] Empresa publica/edita vagas e vê inscrições restritas às próprias vagas.
- [ ] Aba Serviços da empresa oferece busca de profissionais/categorias, respeitando autorização de visibilidade.
- [ ] SEMISPE tem ambiente próprio de gestão de cursos, inscrições, frequência, conclusão e certificados.
- [ ] Há entrada clara para WhatsApp, estado de vinculação e registros sincronizados com o portal.
- [ ] Todas as telas fundamentais tratam carregamento, erro, vazio e acesso negado.
- [ ] O protótipo funciona bem em celular e desktop e tem acessibilidade básica.
- [ ] Nenhuma contagem, score, matrícula, contratação ou confirmação é exibida como real quando for dado de demonstração.

---

## 15. Questões em aberto — não bloqueiam wireframes, mas exigem alinhamento

1. **Forma definitiva de login:** e-mail/senha está sugerido; uso de CPF, verificação de e-mail e recuperação de conta precisam ser definidos. Gov.br não está confirmado para o MVP.
2. **Limite territorial do cadastro:** Itaqui-Bacanga é prioridade de implantação; ainda não há decisão de bloqueio para outros bairros de São Luís. **Não criar bloqueio geográfico por conta própria.**
3. **Regras de acesso e transição das candidaturas:** o candidato e a SEMISPE visualizam a trajetória; definir exatamente o que a empresa atualiza ou consulta.
4. **Diretório Serviços:** decidir quais profissionais aparecem, se são autônomos ou todos os interessados, que dados ficam públicos e como acontece o primeiro contato. Nenhum marketplace de pagamentos foi aprovado.
5. **Modelo de score:** dimensões aprovadas conceitualmente, mas pesos, requisitos eliminatórios e formato do retorno da API ainda serão especificados.
6. **Inscrições e cursos:** política de confirmação, recusa, cancelamento e inscrição em múltiplas turmas precisa ser definida.
7. **WhatsApp:** procedimento de vinculação, templates autorizados de mensagem, consentimentos e confirmação de ações dependem da integração real.
8. **Fontes e veracidade das vagas:** nesta fase, cadastro direto pelas empresas está definido; integrações SINE, scraping e Google Jobs **não integram o fluxo confirmado do MVP**.
9. **Logotipos e domínios:** uso de logotipo derivado, domínio final e vínculo oficial ao Parque devem ser aprovados pela instituição.
10. **Política de dados:** termos de uso, privacidade, exibição de currículo e retenção dos dados deverão ser definidos pela equipe/responsáveis institucionais.

**Regra de desenvolvimento:** para campos ou fluxos marcados **[DEFINIR]**, preparar interface extensível ou estados demonstrativos, mas não apresentá-los como decisão aprovada.

---

## 16. Links e materiais de referência

- **Brandbook visual:** `Brandbook — Parque Tecnológico de São Luís (site).html` — arquivo fornecido pela equipe, **fonte prioritária de identidade visual**.
- **GO Recife — portal:** https://gorecife.recife.pe.gov.br/
- **GO Recife — vagas:** https://gorecife.recife.pe.gov.br/oportunidades
- **GO Recife — cursos:** https://gorecife.recife.pe.gov.br/cursos
- **GO Recife — profissionais/serviços:** https://gorecife.recife.pe.gov.br/cidadao/encontrar-profissionais
- **GO Recife — FAQ e referência de fluxos:** https://gorecife.recife.pe.gov.br/ajuda

> **Resumo de orientação para o responsável pelo frontend:** implemente o comportamento estrutural inspirado no GO Recife, **mas desenhe tudo com o design system do Parque Tecnológico de São Luís**. Entregue um portal único, responsivo e acessível, com jornadas distintas de pessoa física, empresa e administração SEMISPE. A construção do site do Parque em si está fora do escopo do hackathon; a futura integração será demonstrada conceitualmente no pitch.
