import { sanitizarEntradaCidadao } from '@/server/domain/ai/Guardrails';
import { isClosingCourtesyIntent } from '@/server/ai/whatsapp/whatsappIntent';

export interface FarolSafetyResult {
  corrected: boolean;
  reasons: string[];
  text: string;
}

function detectsJobGuaranteePromise(rawReply: string): boolean {
  const clean = rawReply.replace(/[*_~`]/g, '').toLowerCase();
  const clauses = clean.split(/[.!?\n,;]+/);

  for (const clause of clauses) {
    const trimmed = clause.trim();
    if (!trimmed) continue;
    if (/\b(n[aã]o|jamais|nunca)\s+(garanto|prometo|garantimos|prometemos|assegur)/i.test(trimmed)) {
      continue;
    }
    if (
      /\b(garanto|garantimos|prometo|prometemos|vaga\s+garantida|emprego\s+garantido|contrata[cç][aã]o\s+garantida|entrevista\s+garantida|voc[eê]\s+vai\s+ser\s+contratad[oa])\b/i.test(
        trimmed
      )
    ) {
      return true;
    }
  }
  return false;
}

function normalizeWhatsAppBold(text: string): string {
  return text.replace(/\*\*([^*\n]+)\*\*/g, '*$1*');
}

/**
 * Defesa determinística final sobre as respostas da IA FAROL:
 * - Impede vazamento de CPF/RG na resposta
 * - Impede promessa de emprego/contratação garantida
 * - Impede reinício abrupto de saudação ("Olá! Seja bem-vindo...") em conversas em andamento
 * - Padroniza negrito para WhatsApp (*texto*)
 */
export function enforceFarolSafety(params: {
  reply: string;
  userText: string;
  hasPreviousInteraction: boolean;
  cidadaoNome?: string | null;
  periodo?: 'manha' | 'tarde' | 'noite';
}): FarolSafetyResult {
  const reasons: string[] = [];
  let text = normalizeWhatsAppBold(params.reply.trim());

  const sanitizado = sanitizarEntradaCidadao(text);
  if (sanitizado.detectouCpf || sanitizado.detectouRg) {
    text = sanitizado.textoLimpo;
    reasons.push('pii_removed');
  }

  if (detectsJobGuaranteePromise(text)) {
    reasons.push('job_guarantee_removed');
    const nome = params.cidadaoNome ? `, ${params.cidadaoNome}` : '';
    text =
      `Entendi${nome}! Pelo FAROL eu consigo montar seu currículo, mostrar as vagas compatíveis e encaminhar sua candidatura, mas a seleção e a entrevista ficam sempre a critério de cada empresa. Quer que eu veja as vagas que mais combinam com você?`;
  }

  if (
    params.hasPreviousInteraction &&
    /(seja bem[- ]vindo|como posso (lhe |te )?ajudar hoje|em que posso ajudar hoje|eu sou a assistente do farol)/i.test(
      text
    )
  ) {
    reasons.push('abrupt_greeting_removed');
    const nome = params.cidadaoNome ? `, ${params.cidadaoNome}` : '';

    if (isClosingCourtesyIntent(params.userText)) {
      if (params.periodo === 'manha') {
        text = `Bom dia${nome}! Tenha um excelente dia. Sempre que precisar do FAROL, é só chamar por aqui!`;
      } else if (params.periodo === 'tarde') {
        text = `Boa tarde${nome}! Tenha uma ótima tarde. Sempre que precisar do FAROL, estou por aqui!`;
      } else {
        text = `Boa noite${nome}! Bom descanso. Quando precisar buscar vagas ou atualizar seu currículo, é só chamar!`;
      }
    } else {
      const cleaned = text
        .replace(
          /^(ol[aá]|oi|bom\s+dia|boa\s+tarde|boa\s+noite)[!.,\s]*(eu\s+sou\s+a\s+assistente\s+do\s+farol[^\n.!?]*[.!?]\s*)?(seja\s+bem[- ]vindo[^\n.!?]*[.!?]\s*)?/i,
          ''
        )
        .replace(/como posso (lhe |te )?ajudar hoje\??/i, '')
        .trim();
      text = cleaned || `Oi${nome}! Como posso continuar te ajudando com seu currículo, vagas ou cursos?`;
    }
  }

  return {
    corrected: reasons.length > 0,
    reasons,
    text,
  };
}
