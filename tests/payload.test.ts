/**
 * Row construction: what actually reaches the database.
 */

import { describe, expect, it } from 'vitest';
import { fullAnswers, fullState, VALID_CONSENTS } from './fixtures';
import { LEGAL_VERSIONS } from '@/lib/legal';
import { buildResponseRow, RESPONSE_COLUMNS } from '@/lib/survey/payload';
import { QUESTION_IDS } from '@/lib/survey/types';

const ENTRY_ID = '4b3a9b3e-9c1a-4b8e-8b6f-2f0a5d7c1e11';

describe('rule 7 — a hidden question is never submitted', () => {
  it('nulls every branched-away column even when the payload still carries it', () => {
    // Exactly the tampered-request case: answers for a branch the participant
    // never saw. `buildResponseRow` prunes before reading anything.
    const row = buildResponseRow(
      { answers: fullAnswers({ ai_use_cases: ['education'] }), consents: VALID_CONSENTS },
      ENTRY_ID,
    );

    expect(row.coding_problem).toBeNull();
    expect(row.coding_device).toBeNull();
    expect(row.mobile_coding_interest).toBeNull();
    expect(row.cross_device_interest).toBeNull();
    expect(row.cross_device_problem).toBeNull();
    expect(row.research_problem).toBeNull();
  });

  it('nulls the engineering and beta follow-ups when their controller is closed', () => {
    const row = buildResponseRow(
      fullState({ engineering_ai_interest: 'no', beta_interest: 'no' }),
      ENTRY_ID,
    );

    expect(row.engineering_areas).toBeNull();
    expect(row.beta_products).toBeNull();
  });

  it('keeps conditional answers when the branch really was shown', () => {
    const row = buildResponseRow(fullState(), ENTRY_ID);

    expect(row.coding_problem).not.toBeNull();
    expect(row.research_problem).not.toBeNull();
    expect(row.cross_device_problem).not.toBeNull();
    expect(row.engineering_areas).toEqual(['simulation', 'mechanical']);
  });
});

describe('schema', () => {
  it('builds exactly the documented column set', () => {
    const row = buildResponseRow(fullState(), ENTRY_ID);
    expect(Object.keys(row).sort()).toEqual([...RESPONSE_COLUMNS].sort());
  });

  it('has a column for every question id', () => {
    for (const id of QUESTION_IDS) {
      expect(RESPONSE_COLUMNS).toContain(id);
    }
  });
});

describe('derived and normalised values', () => {
  it('lower-cases the email', () => {
    expect(buildResponseRow(fullState(), ENTRY_ID).email).toBe('person@example.com');
  });

  it('normalises the optional link and keeps null when it is absent', () => {
    expect(buildResponseRow(fullState(), ENTRY_ID).website).toBe('https://github.com/example');

    const answers = fullAnswers();
    delete answers.website;
    expect(buildResponseRow({ answers, consents: VALID_CONSENTS }, ENTRY_ID).website).toBeNull();
  });

  it.each([
    ['yes', true],
    ['maybe', true],
    ['no', false],
  ] as const)('derives beta_contact_consent from Q15 = %s', (interest, expected) => {
    expect(buildResponseRow(fullState({ beta_interest: interest }), ENTRY_ID).beta_contact_consent).toBe(
      expected,
    );
  });

  it('records the consent choices as given', () => {
    const row = buildResponseRow(
      fullState({}, { research: true, marketing: true, reward: true }),
      ENTRY_ID,
    );
    expect(row.research_consent).toBe(true);
    expect(row.marketing_consent).toBe(true);
    expect(row.reward_acknowledgement).toBe(true);
  });

  it('stamps the legal versions server-side', () => {
    const row = buildResponseRow(fullState(), ENTRY_ID);
    expect(row.terms_version).toBe(LEGAL_VERSIONS.terms);
    expect(row.privacy_policy_version).toBe(LEGAL_VERSIONS.privacy);
    expect(row.reward_rules_version).toBe(LEGAL_VERSIONS.rewardRules);
  });
});

describe('failing closed', () => {
  it.each(['email', 'country', 'beta_interest', 'one_problem_to_solve', 'ai_tools'] as const)(
    'refuses to build a row without %s',
    (key) => {
      const answers = fullAnswers();
      delete answers[key];
      expect(() => buildResponseRow({ answers, consents: VALID_CONSENTS }, ENTRY_ID)).toThrow(key);
    },
  );
});
