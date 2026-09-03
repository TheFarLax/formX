/**
 * Validation, including the rule that a hidden question is never required.
 */

import { describe, expect, it } from 'vitest';
import { fullAnswers, fullState, nonCodingAnswers, VALID_CONSENTS } from './fixtures';
import {
  normalizeEmail,
  normalizeWebsite,
  validateAll,
  validateConsents,
  validateEmail,
  validateSection,
} from '@/lib/survey/validate';

describe('rule 6 — a hidden question is never required', () => {
  it('accepts a response with every branch closed', () => {
    expect(validateAll({ answers: nonCodingAnswers(), consents: VALID_CONSENTS })).toEqual({});
  });

  it('accepts a complete response with every branch open', () => {
    expect(validateAll(fullState())).toEqual({});
  });

  it('ignores stale answers left behind for a closed branch', () => {
    // Un-pruned on purpose: the coding answers are present but invisible.
    const answers = fullAnswers({ ai_use_cases: ['education'] });
    expect(validateAll({ answers, consents: VALID_CONSENTS })).toEqual({});
  });

  it('requires the follow-up only while its controller keeps it visible', () => {
    const open = validateSection('research_engineering', {
      answers: { engineering_ai_interest: 'maybe' },
      consents: VALID_CONSENTS,
    });
    expect(open.engineering_areas).toBeDefined();

    const closed = validateSection('research_engineering', {
      answers: { engineering_ai_interest: 'no' },
      consents: VALID_CONSENTS,
    });
    expect(closed.engineering_areas).toBeUndefined();
  });

  it('never requires the optional cross-device follow-up', () => {
    const errors = validateSection('coding', {
      answers: {
        ai_use_cases: ['coding'],
        coding_problem: 'Large codebases.',
        coding_device: 'pc',
        mobile_coding_interest: 'no',
        cross_device_interest: 'yes',
      },
      consents: VALID_CONSENTS,
    });
    expect(errors).toEqual({});
  });
});

describe('required answers', () => {
  it('reports each missing visible question', () => {
    const errors = validateSection('usage', { answers: {}, consents: VALID_CONSENTS });
    expect(errors.ai_use_cases).toBeDefined();
    expect(errors.ai_tools).toBeDefined();
  });

  it('rejects an option value that is not on the list', () => {
    const errors = validateSection('usage', {
      answers: { ai_use_cases: ['not_a_real_option'], ai_tools: ['claude'] },
      consents: VALID_CONSENTS,
    });
    expect(errors.ai_use_cases).toBeDefined();
  });

  it('rejects a duplicated selection', () => {
    const errors = validateSection('usage', {
      answers: { ai_use_cases: ['coding', 'coding'], ai_tools: ['claude'] },
      consents: VALID_CONSENTS,
    });
    expect(errors.ai_use_cases).toBeDefined();
  });

  it('rejects whitespace as a text answer', () => {
    const errors = validateSection('future', {
      answers: {
        one_problem_to_solve: '   ',
        desired_agent_task: 'Triage the issue tracker.',
        unsolved_ai_problem: 'Uncertainty.',
      },
      consents: VALID_CONSENTS,
    });
    expect(errors.one_problem_to_solve).toBeDefined();
  });

  it('rejects an unknown country', () => {
    const errors = validateAll(fullState({ country: 'Atlantis' }));
    expect(errors.country).toBeDefined();
  });
});

describe('email', () => {
  it.each([
    'person@example.com',
    'first.last@example.co.uk',
    'user+tag@sub.domain.example',
    "o'brien@example.org",
  ])('accepts %s', (value) => {
    expect(validateEmail(value)).toBeNull();
  });

  it.each([
    '',
    'person',
    'person@',
    '@example.com',
    'person@example',
    'person@@example.com',
    'person@.com',
    'person@example..com',
    'person@-example.com',
    'person@example.c',
    '.person@example.com',
    'person.@example.com',
    'per..son@example.com',
    'person @example.com',
    'person@exa mple.com',
    'person@example.123',
  ])('rejects %s', (value) => {
    expect(validateEmail(value)).not.toBeNull();
  });

  it('rejects an over-long address', () => {
    expect(validateEmail(`${'a'.repeat(250)}@example.com`)).not.toBeNull();
  });

  it('normalises for storage and duplicate detection', () => {
    expect(normalizeEmail('  Person@Example.COM ')).toBe('person@example.com');
  });
});

describe('website', () => {
  it('treats an empty value as absent rather than invalid', () => {
    expect(normalizeWebsite('   ')).toEqual({ value: null, error: null });
  });

  it('adds https to a bare host', () => {
    expect(normalizeWebsite('github.com/xasri').value).toBe('https://github.com/xasri');
  });

  it('keeps an explicit scheme', () => {
    expect(normalizeWebsite('http://example.com/x').value).toBe('http://example.com/x');
  });

  it.each(['javascript:alert(1)', 'mailto:person@example.com', 'ftp://example.com'])(
    'rejects %s',
    (value) => {
      expect(normalizeWebsite(value).error).not.toBeNull();
    },
  );

  it('rejects a host with no dot', () => {
    expect(normalizeWebsite('localhost').error).not.toBeNull();
  });
});

describe('consents', () => {
  it('requires the terms agreement and the reward acknowledgement separately', () => {
    const errors = validateConsents({ research: false, marketing: true, reward: false });
    expect(errors.research).toBeDefined();
    expect(errors.reward).toBeDefined();
  });

  it('never requires marketing consent', () => {
    const errors = validateConsents({ research: true, marketing: false, reward: true });
    expect(errors).toEqual({});
  });

  it('blocks submission when either required box is unchecked', () => {
    const withoutTerms = validateAll(fullState({}, { research: false, marketing: false, reward: true }));
    expect(withoutTerms.research).toBeDefined();

    const withoutReward = validateAll(fullState({}, { research: true, marketing: false, reward: false }));
    expect(withoutReward.reward).toBeDefined();
  });
});
