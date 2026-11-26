/**
 * Imagens de capa das vagas.
 *
 * Cada vaga pode ter `imagemCapaUrl` (coluna `vagas.imagem_capa_url`). Quando ausente ou inválida,
 * usamos a imagem padrão da área, garantindo que toda vaga tenha fundo.
 *
 * Fotos em /public/vagas/capas — Unsplash License (uso comercial livre, sem atribuição obrigatória):
 *  - industria.jpg  → unsplash.com/photos/UWU_i03dNq4 (TECNIC Bioprocess Solutions)
 *  - logistica.jpg  → unsplash.com/photos/F2C_mSrb6iM (Bernd Dittrich)
 *  - escritorio.jpg → unsplash.com/photos/gEvMA8O6Et4
 *  - tecnologia.jpg → unsplash.com/photos/oYzjGQ7LCVE (Bayu Syaits)
 *  - comercio.jpg   → unsplash.com/photos/GInTp0NE14w (Vitaly Gariev)
 *  - porto.jpg      → unsplash.com/photos/5T5zmIqs0AM (taro ohtani)
 */

export const CAPAS_PADRAO = {
  industria: '/vagas/capas/industria.jpg',
  logistica: '/vagas/capas/logistica.jpg',
  escritorio: '/vagas/capas/escritorio.jpg',
  tecnologia: '/vagas/capas/tecnologia.jpg',
  comercio: '/vagas/capas/comercio.jpg',
  porto: '/vagas/capas/porto.jpg',
} as const;

// A ordem importa: a primeira regra que casar define a capa.
const REGRAS: Array<[RegExp, string]> = [
  [/tecnolog|software|desenvolv|program|dados|\bti\b|suporte tecnico|informatica|digital/, CAPAS_PADRAO.tecnologia],
  [/logistic|transport|almoxarif|estoque|armazem|expedic|motorista|entrega|portuar|carga/, CAPAS_PADRAO.logistica],
  [/manutenc|mecanic|industri|solda|eletric|operador|producao|fabrica|construc|obra|civil|pedreir/, CAPAS_PADRAO.industria],
  [/comerc|vend|varejo|loja|caixa|repositor/, CAPAS_PADRAO.comercio],
  [/administr|atendimento|escritorio|financ|contab|recep|secretar|recursos humanos|\brh\b|marketing/, CAPAS_PADRAO.escritorio],
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

/** Capa padrão pela área da vaga (com o título como segunda pista). */
export function capaPadraoDaVaga(area: string, titulo = '') {
  return buscarRegra(area) ?? buscarRegra(titulo) ?? CAPAS_PADRAO.porto;
}

/** Aceita apenas https:// ou caminho local do portal (mesma regra do CHECK no banco). */
export function urlCapaValida(url: string | null | undefined): url is string {
  if (!url) return false;
  return /^(https:\/\/\S+|\/[^/\s]\S*)$/i.test(url.trim()) && url.length <= 2000;
}

export function capaDaVaga(vaga: { imagemCapaUrl?: string | null; area: string; titulo?: string }) {
  const fallback = capaPadraoDaVaga(vaga.area, vaga.titulo);
  const src = urlCapaValida(vaga.imagemCapaUrl) ? vaga.imagemCapaUrl.trim() : fallback;
  return { src, fallback };
}
