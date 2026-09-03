/**
 * Branching rules.
 *
 * One test per rule from the survey design, named after it, so a failure says
 * which guarantee broke rather than which function changed.
 */

import { describe, expect, it } from 'vitest';
import { fullAnswers } from './fixtures';
import { SECTIONS } from '@/lib/survey/questions';
import type { Answers } from '@/lib/survey/types';
import {
  isQuestionVisible,
  isSectionEnabled,
  pruneAnswers,
  sectionProgress,
  visibleQuestions,
  visibleSections,
} from '@/lib/survey/visibility';

describe('rule 1 — Q1 controls the coding and research branches', () => {
  it('opens the coding section for coding', () => {
    const answers: Answers = { ai_use_cases: ['coding'] };
    expect(isSectionEnabled('coding', answers)).toBe(true);
    expect(isQuestionVisible('coding_problem', answers)).toBe(true);
    expect(isQuestionVisible('research_problem', answers)).toBe(false);
  });

  it('opens the coding section for app building', () => {
    expect(isSectionEnabled('coding', { ai_use_cases: ['app_building'] })).toBe(true);
  });

  it('opens the research question for research', () => {
    const answers: Answers = { ai_use_cases: ['research'] };
    expect(isQuestionVisible('research_problem', answers)).toBe(true);
    expect(isSectionEnabled('coding', answers)).toBe(false);
  });

  it('closes both for an unrelated use case', () => {
    const answers: Answers = { ai_use_cases: ['education'] };
    expect(isSectionEnabled('coding', answers)).toBe(false);
    expect(isQuestionVisible('research_problem', answers)).toBe(false);
  });

  it('closes both when Q1 is unanswered', () => {
    expect(isSectionEnabled('coding', {})).toBe(false);
    expect(isQuestionVisible('research_problem', {})).toBe(false);
  });
});

describe('rule 2 — Q7 controls the mobile and cross-device questions', () => {
  const base: Answers = { ai_use_cases: ['coding'] };

  it('shows both once a device is chosen', () => {
    const answers = { ...base, coding_device: 'pc' };
    expect(isQuestionVisible('mobile_coding_interest', answers)).toBe(true);
    expect(isQuestionVisible('cross_device_interest', answers)).toBe(true);
  });

  it('hides both for "I currently don\'t code"', () => {
    const answers = { ...base, coding_device: 'not_coding' };
    expect(isQuestionVisible('mobile_coding_interest', answers)).toBe(false);
    expect(isQuestionVisible('cross_device_interest', answers)).toBe(false);
  });

  it('hides both while Q7 is unanswered', () => {
    expect(isQuestionVisible('mobile_coding_interest', base)).toBe(false);
    expect(isQuestionVisible('cross_device_interest', base)).toBe(false);
  });
});

describe('rule 3 — Q9 controls the cross-device follow-up', () => {
  const base: Answers = { ai_use_cases: ['coding'], coding_device: 'multiple' };

  it.each(['yes', 'maybe'])('shows the follow-up for %s', (value) => {
    expect(isQuestionVisible('cross_device_problem', { ...base, cross_device_interest: value })).toBe(
      true,
    );
  });

  it('hides the follow-up for no', () => {
    expect(
      isQuestionVisible('cross_device_problem', { ...base, cross_device_interest: 'no' }),
    ).toBe(false);
  });
});

describe('rule 4 — Q11 controls engineering area selection', () => {
  it.each(['yes_definitely', 'yes_when_beta', 'maybe'])('shows areas for %s', (value) => {
    expect(isQuestionVisible('engineering_areas', { engineering_ai_interest: value })).toBe(true);
  });

  it('hides areas for no', () => {
    expect(isQuestionVisible('engineering_areas', { engineering_ai_interest: 'no' })).toBe(false);
  });

  it('hides areas while Q11 is unanswered', () => {
    expect(isQuestionVisible('engineering_areas', {})).toBe(false);
  });
});

describe('rule 5 — Q15 controls beta product selection', () => {
  it.each(['yes', 'maybe'])('shows products for %s', (value) => {
    expect(isQuestionVisible('beta_products', { beta_interest: value })).toBe(true);
  });

  it('hides products for no', () => {
    expect(isQuestionVisible('beta_products', { beta_interest: 'no' })).toBe(false);
  });
});

describe('rule 8 — changing an earlier answer clears dependent answers', () => {
  it('drops the whole coding and research subtree when Q1 changes', () => {
    const changed = pruneAnswers({ ...fullAnswers(), ai_use_cases: ['education'] });

    expect(changed.coding_problem).toBeUndefined();
    expect(changed.coding_device).toBeUndefined();
    expect(changed.mobile_coding_interest).toBeUndefined();
    expect(changed.cross_device_interest).toBeUndefined();
    expect(changed.cross_device_problem).toBeUndefined();
    expect(changed.research_problem).toBeUndefined();

    // Untouched branches survive.
    expect(changed.biggest_ai_problem).toBeDefined();
    expect(changed.engineering_areas).toBeDefined();
    expect(changed.beta_products).toBeDefined();
  });

  it('clears a grandchild in the same pass as its parent', () => {
    const changed = pruneAnswers({ ...fullAnswers(), coding_device: 'not_coding' });

    expect(changed.cross_device_interest).toBeUndefined();
    // The orphan case: without visibility-aware predicates this would survive.
    expect(changed.cross_device_problem).toBeUndefined();
    expect(changed.mobile_coding_interest).toBeUndefined();
    expect(changed.coding_problem).toBeDefined();
  });

  it('clears the engineering and beta follow-ups when their controller closes', () => {
    const engineering = pruneAnswers({ ...fullAnswers(), engineering_ai_interest: 'no' });
    expect(engineering.engineering_areas).toBeUndefined();

    const beta = pruneAnswers({ ...fullAnswers(), beta_interest: 'no' });
    expect(beta.beta_products).toBeUndefined();
  });
});

describe('rule 9 — valid answers survive navigation', () => {
  it('returns the identical object when nothing is invalid', () => {
    const answers = fullAnswers();
    expect(pruneAnswers(answers)).toBe(answers);
  });
});

describe('rule 10 — an empty section is never shown', () => {
  const cases: Answers[] = [
    {},
    { ai_use_cases: ['education'] },
    { ai_use_cases: ['coding'] },
    fullAnswers(),
    fullAnswers({ ai_use_cases: ['data_analysis'] }),
    fullAnswers({ engineering_ai_interest: 'no', beta_interest: 'no' }),
  ];

  it.each(cases.map((answers, i) => [i, answers] as const))(
    'every visible section has a question (case %i)',
    (_i, answers) => {
      for (const section of visibleSections(answers)) {
        expect(visibleQuestions(section.id, answers).length).toBeGreaterThan(0);
      }
    },
  );

  it('always has at least one section to show', () => {
    expect(visibleSections({}).length).toBeGreaterThan(0);
  });

  it('keeps section 04 available even when Q10 is branched away', () => {
    const answers: Answers = { ai_use_cases: ['education'] };
    expect(isQuestionVisible('research_problem', answers)).toBe(false);
    expect(visibleSections(answers).map((s) => s.id)).toContain('research_engineering');
  });
});

describe('progress', () => {
  it('counts only the sections this participant will see', () => {
    const skipped = sectionProgress('future', { ai_use_cases: ['education'] });
    expect(skipped.total).toBe(SECTIONS.length - 1);
    expect(skipped.label).toBe('04 / 05');

    const all = sectionProgress('future', { ai_use_cases: ['coding'] });
    expect(all.total).toBe(SECTIONS.length);
    expect(all.label).toBe('05 / 06');
  });

  it('pads both numbers to two digits', () => {
    expect(sectionProgress('usage', {}).label).toMatch(/^\d{2} \/ \d{2}$/);
  });
});
