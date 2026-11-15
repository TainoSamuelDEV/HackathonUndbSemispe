import { describe, expect, it } from 'vitest';
import { calcularCompatibilidade } from '@/server/domain/matching/MatchEngine';

describe('MatchEngine (70% obrigatórios / 30% desejáveis)', () => {
  it('calcula 100% quando todos os requisitos obrigatórios e desejáveis são atendidos', () => {
    const res = calcularCompatibilidade(
      {
        escolaridade: 'MEDIO_COMPLETO',
        competencias: ['Atendimento ao público', 'Pacote Office', 'Organização'],
      },
      {
        escolaridadeMinima: 'MEDIO_COMPLETO',
        requisitos: [
          { nome: 'Atendimento ao público', tipo: 'CONHECIMENTO', obrigatorio: true },
          { nome: 'Pacote Office', tipo: 'CONHECIMENTO', obrigatorio: false },
        ],
      }
    );

    expect(res.percentual).toBe(100);
    expect(res.obrigatoriosPendentes).toHaveLength(0);
    expect(res.naoIdentificados).toHaveLength(0);
  });

  it('aplica exatamente peso 70% para obrigatórios e 30% para desejáveis', () => {
    const res = calcularCompatibilidade(
      {
        escolaridade: 'MEDIO_COMPLETO',
        competencias: ['Soldagem básica'],
      },
      {
        escolaridadeMinima: 'MEDIO_COMPLETO',
        requisitos: [
          { nome: 'Soldagem básica', tipo: 'CONHECIMENTO', obrigatorio: true },
          { nome: 'Curso de NR-12', tipo: 'CERTIFICACAO', obrigatorio: false },
        ],
      }
    );

    // Obrigatórios: 2/2 (100% * 0.7 = 70) | Desejáveis: 0/1 (0% * 0.3 = 0)
    expect(res.percentual).toBe(70);
    expect(res.obrigatoriosPendentes).toHaveLength(0);
    expect(res.naoIdentificados).toEqual([
      { item: 'Curso de NR-12', tipo: 'CERTIFICACAO', obrigatorio: false },
    ]);
  });

  it('sinaliza requisito obrigatório pendente sem impedir cálculo', () => {
    const res = calcularCompatibilidade(
      {
        escolaridade: 'FUNDAMENTAL_COMPLETO',
        competencias: ['Operação de empilhadeira'],
      },
      {
        escolaridadeMinima: 'MEDIO_COMPLETO',
        requisitos: [
          { nome: 'Operação de empilhadeira', tipo: 'CONHECIMENTO', obrigatorio: true },
        ],
      }
    );

    // Obrigatórios: 1/2 (50%)
    expect(res.percentual).toBe(50);
    expect(res.obrigatoriosPendentes).toEqual(['Ensino Médio completo']);
  });
});
