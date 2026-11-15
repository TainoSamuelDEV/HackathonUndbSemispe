import { getServerEnv } from '@/server/config/env';

export interface EvolutionSendTextInput {
  telefone: string;
  texto: string;
}

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

  async enviarTexto({ telefone, texto }: EvolutionSendTextInput): Promise<void> {
    const { baseUrl, apiKey, instance } = this.getConfig();
    const response = await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: JSON.stringify({
        number: telefone,
        text: texto,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Falha ao enviar mensagem Evolution API (${response.status}): ${body}`);
    }
  }
}
