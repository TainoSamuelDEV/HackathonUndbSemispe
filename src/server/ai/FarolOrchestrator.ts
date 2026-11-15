import { farolService } from '@/server/application/FarolService';
import { normalizarTelefoneWhatsApp, sanitizarEntradaCidadao } from '@/server/domain/ai/Guardrails';

export interface MensagemEntradaWhatsApp {
  telefoneRaw: string;
  texto: string;
}

export interface RespostaFarolAI {
  telefone: string;
  estadoAtual: string;
  respostaTexto: string;
}

/**
 * Orquestrador da IA FAROL (WhatsApp via Evolution API).
 * Separa execução determinística (código/serviços) da condução conversacional.
 */
export class FarolOrchestrator {
  async processarMensagem(entrada: MensagemEntradaWhatsApp): Promise<RespostaFarolAI> {
    const telefone = normalizarTelefoneWhatsApp(entrada.telefoneRaw);
    const { textoLimpo, detectouCpf } = sanitizarEntradaCidadao(entrada.texto);

    if (detectouCpf) {
      const conv = await farolService.obterOuCriarConversaWhatsApp(telefone);
      return {
        telefone,
        estadoAtual: conv.estadoAtual,
        respostaTexto:
          'Obrigada, mas não preciso do seu CPF para isso. Vou ignorar essa informação para sua segurança. Podemos continuar?',
      };
    }

    const textoNorm = textoLimpo.toLowerCase().trim();
    const conv = await farolService.obterOuCriarConversaWhatsApp(telefone);

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

    // 2. Match / Consulta de Vagas e Cursos para candidato vinculado
    if (conv.candidatoId) {
      if (textoNorm.includes('curso') || textoNorm === '2') {
        const cursos = await farolService.listarCursos();
        const top = cursos.slice(0, 3);
        const lista = top
          .map((c, idx) => `${idx + 1}) ${c.titulo} (${c.cargaHoraria}h · ${c.tipo === 'PROGRAMADO' ? 'Turma aberta' : 'Sob demanda'})`)
          .join('\n');

        return {
          telefone,
          estadoAtual: 'CURSOS',
          respostaTexto:
            `Encontrei estes cursos gratuitos da SEMISPE:\n${lista}\nQuer se inscrever ou pedir outro curso? Me diga o número ou o tema.`,
        };
      }

      const melhores = await farolService.listarMelhoresVagasParaIA(conv.candidatoId, undefined, 3);
      if (melhores.length === 0) {
        return {
          telefone,
          estadoAtual: 'CURSOS',
          respostaTexto:
            'Hoje não achei vaga compatível com o seu perfil. Quer ver cursos gratuitos da SEMISPE que aumentam suas chances? Responda 1 para SIM.',
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

      return {
        telefone,
        estadoAtual: 'MATCH',
        respostaTexto:
          `Encontrei ${melhores.length} vagas que combinam com você:\n\n${linhasVagas.join('\n\n')}\n\nResponda o número da vaga para se candidatar ou 2 para ver cursos.`,
      };
    }

    // 3. Triagem simplificada para usuário ainda não vinculado
    const nome = String(conv.contextoJson.nome ?? '');
    if (!nome) {
      await farolService.atualizarEstadoConversaWhatsApp(telefone, 'TRIAGEM', { nome: textoLimpo });
      return {
        telefone,
        estadoAtual: 'TRIAGEM',
        respostaTexto: `Prazer, ${textoLimpo}! Em qual bairro de São Luís você mora?`,
      };
    }

    await farolService.atualizarEstadoConversaWhatsApp(telefone, 'CURRICULO', {
      bairro: textoLimpo,
    });

    return {
      telefone,
      estadoAtual: 'CURRICULO',
      respostaTexto:
        `Anotado, ${nome} (${textoLimpo})! Qual é a sua escolaridade?\n1) Fundamental 2) Médio completo 3) Técnico 4) Superior`,
    };
  }
}

export const farolOrchestrator = new FarolOrchestrator();
