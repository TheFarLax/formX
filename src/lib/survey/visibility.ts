/**
 * Visibility and cascade-clearing rules.
 *
 * All five branch controllers (Q1, Q7, Q9, Q11, Q15) are resolved here from the
 * predicates declared in `questions.ts`. Nothing else in the app decides what is
 * visible, which is what makes the branching deterministic.
 */

import { QUESTIONS, QUESTIONS_BY_ID, SECTIONS, SECTIONS_BY_ID, sectionQuestions } from './questions';
import type {
  Answers,
  Question,
  QuestionId,
  Section,
  SectionId,
  VisibilityContext,
} from './types';

function context(answers: Answers, seen: ReadonlySet<QuestionId>): VisibilityContext {
  return {
    answers,
    isVisible: (id) => resolve(id, answers, seen),
  };
}

/**
 * `seen` guards against a predicate cycle introduced by a future edit. The
 * dependency graph is a DAG today; if it ever stops being one, a question
 * silently resolves to hidden instead of overflowing the stack.
 */
function resolve(id: QuestionId, answers: Answers, seen: ReadonlySet<QuestionId>): boolean {
  if (seen.has(id)) return false;

  const question = QUESTIONS_BY_ID[id];
  if (!question) return false;

  const section = SECTIONS_BY_ID[question.section];
  if (!section) return false;

  const next = new Set(seen).add(id);
  if (section.visibleWhen && !section.visibleWhen(context(answers, next))) return false;
  if (!question.visibleWhen) return true;

  return question.visibleWhen(context(answers, next));
}

/** Is this question currently shown, given these answers? */
export function isQuestionVisible(id: QuestionId, answers: Answers): boolean {
  return resolve(id, answers, new Set());
}

/** Does this section's own branch gate pass? Ignores whether it has content. */
export function isSectionEnabled(sectionId: SectionId, answers: Answers): boolean {
  const section = SECTIONS_BY_ID[sectionId];
  if (!section) return false;
  if (!section.visibleWhen) return true;
  return section.visibleWhen(context(answers, new Set()));
}

/** Visible questions within one section, in display order. */
export function visibleQuestions(sectionId: SectionId, answers: Answers): readonly Question[] {
  if (!isSectionEnabled(sectionId, answers)) return [];
  return sectionQuestions(sectionId).filter((q) => isQuestionVisible(q.id, answers));
}

/**
 * Sections the participant will actually walk through. A section is included
 * only when its gate passes *and* it has at least one visible question, which is
 * what guarantees an empty section is never rendered.
 */
export function visibleSections(answers: Answers): readonly Section[] {
  return SECTIONS.filter(
    (s) => isSectionEnabled(s.id, answers) && visibleQuestions(s.id, answers).length > 0,
  );
}

/** Every visible question across the whole survey, in display order. */
export function allVisibleQuestions(answers: Answers): readonly Question[] {
  return QUESTIONS.filter((q) => isQuestionVisible(q.id, answers));
}

/**
 * Drops any answer whose question is no longer visible.
 *
 * Because predicates depend on the *visibility* of their controlling question
 * rather than only on its raw value, a single pass is sufficient: closing a
 * branch high up invalidates the whole subtree at once. Returns the original
 * object when nothing changed, so React state updates stay cheap.
 */
export function pruneAnswers(answers: Answers): Answers {
  const pruned: Answers = {};
  let removed = false;

  for (const key of Object.keys(answers) as QuestionId[]) {
    if (isQuestionVisible(key, answers)) {
      pruned[key] = answers[key];
    } else {
      removed = true;
    }
  }

  return removed ? pruned : answers;
}

/**
 * Position within the visible sections.
 *
 * The denominator counts *visible* sections, not the fixed six. When a branch is
 * skipped, telling someone they are on step 5 of 6 and then submitting them
 * would be exactly the misleading progress the survey design rules out. The
 * section keeps its canonical label number (`03 — Coding & Devices`) separately.
 */
export function sectionProgress(
  sectionId: SectionId,
  answers: Answers,
): { position: number; total: number; label: string } {
  const visible = visibleSections(answers);
  const index = visible.findIndex((s) => s.id === sectionId);
  const position = index === -1 ? 0 : index + 1;
  const total = visible.length;
  const pad = (n: number) => String(n).padStart(2, '0');

  return { position, total, label: `${pad(position)} / ${pad(total)}` };
}
