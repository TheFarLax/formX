/**
 * Validation shared by the browser form and the API route.
 *
 * Only *visible* questions are ever inspected, so a hidden question can never be
 * required — that rule is a property of this file rather than something callers
 * have to remember.
 */

import { isValidCountry } from '../countries';
import { QUESTIONS_BY_ID } from './questions';
import { allVisibleQuestions, visibleQuestions } from './visibility';
import type { Answers, Consents, FieldErrors, Question, SectionId, SurveyState } from './types';

export const MIN_ANSWER_LENGTH = 2;

// ── Email ────────────────────────────────────────────────────────────────────

/**
 * Structural email validation: local part, domain labels and TLD are each
 * checked. Deliberately not a single regex — the failure messages need to be
 * specific, and a one-liner that accepts every valid address is unreadable.
 * Deliverability is not checked here; that is what the notification step is for.
 */
export function validateEmail(raw: string): string | null {
  const value = raw.trim();
  if (value === '') return 'Enter your email address.';
  if (value.length > 254) return 'This email address is too long.';

  const at = value.lastIndexOf('@');
  if (at <= 0 || at === value.length - 1) return 'Enter a valid email address.';

  const local = value.slice(0, at);
  const domain = value.slice(at + 1);

  if (local.length > 64) return 'Enter a valid email address.';
  if (!/^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/.test(local)) return 'Enter a valid email address.';
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return 'Enter a valid email address.';
  }

  if (!/^[A-Za-z0-9.-]+$/.test(domain)) return 'Enter a valid email address.';
  if (!domain.includes('.')) return 'Include the full domain, for example you@example.com.';

  const labels = domain.split('.');
  const badLabel = labels.some(
    (l) => l === '' || l.length > 63 || l.startsWith('-') || l.endsWith('-'),
  );
  if (badLabel) return 'Enter a valid email address.';

  const tld = labels[labels.length - 1] ?? '';
  if (!/^[A-Za-z]{2,}$/.test(tld)) return 'Enter a valid email address.';

  return null;
}

/** Lower-cased and trimmed. Used for storage and for duplicate detection. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

// ── Website ──────────────────────────────────────────────────────────────────

/**
 * Optional field, so an empty value is valid and stores as `null`. A bare host
 * like `github.com/xasri` is accepted and normalised to https rather than
 * rejected on a technicality.
 */
export function normalizeWebsite(raw: string): { value: string | null; error: string | null } {
  const trimmed = raw.trim();
  if (trimmed === '') return { value: null, error: null };
  if (trimmed.length > 500) return { value: null, error: 'This link is too long.' };

  // A scheme is recognised with or without `//`, so `mailto:` and `javascript:`
  // are rejected outright instead of being prefixed into a plausible-looking
  // https URL. Dots are excluded from the scheme so `example.com:8080/x` is still
  // read as a bare host with a port.
  const scheme = /^([a-zA-Z][a-zA-Z0-9+-]*):/.exec(trimmed)?.[1]?.toLowerCase();
  if (scheme !== undefined && scheme !== 'http' && scheme !== 'https') {
    return { value: null, error: 'Links must start with http:// or https://.' };
  }

  const withScheme = scheme === undefined ? `https://${trimmed}` : trimmed;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { value: null, error: 'Enter a valid link, or leave this empty.' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { value: null, error: 'Links must start with http:// or https://.' };
  }
  if (!url.hostname.includes('.') || url.hostname.endsWith('.')) {
    return { value: null, error: 'Enter a valid link, or leave this empty.' };
  }

  return { value: url.toString(), error: null };
}

// ── Per-question ─────────────────────────────────────────────────────────────

function optionValues(question: Question): ReadonlySet<string> {
  return new Set((question.options ?? []).map((o) => o.value));
}

/** Returns an error message, or `null` when the answer is acceptable. */
export function validateQuestion(question: Question, answers: Answers): string | null {
  const raw = answers[question.id];

  if (question.kind === 'multi') {
    const selected = Array.isArray(raw) ? raw : [];
    if (selected.length === 0) {
      return question.required ? 'Select at least one option.' : null;
    }
    const allowed = optionValues(question);
    if (selected.some((v) => !allowed.has(v))) return 'That selection is not valid.';
    if (new Set(selected).size !== selected.length) return 'That selection is not valid.';
    return null;
  }

  const value = typeof raw === 'string' ? raw.trim() : '';

  if (value === '') return question.required ? 'This answer is required.' : null;

  if (question.maxLength && value.length > question.maxLength) {
    return `Please keep this under ${question.maxLength.toLocaleString('en-US')} characters.`;
  }

  switch (question.kind) {
    case 'single':
      return optionValues(question).has(value) ? null : 'That selection is not valid.';
    case 'email':
      return validateEmail(value);
    case 'country':
      return isValidCountry(value) ? null : 'Select your country from the list.';
    case 'text':
      return question.id === 'website' ? normalizeWebsite(value).error : null;
    case 'textarea':
      return value.length < MIN_ANSWER_LENGTH ? 'Please add a little more detail.' : null;
    default:
      return null;
  }
}

// ── Consents ─────────────────────────────────────────────────────────────────

/**
 * The two required acknowledgements are checked independently and reported
 * separately, because they are separate agreements: one is the Terms and Privacy
 * Policy, the other is the reward conditions. Marketing consent is never
 * required.
 */
export function validateConsents(consents: Consents): FieldErrors {
  const errors: FieldErrors = {};
  if (!consents.research) {
    errors.research = 'You need to agree to the Terms & Conditions to submit.';
  }
  if (!consents.reward) {
    errors.reward = 'Please confirm you have read the participant reward information.';
  }
  return errors;
}

// ── Whole-form and per-step ──────────────────────────────────────────────────

/** Errors for the visible questions of one section. Consents are not included. */
export function validateSection(sectionId: SectionId, state: SurveyState): FieldErrors {
  const errors: FieldErrors = {};
  for (const question of visibleQuestions(sectionId, state.answers)) {
    const error = validateQuestion(question, state.answers);
    if (error) errors[question.id] = error;
  }
  return errors;
}

/**
 * Everything currently visible, plus consents. This is what the API route runs
 * after pruning, so the server's notion of "complete" is identical to the
 * client's.
 */
export function validateAll(state: SurveyState): FieldErrors {
  const errors: FieldErrors = {};
  for (const question of allVisibleQuestions(state.answers)) {
    const error = validateQuestion(question, state.answers);
    if (error) errors[question.id] = error;
  }
  return { ...errors, ...validateConsents(state.consents) };
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** First error in display order, for scroll-to-error and the error summary. */
export function firstErrorId(errors: FieldErrors, answers: Answers): string | null {
  for (const question of allVisibleQuestions(answers)) {
    if (errors[question.id]) return question.id;
  }
  for (const key of ['research', 'reward'] as const) {
    if (errors[key]) return key;
  }
  return null;
}

/** Human-readable question label, for the error summary. */
export function labelFor(id: string): string {
  if (id === 'research') return 'Terms & Conditions agreement';
  if (id === 'reward') return 'Participant reward acknowledgement';
  return QUESTIONS_BY_ID[id]?.label ?? id;
}
