import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export async function verifySupabaseConnection(): Promise<{
  configured: boolean;
  connected: boolean;
}> {
  if (!supabase) {
    return { configured: false, connected: false };
  }

  try {
    const { error } = await supabase.from('aspirasi').select('id', { count: 'exact', head: true });
    return { configured: true, connected: !error };
  } catch {
    return { configured: true, connected: false };
  }
}
