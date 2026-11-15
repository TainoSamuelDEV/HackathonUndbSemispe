import { farolService } from '@/server/application/FarolService';
import { isGeminiConfigured } from '@/server/config/env';
import { normalizarTelefoneWhatsApp, sanitizarEntradaCidadao } from '@/server/domain/ai/Guardrails';
import { calcularCompatibilidade } from '@/server/domain/matching/MatchEngine';
import { geminiClient } from '@/server/infrastructure/ai/GeminiClient';
import type { NivelEscolaridade } from '@/types/farol';

export interface MensagemEntradaWhatsApp {
  telefoneRaw: string;
  texto?: string;
  audioBase64?: string;
  audioMimeType?: string;
  documentoBase64?: string;
  documentoMimeType?: string;
}

export interface RespostaFarolAI {
  telefone: string;
  estadoAtual: string;
  respostaTexto: string;
}

const FAROL_SYSTEM_PROMPT = [
  'Você é a assistente virtual do FAROL (Formação, Ações e Rede de Oportunidades Locais), da Prefeitura de São Luís e SEMISPE.',
  'Regras obrigatórias:',
  '- Responda em português brasileiro simples, acolhedor e respeitoso (sem jargões).',
  '- Seja concisa para WhatsApp (no máximo 4 a 6 linhas curtas) e conclua SEMPRE a frase/pergunta por completo.',
  '- Não repita "Olá" se a conversa já estiver em andamento.',
  '- Use EXCLUSIVAMENTE os fatos, vagas, cursos e percentuais presentes em CONTEXTO_REAL_SISTEMA.',
  '- Nunca invente vagas, empresas, cursos, links ou prazos. Nunca prometa emprego garantido.',
  '- Nunca peça nem repita número de CPF ou RG.',
].join('\n');

function parseEscolaridade(textoNorm: string): {
  codigo: NivelEscolaridade;
  label: string;
} | null {
  if (textoNorm === '1' || textoNorm.includes('fundamental')) {
    return { codigo: 'FUNDAMENTAL_COMPLETO', label: 'Fundamental completo' };
  }
  if (textoNorm === '2' || textoNorm.includes('medio') || textoNorm.includes('médio')) {
    return { codigo: 'MEDIO_COMPLETO', label: 'Médio completo' };
  }
  if (textoNorm === '3' || textoNorm.includes('tecnico') || textoNorm.includes('técnico')) {
    return { codigo: 'TECNICO', label: 'Técnico' };
  }
  if (textoNorm === '4' || textoNorm.includes('superior') || textoNorm.includes('faculdade')) {
    return { codigo: 'SUPERIOR_COMPLETO', label: 'Superior' };
  }
  return null;
}

function extrairListaHabilidades(textoLimpo: string): string[] {
  return textoLimpo
    .split(/[,;\n]+|\se\s/i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
    .slice(0, 12);
}

/**
 * Orquestrador da IA FAROL (WhatsApp via Evolution API).
 * Separa execução determinística (código/serviços) da condução conversacional com Gemini.
 */
export class FarolOrchestrator {
  private async redigirComGemini(
    userMessage: string,
    fallbackTexto: string,
    contextoJson: Record<string, unknown>
  ): Promise<string> {
    if (!isGeminiConfigured()) {
      return fallbackTexto;
    }

    try {
      return await geminiClient.gerarRespostaConversacional({
        systemInstruction: FAROL_SYSTEM_PROMPT,
        userMessage,
        contextoJson,
      });
    } catch {
      return fallbackTexto;
    }
  }

  private async responderComVagasECursosPorPerfil(
    telefone: string,
    textoLimpo: string,
    textoNorm: string,
    escolaridadeCodigo: NivelEscolaridade,
    habilidades: string[]
  ): Promise<RespostaFarolAI> {
    if (textoNorm.includes('curso') || textoNorm === '2') {
      const cursos = await farolService.listarCursos();
      const top = cursos.slice(0, 3);
      const lista = top
        .map(
          (c, idx) =>
            `${idx + 1}) ${c.titulo} (${c.cargaHoraria}h · ${c.tipo === 'PROGRAMADO' ? 'Turma aberta' : 'Sob demanda'})`
        )
        .join('\n');

      const fallback = `Encontrei estes cursos gratuitos da SEMISPE:\n${lista}\nQuer saber mais sobre algum curso ou ver vagas?`;
      const respostaTexto = await this.redigirComGemini(textoLimpo, fallback, {
        acao: 'listar_cursos_semispe',
        cursos: top.map((c, idx) => ({
          numero: idx + 1,
          titulo: c.titulo,
          cargaHoraria: c.cargaHoraria,
          tipo: c.tipo,
        })),
      });

      await farolService.atualizarEstadoConversaWhatsApp(telefone, 'CURSOS');
      return { telefone, estadoAtual: 'CURSOS', respostaTexto };
    }

    const vagas = await farolService.listarVagasPublicas();
    const avaliadas = vagas
      .map((vaga) => ({
        vaga,
        match: calcularCompatibilidade(
          {
            escolaridade: escolaridadeCodigo,
            competencias: habilidades,
          },
          {
            escolaridadeMinima: vaga.escolaridadeMinima,
            requisitos: vaga.requisitos,
          }
        ),
      }))
      .sort((a, b) => b.match.percentual - a.match.percentual)
      .slice(0, 3);

    if (avaliadas.length === 0) {
      const fallback =
        'No momento não encontrei vagas abertas para o seu perfil. Quer ver os cursos gratuitos da SEMISPE? Responda CURSOS.';
      const respostaTexto = await this.redigirComGemini(textoLimpo, fallback, {
        acao: 'sem_vagas_abertas_sugerir_cursos',
      });
      await farolService.atualizarEstadoConversaWhatsApp(telefone, 'CURSOS');
      return { telefone, estadoAtual: 'CURSOS', respostaTexto };
    }

    const linhasVagas = avaliadas.map(({ vaga, match }, idx) => {
      const atende = match.atendidos.slice(0, 2).join(', ') || 'Perfil inicial';
      const falta = match.naoIdentificados.slice(0, 1).map((f) => f.item).join(', ');
      const selo = vaga.seloSimulado ? ' [Exemplo]' : '';
      return `${idx + 1}) ${vaga.titulo}${selo} — ${match.percentual}% compatível\n✅ Atende: ${atende}${falta ? `\n📌 Falta: ${falta}` : ''}`;
    });

    await farolService.atualizarEstadoConversaWhatsApp(telefone, 'MATCH', {
      ultimasVagasSugeridas: avaliadas.map((m) => m.vaga.id),
    });

    const fallback = `Encontrei ${avaliadas.length} vagas para o seu perfil:\n\n${linhasVagas.join('\n\n')}\n\nResponda 2 para ver cursos gratuitos da SEMISPE ou ATENDENTE para falar com a equipe.`;
    const respostaTexto = await this.redigirComGemini(textoLimpo, fallback, {
      acao: 'apresentar_vagas_match',
      vagas: avaliadas.map(({ vaga, match }, idx) => ({
        numero: idx + 1,
        titulo: vaga.titulo,
        seloExemplo: Boolean(vaga.seloSimulado),
        compatibilidadePercentual: match.percentual,
        atende: match.atendidos.slice(0, 2),
        falta: match.naoIdentificados.slice(0, 1).map((f) => f.item),
      })),
    });

    return { telefone, estadoAtual: 'MATCH', respostaTexto };
  }

  async processarMensagem(entrada: MensagemEntradaWhatsApp): Promise<RespostaFarolAI> {
    const telefone = normalizarTelefoneWhatsApp(entrada.telefoneRaw);
    const conv = await farolService.obterOuCriarConversaWhatsApp(telefone);

    let textoBruto = (entrada.texto ?? '').trim();

    // Transcrição multimodal de áudio via Gemini
    if (entrada.audioBase64) {
      if (!isGeminiConfigured()) {
        return {
          telefone,
          estadoAtual: conv.estadoAtual,
          respostaTexto:
            'Recebi seu áudio! No momento a transcrição automática está indisponível. Pode escrever sua resposta por texto, por favor?',
        };
      }
      try {
        textoBruto = await geminiClient.transcreverAudio(
          entrada.audioBase64,
          entrada.audioMimeType ?? 'audio/ogg'
        );
      } catch {
        return {
          telefone,
          estadoAtual: conv.estadoAtual,
          respostaTexto:
            'Não consegui entender seu áudio agora. Pode enviar novamente ou escrever por texto?',
        };
      }
    }

    // Extração multimodal de currículo (PDF/imagem) via Gemini
    if (entrada.documentoBase64) {
      if (!isGeminiConfigured()) {
        return {
          telefone,
          estadoAtual: conv.estadoAtual,
          respostaTexto:
            'Recebi seu arquivo! No momento não consigo ler documentos automaticamente aqui. Pode me contar sua experiência por texto?',
        };
      }

      try {
        const extraido = await geminiClient.extrairCurriculo(
          entrada.documentoBase64,
          entrada.documentoMimeType ?? 'application/pdf'
        );
        const habilidadesTexto = extraido.habilidades.slice(0, 5).join(', ') || 'não informadas';
        const resumoCurriculo = {
          nome: extraido.nome,
          bairro: extraido.bairro,
          escolaridade: extraido.escolaridade,
          habilidades: extraido.habilidades.slice(0, 8),
        };

        const escolaridadeDetectada = extraido.escolaridade
          ? parseEscolaridade(extraido.escolaridade.toLowerCase())
          : null;

        await farolService.atualizarEstadoConversaWhatsApp(telefone, 'CURRICULO', {
          curriculoExtraido: resumoCurriculo,
          ...(extraido.nome ? { nome: extraido.nome } : {}),
          ...(extraido.bairro ? { bairro: extraido.bairro } : {}),
          ...(escolaridadeDetectada
            ? {
                escolaridade: escolaridadeDetectada.label,
                escolaridadeCodigo: escolaridadeDetectada.codigo,
              }
            : {}),
          ...(extraido.habilidades.length > 0 ? { habilidades: extraido.habilidades.slice(0, 12) } : {}),
        });

        const fallback =
          `Li seu currículo! Encontrei: ${extraido.nome ?? 'Nome não identificado'}, ` +
          `habilidades: ${habilidadesTexto}.\nEstá tudo certo? Responda VAGAS para ver oportunidades ou me diga o que corrigir.`;

        const respostaTexto = await this.redigirComGemini(
          'O cidadão enviou um currículo em arquivo. Resuma o que foi extraído e peça confirmação.',
          fallback,
          { acao: 'confirmar_curriculo_extraido', curriculoExtraido: resumoCurriculo }
        );

        return {
          telefone,
          estadoAtual: 'CURRICULO',
          respostaTexto,
        };
      } catch {
        return {
          telefone,
          estadoAtual: conv.estadoAtual,
          respostaTexto:
            'Não consegui ler esse arquivo de currículo. Pode enviar uma foto mais nítida, PDF ou me contar sua experiência por texto?',
        };
      }
    }

    const { textoLimpo, detectouCpf } = sanitizarEntradaCidadao(textoBruto);

    if (detectouCpf) {
      return {
        telefone,
        estadoAtual: conv.estadoAtual,
        respostaTexto:
          'Obrigada, mas não preciso do seu CPF para isso. Vou ignorar essa informação para sua segurança. Podemos continuar?',
      };
    }

    const textoNorm = textoLimpo.toLowerCase().trim();

    // Escalonamento humano imediato quando solicitado
    if (
      textoNorm.includes('atendente') ||
      textoNorm.includes('humano') ||
      textoNorm.includes('falar com alguem') ||
      textoNorm.includes('falar com alguém')
    ) {
      await farolService.atualizarEstadoConversaWhatsApp(telefone, 'ATENDIMENTO_HUMANO', undefined, true);
      return {
        telefone,
        estadoAtual: 'ATENDIMENTO_HUMANO',
        respostaTexto:
          'Entendo. Vou passar seu caso para a equipe da SEMISPE. Eles vão te chamar por aqui no WhatsApp.',
      };
    }

    // 1. Abertura + Consentimento LGPD
    if (conv.estadoAtual === 'NOVO') {
      await farolService.atualizarEstadoConversaWhatsApp(telefone, 'CONSENTIMENTO');
      return {
        telefone,
        estadoAtual: 'CONSENTIMENTO',
        respostaTexto:
          'Olá! 👋 Eu sou a assistente do FAROL, projeto da Prefeitura de São Luís e SEMISPE.\n' +
          'Pra te ajudar a achar vagas e cursos, preciso guardar algumas informações suas (nome, bairro e experiência).\n' +
          'Posso começar? Responda 1 para SIM ou 2 para NÃO.',
      };
    }

    if (conv.estadoAtual === 'CONSENTIMENTO') {
      if (textoNorm === '1' || textoNorm.includes('sim')) {
        await farolService.atualizarEstadoConversaWhatsApp(telefone, 'TRIAGEM', {
          consentimentoEm: new Date().toISOString(),
        });
        return {
          telefone,
          estadoAtual: 'TRIAGEM',
          respostaTexto: 'Combinado! ✅ Como você gostaria de ser chamado(a)?',
        };
      }

      if (textoNorm === '2' || textoNorm.includes('nao') || textoNorm.includes('não')) {
        await farolService.atualizarEstadoConversaWhatsApp(telefone, 'NOVO');
        return {
          telefone,
          estadoAtual: 'NOVO',
          respostaTexto:
            'Tudo bem! Sem sua autorização eu não guardo nenhum dado. Quando quiser procurar vagas no FAROL, é só mandar um "oi".',
        };
      }

      return {
        telefone,
        estadoAtual: 'CONSENTIMENTO',
        respostaTexto:
          'Essas informações servem apenas para encontrar vagas e cursos que combinam com você. Posso começar? Responda 1 para SIM ou 2 para NÃO.',
      };
    }

    // 2. Match / Consulta de Vagas e Cursos para candidato já vinculado no banco
    if (conv.candidatoId) {
      if (textoNorm.includes('curso') || textoNorm === '2') {
        const cursos = await farolService.listarCursos();
        const top = cursos.slice(0, 3);
        const lista = top
          .map(
            (c, idx) =>
              `${idx + 1}) ${c.titulo} (${c.cargaHoraria}h · ${c.tipo === 'PROGRAMADO' ? 'Turma aberta' : 'Sob demanda'})`
          )
          .join('\n');

        const fallback = `Encontrei estes cursos gratuitos da SEMISPE:\n${lista}\nQuer se inscrever ou pedir outro curso? Me diga o número ou o tema.`;
        const respostaTexto = await this.redigirComGemini(textoLimpo, fallback, {
          acao: 'listar_cursos_semispe',
          cursos: top.map((c, idx) => ({
            numero: idx + 1,
            titulo: c.titulo,
            cargaHoraria: c.cargaHoraria,
            tipo: c.tipo,
          })),
        });

        return {
          telefone,
          estadoAtual: 'CURSOS',
          respostaTexto,
        };
      }

      const melhores = await farolService.listarMelhoresVagasParaIA(conv.candidatoId, undefined, 3);
      if (melhores.length === 0) {
        const fallback =
          'Hoje não achei vaga compatível com o seu perfil. Quer ver cursos gratuitos da SEMISPE que aumentam suas chances? Responda 1 para SIM.';
        const respostaTexto = await this.redigirComGemini(textoLimpo, fallback, {
          acao: 'sem_vagas_compativeis_sugerir_cursos',
        });

        return {
          telefone,
          estadoAtual: 'CURSOS',
          respostaTexto,
        };
      }

      const linhasVagas = melhores.map(({ vaga, match }, idx) => {
        const atende = match.atendidos.slice(0, 2).join(', ') || 'Perfil inicial';
        const falta = match.naoIdentificados.slice(0, 1).map((f) => f.item).join(', ');
        const selo = vaga.seloSimulado ? ' [Exemplo]' : '';
        return `${idx + 1}) ${vaga.titulo}${selo} — ${match.percentual}% compatível\n✅ Atende: ${atende}${falta ? `\n📌 Falta: ${falta}` : ''}`;
      });

      await farolService.atualizarEstadoConversaWhatsApp(telefone, 'MATCH', {
        ultimasVagasSugeridas: melhores.map((m) => m.vaga.id),
      });

      const fallback = `Encontrei ${melhores.length} vagas que combinam com você:\n\n${linhasVagas.join('\n\n')}\n\nResponda o número da vaga para se candidatar ou 2 para ver cursos.`;
      const respostaTexto = await this.redigirComGemini(textoLimpo, fallback, {
        acao: 'apresentar_vagas_match',
        vagas: melhores.map(({ vaga, match }, idx) => ({
          numero: idx + 1,
          titulo: vaga.titulo,
          seloExemplo: Boolean(vaga.seloSimulado),
          compatibilidadePercentual: match.percentual,
          atende: match.atendidos.slice(0, 2),
          falta: match.naoIdentificados.slice(0, 1).map((f) => f.item),
        })),
      });

      return {
        telefone,
        estadoAtual: 'MATCH',
        respostaTexto,
      };
    }

    // 3. Triagem sequencial para cidadão via WhatsApp (nome -> bairro -> escolaridade -> habilidades -> match)
    const nome = String(conv.contextoJson.nome ?? '').trim();
    if (!nome) {
      await farolService.atualizarEstadoConversaWhatsApp(telefone, 'TRIAGEM', { nome: textoLimpo });
      const fallback = `Prazer, ${textoLimpo}! Em qual bairro de São Luís você mora?`;
      const respostaTexto = await this.redigirComGemini(textoLimpo, fallback, {
        acao: 'perguntar_bairro',
        nomeCidadao: textoLimpo,
      });

      return {
        telefone,
        estadoAtual: 'TRIAGEM',
        respostaTexto,
      };
    }

    const bairro = String(conv.contextoJson.bairro ?? '').trim();
    if (!bairro) {
      await farolService.atualizarEstadoConversaWhatsApp(telefone, 'CURRICULO', {
        bairro: textoLimpo,
      });

      const fallback = `Anotado, ${nome} (${textoLimpo})! Qual é a sua escolaridade?\n1) Fundamental\n2) Médio completo\n3) Técnico\n4) Superior`;
      const respostaTexto = await this.redigirComGemini(textoLimpo, fallback, {
        acao: 'perguntar_escolaridade',
        nomeCidadao: nome,
        bairro: textoLimpo,
        opcoesEscolaridade: ['1) Fundamental', '2) Médio completo', '3) Técnico', '4) Superior'],
      });

      return {
        telefone,
        estadoAtual: 'CURRICULO',
        respostaTexto,
      };
    }

    const escolaridadeCodigo = conv.contextoJson.escolaridadeCodigo as NivelEscolaridade | undefined;
    if (!escolaridadeCodigo) {
      const parsed = parseEscolaridade(textoNorm);
      if (!parsed) {
        return {
          telefone,
          estadoAtual: 'CURRICULO',
          respostaTexto:
            'Não entendi sua escolaridade. Por favor, responda apenas com o número:\n1) Fundamental\n2) Médio completo\n3) Técnico\n4) Superior',
        };
      }

      await farolService.atualizarEstadoConversaWhatsApp(telefone, 'CURRICULO', {
        escolaridade: parsed.label,
        escolaridadeCodigo: parsed.codigo,
      });

      const fallback = `Perfeito, ${nome}! Escolaridade: ${parsed.label}. Agora me conte: quais são suas principais habilidades ou experiências de trabalho? (Ex: vendas, caixa, atendimento, informática)`;
      const respostaTexto = await this.redigirComGemini(textoLimpo, fallback, {
        acao: 'perguntar_habilidades_experiencia',
        nomeCidadao: nome,
        bairro,
        escolaridade: parsed.label,
      });

      return {
        telefone,
        estadoAtual: 'CURRICULO',
        respostaTexto,
      };
    }

    const habilidadesSalvas = Array.isArray(conv.contextoJson.habilidades)
      ? (conv.contextoJson.habilidades as string[])
      : [];

    if (habilidadesSalvas.length === 0) {
      const habilidades = extrairListaHabilidades(textoLimpo);
      if (habilidades.length === 0) {
        return {
          telefone,
          estadoAtual: 'CURRICULO',
          respostaTexto:
            'Pode me dizer pelo menos uma área ou habilidade que você tem? (Ex: atendimento, estoque, entregas, limpeza, informática)',
        };
      }

      await farolService.atualizarEstadoConversaWhatsApp(telefone, 'MATCH', {
        habilidades,
      });

      return this.responderComVagasECursosPorPerfil(
        telefone,
        textoLimpo,
        textoNorm,
        escolaridadeCodigo,
        habilidades
      );
    }

    return this.responderComVagasECursosPorPerfil(
      telefone,
      textoLimpo,
      textoNorm,
      escolaridadeCodigo,
      habilidadesSalvas
    );
  }
}

export const farolOrchestrator = new FarolOrchestrator();
