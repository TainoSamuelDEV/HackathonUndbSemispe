import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(16).default('farol-dev-secret-key-min-32-chars!!'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  EVOLUTION_API_URL: z.string().url().optional(),
  EVOLUTION_API_KEY: z.string().min(1).optional(),
  EVOLUTION_INSTANCE_NAME: z.string().default('farol-whatsapp'),
  EVOLUTION_WEBHOOK_SECRET: z.string().optional(),
  LLM_PROVIDER: z.enum(['gemini', 'anthropic', 'openai']).default('gemini'),
  LLM_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  AI_INTERNAL_API_KEY: z.string().default('farol-ai-internal-dev-key'),
});

export type ServerEnv = z.infer<typeof envSchema>;

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;
  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
}

export function isSupabaseConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getGeminiApiKey(): string | null {
  const env = getServerEnv();
  const key = (env.GEMINI_API_KEY ?? env.LLM_API_KEY ?? '').trim();
  if (!key || key === 'sua-llm-api-key' || key === 'sua-gemini-api-key') {
    return null;
  }
  return key;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}
