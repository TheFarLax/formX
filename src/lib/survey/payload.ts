/**
 * Builds the `survey_responses` row from validated survey state.
 *
 * Every question id equals its column name, and the row is assembled from
 * *pruned* answers, so a branched-away question arrives here already absent and
 * lands in the database as `NULL` rather than as an invented value.
 */

import { LEGAL_VERSIONS } from '../legal';
import { YES_MAYBE } from './questions';
import type { Answers, SurveyState } from './types';
import { normalizeEmail, normalizeWebsite } from './validate';
import { pruneAnswers } from './visibility';

export interface SurveyResponseInsert {
  entry_id: string;
  email: string;
  country: string;
  website: string | null;
  ai_use_cases: string[];
  ai_tools: string[];
  biggest_ai_problem: string;
  ai_frustrations: string[];
  desired_ai_capability: string;
  coding_problem: string | null;
  coding_device: string | null;
  mobile_coding_interest: string | null;
  cross_device_interest: string | null;
  cross_device_problem: string | null;
  research_problem: string | null;
  engineering_ai_interest: string;
  engineering_areas: string[] | null;
  one_problem_to_solve: string;
  desired_agent_task: string;
  unsolved_ai_problem: string;
  beta_interest: string;
  beta_products: string[] | null;
  beta_contact_consent: boolean;
  research_consent: boolean;
  marketing_consent: boolean;
  reward_acknowledgement: boolean;
  terms_version: string;
  privacy_policy_version: string;
  reward_rules_version: string;
}

/** Trimmed string, or `null` when the question was branched away or left empty. */
function text(answers: Answers, key: keyof Answers): string | null {
  const value = answers[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** Selections, or `null` when the question was branched away. */
function list(answers: Answers, key: keyof Answers): string[] | null {
  const value = answers[key];
  if (!Array.isArray(value) || value.length === 0) return null;
  return [...value];
}

/**
 * Required columns are non-null by construction once `validateAll` has passed;
 * this keeps the types honest without scattering non-null assertions.
 */
function required(value: string | null, column: string): string {
  if (value === null) {
    throw new Error(`Refusing to build a response row: required column "${column}" is empty.`);
  }
  return value;
}

function requiredList(value: string[] | null, column: string): string[] {
  if (value === null) {
    throw new Error(`Refusing to build a response row: required column "${column}" is empty.`);
  }
  return value;
}

export function buildResponseRow(state: SurveyState, entryId: string): SurveyResponseInsert {
  const a = pruneAnswers(state.answers);
  const betaInterest = required(text(a, 'beta_interest'), 'beta_interest');

  return {
    entry_id: entryId,
    email: normalizeEmail(required(text(a, 'email'), 'email')),
    country: required(text(a, 'country'), 'country'),
    website: normalizeWebsite(text(a, 'website') ?? '').value,

    ai_use_cases: requiredList(list(a, 'ai_use_cases'), 'ai_use_cases'),
    ai_tools: requiredList(list(a, 'ai_tools'), 'ai_tools'),
    biggest_ai_problem: required(text(a, 'biggest_ai_problem'), 'biggest_ai_problem'),
    ai_frustrations: requiredList(list(a, 'ai_frustrations'), 'ai_frustrations'),
    desired_ai_capability: required(text(a, 'desired_ai_capability'), 'desired_ai_capability'),

    // Conditional — null whenever the coding branch did not apply.
    coding_problem: text(a, 'coding_problem'),
    coding_device: text(a, 'coding_device'),
    mobile_coding_interest: text(a, 'mobile_coding_interest'),
    cross_device_interest: text(a, 'cross_device_interest'),
    cross_device_problem: text(a, 'cross_device_problem'),
    research_problem: text(a, 'research_problem'),

    engineering_ai_interest: required(
      text(a, 'engineering_ai_interest'),
      'engineering_ai_interest',
    ),
    engineering_areas: list(a, 'engineering_areas'),

    one_problem_to_solve: required(text(a, 'one_problem_to_solve'), 'one_problem_to_solve'),
    desired_agent_task: required(text(a, 'desired_agent_task'), 'desired_agent_task'),
    unsolved_ai_problem: required(text(a, 'unsolved_ai_problem'), 'unsolved_ai_problem'),

    beta_interest: betaInterest,
    beta_products: list(a, 'beta_products'),

    // Derived, not asked twice: opting into beta testing *is* the contact consent.
    beta_contact_consent: (YES_MAYBE as readonly string[]).includes(betaInterest),

    research_consent: state.consents.research,
    marketing_consent: state.consents.marketing,
    reward_acknowledgement: state.consents.reward,

    // Server-side constants. Never taken from the request body.
    terms_version: LEGAL_VERSIONS.terms,
    privacy_policy_version: LEGAL_VERSIONS.privacy,
    reward_rules_version: LEGAL_VERSIONS.rewardRules,
  };
}

/** Column list, used by the schema-drift test. */
export const RESPONSE_COLUMNS: readonly string[] = [
  'entry_id',
  'email',
  'country',
  'website',
  'ai_use_cases',
  'ai_tools',
  'biggest_ai_problem',
  'ai_frustrations',
  'desired_ai_capability',
  'coding_problem',
  'coding_device',
  'mobile_coding_interest',
  'cross_device_interest',
  'cross_device_problem',
  'research_problem',
  'engineering_ai_interest',
  'engineering_areas',
  'one_problem_to_solve',
  'desired_agent_task',
  'unsolved_ai_problem',
  'beta_interest',
  'beta_products',
  'beta_contact_consent',
  'research_consent',
  'marketing_consent',
  'reward_acknowledgement',
  'terms_version',
  'privacy_policy_version',
  'reward_rules_version',
];
