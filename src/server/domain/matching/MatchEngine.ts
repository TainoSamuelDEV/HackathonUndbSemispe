import type {
  LacunaMatch,
  NivelEscolaridade,
  RequisitoVaga,
  ResultadoMatch,
} from '@/types/farol';

const ORDEM_ESCOLARIDADE: Record<NivelEscolaridade, number> = {
  FUNDAMENTAL_INCOMPLETO: 1,
  FUNDAMENTAL_COMPLETO: 2,
  MEDIO_INCOMPLETO: 3,
  MEDIO_COMPLETO: 4,
  TECNICO: 5,
  SUPERIOR_INCOMPLETO: 6,
  SUPERIOR_COMPLETO: 7,
};

const LABEL_ESCOLARIDADE: Record<NivelEscolaridade, string> = {
  FUNDAMENTAL_INCOMPLETO: 'Ensino Fundamental incompleto',
  FUNDAMENTAL_COMPLETO: 'Ensino Fundamental completo',
  MEDIO_INCOMPLETO: 'Ensino Médio incompleto',
  MEDIO_COMPLETO: 'Ensino Médio completo',
  TECNICO: 'Ensino Técnico',
  SUPERIOR_INCOMPLETO: 'Ensino Superior incompleto',
  SUPERIOR_COMPLETO: 'Ensino Superior completo',
};

export interface PerfilParaMatch {
  escolaridade: NivelEscolaridade | null;
  competencias: string[];
}

export interface VagaParaMatch {
  escolaridadeMinima: NivelEscolaridade | null;
  requisitos: RequisitoVaga[];
}

export function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function candidatoAtendeCompetencia(competenciasNormalizadas: string[], requisitoNome: string): boolean {
  const reqNorm = normalizarTexto(requisitoNome);
  if (!reqNorm) return false;
  return competenciasNormalizadas.some(
    (comp) => comp === reqNorm || comp.includes(reqNorm) || reqNorm.includes(comp)
  );
}

/**
 * Motor determinístico de compatibilidade (70% obrigatórios / 30% desejáveis).
 * Regra oficial do FAROL: localização/bairro NUNCA entra no cálculo numérico do score.
 */
export function calcularCompatibilidade(
  perfil: PerfilParaMatch,
  vaga: VagaParaMatch
): ResultadoMatch {
  const competenciasNorm = perfil.competencias.map(normalizarTexto).filter(Boolean);

  const atendidos: string[] = [];
  const naoIdentificados: LacunaMatch[] = [];
  const obrigatoriosPendentes: string[] = [];

  let totalObrigatorios = 0;
  let atendidosObrigatorios = 0;

  let totalDesejaveis = 0;
  let atendidosDesejaveis = 0;

  // 1. Escolaridade mínima integra os requisitos obrigatórios
  if (vaga.escolaridadeMinima) {
    totalObrigatorios += 1;
    const nivelMin = ORDEM_ESCOLARIDADE[vaga.escolaridadeMinima];
    const nivelCand = perfil.escolaridade ? ORDEM_ESCOLARIDADE[perfil.escolaridade] : 0;
    const labelEscolaridade = LABEL_ESCOLARIDADE[vaga.escolaridadeMinima];

    if (nivelCand >= nivelMin) {
      atendidosObrigatorios += 1;
      atendidos.push(labelEscolaridade);
    } else {
      obrigatoriosPendentes.push(labelEscolaridade);
      naoIdentificados.push({
        item: labelEscolaridade,
        tipo: 'REQUISITO',
        obrigatorio: true,
      });
    }
  }

  // 2. Requisitos estruturados (competências, certificações, etc.)
  for (const req of vaga.requisitos) {
    const atende = candidatoAtendeCompetencia(competenciasNorm, req.nome);

    if (req.obrigatorio) {
      totalObrigatorios += 1;
      if (atende) {
        atendidosObrigatorios += 1;
        atendidos.push(req.nome);
      } else {
        obrigatoriosPendentes.push(req.nome);
        naoIdentificados.push({
          item: req.nome,
          tipo: req.tipo,
          obrigatorio: true,
        });
      }
    } else {
      totalDesejaveis += 1;
      if (atende) {
        atendidosDesejaveis += 1;
        atendidos.push(`${req.nome} (desejável)`);
      } else {
        naoIdentificados.push({
          item: req.nome,
          tipo: req.tipo,
          obrigatorio: false,
        });
      }
    }
  }

  // 3. Ponderação oficial: 70% obrigatórios + 30% desejáveis
  let score = 0;
  if (totalObrigatorios > 0 && totalDesejaveis > 0) {
    const taxaObrig = atendidosObrigatorios / totalObrigatorios;
    const taxaDesej = atendidosDesejaveis / totalDesejaveis;
    score = Math.round((taxaObrig * 0.7 + taxaDesej * 0.3) * 100);
  } else if (totalObrigatorios > 0) {
    score = Math.round((atendidosObrigatorios / totalObrigatorios) * 100);
  } else if (totalDesejaveis > 0) {
    score = Math.round((atendidosDesejaveis / totalDesejaveis) * 100);
  } else {
    score = 100;
  }

  return {
    percentual: Math.max(0, Math.min(100, score)),
    atendidos,
    naoIdentificados,
    obrigatoriosPendentes,
    avaliadoEm: new Date().toISOString(),
  };
}
