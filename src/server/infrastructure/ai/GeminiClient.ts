import { getGeminiApiKey, getServerEnv } from '@/server/config/env';

export interface GeminiConversationalInput {
  systemInstruction: string;
  userMessage: string;
  contextoJson?: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface CurriculoExtraido {
  nome?: string;
  bairro?: string;
  habilidades: string[];
  experiencias: Array<{
    cargo: string;
    empresa?: string;
    periodo?: string;
  }>;
  escolaridade?: string;
  resumo?: string;
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
    code?: number;
  };
}

/**
 * Cliente HTTP leve para a API oficial do Google Gemini (Generative Language API).
 * Utiliza `fetch` nativo no servidor para evitar dependências pesadas.
 */
export class GeminiClient {
  private getCredentials(): { apiKey: string; model: string } {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error(
        'API do Gemini não configurada. Defina GEMINI_API_KEY (ou LLM_API_KEY) no arquivo .env.local.'
      );
    }
    const env = getServerEnv();
    return {
      apiKey,
      model: env.GEMINI_MODEL || 'gemini-2.5-flash',
    };
  }

  private async generateContent(body: Record<string, unknown>): Promise<string> {
    const { apiKey, model } = this.getCredentials();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json().catch(() => ({}))) as GeminiGenerateContentResponse;

    if (!response.ok) {
      const msg = data?.error?.message || `HTTP ${response.status}`;
      throw new Error(`Falha na API do Gemini: ${msg}`);
    }

    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim() ?? '';

    if (!text) {
      throw new Error('A API do Gemini retornou uma resposta vazia.');
    }

    return text;
  }

  /**
   * Gera resposta conversacional curta e objetiva ancorada exclusivamente nos dados reais fornecidos.
   */
  async gerarRespostaConversacional(input: GeminiConversationalInput): Promise<string> {
    const promptUsuario = input.contextoJson
      ? `CONTEXTO_REAL_SISTEMA (use apenas estes fatos):\n${JSON.stringify(
          input.contextoJson,
          null,
          2
        )}\n\nMENSAGEM_CIDADAO:\n${input.userMessage}`
      : input.userMessage;

    return this.generateContent({
      systemInstruction: {
        parts: [{ text: input.systemInstruction }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: promptUsuario }],
        },
      ],
      generationConfig: {
        temperature: input.temperature ?? 0.3,
        maxOutputTokens: input.maxOutputTokens ?? 1024,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });
  }

  /**
   * Transcreve áudio de WhatsApp (OGG/MP3/WAV/M4A) para português brasileiro simples.
   */
  async transcreverAudio(base64Data: string, mimeType = 'audio/ogg'): Promise<string> {
    return this.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Transcreva exatamente o que o cidadão falou neste áudio em português do Brasil. Retorne apenas a transcrição limpa, sem comentários.',
            },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });
  }

  /**
   * Extrai informações estruturadas de um currículo em PDF ou imagem para revisão do candidato.
   */
  async extrairCurriculo(base64Data: string, mimeType: string): Promise<CurriculoExtraido> {
    const rawJson = await this.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: [
                'Extraia os dados deste currículo em português e retorne APENAS um JSON válido com a seguinte estrutura:',
                '{',
                '  "nome": string | null,',
                '  "bairro": string | null,',
                '  "habilidades": string[],',
                '  "experiencias": [{ "cargo": string, "empresa": string | null, "periodo": string | null }],',
                '  "escolaridade": string | null,',
                '  "resumo": string | null',
                '}',
                'Não invente informações que não estejam no documento. Não inclua CPF ou RG na resposta.',
              ].join('\n'),
            },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(rawJson) as Partial<CurriculoExtraido>;
    return {
      nome: typeof parsed.nome === 'string' && parsed.nome.trim() ? parsed.nome.trim() : undefined,
      bairro: typeof parsed.bairro === 'string' && parsed.bairro.trim() ? parsed.bairro.trim() : undefined,
      habilidades: Array.isArray(parsed.habilidades)
        ? parsed.habilidades.filter((h): h is string => typeof h === 'string' && h.trim().length > 0)
        : [],
      experiencias: Array.isArray(parsed.experiencias)
        ? parsed.experiencias
            .filter((e): e is { cargo: string; empresa?: string; periodo?: string } => Boolean(e && typeof e.cargo === 'string'))
            .map((e) => ({
              cargo: e.cargo.trim(),
              empresa: typeof e.empresa === 'string' && e.empresa.trim() ? e.empresa.trim() : undefined,
              periodo: typeof e.periodo === 'string' && e.periodo.trim() ? e.periodo.trim() : undefined,
            }))
        : [],
      escolaridade:
        typeof parsed.escolaridade === 'string' && parsed.escolaridade.trim()
          ? parsed.escolaridade.trim()
          : undefined,
      resumo: typeof parsed.resumo === 'string' && parsed.resumo.trim() ? parsed.resumo.trim() : undefined,
    };
  }
}

export const geminiClient = new GeminiClient();
