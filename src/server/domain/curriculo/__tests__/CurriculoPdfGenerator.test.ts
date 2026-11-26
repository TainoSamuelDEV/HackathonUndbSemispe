import { describe, expect, it } from 'vitest';
import {
  calcularCompletudeCurriculo,
  gerarNomeArquivoCurriculo,
  mesclarCurriculoPadrao,
  sanitizarCurriculoPadrao,
} from '@/server/domain/curriculo/CurriculoPadrao';
import { gerarCurriculoPadraoPdf } from '@/server/domain/curriculo/CurriculoPdfGenerator';

describe('Currículo Modelo Padrão FAROL & Gerador PDF', () => {
  it('sanitiza CPF e RG de qualquer campo antes de gerar o currículo', () => {
    const limpo = sanitizarCurriculoPadrao({
      nomeCompleto: 'Maria da Silva',
      bairro: 'Anjo da Guarda',
      objetivo: 'Atendimento ao público. CPF 123.456.789-00 RG: 9876543-2',
      competencias: ['Caixa', 'Atendimento', 'caixa'],
    });

    expect(limpo.objetivo).not.toContain('123.456.789-00');
    expect(limpo.objetivo).not.toContain('9876543-2');
    expect(limpo.competencias).toEqual(['Caixa', 'Atendimento']);
  });

  it('gera PDF 1.4 válido com estrutura xref/%%EOF, cabeçalho e acentuação WinAnsi', () => {
    const dados = mesclarCurriculoPadrao(
      {
        nomeCompleto: 'João Pedro Almeida',
        bairro: 'Itaqui-Bacanga',
        municipio: 'São Luís',
        telefoneWhatsApp: '5598991234567',
        escolaridade: 'TECNICO',
        areaInteresse: 'Logística Portuária',
        objetivo: 'Atuar na conferência de cargas e controle de estoque.',
        resumoProfissional: 'Técnico em Logística com vivência prática em almoxarifado e expedição.',
        disponibilidade: 'Turnos e escalas',
        competencias: ['Controle de estoque', 'Pacote Office', 'Operação de empilhadeira'],
        experiencias: [
          {
            cargo: 'Auxiliar de Almoxarifado',
            empresa: 'Distribuidora Maranhão',
            periodo: '2022 - 2025',
            descricao: 'Conferência de notas fiscais e organização de inventário.',
          },
        ],
        cursosCertificacoes: [
          {
            titulo: 'NR-12 Segurança em Máquinas',
            instituicao: 'SEMISPE',
            cargaHoraria: '16h',
          },
        ],
      },
      {}
    );

    const pdf = gerarCurriculoPadraoPdf(dados);
    const ascii = pdf.buffer.toString('latin1');

    expect(pdf.mimeType).toBe('application/pdf');
    expect(pdf.fileName).toBe('Curriculo_FAROL_Joao_Pedro_Almeida.pdf');
    expect(pdf.pageCount).toBe(1);
    expect(ascii.startsWith('%PDF-1.4')).toBe(true);
    expect(ascii).toContain('/Type /Catalog');
    expect(ascii).toContain('/Encoding /WinAnsiEncoding');
    expect(ascii).toContain('xref');
    expect(ascii.trimEnd().endsWith('%%EOF')).toBe(true);
  });

  it('pagina automaticamente quando o currículo possui muitas experiências', () => {
    const experiencias = Array.from({ length: 18 }, (_, i) => ({
      cargo: `Atividade Profissional ${i + 1}`,
      empresa: `Empresa Local ${i + 1}`,
      periodo: '2020 - 2024',
      descricao:
        'Atuação contínua em atendimento, conferência de materiais, organização operacional e apoio às equipes.',
    }));

    const pdf = gerarCurriculoPadraoPdf(
      sanitizarCurriculoPadrao({
        nomeCompleto: 'Ana Paula Ferreira',
        bairro: 'Vila Embratel',
        escolaridade: 'MEDIO_COMPLETO',
        competencias: ['Atendimento', 'Organização', 'Vendas'],
        experiencias,
      })
    );

    expect(pdf.pageCount).toBeGreaterThan(1);
    expect(pdf.buffer.toString('latin1')).toContain('P\\341gina 2 de');
  });

  it('calcula completude e gera nome de arquivo seguro', () => {
    const comp = calcularCompletudeCurriculo({
      nomeCompleto: 'Carlos Eduardo',
      bairro: 'Anjo da Guarda',
    });
    expect(comp.prontoParaGerar).toBe(false);
    expect(comp.camposFaltantes).toContain('escolaridade');

    expect(gerarNomeArquivoCurriculo('../../etc/passwd João!')).toBe(
      'Curriculo_FAROL_etc_passwd_Joao.pdf'
    );
  });
});
