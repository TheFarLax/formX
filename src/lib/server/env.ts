/**
 * Server-side environment access.
 *
 * Nothing in here is prefixed `NEXT_PUBLIC_`, so none of it can reach the
 * browser bundle. The `window` guard is a belt-and-braces check in case a future
 * refactor imports this module from a client component — it fails loudly at the
 * boundary instead of silently shipping a secret.
 */

if (typeof window !== 'undefined') {
  throw new Error('src/lib/server/env.ts must never be imported from client code.');
}

export interface ServerEnv {
  supabaseUrl: string;
  serviceRoleKey: string;
  ipHashSalt: string;
}

let cached: ServerEnv | null = null;

/**
 * Throws when configuration is missing. Callers must catch and surface the
 * generic failure message — a misconfigured deployment should never explain
 * itself to a participant.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const ipHashSalt = process.env.IP_HASH_SALT?.trim();

  const missing: string[] = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!ipHashSalt) missing.push('IP_HASH_SALT');

  if (!supabaseUrl || !serviceRoleKey || !ipHashSalt) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (ipHashSalt.length < 32) {
    throw new Error('IP_HASH_SALT must be at least 32 characters. Generate with: openssl rand -hex 32');
  }

  cached = { supabaseUrl, serviceRoleKey, ipHashSalt };
  return cached;
}
