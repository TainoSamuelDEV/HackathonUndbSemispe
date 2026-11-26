import {
  type CurriculoPadraoData,
  gerarNomeArquivoCurriculo,
  labelEscolaridade,
  sanitizarCurriculoPadrao,
} from '@/server/domain/curriculo/CurriculoPadrao';

export interface CurriculoPdfGerado {
  buffer: Buffer;
  base64: string;
  fileName: string;
  mimeType: 'application/pdf';
  pageCount: number;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 46;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const FOOTER_Y = 32;
const BOTTOM_LIMIT = 56;
const HEADER_HEIGHT = 108;

const COLOR_NAVY = '0.043 0.145 0.251'; // #0B2540
const COLOR_BLUE = '0.004 0.384 0.655'; // #0162A7
const COLOR_GOLD = '0.980 0.863 0.000'; // #FADC00
const COLOR_TEXT = '0.110 0.165 0.220'; // #1C2A38
const COLOR_MUTED = '0.400 0.471 0.541'; // #66788A
const COLOR_BORDER = '0.863 0.906 0.937'; // #DCE7EF
const COLOR_TAG_BG = '0.937 0.969 0.988'; // #EFF7FC
const COLOR_WHITE = '1 1 1';

const WINANSI_MAP: Record<string, number> = {
  '€': 0x80,
  '‚': 0x82,
  'ƒ': 0x83,
  '„': 0x84,
  '…': 0x85,
  '†': 0x86,
  '‡': 0x87,
  'ˆ': 0x88,
  '‰': 0x89,
  'Š': 0x8a,
  '‹': 0x8b,
  'Œ': 0x8c,
  'Ž': 0x8e,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '˜': 0x98,
  '™': 0x99,
  'š': 0x9a,
  '›': 0x9b,
  'œ': 0x9c,
  'ž': 0x9e,
  'Ÿ': 0x9f,
};

function encodePdfWinAnsi(text: string): string {
  const clean = text.replace(/\r\n|\r|\n/g, ' ');
  let out = '';

  for (const ch of clean) {
    const code = ch.charCodeAt(0);
    if (ch === '\\' || ch === '(' || ch === ')') {
      out += `\\${ch}`;
    } else if (code >= 32 && code <= 126) {
      out += ch;
    } else if (code >= 160 && code <= 255) {
      out += `\\${code.toString(8).padStart(3, '0')}`;
    } else if (WINANSI_MAP[ch] !== undefined) {
      out += `\\${WINANSI_MAP[ch].toString(8).padStart(3, '0')}`;
    } else {
      const normalized = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized && normalized.charCodeAt(0) >= 32 && normalized.charCodeAt(0) <= 126) {
        out += normalized;
      } else {
        out += '-';
      }
    }
  }

  return out;
}

function estimateCharWidth(ch: string, fontSize: number, bold: boolean): number {
  const narrow = 'ijlI1.,:;\'"!| ';
  const wide = 'MWmwGOQD@%';
  let factor = 0.52;
  if (narrow.includes(ch)) factor = 0.28;
  else if (wide.includes(ch)) factor = 0.78;
  else if (ch >= 'A' && ch <= 'Z') factor = 0.65;
  return fontSize * factor * (bold ? 1.06 : 1.0);
}

function estimateTextWidth(text: string, fontSize: number, bold = false): number {
  let w = 0;
  for (const ch of text) {
    w += estimateCharWidth(ch, fontSize, bold);
  }
  return w;
}

function wrapText(text: string, maxWidth: number, fontSize: number, bold = false): string[] {
  const paragraphs = text.split(/\n+/);
  const lines: string[] = [];

  for (const rawParagraph of paragraphs) {
    const words = rawParagraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (estimateTextWidth(candidate, fontSize, bold) <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        if (estimateTextWidth(word, fontSize, bold) <= maxWidth) {
          current = word;
        } else {
          // Quebra palavra muito longa para nunca vazar a margem
          let chunk = '';
          for (const ch of word) {
            if (estimateTextWidth(chunk + ch, fontSize, bold) > maxWidth && chunk) {
              lines.push(chunk);
              chunk = ch;
            } else {
              chunk += ch;
            }
          }
          current = chunk;
        }
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}

function formatarTelefoneLegivel(raw?: string): string | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/\D/g, '');
  const local = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return raw;
}

function dataHojeSaoLuisBr(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Fortaleza',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());
}

class PdfCanvas {
  private pages: string[][] = [[]];
  private y = PAGE_HEIGHT - 48;

  private get currentStream(): string[] {
    return this.pages[this.pages.length - 1];
  }

  ensureSpace(neededHeight: number): void {
    if (this.y - neededHeight < BOTTOM_LIMIT) {
      this.pages.push([]);
      this.y = PAGE_HEIGHT - 54;
    }
  }

  drawRect(x: number, y: number, w: number, h: number, fillRgb: string): void {
    this.currentStream.push(`q ${fillRgb} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f Q`);
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, strokeRgb: string, width = 0.8): void {
    this.currentStream.push(
      `q ${strokeRgb} RG ${width.toFixed(2)} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S Q`
    );
  }

  drawTextLine(
    text: string,
    x: number,
    y: number,
    options: { font?: 'F1' | 'F2'; size: number; colorRgb: string }
  ): void {
    const font = options.font ?? 'F1';
    const encoded = encodePdfWinAnsi(text);
    this.currentStream.push(
      `BT /${font} ${options.size} Tf ${options.colorRgb} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${encoded}) Tj ET`
    );
  }

  drawHeader(dados: CurriculoPadraoData): void {
    const topY = PAGE_HEIGHT;
    this.drawRect(0, topY - HEADER_HEIGHT, PAGE_WIDTH, HEADER_HEIGHT, COLOR_NAVY);
    this.drawRect(0, topY - HEADER_HEIGHT, PAGE_WIDTH, 4, COLOR_GOLD);

    this.drawTextLine('FAROL · PREFEITURA DE SÃO LUÍS / SEMISPE · CURRÍCULO MODELO PADRÃO', MARGIN_X, topY - 24, {
      font: 'F2',
      size: 7.5,
      colorRgb: COLOR_GOLD,
    });

    const nome = dados.nomeCompleto || 'Candidato(a) FAROL';
    const nomeLinhas = wrapText(nome, CONTENT_WIDTH, 18, true).slice(0, 2);
    let cursorY = topY - 48;
    for (const linha of nomeLinhas) {
      this.drawTextLine(linha, MARGIN_X, cursorY, {
        font: 'F2',
        size: 18,
        colorRgb: COLOR_WHITE,
      });
      cursorY -= 20;
    }

    if (dados.areaInteresse) {
      this.drawTextLine(dados.areaInteresse, MARGIN_X, cursorY + 4, {
        font: 'F1',
        size: 10.5,
        colorRgb: '0.847 0.914 0.969',
      });
      cursorY -= 15;
    }

    const contatoPartes: string[] = [];
    if (dados.bairro) {
      contatoPartes.push(`${dados.bairro}, ${dados.municipio || 'São Luís'} - MA`);
    } else if (dados.municipio) {
      contatoPartes.push(`${dados.municipio} - MA`);
    }
    const telFmt = formatarTelefoneLegivel(dados.telefoneWhatsApp);
    if (telFmt) contatoPartes.push(`WhatsApp: ${telFmt}`);
    if (dados.email) contatoPartes.push(dados.email);

    const contatoLinha = contatoPartes.join('  ·  ');
    if (contatoLinha) {
      const linhasContato = wrapText(contatoLinha, CONTENT_WIDTH, 8.8, false).slice(0, 1);
      for (const lc of linhasContato) {
        this.drawTextLine(lc, MARGIN_X, topY - HEADER_HEIGHT + 16, {
          font: 'F1',
          size: 8.8,
          colorRgb: '0.880 0.930 0.975',
        });
      }
    }

    this.y = topY - HEADER_HEIGHT - 24;
  }

  drawSectionTitle(title: string): void {
    this.ensureSpace(34);
    this.drawTextLine(title.toUpperCase(), MARGIN_X, this.y, {
      font: 'F2',
      size: 10.5,
      colorRgb: COLOR_BLUE,
    });
    this.drawLine(MARGIN_X, this.y - 5, MARGIN_X + CONTENT_WIDTH, this.y - 5, COLOR_BORDER, 1);
    this.y -= 20;
  }

  drawParagraph(text: string, options?: { size?: number; bold?: boolean; colorRgb?: string; indent?: number }): void {
    const size = options?.size ?? 10;
    const bold = options?.bold ?? false;
    const colorRgb = options?.colorRgb ?? COLOR_TEXT;
    const indent = options?.indent ?? 0;
    const lineHeight = size + 4.5;
    const lines = wrapText(text, CONTENT_WIDTH - indent, size, bold);

    for (const line of lines) {
      this.ensureSpace(lineHeight + 2);
      this.drawTextLine(line, MARGIN_X + indent, this.y, {
        font: bold ? 'F2' : 'F1',
        size,
        colorRgb,
      });
      this.y -= lineHeight;
    }
  }

  drawBullet(text: string, size = 9.8): void {
    const lines = wrapText(text, CONTENT_WIDTH - 14, size, false);
    const lineHeight = size + 4.2;
    lines.forEach((line, idx) => {
      this.ensureSpace(lineHeight + 2);
      if (idx === 0) {
        this.drawTextLine('•', MARGIN_X + 2, this.y, {
          font: 'F2',
          size,
          colorRgb: COLOR_BLUE,
        });
      }
      this.drawTextLine(line, MARGIN_X + 14, this.y, {
        font: 'F1',
        size,
        colorRgb: COLOR_TEXT,
      });
      this.y -= lineHeight;
    });
  }

  drawSkillChips(skills: string[]): void {
    const fontSize = 9;
    const padX = 8;
    const chipH = 18;
    const gapX = 6;
    const gapY = 6;
    let x = MARGIN_X;

    this.ensureSpace(chipH + 8);

    for (const skill of skills) {
      const chipW = Math.min(estimateTextWidth(skill, fontSize, true) + padX * 2, CONTENT_WIDTH);
      if (x + chipW > MARGIN_X + CONTENT_WIDTH) {
        x = MARGIN_X;
        this.y -= chipH + gapY;
        this.ensureSpace(chipH + 4);
      }
      this.drawRect(x, this.y - 4, chipW, chipH, COLOR_TAG_BG);
      this.drawTextLine(skill, x + padX, this.y + 1.5, {
        font: 'F2',
        size: fontSize,
        colorRgb: COLOR_NAVY,
      });
      x += chipW + gapX;
    }

    this.y -= chipH + 8;
  }

  addSpace(points: number): void {
    this.y -= points;
  }

  finalizePages(): string[] {
    const total = this.pages.length;
    const dataGeracao = dataHojeSaoLuisBr();

    return this.pages.map((cmds, index) => {
      const footerCmds = [
        `q ${COLOR_BORDER} RG 0.7 w ${MARGIN_X.toFixed(2)} ${(FOOTER_Y + 12).toFixed(2)} m ${(MARGIN_X + CONTENT_WIDTH).toFixed(2)} ${(FOOTER_Y + 12).toFixed(2)} l S Q`,
        `BT /F1 8 Tf ${COLOR_MUTED} rg 1 0 0 1 ${MARGIN_X.toFixed(2)} ${FOOTER_Y.toFixed(2)} Tm (${encodePdfWinAnsi(
          `Currículo Modelo Padrão FAROL · Gerado em ${dataGeracao}`
        )}) Tj ET`,
        `BT /F1 8 Tf ${COLOR_MUTED} rg 1 0 0 1 ${(PAGE_WIDTH - MARGIN_X - 58).toFixed(2)} ${FOOTER_Y.toFixed(2)} Tm (${encodePdfWinAnsi(
          `Página ${index + 1} de ${total}`
        )}) Tj ET`,
      ];
      return [...cmds, ...footerCmds].join('\n');
    });
  }
}

function buildPdfDocument(pageStreams: string[]): Buffer {
  // Objetos:
  // 1: Catalog
  // 2: Pages
  // 3: Font F1 (Helvetica)
  // 4: Font F2 (Helvetica-Bold)
  // 5..: pares (Page, ContentStream) para cada página
  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  // Placeholder para 1..4
  objects.push('');
  objects.push('');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

  for (const streamContent of pageStreams) {
    const pageObjId = objects.length + 1;
    const contentObjId = objects.length + 2;
    pageObjectIds.push(pageObjId);

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(
        2
      )}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>`
    );

    const streamLength = Buffer.byteLength(streamContent, 'latin1');
    objects.push(`<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream`);
  }

  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${
    pageObjectIds.length
  } >>`;

  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const chunks: Buffer[] = [Buffer.from(header, 'latin1')];
  const offsets: number[] = [0];
  let currentOffset = chunks[0].length;

  for (let i = 0; i < objects.length; i++) {
    offsets.push(currentOffset);
    const objStr = `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
    const buf = Buffer.from(objStr, 'latin1');
    chunks.push(buf);
    currentOffset += buf.length;
  }

  const xrefStart = currentOffset;
  const xrefLines = [`xref`, `0 ${objects.length + 1}`, `0000000000 65535 f `];
  for (let i = 1; i <= objects.length; i++) {
    xrefLines.push(`${String(offsets[i]).padStart(10, '0')} 00000 n `);
  }

  const trailer = [
    ...xrefLines,
    `trailer`,
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    `startxref`,
    `${xrefStart}`,
    `%%EOF\n`,
  ].join('\n');

  chunks.push(Buffer.from(trailer, 'latin1'));
  return Buffer.concat(chunks);
}

/**
 * Gera o Currículo Modelo Padrão FAROL em formato PDF (A4) a partir dos dados
 * estruturados confirmados pelo cidadão, sem dependências externas nativas.
 */
export function gerarCurriculoPadraoPdf(entrada: CurriculoPadraoData): CurriculoPdfGerado {
  const dados = sanitizarCurriculoPadrao(entrada);
  const canvas = new PdfCanvas();

  canvas.drawHeader(dados);

  if (dados.objetivo) {
    canvas.drawSectionTitle('Objetivo Profissional');
    canvas.drawParagraph(dados.objetivo);
    canvas.addSpace(10);
  }

  if (dados.resumoProfissional) {
    canvas.drawSectionTitle('Resumo Profissional');
    canvas.drawParagraph(dados.resumoProfissional);
    canvas.addSpace(10);
  }

  if (dados.experiencias.length > 0) {
    canvas.drawSectionTitle('Experiências Profissionais e Atividades');
    for (const exp of dados.experiencias) {
      canvas.ensureSpace(34);
      const complemento = [
        exp.empresa,
        exp.trabalhoInformal ? 'Atividade autônoma / informal' : undefined,
        exp.periodo,
      ]
        .filter(Boolean)
        .join(' · ');
      canvas.drawParagraph(exp.cargo, { size: 10.5, bold: true, colorRgb: COLOR_NAVY });
      if (complemento) {
        canvas.drawParagraph(complemento, { size: 9, colorRgb: COLOR_MUTED });
      }
      if (exp.descricao) {
        canvas.drawParagraph(exp.descricao, { size: 9.5, indent: 6 });
      }
      canvas.addSpace(6);
    }
    canvas.addSpace(4);
  }

  const escolaridadePrincipal =
    dados.escolaridadeTexto || (dados.escolaridade ? labelEscolaridade(dados.escolaridade) : undefined);

  if (escolaridadePrincipal || dados.formacoes.length > 0) {
    canvas.drawSectionTitle('Formação e Escolaridade');
    if (dados.formacoes.length > 0) {
      for (const f of dados.formacoes) {
        const linha = [f.nivel, f.curso, f.instituicao, f.anoConclusao].filter(Boolean).join(' · ');
        canvas.drawBullet(linha);
      }
    } else if (escolaridadePrincipal) {
      canvas.drawBullet(escolaridadePrincipal);
    }
    canvas.addSpace(10);
  }

  if (dados.competencias.length > 0) {
    canvas.drawSectionTitle('Competências e Habilidades');
    canvas.drawSkillChips(dados.competencias);
    canvas.addSpace(4);
  }

  if (dados.cursosCertificacoes.length > 0) {
    canvas.drawSectionTitle('Cursos e Certificações');
    for (const c of dados.cursosCertificacoes) {
      const linha = [c.titulo, c.instituicao, c.cargaHoraria].filter(Boolean).join(' · ');
      canvas.drawBullet(linha);
    }
    canvas.addSpace(10);
  }

  if (dados.disponibilidade || dados.observacoesAdicionais.length > 0) {
    canvas.drawSectionTitle('Informações Adicionais');
    if (dados.disponibilidade) {
      canvas.drawBullet(`Disponibilidade: ${dados.disponibilidade}`);
    }
    for (const obs of dados.observacoesAdicionais) {
      canvas.drawBullet(obs);
    }
    canvas.addSpace(6);
  }

  const pageStreams = canvas.finalizePages();
  const buffer = buildPdfDocument(pageStreams);

  return {
    buffer,
    base64: buffer.toString('base64'),
    fileName: gerarNomeArquivoCurriculo(dados.nomeCompleto),
    mimeType: 'application/pdf',
    pageCount: pageStreams.length,
  };
}
