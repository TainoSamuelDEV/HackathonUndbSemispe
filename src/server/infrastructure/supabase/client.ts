import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/server/config/env';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Cliente Supabase exclusivo para o servidor (SERVICE_ROLE_KEY).
 * Nunca deve ser importado em componentes Client ("use client").
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const env = getServerEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.'
    );
  }

  supabaseInstance = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseInstance;
}
