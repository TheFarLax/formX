/**
 * Abuse protection: IP-derived rate limiting, honeypot and fill-time checks.
 *
 * The stored value is a salted SHA-256 of the address, never the address itself,
 * so the ledger is useless to anyone who obtains it and the Privacy Policy can
 * honestly say raw IPs are not retained.
 */

import { createHash } from 'node:crypto';
import { getServerEnv } from './env';
import { getSupabaseAdmin } from './supabase-admin';

/**
 * A genuine participant cannot read fifteen questions and answer them in under
 * fifteen seconds. Scripted submissions routinely arrive in under one.
 */
export const MIN_FILL_MS = 15_000;

/** Tolerance for a participant whose device clock is wrong. */
const CLOCK_SKEW_MS = 5 * 60_000;

const FORWARDED_HEADERS = ['x-vercel-forwarded-for', 'x-forwarded-for', 'x-real-ip'] as const;

/**
 * Best-effort client address. `x-forwarded-for` may hold a proxy chain, in which
 * case the left-most entry is the original client. Returns null when no header is
 * present, which happens in local development.
 */
export function clientIpFrom(headers: Headers): string | null {
  for (const name of FORWARDED_HEADERS) {
    const raw = headers.get(name);
    if (!raw) continue;
    const first = raw.split(',')[0]?.trim();
    if (first) return first;
  }
  return null;
}

export function hashIp(ip: string): string {
  const { ipHashSalt } = getServerEnv();
  return createHash('sha256').update(`${ipHashSalt}:${ip}`).digest('hex');
}

export type RateLimitResult = { allowed: true } | { allowed: false; reason: 'quota' | 'error' };

/**
 * Records the attempt and reports whether it was within limits. Delegates to a
 * Postgres function so counting and inserting are one atomic round trip; two
 * requests racing cannot both slip past the limit.
 *
 * A failure to reach the limiter is not treated as a rejection — the survey stays
 * available if the ledger has a problem, and the insert path still enforces
 * one-entry-per-email.
 */
export async function checkRateLimit(headers: Headers): Promise<RateLimitResult> {
  const ip = clientIpFrom(headers);
  if (!ip) return { allowed: true };

  const { data, error } = await getSupabaseAdmin().rpc('record_submission_attempt', {
    p_ip_hash: hashIp(ip),
  });

  if (error) {
    console.error('[survey] rate limiter unavailable:', error.code ?? '', error.message);
    return { allowed: true };
  }

  return data === false ? { allowed: false, reason: 'quota' } : { allowed: true };
}

/** True when the submission looks automated. */
export function looksAutomated(input: {
  honeypot: string | undefined;
  startedAt: number;
  now?: number;
}): boolean {
  if (input.honeypot && input.honeypot.trim() !== '') return true;

  const now = input.now ?? Date.now();
  if (input.startedAt > now + CLOCK_SKEW_MS) return true;

  return now - input.startedAt < MIN_FILL_MS;
}

/**
 * Rejects cross-site form posts. Only enforced when an Origin header is present,
 * so a same-origin request from a client that omits it is not broken.
 */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get('origin');
  if (!origin) return true;

  const host = headers.get('x-forwarded-host') ?? headers.get('host');
  if (!host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
