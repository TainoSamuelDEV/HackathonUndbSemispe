/** Rótulos legíveis para os enums da vaga (evita exibir PRESENCIAL, JOVEM_APRENDIZ etc.). */

const MODALIDADE: Record<string, string> = {
  PRESENCIAL: 'Presencial',
  HIBRIDO: 'Híbrido',
  REMOTO: 'Remoto',
};

const CONTRATACAO: Record<string, string> = {
  CLT: 'CLT',
  ESTAGIO: 'Estágio',
  JOVEM_APRENDIZ: 'Jovem aprendiz',
  TEMPORARIO: 'Temporário',
  AUTONOMO_MEI: 'Autônomo / MEI',
  OUTRO: 'Outro',
};

export const rotuloModalidade = (valor: string) => MODALIDADE[valor] ?? valor;
export const rotuloContratacao = (valor: string) => CONTRATACAO[valor] ?? valor;
