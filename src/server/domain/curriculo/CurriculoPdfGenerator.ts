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
const USABLE_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 503.28 pt
const MAIN_X = MARGIN_X;
const MAIN_W = 322;
const SIDE_GAP = 19;
const SIDE_X = MAIN_X + MAIN_W + SIDE_GAP; // 387
const SIDE_W = USABLE_WIDTH - MAIN_W - SIDE_GAP; // 162.28
const FOOTER_Y = 30;
const BOTTOM_LIMIT = 56;

// Paleta editorial limpa (fundo branco imprimível + acentos FAROL)
const COLOR_INK = '0.059 0.090 0.165'; // #0F172A
const COLOR_BODY = '0.200 0.255 0.333'; // #334155
const COLOR_MUTED = '0.392 0.455 0.545'; // #64748B
const COLOR_BLUE = '0.004 0.384 0.655'; // #0162A7
const COLOR_GOLD = '0.980 0.863 0.000'; // #FADC00
const COLOR_SURFACE = '0.973 0.980 0.988'; // #F8FAFC
const COLOR_PILL_BG = '0.933 0.965 0.988'; // #EEF6FC
const COLOR_BADGE_BG = '0.945 0.961 0.976'; // #F1F5F9
const COLOR_BORDER = '0.886 0.910 0.941'; // #E2E8F0
const COLOR_TIMELINE = '0.796 0.835 0.882'; // #CBD5E1

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

// Larguras reais AFM (em 1/1000 em) para Helvetica (ASCII 32..126)
const HELVETICA_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

// Larguras reais AFM (em 1/1000 em) para Helvetica-Bold (ASCII 32..126)
const HELVETICA_BOLD_WIDTHS = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

const EXTRA_CHAR_WIDTHS: Record<string, [number, number]> = {
  '•': [350, 350],
  '–': [556, 556],
  '—': [1000, 1000],
  '…': [1000, 1000],
  'º': [365, 365],
  'ª': [370, 370],
  '·': [278, 333],
  '‘': [222, 278],
  '’': [222, 278],
  '“': [333, 500],
  '”': [333, 500],
};

function charWidthThousandths(ch: string, bold: boolean): number {
  const extra = EXTRA_CHAR_WIDTHS[ch];
  if (extra) return bold ? extra[1] : extra[0];

  const code = ch.charCodeAt(0);
  if (code >= 32 && code <= 126) {
    return (bold ? HELVETICA_BOLD_WIDTHS : HELVETICA_WIDTHS)[code - 32] ?? 556;
  }

  const base = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (base.length === 1) {
    const baseCode = base.charCodeAt(0);
    if (baseCode >= 32 && baseCode <= 126) {
      return (bold ? HELVETICA_BOLD_WIDTHS : HELVETICA_WIDTHS)[baseCode - 32] ?? 556;
    }
  }
  return 556;
}

function measureTextWidth(
  text: string,
  fontSize: number,
  bold = false,
  charSpacing = 0
): number {
  if (!text) return 0;
  let units = 0;
  for (const ch of text) {
    units += charWidthThousandths(ch, bold);
  }
  const spacingTotal = text.length > 1 ? (text.length - 1) * charSpacing : 0;
  return (units * fontSize) / 1000 + spacingTotal;
}

function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  bold = false,
  charSpacing = 0
): string[] {
  const paragraphs = text.split(/\n+/);
  const lines: string[] = [];

  for (const rawParagraph of paragraphs) {
    const words = rawParagraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (measureTextWidth(candidate, fontSize, bold, charSpacing) <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        if (measureTextWidth(word, fontSize, bold, charSpacing) <= maxWidth) {
          current = word;
        } else {
          let chunk = '';
          for (const ch of word) {
            if (measureTextWidth(chunk + ch, fontSize, bold, charSpacing) > maxWidth && chunk) {
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

// Primitivas vetoriais PDF reutilizáveis
function cmdRect(x: number, y: number, w: number, h: number, fillRgb: string): string {
  return `q ${fillRgb} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f Q`;
}

function cmdLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  strokeRgb: string,
  width = 0.75
): string {
  return `q ${strokeRgb} RG ${width.toFixed(2)} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S Q`;
}

function cmdRoundedRect(
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fillRgb?: string,
  strokeRgb?: string,
  lineWidth = 0.75
): string {
  const r = Math.min(radius, w / 2, h / 2);
  const k = 0.55228475 * r;
  const parts: string[] = ['q'];
  if (fillRgb) parts.push(`${fillRgb} rg`);
  if (strokeRgb) parts.push(`${strokeRgb} RG ${lineWidth.toFixed(2)} w`);

  const path = [
    `${(x + r).toFixed(2)} ${y.toFixed(2)} m`,
    `${(x + w - r).toFixed(2)} ${y.toFixed(2)} l`,
    `${(x + w - r + k).toFixed(2)} ${y.toFixed(2)} ${(x + w).toFixed(2)} ${(y + r - k).toFixed(2)} ${(x + w).toFixed(2)} ${(y + r).toFixed(2)} c`,
    `${(x + w).toFixed(2)} ${(y + h - r).toFixed(2)} l`,
    `${(x + w).toFixed(2)} ${(y + h - r + k).toFixed(2)} ${(x + w - r + k).toFixed(2)} ${(y + h).toFixed(2)} ${(x + w - r).toFixed(2)} ${(y + h).toFixed(2)} c`,
    `${(x + r).toFixed(2)} ${(y + h).toFixed(2)} l`,
    `${(x + r - k).toFixed(2)} ${(y + h).toFixed(2)} ${x.toFixed(2)} ${(y + h - r + k).toFixed(2)} ${x.toFixed(2)} ${(y + h - r).toFixed(2)} c`,
    `${x.toFixed(2)} ${(y + r).toFixed(2)} l`,
    `${x.toFixed(2)} ${(y + r - k).toFixed(2)} ${(x + r - k).toFixed(2)} ${y.toFixed(2)} ${(x + r).toFixed(2)} ${y.toFixed(2)} c`,
    'h',
  ];

  const op = fillRgb && strokeRgb ? 'B' : fillRgb ? 'f' : 'S';
  parts.push(...path, op, 'Q');
  return parts.join(' ');
}

function cmdCircle(cx: number, cy: number, r: number, fillRgb: string): string {
  const d = 0.55228475 * r;
  return [
    'q',
    `${fillRgb} rg`,
    `${(cx + r).toFixed(2)} ${cy.toFixed(2)} m`,
    `${(cx + r).toFixed(2)} ${(cy + d).toFixed(2)} ${(cx + d).toFixed(2)} ${(cy + r).toFixed(2)} ${cx.toFixed(2)} ${(cy + r).toFixed(2)} c`,
    `${(cx - d).toFixed(2)} ${(cy + r).toFixed(2)} ${(cx - r).toFixed(2)} ${(cy + d).toFixed(2)} ${(cx - r).toFixed(2)} ${cy.toFixed(2)} c`,
    `${(cx - r).toFixed(2)} ${(cy - d).toFixed(2)} ${(cx - d).toFixed(2)} ${(cy - r).toFixed(2)} ${cx.toFixed(2)} ${(cy - r).toFixed(2)} c`,
    `${(cx + d).toFixed(2)} ${(cy - r).toFixed(2)} ${(cx + r).toFixed(2)} ${(cy - d).toFixed(2)} ${(cx + r).toFixed(2)} ${cy.toFixed(2)} c`,
    'h f Q',
  ].join(' ');
}

function cmdText(
  text: string,
  x: number,
  y: number,
  options: { font?: 'F1' | 'F2'; size: number; colorRgb: string; charSpacing?: number }
): string {
  const font = options.font ?? 'F1';
  const encoded = encodePdfWinAnsi(text);
  const tc = options.charSpacing ? `${options.charSpacing.toFixed(2)} Tc ` : '';
  const resetTc = options.charSpacing ? ' 0 Tc' : '';
  return `BT /${font} ${options.size} Tf ${tc}${options.colorRgb} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${encoded}) Tj${resetTc} ET`;
}

// Mini ícones vetoriais limpos para a barra de contato
function cmdPinIcon(x: number, y: number, colorRgb: string): string {
  // x, y = canto inferior esquerdo da caixa 7x8
  const cx = x + 3.5;
  const cy = y + 5;
  return [
    'q',
    `${colorRgb} RG 0.85 w`,
    `${cx.toFixed(2)} ${y.toFixed(2)} m`,
    `${(x + 0.8).toFixed(2)} ${(cy - 1.2).toFixed(2)} l`,
    `${(x + 0.8).toFixed(2)} ${(cy + 1.8).toFixed(2)} ${(x + 6.2).toFixed(2)} ${(cy + 1.8).toFixed(2)} ${(x + 6.2).toFixed(2)} ${(cy - 1.2).toFixed(2)} c`,
    `${cx.toFixed(2)} ${y.toFixed(2)} l S`,
    'Q',
    cmdCircle(cx, cy, 1.05, colorRgb),
  ].join(' ');
}

function cmdPhoneIcon(x: number, y: number, colorRgb: string): string {
  return [
    cmdRoundedRect(x + 1, y, 5, 8, 1.1, undefined, colorRgb, 0.85),
    cmdLine(x + 2.7, y + 1.4, x + 4.3, y + 1.4, colorRgb, 0.85),
  ].join(' ');
}

function cmdMailIcon(x: number, y: number, colorRgb: string): string {
  return [
    cmdRoundedRect(x, y + 0.8, 8.2, 6, 0.9, undefined, colorRgb, 0.85),
    `q ${colorRgb} RG 0.8 w ${(x + 0.6).toFixed(2)} ${(y + 6.2).toFixed(2)} m ${(x + 4.1).toFixed(2)} ${(y + 3.4).toFixed(2)} l ${(x + 7.6).toFixed(2)} ${(y + 6.2).toFixed(2)} l S Q`,
  ].join(' ');
}

interface ContactItem {
  kind: 'location' | 'phone' | 'mail';
  text: string;
}

class ModernCurriculoLayout {
  private pages: string[][] = [[]];
  private mainY = PAGE_HEIGHT - 40;
  private nomeCandidato = 'Candidato(a) FAROL';

  private get activePage(): string[] {
    return this.pages[this.pages.length - 1];
  }

  private get activeColWidth(): number {
    return this.pages.length === 1 ? MAIN_W : USABLE_WIDTH;
  }

  private startNewPage(): void {
    this.pages.push([]);
    const topY = PAGE_HEIGHT - 36;
    this.activePage.push(
      cmdRect(0, PAGE_HEIGHT - 3, 88, 3, COLOR_GOLD),
      cmdRect(88, PAGE_HEIGHT - 3, PAGE_WIDTH - 88, 3, COLOR_BLUE),
      cmdText(`${this.nomeCandidato}  ·  Currículo Profissional`, MARGIN_X, topY, {
        font: 'F2',
        size: 9,
        colorRgb: COLOR_MUTED,
      }),
      cmdLine(MARGIN_X, topY - 8, PAGE_WIDTH - MARGIN_X, topY - 8, COLOR_BORDER, 0.75)
    );
    this.mainY = topY - 28;
  }

  private ensureMainSpace(neededHeight: number): void {
    if (this.mainY - neededHeight < BOTTOM_LIMIT) {
      this.startNewPage();
    }
  }

  renderHeader(dados: CurriculoPadraoData): number {
    this.nomeCandidato = dados.nomeCompleto || 'Candidato(a) FAROL';
    const topBarY = PAGE_HEIGHT - 3.5;

    // Acento fino no topo (sem bloco escuro pesado)
    this.activePage.push(
      cmdRect(0, topBarY, 88, 3.5, COLOR_GOLD),
      cmdRect(88, topBarY, PAGE_WIDTH - 88, 3.5, COLOR_BLUE)
    );

    let y = PAGE_HEIGHT - 28;
    this.activePage.push(
      cmdText('CURRÍCULO PROFISSIONAL · FAROL SEMISPE', MARGIN_X, y, {
        font: 'F2',
        size: 7.3,
        colorRgb: COLOR_MUTED,
        charSpacing: 0.7,
      })
    );

    y -= 24;
    const nameLines = wrapText(this.nomeCandidato, USABLE_WIDTH, 22, true).slice(0, 2);
    for (const line of nameLines) {
      this.activePage.push(
        cmdText(line, MARGIN_X, y, {
          font: 'F2',
          size: 22,
          colorRgb: COLOR_INK,
        })
      );
      y -= 24;
    }

    if (dados.areaInteresse) {
      y += 4;
      const areaLines = wrapText(dados.areaInteresse, USABLE_WIDTH, 11, true).slice(0, 1);
      for (const line of areaLines) {
        this.activePage.push(
          cmdText(line, MARGIN_X, y, {
            font: 'F2',
            size: 11,
            colorRgb: COLOR_BLUE,
          })
        );
      }
      y -= 18;
    } else {
      y += 2;
    }

    // Barra de contato limpa em container arredondado
    const contacts: ContactItem[] = [];
    if (dados.bairro || dados.municipio) {
      const local = [dados.bairro, dados.municipio || 'São Luís'].filter(Boolean).join(', ');
      contacts.push({ kind: 'location', text: `${local} - MA` });
    }
    const telFmt = formatarTelefoneLegivel(dados.telefoneWhatsApp);
    if (telFmt) {
      contacts.push({ kind: 'phone', text: `WhatsApp: ${telFmt}` });
    }
    if (dados.email) {
      contacts.push({ kind: 'mail', text: dados.email });
    }

    if (contacts.length > 0) {
      const innerX = MARGIN_X + 12;
      const innerMaxX = MARGIN_X + USABLE_WIDTH - 12;
      const rows: Array<Array<{ item: ContactItem; width: number }>> = [[]];
      let cursorX = innerX;

      for (const item of contacts) {
        const iconW = 12;
        const textW = measureTextWidth(item.text, 8.8, false);
        const totalItemW = iconW + textW;
        if (cursorX > innerX && cursorX + totalItemW > innerMaxX) {
          rows.push([{ item, width: totalItemW }]);
          cursorX = innerX + totalItemW + 18;
        } else {
          rows[rows.length - 1].push({ item, width: totalItemW });
          cursorX += totalItemW + 18;
        }
      }

      const rowH = 15;
      const boxH = rows.length * rowH + 10;
      const boxY = y - boxH + 4;
      this.activePage.push(
        cmdRoundedRect(MARGIN_X, boxY, USABLE_WIDTH, boxH, 6, COLOR_SURFACE, COLOR_BORDER, 0.75)
      );

      let rowY = boxY + boxH - 15;
      for (const row of rows) {
        let rx = innerX;
        for (let i = 0; i < row.length; i++) {
          const { item, width } = row[i];
          if (item.kind === 'location') {
            this.activePage.push(cmdPinIcon(rx, rowY - 0.5, COLOR_BLUE));
          } else if (item.kind === 'phone') {
            this.activePage.push(cmdPhoneIcon(rx, rowY - 0.5, COLOR_BLUE));
          } else {
            this.activePage.push(cmdMailIcon(rx, rowY - 0.5, COLOR_BLUE));
          }
          this.activePage.push(
            cmdText(item.text, rx + 12, rowY, {
              font: 'F1',
              size: 8.8,
              colorRgb: COLOR_BODY,
            })
          );
          rx += width + 18;
        }
        rowY -= rowH;
      }

      y = boxY - 18;
    } else {
      this.activePage.push(cmdLine(MARGIN_X, y + 6, MARGIN_X + USABLE_WIDTH, y + 6, COLOR_BORDER, 0.8));
      y -= 14;
    }

    this.mainY = y;
    return y;
  }

  renderSidebar(dados: CurriculoPadraoData, startY: number): void {
    const padX = 12;
    const padTop = 14;
    const innerX = SIDE_X + padX;
    const innerW = SIDE_W - padX * 2;
    const cmds: string[] = [];
    let sy = startY - padTop;

    const drawSideSectionHeader = (title: string) => {
      if (sy - 26 < BOTTOM_LIMIT + 10) return false;
      cmds.push(
        cmdText(title.toUpperCase(), innerX, sy, {
          font: 'F2',
          size: 8.2,
          colorRgb: COLOR_BLUE,
          charSpacing: 0.65,
        }),
        cmdLine(innerX, sy - 5, innerX + innerW, sy - 5, COLOR_BORDER, 0.7)
      );
      sy -= 18;
      return true;
    };

    const drawSideLines = (
      text: string,
      size: number,
      bold: boolean,
      colorRgb: string,
      lineGap = 3.5
    ) => {
      const lines = wrapText(text, innerW, size, bold);
      const step = size + lineGap;
      for (const line of lines) {
        if (sy - step < BOTTOM_LIMIT + 10) return;
        cmds.push(cmdText(line, innerX, sy, { font: bold ? 'F2' : 'F1', size, colorRgb }));
        sy -= step;
      }
    };

    // 1. Formação / Escolaridade
    const escolaridadePrincipal =
      dados.escolaridadeTexto ||
      (dados.escolaridade ? labelEscolaridade(dados.escolaridade) : undefined);

    if (escolaridadePrincipal || dados.formacoes.length > 0) {
      if (drawSideSectionHeader('Formação')) {
        if (dados.formacoes.length > 0) {
          for (const f of dados.formacoes) {
            const titulo = [f.nivel, f.curso].filter(Boolean).join(' · ');
            drawSideLines(titulo, 8.8, true, COLOR_INK, 3);
            const meta = [f.instituicao, f.anoConclusao].filter(Boolean).join(' · ');
            if (meta) {
              drawSideLines(meta, 8.1, false, COLOR_MUTED, 3);
            }
            sy -= 6;
          }
        } else if (escolaridadePrincipal) {
          drawSideLines(escolaridadePrincipal, 8.8, true, COLOR_INK, 3);
          sy -= 6;
        }
        sy -= 6;
      }
    }

    // 2. Competências (pílulas arredondadas medidas com largura real)
    if (dados.competencias.length > 0) {
      if (drawSideSectionHeader('Competências')) {
        const fontSize = 7.9;
        const chipPadX = 7;
        const chipH = 16;
        const gapX = 5;
        const gapY = 5;
        let cx = innerX;

        for (const skill of dados.competencias) {
          const textLines = wrapText(skill, innerW - chipPadX * 2, fontSize, true);
          const label = textLines[0] ?? skill;
          const chipW = Math.min(
            measureTextWidth(label, fontSize, true) + chipPadX * 2,
            innerW
          );

          if (cx > innerX && cx + chipW > innerX + innerW) {
            cx = innerX;
            sy -= chipH + gapY;
          }
          if (sy - chipH < BOTTOM_LIMIT + 10) break;

          cmds.push(
            cmdRoundedRect(cx, sy - 4, chipW, chipH, 4, COLOR_PILL_BG, COLOR_BORDER, 0.5),
            cmdText(label, cx + chipPadX, sy + 1, {
              font: 'F2',
              size: fontSize,
              colorRgb: COLOR_INK,
            })
          );
          cx += chipW + gapX;
        }
        sy -= chipH + 10;
      }
    }

    // 3. Disponibilidade e Informações Adicionais
    if (dados.disponibilidade || dados.observacoesAdicionais.length > 0) {
      if (drawSideSectionHeader('Informações')) {
        if (dados.disponibilidade) {
          drawSideLines('Disponibilidade', 7.8, true, COLOR_MUTED, 2.5);
          drawSideLines(dados.disponibilidade, 8.6, false, COLOR_BODY, 3);
          sy -= 6;
        }
        for (const obs of dados.observacoesAdicionais) {
          drawSideLines(`• ${obs}`, 8.4, false, COLOR_BODY, 3);
          sy -= 3;
        }
      }
    }

    if (cmds.length > 0) {
      const boxBottom = Math.max(BOTTOM_LIMIT + 4, sy - 4);
      const boxHeight = Math.max(48, startY - boxBottom);
      this.pages[0].push(
        cmdRoundedRect(SIDE_X, boxBottom, SIDE_W, boxHeight, 8, COLOR_SURFACE, COLOR_BORDER, 0.75),
        ...cmds
      );
    }
  }

  private drawMainSectionTitle(title: string): void {
    this.ensureMainSpace(32);
    const w = this.activeColWidth;
    this.activePage.push(
      cmdText(title.toUpperCase(), MAIN_X, this.mainY, {
        font: 'F2',
        size: 8.8,
        colorRgb: COLOR_BLUE,
        charSpacing: 0.75,
      }),
      cmdLine(MAIN_X, this.mainY - 5, MAIN_X + w, this.mainY - 5, COLOR_BORDER, 0.85)
    );
    this.mainY -= 20;
  }

  private drawMainParagraph(
    text: string,
    options?: { size?: number; bold?: boolean; colorRgb?: string; indent?: number; lineGap?: number }
  ): void {
    const size = options?.size ?? 9.5;
    const bold = options?.bold ?? false;
    const colorRgb = options?.colorRgb ?? COLOR_BODY;
    const indent = options?.indent ?? 0;
    const lineHeight = size + (options?.lineGap ?? 4.2);
    const lines = wrapText(text, this.activeColWidth - indent, size, bold);

    for (const line of lines) {
      this.ensureMainSpace(lineHeight + 2);
      this.activePage.push(
        cmdText(line, MAIN_X + indent, this.mainY, {
          font: bold ? 'F2' : 'F1',
          size,
          colorRgb,
        })
      );
      this.mainY -= lineHeight;
    }
  }

  renderMainContent(dados: CurriculoPadraoData): void {
    // 1. Perfil & Objetivo Profissional
    if (dados.objetivo || dados.resumoProfissional) {
      this.drawMainSectionTitle('Perfil e Objetivo');
      const blocks = [dados.objetivo, dados.resumoProfissional].filter(
        (b): b is string => Boolean(b && b.trim())
      );

      for (const block of blocks) {
        const lines = wrapText(block, this.activeColWidth - 11, 9.5, false);
        const lineH = 13.8;
        const needed = lines.length * lineH + 4;
        this.ensureMainSpace(Math.min(needed, 80));

        const topY = this.mainY + 8;
        const startPageIdx = this.pages.length - 1;
        let lastY = this.mainY;

        for (const line of lines) {
          this.ensureMainSpace(lineH + 2);
          if (this.pages.length - 1 === startPageIdx) {
            lastY = this.mainY;
          }
          this.activePage.push(
            cmdText(line, MAIN_X + 11, this.mainY, {
              font: 'F1',
              size: 9.5,
              colorRgb: COLOR_BODY,
            })
          );
          this.mainY -= lineH;
        }

        // Barra vertical discreta de destaque na esquerda do perfil
        if (this.pages.length - 1 === startPageIdx) {
          const barBottom = lastY - 2;
          const barH = Math.max(12, topY - barBottom);
          this.pages[startPageIdx].push(cmdRect(MAIN_X, barBottom, 2.5, barH, COLOR_BLUE));
        }

        this.mainY -= 6;
      }

      this.mainY -= 8;
    }

    // 2. Experiência Profissional (com timeline vetorial limpa)
    if (dados.experiencias.length > 0) {
      this.drawMainSectionTitle('Experiência Profissional');

      for (let idx = 0; idx < dados.experiencias.length; idx++) {
        const exp = dados.experiencias[idx];
        const colW = this.activeColWidth;
        const textX = MAIN_X + 14;

        const periodText = exp.periodo?.trim() || '';
        const periodW = periodText ? measureTextWidth(periodText, 7.8, true) + 12 : 0;
        const cargoMaxW = colW - 14 - (periodW > 0 ? periodW + 8 : 0);

        const cargoLines = wrapText(exp.cargo, Math.max(cargoMaxW, 120), 10, true);
        const subLine = [
          exp.empresa,
          exp.trabalhoInformal ? 'Atividade autônoma / informal' : undefined,
        ]
          .filter(Boolean)
          .join(' · ');
        const subLines = subLine ? wrapText(subLine, colW - 14, 8.6, false) : [];
        const descLines = exp.descricao ? wrapText(exp.descricao, colW - 14, 9.2, false) : [];

        const estimatedH =
          cargoLines.length * 13.5 +
          subLines.length * 12 +
          descLines.length * 13 +
          12;

        this.ensureMainSpace(Math.min(estimatedH, 120));

        const entryStartY = this.mainY;
        const startPageIdx = this.pages.length - 1;

        // Marcador circular na timeline
        this.activePage.push(cmdCircle(MAIN_X + 4, entryStartY + 3.2, 2.7, COLOR_BLUE));

        // Badge do período alinhado à direita
        if (periodText) {
          const badgeX = MAIN_X + colW - periodW;
          this.activePage.push(
            cmdRoundedRect(badgeX, entryStartY - 2.5, periodW, 14, 3.5, COLOR_BADGE_BG),
            cmdText(periodText, badgeX + 6, entryStartY + 1, {
              font: 'F2',
              size: 7.8,
              colorRgb: COLOR_BODY,
            })
          );
        }

        for (const line of cargoLines) {
          this.activePage.push(
            cmdText(line, textX, this.mainY, {
              font: 'F2',
              size: 10,
              colorRgb: COLOR_INK,
            })
          );
          this.mainY -= 13.5;
        }

        for (const line of subLines) {
          this.ensureMainSpace(14);
          this.activePage.push(
            cmdText(line, textX, this.mainY, {
              font: 'F1',
              size: 8.6,
              colorRgb: COLOR_MUTED,
            })
          );
          this.mainY -= 12;
        }

        if (descLines.length > 0) {
          this.mainY -= 1.5;
          for (const line of descLines) {
            this.ensureMainSpace(14);
            this.activePage.push(
              cmdText(line, textX, this.mainY, {
                font: 'F1',
                size: 9.2,
                colorRgb: COLOR_BODY,
              })
            );
            this.mainY -= 13;
          }
        }

        // Linha conectora da timeline quando houver próximo item na mesma página
        if (
          idx < dados.experiencias.length - 1 &&
          this.pages.length - 1 === startPageIdx &&
          this.mainY - 12 > BOTTOM_LIMIT
        ) {
          this.activePage.push(
            cmdLine(
              MAIN_X + 4,
              entryStartY - 1.5,
              MAIN_X + 4,
              this.mainY - 4,
              COLOR_TIMELINE,
              0.9
            )
          );
        }

        this.mainY -= 10;
      }
    } else {
      // Equilíbrio visual elegante para candidatos de primeiro emprego
      this.drawMainSectionTitle('Trajetória e Prontidão');
      const cardLines = wrapText(
        'Em busca de primeira oportunidade formal de trabalho. Perfil em desenvolvimento com foco em dedicação, pontualidade, aprendizado rápido e bom atendimento.',
        this.activeColWidth - 20,
        9.2,
        false
      );
      const cardH = cardLines.length * 13 + 16;
      this.ensureMainSpace(cardH + 8);
      const boxY = this.mainY - cardH + 10;
      this.activePage.push(
        cmdRoundedRect(MAIN_X, boxY, this.activeColWidth, cardH, 6, COLOR_SURFACE, COLOR_BORDER, 0.75)
      );
      let cy = this.mainY - 2;
      for (const line of cardLines) {
        this.activePage.push(
          cmdText(line, MAIN_X + 10, cy, {
            font: 'F1',
            size: 9.2,
            colorRgb: COLOR_BODY,
          })
        );
        cy -= 13;
      }
      this.mainY = boxY - 16;
    }

    // 3. Cursos e Certificações
    if (dados.cursosCertificacoes.length > 0) {
      this.drawMainSectionTitle('Cursos e Certificações');

      for (const c of dados.cursosCertificacoes) {
        const colW = this.activeColWidth;
        const chText = c.cargaHoraria?.trim() || '';
        const chW = chText ? measureTextWidth(chText, 7.8, true) + 12 : 0;
        const titleMaxW = colW - 12 - (chW > 0 ? chW + 8 : 0);
        const titleLines = wrapText(c.titulo, Math.max(titleMaxW, 120), 9.5, true);
        const instLines = c.instituicao
          ? wrapText(c.instituicao, colW - 12, 8.5, false)
          : [];

        this.ensureMainSpace(titleLines.length * 13 + instLines.length * 11.5 + 10);

        const rowY = this.mainY;
        this.activePage.push(cmdCircle(MAIN_X + 3, rowY + 3, 2, COLOR_BLUE));

        if (chText) {
          const badgeX = MAIN_X + colW - chW;
          this.activePage.push(
            cmdRoundedRect(badgeX, rowY - 2.5, chW, 13.5, 3.5, COLOR_PILL_BG),
            cmdText(chText, badgeX + 6, rowY + 1, {
              font: 'F2',
              size: 7.8,
              colorRgb: COLOR_BLUE,
            })
          );
        }

        for (const line of titleLines) {
          this.activePage.push(
            cmdText(line, MAIN_X + 12, this.mainY, {
              font: 'F2',
              size: 9.5,
              colorRgb: COLOR_INK,
            })
          );
          this.mainY -= 13;
        }

        for (const line of instLines) {
          this.activePage.push(
            cmdText(line, MAIN_X + 12, this.mainY, {
              font: 'F1',
              size: 8.5,
              colorRgb: COLOR_MUTED,
            })
          );
          this.mainY -= 11.5;
        }

        this.mainY -= 6;
      }
    }
  }

  finalizePages(): string[] {
    const total = this.pages.length;
    const dataGeracao = dataHojeSaoLuisBr();

    return this.pages.map((cmds, index) => {
      const pageLabel = `Página ${index + 1} de ${total}`;
      const pageLabelW = measureTextWidth(pageLabel, 7.8, false);
      const rightX = PAGE_WIDTH - MARGIN_X - pageLabelW;

      const footerCmds = [
        cmdLine(MARGIN_X, FOOTER_Y + 12, PAGE_WIDTH - MARGIN_X, FOOTER_Y + 12, COLOR_BORDER, 0.7),
        cmdText(
          `FAROL · Prefeitura de São Luís / SEMISPE · Atualizado em ${dataGeracao}`,
          MARGIN_X,
          FOOTER_Y,
          { font: 'F1', size: 7.8, colorRgb: COLOR_MUTED }
        ),
        cmdText(pageLabel, rightX, FOOTER_Y, {
          font: 'F1',
          size: 7.8,
          colorRgb: COLOR_MUTED,
        }),
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
 * Gera o Currículo Modelo Padrão FAROL em PDF (A4) com design editorial moderno,
 * limpo e bem organizado em 2 colunas, sem dependências externas nativas.
 */
export function gerarCurriculoPadraoPdf(entrada: CurriculoPadraoData): CurriculoPdfGerado {
  const dados = sanitizarCurriculoPadrao(entrada);
  const layout = new ModernCurriculoLayout();

  const bodyStartY = layout.renderHeader(dados);
  layout.renderSidebar(dados, bodyStartY);
  layout.renderMainContent(dados);

  const pageStreams = layout.finalizePages();
  const buffer = buildPdfDocument(pageStreams);

  return {
    buffer,
    base64: buffer.toString('base64'),
    fileName: gerarNomeArquivoCurriculo(dados.nomeCompleto),
    mimeType: 'application/pdf',
    pageCount: pageStreams.length,
  };
}
