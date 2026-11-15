const CPF_REGEX = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;

export interface ResultadoSanitizacao {
  textoLimpo: string;
  detectouCpf: boolean;
}

/**
 * Remove padrões de CPF para garantir que a IA FAROL nunca armazene
 * documentos sensíveis enviados espontaneamente pelo usuário.
 */
export function sanitizarEntradaCidadao(texto: string): ResultadoSanitizacao {
  const detectouCpf = CPF_REGEX.test(texto);
  const textoLimpo = texto.replace(CPF_REGEX, '[DADO_REMOVIDO_LGPD]').trim();
  return { textoLimpo, detectouCpf };
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
