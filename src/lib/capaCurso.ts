import { CAPAS_PADRAO as CAPAS_VAGAS, urlCapaValida } from './capaVaga';

/**
 * Imagens de capa dos cursos.
 *
 * Cada curso pode ter `imagemCapaUrl` (coluna `cursos.imagem_capa_url`). Quando ausente ou inválida,
 * usamos a imagem padrão do tema do curso, garantindo que todo curso tenha fundo.
 *
 * Fotos em /public/cursos/capas — Unsplash License (uso comercial livre, sem atribuição obrigatória):
 *  - seguranca.jpg   → unsplash.com/photos/wjHdeYmI-XU (Tanya Paquet)
 *  - informatica.jpg → unsplash.com/photos/ereEoYDIl20 (Poddar Group of Institutions)
 *  - logistica.jpg   → unsplash.com/photos/HbUhHmGCB-w (Homa Appliances)
 *  - capacitacao.jpg → unsplash.com/photos/XH8chLuj02g (Centre for Ageing Better)
 */

export const CAPAS_CURSOS = {
  seguranca: '/cursos/capas/seguranca.jpg',
  informatica: '/cursos/capas/informatica.jpg',
  logistica: '/cursos/capas/logistica.jpg',
  capacitacao: '/cursos/capas/capacitacao.jpg',
} as const;

// A ordem importa: a primeira regra que casar define a capa.
const REGRAS: Array<[RegExp, string]> = [
  [/seguranca|\bnr-?\s?\d|\bepi\b|prevenc|primeiros socorros|brigad|bombeiro/, CAPAS_CURSOS.seguranca],
  [/informatica|office|computador|excel|planilha|digital|tecnolog|programa|dados|internet/, CAPAS_CURSOS.informatica],
  [/logistic|transport|empilhadeira|estoque|almoxarif|armazem|portuar|carga/, CAPAS_CURSOS.logistica],
  [/manutenc|mecanic|industri|solda|eletric|eletrotec|construc|obra|pedreir/, CAPAS_VAGAS.industria],
  [/comerc|vend|varejo|atendimento|caixa/, CAPAS_VAGAS.comercio],
];

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function buscarRegra(texto: string) {
  const alvo = normalizar(texto);
  return REGRAS.find(([regex]) => regex.test(alvo))?.[1];
}

/** Capa padrão do curso: o título é a pista principal (ex.: "Informática Básica" na área "Administrativo"). */
export function capaPadraoDoCurso(titulo: string, area: string) {
  return buscarRegra(titulo) ?? buscarRegra(area) ?? CAPAS_CURSOS.capacitacao;
}

export function capaDoCurso(curso: { imagemCapaUrl?: string | null; titulo: string; area: string }) {
  const fallback = capaPadraoDoCurso(curso.titulo, curso.area);
  const src = urlCapaValida(curso.imagemCapaUrl) ? curso.imagemCapaUrl.trim() : fallback;
  return { src, fallback };
}
