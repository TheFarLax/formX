/**
 * Shared test data.
 *
 * `fullAnswers` opens every branch, so a test can close exactly one and assert on
 * the consequences instead of building a fresh survey each time.
 */

import type { Answers, Consents, SurveyState } from '@/lib/survey/types';

export function fullAnswers(overrides: Answers = {}): Answers {
  return {
    ai_use_cases: ['coding', 'research'],
    ai_tools: ['claude', 'cursor'],
    biggest_ai_problem: 'Context is lost between sessions and I re-explain the project.',
    ai_frustrations: ['context_loss', 'weak_verification'],
    desired_ai_capability: 'Finish a multi-file refactor without supervision.',

    coding_problem: 'It cannot hold a large codebase in mind long enough to be trusted.',
    coding_device: 'pc',
    mobile_coding_interest: 'sometimes',
    cross_device_interest: 'yes',
    cross_device_problem: 'Keeping the environment identical on both machines.',

    research_problem: 'Citations that look plausible and do not exist.',
    engineering_ai_interest: 'maybe',
    engineering_areas: ['simulation', 'mechanical'],

    one_problem_to_solve: 'Verifying its own output before handing it to me.',
    desired_agent_task: 'Triage the issue tracker every morning.',
    unsolved_ai_problem: 'Admitting uncertainty instead of guessing confidently.',

    beta_interest: 'yes',
    beta_products: ['ai_coding'],

    email: 'Person@Example.com',
    country: 'Germany',
    website: 'github.com/example',
    ...overrides,
  };
}

export const VALID_CONSENTS: Consents = { research: true, marketing: false, reward: true };

export function fullState(overrides: Answers = {}, consents: Consents = VALID_CONSENTS): SurveyState {
  return { answers: fullAnswers(overrides), consents };
}

/** Answers for someone who uses AI for neither coding nor research. */
export function nonCodingAnswers(overrides: Answers = {}): Answers {
  const answers = fullAnswers({ ai_use_cases: ['education'] });

  for (const key of [
    'coding_problem',
    'coding_device',
    'mobile_coding_interest',
    'cross_device_interest',
    'cross_device_problem',
    'research_problem',
  ] as const) {
    delete answers[key];
  }

  return { ...answers, ...overrides };
}
