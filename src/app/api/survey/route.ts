/**
 * Survey submission endpoint.
 *
 * The browser never talks to Supabase. Everything arrives here, is re-validated
 * against the same shared schema the form used, and is written with the
 * service-role key. Database and configuration failures are logged server-side
 * and reduced to an opaque error code before they reach the participant.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, isSameOrigin, looksAutomated } from '@/lib/server/abuse';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { buildResponseRow } from '@/lib/survey/payload';
import { QUESTION_IDS } from '@/lib/survey/types';
import type { Answers, QuestionId } from '@/lib/survey/types';
import { hasErrors, validateAll } from '@/lib/survey/validate';
import { pruneAnswers } from '@/lib/survey/visibility';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Generous next to a full survey (15 answers × 4 000 chars), tight enough to
 *  refuse a payload designed to exhaust memory before validation runs. */
const MAX_BODY_CHARS = 200_000;

const answerValue = z.union([z.string().max(8_000), z.array(z.string().max(200)).max(32)]);

const bodySchema = z.object({
  entry_id: z.uuid(),
  answers: z.record(z.string().max(64), answerValue),
  consents: z.object({
    research: z.boolean(),
    marketing: z.boolean(),
    reward: z.boolean(),
  }),
  started_at: z.number().int().positive(),
  /** Honeypot. Must arrive empty. */
  x_ref: z.string().max(200).optional(),
});

const KNOWN_QUESTION_IDS: ReadonlySet<string> = new Set(QUESTION_IDS);

type ErrorCode =
  | 'invalid_request'
  | 'validation'
  | 'rate_limited'
  | 'duplicate_email'
  | 'server_error';

function fail(status: number, error: ErrorCode, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

/** Unknown keys are dropped rather than rejected, so an older cached client that
 *  posts a retired question id still submits successfully. */
function knownAnswersOnly(input: Record<string, string | string[]>): Answers {
  const answers: Answers = {};
  for (const [key, value] of Object.entries(input)) {
    if (KNOWN_QUESTION_IDS.has(key)) answers[key as QuestionId] = value;
  }
  return answers;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request.headers)) {
    return fail(403, 'invalid_request');
  }

  // ── Parse ────────────────────────────────────────────────────────────────
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return fail(400, 'invalid_request');
  }
  if (raw.length === 0 || raw.length > MAX_BODY_CHARS) {
    return fail(413, 'invalid_request');
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail(400, 'invalid_request');
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return fail(400, 'invalid_request');
  }
  const body = parsed.data;

  // ── Bot checks ───────────────────────────────────────────────────────────
  if (looksAutomated({ honeypot: body.x_ref, startedAt: body.started_at })) {
    return fail(400, 'invalid_request');
  }

  // ── Rate limit ───────────────────────────────────────────────────────────
  let limit;
  try {
    limit = await checkRateLimit(request.headers);
  } catch (error) {
    console.error('[survey] rate limit check threw:', error);
    return fail(500, 'server_error');
  }
  if (!limit.allowed) {
    return fail(429, 'rate_limited');
  }

  // ── Re-derive and re-validate ────────────────────────────────────────────
  // Pruning here is what enforces "hidden questions are never submitted": a
  // tampered payload carrying answers for a branch the participant never saw has
  // them dropped before the row is built.
  const state = {
    answers: pruneAnswers(knownAnswersOnly(body.answers)),
    consents: body.consents,
  };

  const errors = validateAll(state);
  if (hasErrors(errors)) {
    return fail(422, 'validation', { fields: errors });
  }

  // ── Persist ──────────────────────────────────────────────────────────────
  let row;
  try {
    row = buildResponseRow(state, body.entry_id);
  } catch (error) {
    // Unreachable while the row builder and the validator agree about which
    // answers are required. If they ever disagree it is a server fault, not
    // something the participant can correct, so it is reported as one.
    console.error('[survey] could not build response row:', error);
    return fail(500, 'server_error');
  }

  try {
    const { error } = await getSupabaseAdmin().from('survey_responses').insert(row);

    if (error) {
      if (error.code === '23505') {
        const detail = `${error.message} ${error.details ?? ''}`;

        // Same draft posted twice — the first insert already succeeded, so this
        // is a retry after a dropped response, not a second submission.
        if (detail.includes('survey_responses_entry_id_key')) {
          return NextResponse.json({ ok: true, duplicate: true });
        }
        if (detail.includes('survey_responses_email_key')) {
          return fail(409, 'duplicate_email');
        }
      }

      console.error('[survey] insert failed:', error.code ?? '', error.message);
      return fail(500, 'server_error');
    }
  } catch (error) {
    console.error('[survey] insert threw:', error);
    return fail(500, 'server_error');
  }

  return NextResponse.json({ ok: true });
}
