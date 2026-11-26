export function pickRandom<T>(items: T[], randomFn: () => number = Math.random): T {
  if (items.length === 0) throw new Error('Items array cannot be empty');
  const index = Math.floor(randomFn() * items.length);
  return items[index];
}

/**
 * Detecta mensagens automáticas de ausência de WhatsApp Business para evitar loops entre robôs.
 */
export function isAutoResponderMessage(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const normalized = text.toLowerCase();

  const botSignatures = [
    'mensagem automática',
    'mensagem automatica',
    'resposta automática',
    'resposta automatica',
    'agradecemos sua mensagem',
    'estamos ausentes',
    'não estamos disponíveis no momento',
    'nao estamos disponiveis no momento',
    'retornaremos assim que possível',
    'retornaremos assim que possivel',
    'horário de atendimento é de',
    'este é um canal de atendimento automático',
  ];

  return botSignatures.some((sig) => normalized.includes(sig));
}

/**
 * Detecta solicitação de atendimento humano / equipe da SEMISPE.
 */
export function isHumanHandoffIntent(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const normalized = text.toLowerCase().trim();

  const directPatterns = [
    /^(atendente|atendimento\s+humano|humano|equipe\s+semispe)[\s!.,?]*$/i,
    /(falar|conversar)\s+com\s+(um[a]?\s+|[oa]s?\s+|algum[a]?\s+)?(pessoa|humano|atendente|algu[eé]m|equipe|semispe)/i,
    /(quero|preciso|gostaria|favor|solicito|d[aá]\s+pra|tem\s+como|posso|pode|consegue)\s+(de\s+)?(falar\s+com\s+|conversar\s+com\s+)?(um[a]?\s+|[oa]s?\s+|algum[a]?\s+)?(atendente|pessoa|humano|algu[eé]m|atendimento\s+humano)/i,
    /(passa|passar|transfere|transferir|mudar|chama|chamar)\s+(para\s+|pra\s+|pro\s+)?(um[a]?\s+|[oa]s?\s+|algum[a]?\s+)?(atendente|pessoa|humano|algu[eé]m|equipe)/i,
    /(atendimento|ajuda|suporte)\s+(humano|manual|com\s+(uma?\s+|[oa]s?\s+)?(pessoa|humano|atendente))/i,
    /(pessoa|algu[eé]m|gente)\s+(de\s+verdade|real)|rob[oô]\s+n[aã]o|n[aã]o\s+quero\s+(falar\s+com\s+)?rob[oô]/i,
    /tem\s+(algu[eé]m|uma?\s+pessoa)\s+(a[ií]|aqui)\s+(da\s+semispe)?/i,
  ];

  return directPatterns.some((pattern) => pattern.test(normalized));
}

/**
 * Detecta confirmação afirmativa após a IA perguntar se o cidadão quer mesmo falar com a equipe humana.
 */
export function isConfirmHandoffIntent(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const normalized = text
    .toLowerCase()
    .replace(/[,\-_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (
    normalized.includes('?') ||
    /(vaga|curso|curr[ií]culo|quanto|qual|onde|como|quando)/i.test(normalized)
  ) {
    return false;
  }

  const confirmPatterns = [
    /^(sim|quero|quero\s+sim|sim\s+quero|com\s+certeza|isso|exato|exatamente|por\s+favor|sim\s+por\s+favor|1)[\s!.,👍✌️🙏]*$/i,
    /^(chama(\s+a[ií]|\s+l[aá])?|pode\s+chamar|chamar|transfere|pode\s+transferir|transferir)[\s!.,👍✌️🙏]*$/i,
    /^((sim\s*)?(quero\s*)?(com\s*)?(o\s+|um[a]?\s+)?(atendente|humano|pessoa|equipe)(\s+mesmo)?)[\s!.,👍✌️🙏]*$/i,
    /^(prefiro|quero)\s+(falar\s+com\s+)?(um[a]?\s+|[oa]\s+)?(atendente|humano|pessoa|equipe)[\s!.,👍✌️🙏]*$/i,
  ];

  return confirmPatterns.some((pattern) => pattern.test(normalized));
}

/**
 * Detecta recusa de falar com atendente (cidadão prefere continuar com a IA FAROL).
 */
export function isRejectHandoffIntent(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const normalized = text.toLowerCase().trim();

  const rejectPatterns = [
    /^(n[aã]o|n[aã]o\s+precisa|n[aã]o\s+quero|deixa|deixa\s+quieto|esquece|cancela|2)[\s!.,👍✌️🙏]*$/i,
    /^(pode\s+ser\s+por\s+aqui(\s+mesmo)?|ajuda\s+por\s+aqui(\s+mesmo)?|por\s+aqui\s+mesmo|voc[eê]\s+mesm[ao]|prefiro\s+voc[eê]|continua)[\s!.,👍✌️🙏]*$/i,
    /^n[aã]o,?\s*(quero|pode|prefiro)/i,
  ];

  return rejectPatterns.some((pattern) => pattern.test(normalized));
}

export function buildHandoffConfirmationQuestion(nome?: string | null): string {
  const saudacaoNome = nome ? `, ${nome}` : '';
  return (
    `Você prefere que eu passe seu atendimento para a equipe humana da SEMISPE${saudacaoNome}, ou posso continuar te ajudando por aqui? ` +
    `Consigo montar seu currículo em PDF, buscar vagas e mostrar cursos gratuitos na hora. ` +
    `Se preferir falar com um atendente, me responda *"Sim, quero atendente"*.`
  );
}

/**
 * Detecta cortesias puras de encerramento em conversas já iniciadas.
 */
export function isClosingCourtesyIntent(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const normalized = text.toLowerCase().trim();

  if (
    normalized.includes('?') ||
    /(vaga|curso|curr[ií]culo|pdf|quanto|qual|onde|como|quando|tem|posso|pode|consegue|quero)/i.test(
      normalized
    )
  ) {
    return false;
  }

  const directFarewellPatterns = [
    /^(boa\s+noite|boa\s+tarde|bom\s+dia|bom\s+descanso|boa\s+semana|bom\s+fim\s+de\s+semana)[\s!.,👍✌️🙏]*$/i,
    /^(obrigad[ao]|valeu|valeu\s+obrigad[ao]|muito\s+obrigad[ao]|agrade[cç]o|valeu\s+demais|show\s+obrigad[ao]|perfeito\s+obrigad[ao])[\s!.,👍✌️🙏]*$/i,
    /^(at[eé]\s+(logo|mais|amanh[aã]|breve|a\s+pr[oó]xima)|falou|tchau|abra[cç]o|tmj|tamo\s+junto)[\s!.,👍✌️🙏]*$/i,
    /^((muito\s+)?obrigad[ao]|valeu|tenha\s+um[a]?|beleza|tranquilo|show|fechado|perfeito|combinado)[\s,]+(boa\s+noite|bom\s+dia|boa\s+tarde|bom\s+descanso)[\s!.,👍✌️🙏]*$/i,
  ];

  return directFarewellPatterns.some((pattern) => pattern.test(normalized));
}

export function detectarRespostaConsentimento(text: string): 'ACEITO' | 'RECUSADO' | null {
  const norm = text.toLowerCase().trim();
  if (
    /^(1|sim|s|aceito|autorizo|pode\s+come[cç]ar|pode\s+sim|concordo|claro|com\s+certeza|ok|beleza|bora)[\s!.,]*$/i.test(
      norm
    )
  ) {
    return 'ACEITO';
  }
  if (/^(2|n[aã]o|nao|n|recuso|n[aã]o\s+autorizo|n[aã]o\s+quero)[\s!.,]*$/i.test(norm)) {
    return 'RECUSADO';
  }
  return null;
}
