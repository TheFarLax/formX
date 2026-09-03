/**
 * Local draft persistence.
 *
 * Unfinished progress lives in the participant's own browser and nowhere else —
 * no partial responses are written to the database. Every access is wrapped:
 * Safari in private mode throws on `localStorage`, and a survey that crashes
 * because storage is unavailable would be worse than one that simply forgets.
 */

import { QUESTION_IDS } from './survey/types';
import type { Answers, Consents, QuestionId, SectionId } from './survey/types';

const DRAFT_KEY = 'xasri.survey.draft.v1';
const SUBMITTED_KEY = 'xasri.survey.submitted.v1';

export interface Draft {
  version: 1;
  entryId: string;
  startedAt: number;
  savedAt: number;
  sectionId: SectionId | null;
  answers: Answers;
  consents: Consents;
}

const KNOWN_IDS: ReadonlySet<string> = new Set(QUESTION_IDS);

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Narrows untrusted stored JSON. A malformed draft is discarded, not repaired. */
function parseDraft(raw: string): Draft | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof value !== 'object' || value === null) return null;
  const d = value as Record<string, unknown>;

  if (d.version !== 1) return null;
  if (typeof d.entryId !== 'string' || d.entryId === '') return null;
  if (typeof d.startedAt !== 'number' || !Number.isFinite(d.startedAt)) return null;
  if (typeof d.answers !== 'object' || d.answers === null) return null;
  if (typeof d.consents !== 'object' || d.consents === null) return null;

  const answers: Answers = {};
  for (const [key, val] of Object.entries(d.answers as Record<string, unknown>)) {
    if (!KNOWN_IDS.has(key)) continue;
    if (typeof val === 'string') {
      answers[key as QuestionId] = val;
    } else if (Array.isArray(val) && val.every((v) => typeof v === 'string')) {
      answers[key as QuestionId] = val as string[];
    }
  }

  const c = d.consents as Record<string, unknown>;
  const consents: Consents = {
    research: c.research === true,
    marketing: c.marketing === true,
    reward: c.reward === true,
  };

  return {
    version: 1,
    entryId: d.entryId,
    startedAt: d.startedAt,
    savedAt: typeof d.savedAt === 'number' ? d.savedAt : d.startedAt,
    sectionId: typeof d.sectionId === 'string' ? (d.sectionId as SectionId) : null,
    answers,
    consents,
  };
}

export function loadDraft(): Draft | null {
  const store = storage();
  if (!store) return null;
  const raw = store.getItem(DRAFT_KEY);
  return raw ? parseDraft(raw) : null;
}

export function saveDraft(draft: Draft): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Quota exceeded or storage disabled. Losing the draft is acceptable;
    // interrupting the participant is not.
  }
}

export function clearDraft(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(DRAFT_KEY);
  } catch {
    /* nothing useful to do */
  }
}

/** True when a draft holds work worth offering to resume. */
export function isResumable(draft: Draft | null): draft is Draft {
  if (!draft) return false;
  return Object.values(draft.answers).some((v) =>
    Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim() !== '',
  );
}

/** Records that this device has submitted, so a return visit cannot double up. */
export function markSubmitted(entryId: string): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(SUBMITTED_KEY, entryId);
  } catch {
    /* nothing useful to do */
  }
}

export function submittedEntryId(): string | null {
  const store = storage();
  if (!store) return null;
  try {
    return store.getItem(SUBMITTED_KEY);
  } catch {
    return null;
  }
}

export function newEntryId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers: RFC 4122 v4 shape from getRandomValues.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
