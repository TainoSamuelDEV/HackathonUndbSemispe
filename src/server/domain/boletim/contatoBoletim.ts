import type { TipoContatoBoletim } from '@/types/farol';

export interface ContatoBoletim {
  /** Forma normalizada, usada como chave única: e-mail em minúsculas ou WhatsApp só com dígitos (DDI 55). */
  contato: string;
  tipo: TipoContatoBoletim;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Interpreta o contato informado no formulário do boletim.
 * Aceita e-mail ou número de WhatsApp brasileiro com DDD (com ou sem DDI 55 e formatação).
 * Retorna null quando o valor não é um e-mail nem um telefone válido.
 */
export function normalizarContatoBoletim(entrada: string): ContatoBoletim | null {
  const valor = entrada.trim();
  if (!valor) return null;

  if (valor.includes('@')) {
    const email = valor.toLowerCase();
    return email.length <= 160 && EMAIL.test(email) ? { contato: email, tipo: 'EMAIL' } : null;
  }

  // Telefone: só aceita dígitos e caracteres de formatação usuais
  if (!/^[\d\s()+.-]+$/.test(valor)) return null;

  let digitos = valor.replace(/\D/g, '');
  if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`;
  if (!/^55[1-9]{2}\d{8,9}$/.test(digitos)) return null;

  return { contato: digitos, tipo: 'WHATSAPP' };
}
