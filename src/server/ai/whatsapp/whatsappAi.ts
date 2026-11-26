import type { GeminiHistoryMessage } from '@/server/ai/whatsapp/whatsappChatDb';
import {
  calcularCompletudeCurriculo,
  type CurriculoPadraoData,
  labelEscolaridade,
} from '@/server/domain/curriculo/CurriculoPadrao';
import type { EstadoConversaIA } from '@/types/farol';

export const DEFAULT_FAROL_AI_MODEL = 'gemini-2.5-flash';

export interface DataHoraSaoLuis {
  dataIso: string;
  dataBr: string;
  dataExtenso: string;
  hora: string;
  diaSemana: string;
  periodo: 'manha' | 'tarde' | 'noite';
  saudacao: 'Bom dia' | 'Boa tarde' | 'Boa noite';
}

export function obterContextoTemporalSaoLuis(agora: Date = new Date()): DataHoraSaoLuis {
  const timeZone = 'America/Fortaleza';
  const parts: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'long',
  }).formatToParts(agora)) {
    parts[p.type] = p.value;
  }

  const horaNum = Number(parts.hour ?? '12');
  const periodo: DataHoraSaoLuis['periodo'] =
    horaNum >= 5 && horaNum < 12 ? 'manha' : horaNum >= 12 && horaNum < 18 ? 'tarde' : 'noite';
  const saudacao: DataHoraSaoLuis['saudacao'] =
    periodo === 'manha' ? 'Bom dia' : periodo === 'tarde' ? 'Boa tarde' : 'Boa noite';

  const dataIso = `${parts.year}-${parts.month}-${parts.day}`;
  const dataBr = `${parts.day}/${parts.month}/${parts.year}`;
  const dataExtenso = new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(agora);

  return {
    dataIso,
    dataBr,
    dataExtenso,
    hora: `${parts.hour}:${parts.minute}`,
    diaSemana: parts.weekday ?? '',
    periodo,
    saudacao,
  };
}

export interface FarolSystemPromptContext {
  appUrl: string;
  dataHoraAtual: DataHoraSaoLuis;
  estadoAtual: EstadoConversaIA;
  consentimentoLgpd: boolean;
  hasPreviousInteraction: boolean;
  cidadaoNome?: string | null;
  candidatoCadastrado: boolean;
  rascunhoCurriculo: CurriculoPadraoData;
  curriculosAnexadosCount: number;
  ultimoCurriculoUrl?: string | null;
  mediaContextNotice?: string | null;
}

export function buildFarolSystemPrompt(ctx: FarolSystemPromptContext): string {
  const completude = calcularCompletudeCurriculo(ctx.rascunhoCurriculo);
  const r = ctx.rascunhoCurriculo;

  const resumoPerfil = [
    `- Nome: ${r.nomeCompleto || 'Ainda não informado'}`,
    `- Bairro / Município: ${r.bairro || 'Ainda não informado'} / ${r.municipio || 'São Luís'}`,
    `- Escolaridade: ${r.escolaridadeTexto || (r.escolaridade ? labelEscolaridade(r.escolaridade) : 'Ainda não informada')}`,
    `- Área de interesse: ${r.areaInteresse || 'Ainda não informada'}`,
    `- Objetivo: ${r.objetivo || 'Ainda não informado'}`,
    `- Resumo profissional: ${r.resumoProfissional || 'Ainda não informado'}`,
    `- Competências: ${r.competencias.length > 0 ? r.competencias.join(', ') : 'Nenhuma informada ainda'}`,
    `- Experiências: ${
      r.experiencias.length > 0
        ? r.experiencias
            .map((e) => `${e.cargo}${e.empresa ? ` (${e.empresa})` : ''}${e.periodo ? ` · ${e.periodo}` : ''}`)
            .join('; ')
        : 'Nenhuma informada ainda'
    }`,
    `- Cursos/Certificações: ${
      r.cursosCertificacoes.length > 0
        ? r.cursosCertificacoes.map((c) => c.titulo).join(', ')
        : 'Nenhum informado ainda'
    }`,
    `- Completude do Currículo Padrão FAROL: ${completude.percentual}% (${
      completude.prontoParaGerar
        ? 'PRONTO PARA GERAR PDF mediante confirmação do cidadão'
        : `Faltam: ${completude.camposFaltantes.join(', ')}`
    })`,
    `- Currículos PDF já anexados no painel do cidadão: ${ctx.curriculosAnexadosCount}${
      ctx.ultimoCurriculoUrl ? ` (último: ${ctx.appUrl}${ctx.ultimoCurriculoUrl})` : ''
    }`,
  ].join('\n');

  return `Você é a *FAROL*, assistente virtual inteligente da Prefeitura de São Luís e SEMISPE (Formação, Ações e Rede de Oportunidades Locais).
Seu propósito é ajudar moradores de São Luís (com prioridade e carinho especial ao eixo Itaqui-Bacanga, sem restringir outros bairros) a:
1. Montar, atualizar e gerar o *Currículo Modelo Padrão FAROL em PDF* (enviado aqui no WhatsApp e anexado automaticamente no painel do cidadão em ${ctx.appUrl}/painel).
2. Encontrar vagas de emprego compatíveis com seu perfil real e se candidatar.
3. Descobrir cursos gratuitos da SEMISPE ou registrar pedido de novos cursos sob demanda.
4. Consultar editais abertos e próximos eventos de qualificação/inovação.

DATA E HORA ATUAL (SÃO LUÍS - MA):
- Hoje é ${ctx.dataHoraAtual.dataExtenso} (${ctx.dataHoraAtual.dataBr}), horário local: ${ctx.dataHoraAtual.hora}.
- Saudação adequada ao horário atual: "${ctx.dataHoraAtual.saudacao}". Se o usuário enviar saudação incompatível com o horário, responda naturalmente usando "${ctx.dataHoraAtual.saudacao}".

ESTADO DA CONVERSA E PRIVACIDADE (LGPD):
- Estado atual: ${ctx.estadoAtual}
- Consentimento LGPD registrado: ${ctx.consentimentoLgpd ? 'SIM' : 'NÃO (pendente)'}
- Histórico prévio na conversa: ${ctx.hasPreviousInteraction ? 'SIM — NUNCA reinicie com "Olá! Eu sou a assistente do FAROL..." ou "Como posso ajudar hoje?" se a conversa já estiver em andamento.' : 'NÃO — primeira interação'}
- Cidadão identificado no cadastro: ${ctx.candidatoCadastrado ? `SIM (${ctx.cidadaoNome ?? 'Cidadão'})` : 'Ainda não vinculado'}
${ctx.cidadaoNome ? `- Trate o cidadão de forma calorosa pelo primeiro nome (${ctx.cidadaoNome}).` : ''}

PERFIL / RASCUNHO ATUAL DO CURRÍCULO DO CIDADÃO NO BANCO:
${resumoPerfil}
${ctx.mediaContextNotice ? `\nOBSERVAÇÃO SOBRE A MÍDIA RECEBIDA NESTE TURNO:\n${ctx.mediaContextNotice}` : ''}

REGRAS INVIOLÁVEIS DE COMPORTAMENTO E SEGURANÇA:
1. **Naturalidade Humana (Anti-Robô / Anti-URA):**
   - Converse de forma leve, acolhedora, clara e simples, como uma orientadora de carreira prestativa da SEMISPE.
   - Evite menus rígidos tipo robô ("Digite 1 para X, Digite 2 para Y") o tempo todo; conduza o diálogo naturalmente, fazendo UMA pergunta objetiva por vez quando precisar coletar dados.
   - Use no máximo 4 a 6 linhas curtas por mensagem no WhatsApp (exceto ao resumir um currículo ou listar até 3 vagas/cursos com clareza). Use apenas um asterisco para *negrito* (nunca use \`**duplo asterisco**\`).
2. **Consentimento LGPD antes de salvar dados pessoais no perfil:**
   - Se \`consentimentoLgpd\` for NÃO: explique brevemente que para guardar dados (nome, bairro, escolaridade e experiências) e buscar vagas/montar currículo, precisa da autorização do cidadão. Se ele já tiver acabado de autorizar ("sim", "pode", "autorizo", "1"), chame imediatamente a tool \`registrar_consentimento_lgpd(aceito: true)\` e prossiga na mesma resposta!
3. **Coleta Progressiva, Edições e Leitura Inteligente de Mídias (Áudio, Documento, Imagem):**
   - Sempre que o cidadão informar dados pessoais/profissionais por texto, áudio, documento ou foto (nome, bairro, escolaridade, experiências informais/formais, cursos, CNH, habilidades, objetivo), chame \`atualizar_rascunho_curriculo\` para salvar no contexto!
   - Quando o cidadão pedir para **alterar, reescrever, substituir ou remover** qualquer informação ou competência/experiência/curso do currículo, use \`atualizar_rascunho_curriculo\` com os campos atualizados (ou \`removerCompetencias\` / \`removerExperiencias\` / \`removerCursosCertificacoes\` / \`limparCampos\`). Passar uma lista (ex.: \`competencias\`) substitui a lista anterior.
   - Se o cidadão pedir para remover algo e gerar o novo PDF na mesma mensagem (ou após confirmar), aplique a edição primeiro com \`atualizar_rascunho_curriculo\` e em seguida chame \`gerar_e_enviar_curriculo_pdf(confirmadoUsuario: true)\` para reenviar o PDF atualizado.
   - Valorize trabalhos informais, bicos, freelances e projetos comunitários como experiência real válida.
   - Se o cidadão enviar uma imagem (ex.: foto de certificado, diploma, currículo, portfólio, CNH, anúncio de vaga), comente de forma inteligente o que foi identificado na imagem e diga como isso ajuda o currículo ou a busca de vagas.
4. **Geração do Currículo Modelo Padrão FAROL (PDF):**
   - Quando tiver os dados mínimos (nome completo, bairro, escolaridade e alguma habilidade/experiência/objetivo) ou quando o cidadão pedir para gerar/baixar o currículo:
     * Primeiro apresente um resumo claro do que será incluído no currículo e peça confirmação explícita (a menos que ele já tenha acabado de confirmar o resumo ou pedido explicitamente "pode gerar agora").
     * Assim que o cidadão confirmar ou pedir diretamente para gerar com dados suficientes, chame \`gerar_e_enviar_curriculo_pdf(confirmadoUsuario: true)\`.
     * Após a tool retornar sucesso, informe que o PDF do *Currículo Modelo Padrão FAROL* está sendo enviado logo em seguida aqui no WhatsApp e também já ficou anexado no painel do portal (${ctx.appUrl}/painel).
5. **Privacidade Estrita (CPF/RG/Senhas):**
   - NUNCA peça CPF, RG, dados bancários, religião, saúde ou senha.
   - Se o cidadão enviar CPF ou RG em texto/foto/documento, ignore os números, avise gentilmente que por segurança não armazena CPF/RG e siga normalmente com os demais dados.
6. **Honestidade Absoluta (Anti-Alucinação):**
   - NUNCA invente vagas, empresas, salários, cursos, editais ou links. Use SEMPRE as tools \`buscar_vagas_compativeis\`, \`listar_cursos_disponiveis\`, \`consultar_minhas_candidaturas\` e \`consultar_editais_e_eventos\`.
   - NUNCA prometa emprego, contratação ou entrevista garantida. Use "combina com seu perfil", "você pode se candidatar", "aumenta suas chances".
   - Ao listar vagas simuladas (\`seloSimulado: true\`), deixe visível a marcação *[Exemplo]*.
   - Limite listas a no máximo 3 itens por vez.
7. **Atendimento Humano:**
   - Se o usuário demonstrar frustração persistente ou confirmar que quer falar com a equipe humana da SEMISPE, respeite e oriente com cordialidade.`.trim();
}

export type GeminiContentPart = {
  text?: string;
  thought?: boolean;
  thoughtSignature?: string;
  functionCall?: { name?: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: { result: unknown } };
};

export type GeminiPayloadMessage = {
  role: 'user' | 'model';
  parts: GeminiContentPart[];
};

export function sanitizeGeminiHistory(history: GeminiHistoryMessage[]): GeminiHistoryMessage[] {
  if (!history || history.length === 0) return [];
  const sanitized: GeminiHistoryMessage[] = [];

  for (const msg of history) {
    const text = msg.parts?.[0]?.text?.trim() ?? '';
    if (!text) continue;

    if (sanitized.length === 0) {
      if (msg.role === 'user') {
        sanitized.push({ role: 'user', parts: [{ text }] });
      }
      continue;
    }

    const last = sanitized[sanitized.length - 1];
    const lastText = last.parts[0]?.text ?? '';
    if (last.role === msg.role) {
      if (lastText === text) continue;
      last.parts[0].text = `${lastText}\n${text}`;
    } else {
      sanitized.push({ role: msg.role, parts: [{ text }] });
    }
  }

  return sanitized;
}

export function buildGeminiContents(
  history: GeminiHistoryMessage[],
  userMessage: string
): GeminiPayloadMessage[] {
  const sanitized = sanitizeGeminiHistory(history);
  const currentMsg = userMessage.trim();

  if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === 'user') {
    const lastText = sanitized[sanitized.length - 1].parts[0]?.text ?? '';
    const merged = lastText ? `${lastText}\n${currentMsg}` : currentMsg;
    return [
      ...sanitized.slice(0, -1),
      { role: 'user', parts: [{ text: merged }] },
    ];
  }

  return [...sanitized, { role: 'user', parts: [{ text: currentMsg }] }];
}

export interface FarolGeminiToolHandlers {
  registrar_consentimento_lgpd: (args: { aceito: boolean }) => Promise<unknown>;
  atualizar_rascunho_curriculo: (args: Record<string, unknown>) => Promise<unknown>;
  gerar_e_enviar_curriculo_pdf: (args: { confirmadoUsuario: boolean }) => Promise<unknown>;
  buscar_vagas_compativeis: (args: { area?: string; bairro?: string; limite?: number }) => Promise<unknown>;
  candidatar_vaga: (args: { vagaId: string }) => Promise<unknown>;
  listar_cursos_disponiveis: (args: { area?: string; lacunas?: string[] }) => Promise<unknown>;
  registrar_pedido_curso: (args: {
    temaDesejado: string;
    turnoPreferido?: string;
    motivo?: string;
  }) => Promise<unknown>;
  consultar_minhas_candidaturas: () => Promise<unknown>;
  consultar_editais_e_eventos: () => Promise<unknown>;
}

const FAROL_GEMINI_TOOLS_DECLARATION = [
  {
    functionDeclarations: [
      {
        name: 'registrar_consentimento_lgpd',
        description:
          'Registra o consentimento explícito LGPD do cidadão para armazenar seus dados profissionais e buscar vagas/cursos.',
        parameters: {
          type: 'OBJECT',
          properties: {
            aceito: { type: 'BOOLEAN', description: 'true se o cidadão autorizou, false se recusou.' },
          },
          required: ['aceito'],
        },
      },
      {
        name: 'atualizar_rascunho_curriculo',
        description:
          'Atualiza, edita ou remove campos do Currículo Modelo Padrão FAROL do cidadão. Qualquer campo ou lista enviado substitui o valor anterior do mesmo campo (omitidos são preservados). Para apagar itens específicos sem reenviar a lista inteira, use removerCompetencias, removerExperiencias, removerCursosCertificacoes, removerObservacoes ou limparCampos.',
        parameters: {
          type: 'OBJECT',
          properties: {
            nomeCompleto: { type: 'STRING' },
            bairro: { type: 'STRING' },
            municipio: { type: 'STRING' },
            email: { type: 'STRING' },
            escolaridade: {
              type: 'STRING',
              description:
                'Um entre: FUNDAMENTAL_INCOMPLETO, FUNDAMENTAL_COMPLETO, MEDIO_INCOMPLETO, MEDIO_COMPLETO, TECNICO, SUPERIOR_INCOMPLETO, SUPERIOR_COMPLETO',
            },
            areaInteresse: { type: 'STRING' },
            objetivo: { type: 'STRING' },
            resumoProfissional: { type: 'STRING' },
            disponibilidade: { type: 'STRING' },
            competencias: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Lista completa de competências (substitui a lista atual quando enviada).',
            },
            experiencias: {
              type: 'ARRAY',
              description: 'Lista completa de experiências (substitui a lista atual quando enviada).',
              items: {
                type: 'OBJECT',
                properties: {
                  cargo: { type: 'STRING' },
                  empresa: { type: 'STRING' },
                  periodo: { type: 'STRING' },
                  descricao: { type: 'STRING' },
                  trabalhoInformal: { type: 'BOOLEAN' },
                },
                required: ['cargo'],
              },
            },
            formacoes: {
              type: 'ARRAY',
              description: 'Lista completa de formações acadêmicas (substitui a atual quando enviada).',
              items: {
                type: 'OBJECT',
                properties: {
                  nivel: { type: 'STRING' },
                  curso: { type: 'STRING' },
                  instituicao: { type: 'STRING' },
                  anoConclusao: { type: 'STRING' },
                },
                required: ['nivel'],
              },
            },
            cursosCertificacoes: {
              type: 'ARRAY',
              description: 'Lista completa de cursos/certificações (substitui a atual quando enviada).',
              items: {
                type: 'OBJECT',
                properties: {
                  titulo: { type: 'STRING' },
                  instituicao: { type: 'STRING' },
                  cargaHoraria: { type: 'STRING' },
                },
                required: ['titulo'],
              },
            },
            observacoesAdicionais: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Lista completa de observações adicionais (substitui a atual quando enviada).',
            },
            removerCompetencias: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Remove uma ou mais competências pelo nome.',
            },
            removerExperiencias: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Remove experiências cujo cargo ou empresa correspondam aos termos.',
            },
            removerCursosCertificacoes: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Remove cursos/certificações cujo título corresponda aos termos.',
            },
            removerObservacoes: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Remove observações adicionais correspondentes aos termos.',
            },
            limparCampos: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description:
                'Nomes de campos opcionais para zerar (ex: objetivo, resumoProfissional, areaInteresse, disponibilidade, email, competencias, experiencias).',
            },
          },
        },
      },
      {
        name: 'gerar_e_enviar_curriculo_pdf',
        description:
          'Gera o Currículo Modelo Padrão FAROL oficial em PDF, anexa automaticamente ao painel do candidato no portal e agenda o envio do PDF pelo WhatsApp.',
        parameters: {
          type: 'OBJECT',
          properties: {
            confirmadoUsuario: {
              type: 'BOOLEAN',
              description: 'Deve ser true quando o cidadão confirmou os dados ou pediu para gerar o PDF.',
            },
          },
          required: ['confirmadoUsuario'],
        },
      },
      {
        name: 'buscar_vagas_compativeis',
        description:
          'Busca as melhores vagas reais publicadas no FAROL com cálculo determinístico de compatibilidade para o perfil do cidadão.',
        parameters: {
          type: 'OBJECT',
          properties: {
            area: { type: 'STRING' },
            bairro: { type: 'STRING' },
            limite: { type: 'INTEGER' },
          },
        },
      },
      {
        name: 'candidatar_vaga',
        description: 'Registra a candidatura oficial do cidadão em uma vaga escolhida pelo ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            vagaId: { type: 'STRING', description: 'UUID da vaga retornada em buscar_vagas_compativeis.' },
          },
          required: ['vagaId'],
        },
      },
      {
        name: 'listar_cursos_disponiveis',
        description:
          'Lista cursos gratuitos da SEMISPE (programados ou sob demanda), opcionalmente filtrando por área ou lacunas.',
        parameters: {
          type: 'OBJECT',
          properties: {
            area: { type: 'STRING' },
            lacunas: { type: 'ARRAY', items: { type: 'STRING' } },
          },
        },
      },
      {
        name: 'registrar_pedido_curso',
        description:
          'Registra um pedido de curso sob demanda para entrar no ranking oficial da SEMISPE.',
        parameters: {
          type: 'OBJECT',
          properties: {
            temaDesejado: { type: 'STRING' },
            turnoPreferido: { type: 'STRING' },
            motivo: { type: 'STRING' },
          },
          required: ['temaDesejado'],
        },
      },
      {
        name: 'consultar_minhas_candidaturas',
        description: 'Consulta as candidaturas já registradas pelo cidadão e seus respectivos status.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        name: 'consultar_editais_e_eventos',
        description: 'Consulta editais abertos e próximos eventos gratuitos do ecossistema de São Luís.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
    ],
  },
];

async function executarToolCall(
  name: string,
  args: Record<string, unknown>,
  tools: FarolGeminiToolHandlers
): Promise<unknown> {
  switch (name) {
    case 'registrar_consentimento_lgpd':
      return tools.registrar_consentimento_lgpd({ aceito: Boolean(args.aceito) });
    case 'atualizar_rascunho_curriculo':
      return tools.atualizar_rascunho_curriculo(args);
    case 'gerar_e_enviar_curriculo_pdf':
      return tools.gerar_e_enviar_curriculo_pdf({
        confirmadoUsuario: Boolean(args.confirmadoUsuario),
      });
    case 'buscar_vagas_compativeis':
      return tools.buscar_vagas_compativeis({
        area: typeof args.area === 'string' ? args.area : undefined,
        bairro: typeof args.bairro === 'string' ? args.bairro : undefined,
        limite: typeof args.limite === 'number' ? args.limite : undefined,
      });
    case 'candidatar_vaga':
      return tools.candidatar_vaga({
        vagaId: typeof args.vagaId === 'string' ? args.vagaId : '',
      });
    case 'listar_cursos_disponiveis':
      return tools.listar_cursos_disponiveis({
        area: typeof args.area === 'string' ? args.area : undefined,
        lacunas: Array.isArray(args.lacunas)
          ? args.lacunas.filter((l): l is string => typeof l === 'string')
          : undefined,
      });
    case 'registrar_pedido_curso':
      return tools.registrar_pedido_curso({
        temaDesejado: typeof args.temaDesejado === 'string' ? args.temaDesejado : '',
        turnoPreferido: typeof args.turnoPreferido === 'string' ? args.turnoPreferido : undefined,
        motivo: typeof args.motivo === 'string' ? args.motivo : undefined,
      });
    case 'consultar_minhas_candidaturas':
      return tools.consultar_minhas_candidaturas();
    case 'consultar_editais_e_eventos':
      return tools.consultar_editais_e_eventos();
    default:
      return { error: `Ferramenta desconhecida: ${name}` };
  }
}

export async function askFarolGemini(params: {
  systemPrompt: string;
  userMessage: string;
  history: GeminiHistoryMessage[];
  apiKey: string;
  model?: string;
  tools?: FarolGeminiToolHandlers;
  fetchFn?: typeof fetch;
}): Promise<string> {
  const fetcher = params.fetchFn ?? fetch;
  const model = params.model || DEFAULT_FAROL_AI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  let contents: GeminiPayloadMessage[] = buildGeminiContents(params.history, params.userMessage);
  let includeThinking = true;
  let includeTools = Boolean(params.tools);

  const sendRequest = (withThinking: boolean, withTools: boolean) =>
    fetcher(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: params.systemPrompt }] },
        contents,
        ...(withTools ? { tools: FAROL_GEMINI_TOOLS_DECLARATION } : {}),
        generationConfig: {
          temperature: 0.35,
          topP: 0.9,
          maxOutputTokens: 2048,
          ...(withThinking ? { thinkingConfig: { thinkingBudget: 1024 } } : {}),
        },
      }),
      signal: AbortSignal.timeout(25_000),
    });

  for (let round = 0; round < 4; round += 1) {
    let response = await sendRequest(includeThinking, includeTools);

    if (!response.ok && response.status === 400 && includeThinking) {
      includeThinking = false;
      response = await sendRequest(false, includeTools);
    }

    if (!response.ok && response.status === 400 && includeTools) {
      includeTools = false;
      contents = buildGeminiContents(params.history, params.userMessage);
      response = await sendRequest(false, false);
    }

    if (!response.ok) {
      const errBody = typeof response.text === 'function' ? await response.text().catch(() => '') : '';
      throw new Error(`Gemini API HTTP ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const json = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: GeminiContentPart[];
        };
      }>;
    };

    const rawParts = json.candidates?.[0]?.content?.parts ?? [];
    const toolCalls = rawParts.filter((part) => Boolean(part.functionCall?.name));

    if (toolCalls.length > 0 && params.tools && includeTools) {
      contents.push({
        role: 'model',
        parts: rawParts,
      });

      const functionResponses: GeminiContentPart[] = await Promise.all(
        toolCalls.map(async (tc) => {
          const fnName = tc.functionCall?.name ?? '';
          const fnArgs = tc.functionCall?.args ?? {};
          const result = await executarToolCall(fnName, fnArgs, params.tools!);
          return {
            functionResponse: {
              name: fnName,
              response: { result },
            },
          };
        })
      );

      contents.push({
        role: 'user',
        parts: functionResponses,
      });
      continue;
    }

    const fullText = rawParts
      .filter((p) => !p.thought && typeof p.text === 'string')
      .map((p) => p.text ?? '')
      .join('')
      .trim();

    if (fullText) return fullText;
    break;
  }

  return 'Como posso te ajudar agora com seu currículo, vagas ou cursos gratuitos da SEMISPE?';
}
