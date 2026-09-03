/**
 * Supabase client for the service role.
 *
 * This key bypasses Row Level Security, which is exactly why it lives only here
 * and only on the server. Session persistence and auto-refresh are switched off:
 * this is a stateless machine client, not a user session.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerEnv } from './env';

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const { supabaseUrl, serviceRoleKey } = getServerEnv();

  client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { 'X-Client-Info': 'xasri-research-survey' },
    },
  });

  return client;
}
