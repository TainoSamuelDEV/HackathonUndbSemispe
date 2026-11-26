import { describe, expect, it } from 'vitest';
import {
  aplicarEdicaoCurriculoPadrao,
  calcularCompletudeCurriculo,
  gerarNomeArquivoCurriculo,
  mesclarCurriculoPadrao,
  sanitizarCurriculoPadrao,
} from '@/server/domain/curriculo/CurriculoPadrao';
import { gerarCurriculoPadraoPdf } from '@/server/domain/curriculo/CurriculoPdfGenerator';

function validarTabelaXrefByteAByte(buffer: Buffer): number {
  const ascii = buffer.toString('latin1');
  const startXrefMatch = ascii.match(/startxref\s+(\d+)\s+%%EOF/);
  expect(startXrefMatch).not.toBeNull();
  const startXref = Number(startXrefMatch![1]);

  const xrefSlice = ascii.slice(startXref);
  expect(xrefSlice.startsWith('xref')).toBe(true);

  const linhas = xrefSlice.split(/\r?\n/);
  const [inicioStr, countStr] = linhas[1].trim().split(/\s+/);
  expect(Number(inicioStr)).toBe(0);
  const totalObjetos = Number(countStr);
  expect(totalObjetos).toBeGreaterThanOrEqual(6);

  for (let objId = 1; objId < totalObjetos; objId++) {
    const entrada = linhas[2 + objId];
    const [offsetStr, genStr, flag] = entrada.trim().split(/\s+/);
    expect(flag).toBe('n');
    expect(genStr).toBe('00000');
    const offset = Number(offsetStr);
    const trecho = buffer.subarray(offset, offset + 24).toString('latin1');
    expect(trecho.startsWith(`${objId} 0 obj`)).toBe(true);
  }

  return totalObjetos - 1;
}

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

  it('gera PDF 1.4 moderno com xref exato byte-a-byte, curvas arredondadas e acentuação WinAnsi', () => {
    const dados = mesclarCurriculoPadrao(
      {
        nomeCompleto: 'João Pedro Almeida',
        bairro: 'Itaqui-Bacanga',
        municipio: 'São Luís',
        telefoneWhatsApp: '5598991234567',
        email: 'joao.almeida@exemplo.com',
        escolaridade: 'TECNICO',
        areaInteresse: 'Logística Portuária e Almoxarifado',
        objetivo: 'Atuar na conferência de cargas, expedição e controle de estoque.',
        resumoProfissional:
          'Técnico em Logística com vivência prática em almoxarifado, inventário e operação segura.',
        disponibilidade: 'Turnos e escalas',
        competencias: ['Controle de estoque', 'Pacote Office', 'Operação de empilhadeira', 'NR-12'],
        experiencias: [
          {
            cargo: 'Auxiliar de Almoxarifado',
            empresa: 'Distribuidora Maranhão',
            periodo: '2022 - 2025',
            descricao: 'Conferência de notas fiscais, organização de prateleiras e inventário.',
          },
          {
            cargo: 'Ajudante de Entregas',
            empresa: 'Frete Itaqui',
            periodo: '2020 - 2022',
            trabalhoInformal: true,
          },
        ],
        cursosCertificacoes: [
          {
            titulo: 'NR-12 Segurança em Máquinas e Equipamentos',
            instituicao: 'SEMISPE',
            cargaHoraria: '16h',
          },
        ],
        observacoesAdicionais: ['CNH categoria B'],
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
    // Verifica curvas Bézier cúbicas dos cartões/pílulas arredondados e timeline
    expect(ascii).toContain(' c ');
    expect(ascii.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(validarTabelaXrefByteAByte(pdf.buffer)).toBeGreaterThanOrEqual(6);
  });

  it('equilibra layout limpo para candidato de primeiro emprego sem experiências', () => {
    const pdf = gerarCurriculoPadraoPdf(
      sanitizarCurriculoPadrao({
        nomeCompleto: 'Beatriz Cutrim Santos',
        bairro: 'Vila Nova',
        escolaridade: 'MEDIO_COMPLETO',
        areaInteresse: 'Atendimento e Apoio Administrativo',
        objetivo: 'Conquistar primeira oportunidade no comércio ou recepção.',
        competencias: ['Comunicação', 'Informática Básica', 'Organização'],
        cursosCertificacoes: [{ titulo: 'Pacote Office para o Trabalho', instituicao: 'SEMISPE', cargaHoraria: '40h' }],
      })
    );

    const ascii = pdf.buffer.toString('latin1');
    expect(pdf.pageCount).toBe(1);
    expect(ascii).toContain('primeira oportunidade');
    expect(validarTabelaXrefByteAByte(pdf.buffer)).toBe(6);
  });

  it('pagina automaticamente com cabeçalho de continuação e xref válido quando há muitas experiências', () => {
    const experiencias = Array.from({ length: 16 }, (_, i) => ({
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

    const ascii = pdf.buffer.toString('latin1');
    expect(pdf.pageCount).toBeGreaterThan(1);
    expect(ascii).toContain('P\\341gina 2 de');
    expect(validarTabelaXrefByteAByte(pdf.buffer)).toBe(4 + pdf.pageCount * 2);
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

  it('permite remover competências, substituir listas e limpar campos com aplicarEdicaoCurriculoPadrao', () => {
    const inicial = sanitizarCurriculoPadrao({
      nomeCompleto: 'Taino Samuel Lima Ribeiro',
      bairro: 'Anjo da Guarda',
      escolaridade: 'TECNICO',
      objetivo: 'Atuação em Help Desk N1/N2',
      competencias: [
        'Atendimento via WhatsApp e Plataformas Web',
        'Excelente comunicação verbal e escrita',
        'Help Desk (N1/N2)',
      ],
      experiencias: [
        { cargo: 'Analista de Suporte', empresa: 'Anotado', periodo: '2024 - 2026' },
        { cargo: 'Estagiário de TI', empresa: 'Prefeitura', periodo: '2023' },
      ],
    });

    const semCompetencia = aplicarEdicaoCurriculoPadrao(inicial, {
      removerCompetencias: ['Excelente comunicação verbal e escrita'],
      removerExperiencias: ['Estagiário de TI'],
      limparCampos: ['objetivo'],
    });

    expect(semCompetencia.competencias).toEqual([
      'Atendimento via WhatsApp e Plataformas Web',
      'Help Desk (N1/N2)',
    ]);
    expect(semCompetencia.experiencias).toHaveLength(1);
    expect(semCompetencia.experiencias[0].cargo).toBe('Analista de Suporte');
    expect(semCompetencia.objetivo).toBeUndefined();

    const substituido = aplicarEdicaoCurriculoPadrao(semCompetencia, {
      competencias: ['Help Desk (N1/N2)', 'Ferramentas de CRM/Tickets'],
    });
    expect(substituido.competencias).toEqual(['Help Desk (N1/N2)', 'Ferramentas de CRM/Tickets']);
  });
});
