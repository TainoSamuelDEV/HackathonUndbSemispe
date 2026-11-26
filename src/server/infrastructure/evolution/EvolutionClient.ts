import { getServerEnv } from '@/server/config/env';

export interface EvolutionSendTextInput {
  telefone: string;
  texto: string;
  delay?: number;
  presence?: 'composing' | 'recording' | 'paused';
}

export interface EvolutionSendDocumentInput {
  telefone: string;
  base64: string;
  fileName: string;
  caption?: string;
  mimetype?: string;
}

export interface EvolutionSendResult {
  messageId?: string;
  remoteJid?: string;
}

const configuredSafeInstances = new Set<string>();

export class EvolutionClient {
  private getConfig() {
    const env = getServerEnv();
    if (!env.EVOLUTION_API_URL || !env.EVOLUTION_API_KEY) {
      throw new Error(
        'Evolution API não configurada. Defina EVOLUTION_API_URL e EVOLUTION_API_KEY no .env.'
      );
    }
    return {
      baseUrl: env.EVOLUTION_API_URL.replace(/\/$/, ''),
      apiKey: env.EVOLUTION_API_KEY,
      instance: env.EVOLUTION_INSTANCE_NAME,
    };
  }

  async enviarTexto({
    telefone,
    texto,
    delay,
    presence = 'composing',
  }: EvolutionSendTextInput): Promise<EvolutionSendResult> {
    const { baseUrl, apiKey, instance } = this.getConfig();
    const payload: Record<string, unknown> = {
      number: telefone,
      text: texto,
    };
    if (typeof delay === 'number' && delay > 0) {
      payload.delay = delay;
      payload.presence = presence;
    }

    const response = await fetch(
      `${baseUrl}/message/sendText/${encodeURIComponent(instance)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Falha ao enviar mensagem Evolution API (${response.status}): ${body}`);
    }

    const json = (await response.json().catch(() => null)) as {
      key?: { id?: string; remoteJid?: string };
    } | null;

    return {
      messageId: json?.key?.id,
      remoteJid: json?.key?.remoteJid,
    };
  }

  async enviarDocumento({
    telefone,
    base64,
    fileName,
    caption = '',
    mimetype = 'application/pdf',
  }: EvolutionSendDocumentInput): Promise<EvolutionSendResult> {
    const { baseUrl, apiKey, instance } = this.getConfig();
    const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '').trim();

    const response = await fetch(
      `${baseUrl}/message/sendMedia/${encodeURIComponent(instance)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: telefone,
          mediatype: 'document',
          mimetype,
          caption,
          media: cleanBase64,
          fileName,
        }),
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Falha ao enviar documento Evolution API (${response.status}): ${body}`);
    }

    const json = (await response.json().catch(() => null)) as {
      key?: { id?: string; remoteJid?: string };
    } | null;

    return {
      messageId: json?.key?.id,
      remoteJid: json?.key?.remoteJid,
    };
  }

  async marcarComoLido(remoteJid: string, messageId: string): Promise<void> {
    if (!remoteJid || !messageId) return;
    try {
      const { baseUrl, apiKey, instance } = this.getConfig();
      await fetch(`${baseUrl}/chat/markMessageAsRead/${encodeURIComponent(instance)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: JSON.stringify({
          readMessages: [
            {
              remoteJid,
              fromMe: false,
              id: messageId,
            },
          ],
        }),
        signal: AbortSignal.timeout(5_000),
      });
    } catch {
      // Silencioso para nunca interromper o fluxo de resposta
    }
  }

  async garantirConfiguracaoSegura(): Promise<void> {
    try {
      const { baseUrl, apiKey, instance } = this.getConfig();
      if (configuredSafeInstances.has(instance)) return;
      configuredSafeInstances.add(instance);

      await fetch(`${baseUrl}/settings/set/${encodeURIComponent(instance)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: JSON.stringify({
          rejectCall: false,
          msgCall: '',
          groupsIgnore: false,
          alwaysOnline: false,
          readMessages: false,
          readStatus: false,
          syncFullHistory: false,
        }),
        signal: AbortSignal.timeout(5_000),
      });
    } catch {
      // Silencioso para não bloquear o webhook
    }
  }

  /**
   * Obtém o conteúdo em Base64 de uma mídia recebida (áudio, imagem ou PDF) via Evolution API.
   */
  async obterMediaBase64(messageKey: {
    id: string;
    remoteJid?: string;
    fromMe?: boolean;
  }): Promise<{
    base64: string;
    mimetype?: string;
  }> {
    const { baseUrl, apiKey, instance } = this.getConfig();
    const response = await fetch(
      `${baseUrl}/chat/getBase64FromMediaMessage/${encodeURIComponent(instance)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: JSON.stringify({
          message: { key: messageKey },
          convertToMp4: false,
        }),
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Falha ao baixar mídia Evolution API (${response.status}): ${body}`);
    }

    const data = (await response.json()) as { base64?: string; mimetype?: string };
    if (!data.base64) {
      throw new Error('Evolution API não retornou conteúdo base64 para a mídia.');
    }

    return {
      base64: data.base64,
      mimetype: data.mimetype,
    };
  }
}
