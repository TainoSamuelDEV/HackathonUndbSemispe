const CPF_REGEX = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const RG_ROTULADO_REGEX = /\b(?:rg|identidade|registro\s+geral)\s*[:#-]?\s*\d[\d.\-\s]{4,14}[\dxX]?\b/gi;

export interface ResultadoSanitizacao {
  textoLimpo: string;
  detectouCpf: boolean;
  detectouRg: boolean;
}

/**
 * Remove padrões de CPF e RG rotulado para garantir que a IA FAROL nunca armazene
 * documentos sensíveis enviados espontaneamente pelo usuário.
 */
export function sanitizarEntradaCidadao(texto: string): ResultadoSanitizacao {
  CPF_REGEX.lastIndex = 0;
  RG_ROTULADO_REGEX.lastIndex = 0;
  const detectouCpf = CPF_REGEX.test(texto);
  const detectouRg = RG_ROTULADO_REGEX.test(texto);
  CPF_REGEX.lastIndex = 0;
  RG_ROTULADO_REGEX.lastIndex = 0;

  const textoLimpo = texto
    .replace(CPF_REGEX, '[DADO_REMOVIDO_LGPD]')
    .replace(RG_ROTULADO_REGEX, '[DADO_REMOVIDO_LGPD]')
    .trim();

  return { textoLimpo, detectouCpf, detectouRg };
}

/**
 * Normaliza telefone brasileiro para padrão E.164 numérico (ex: 5598999998888).
 */
export function normalizarTelefoneWhatsApp(raw: string): string {
  const apenasDigitos = raw.replace(/@s\.whatsapp\.net$/i, '').replace(/\D/g, '');
  if (!apenasDigitos) return '';
  if (apenasDigitos.startsWith('55') && (apenasDigitos.length === 12 || apenasDigitos.length === 13)) {
    return apenasDigitos;
  }
  if (apenasDigitos.length === 10 || apenasDigitos.length === 11) {
    return `55${apenasDigitos}`;
  }
  return apenasDigitos;
}

/**
 * Gera variações possíveis de telefone brasileiro no WhatsApp (com/sem 55 e com/sem 9º dígito)
 * para lookup consistente de candidatos e sessões no banco.
 */
export function gerarVariacoesTelefoneWhatsApp(raw: string): string[] {
  const normalizado = normalizarTelefoneWhatsApp(raw);
  if (!normalizado) return [];

  const variacoes = new Set<string>();
  const add = (num: string) => {
    if (!num) return;
    variacoes.add(num);
    variacoes.add(`${num}@s.whatsapp.net`);
  };

  add(normalizado);

  if (normalizado.startsWith('55')) {
    const semPais = normalizado.slice(2);
    add(semPais);

    if (semPais.length === 11 && semPais[2] === '9') {
      const semNono = `${semPais.slice(0, 2)}${semPais.slice(3)}`;
      add(semNono);
      add(`55${semNono}`);
    } else if (semPais.length === 10) {
      const comNono = `${semPais.slice(0, 2)}9${semPais.slice(2)}`;
      add(comNono);
      add(`55${comNono}`);
    }
  }

  return Array.from(variacoes);
}
