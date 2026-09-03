/**
 * Survey domain types.
 *
 * Every question id is deliberately identical to its `survey_responses` column
 * name. That 1:1 mapping is what lets `payload.ts` build a database row from
 * pruned answers without a hand-maintained translation table — a column can't
 * silently drift away from the question that fills it.
 */

export const QUESTION_IDS = [
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
  'email',
  'country',
  'website',
] as const;

export type QuestionId = (typeof QUESTION_IDS)[number];

export const SECTION_IDS = [
  'usage',
  'problems',
  'coding',
  'research_engineering',
  'future',
  'beta',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

/** How a question is rendered and how its answer is shaped. */
export type QuestionKind =
  | 'multi' // string[]
  | 'single' // string
  | 'textarea' // string
  | 'email' // string
  | 'text' // string
  | 'country'; // string

export interface QuestionOption {
  /** Stable machine value. Persisted, and referenced by branching rules. */
  readonly value: string;
  /** Display label. Safe to reword without invalidating stored data. */
  readonly label: string;
}

/**
 * Answers are keyed by question id. Multi-select answers are `string[]`,
 * everything else is `string`. Absent key === unanswered.
 */
export type Answers = {
  [K in QuestionId]?: string | string[];
};

/** Consent state, kept separate from answers because it never branches. */
export interface Consents {
  /** Required. Terms & Conditions + Privacy Policy acknowledgement. */
  research: boolean;
  /** Optional. Beta-testing and product updates. */
  marketing: boolean;
  /** Required. Participant reward information acknowledgement. */
  reward: boolean;
}

export interface SurveyState {
  answers: Answers;
  consents: Consents;
}

/**
 * Passed to visibility predicates. `isVisible` resolves a *controlling*
 * question's visibility, so a predicate can depend on whether its parent is
 * showing rather than only on the parent's raw value. Without that, clearing a
 * grandparent answer would leave an orphaned grandchild behind.
 */
export interface VisibilityContext {
  readonly answers: Answers;
  readonly isVisible: (id: QuestionId) => boolean;
}

export type VisibilityPredicate = (ctx: VisibilityContext) => boolean;

export interface Question {
  readonly id: QuestionId;
  readonly section: SectionId;
  readonly kind: QuestionKind;
  /** Display code shown beside the question, e.g. "Q1". Follow-ups have none. */
  readonly code: string | null;
  readonly label: string;
  readonly helper?: string;
  readonly placeholder?: string;
  /** Required *when visible*. A hidden question is never required. */
  readonly required: boolean;
  readonly options?: readonly QuestionOption[];
  /** Absent means unconditionally visible within its section. */
  readonly visibleWhen?: VisibilityPredicate;
  /** Renders with extra visual weight (Q12). */
  readonly prominent?: boolean;
  /** Character cap for free-text answers. */
  readonly maxLength?: number;
}

export interface Section {
  readonly id: SectionId;
  /** Canonical label number from the survey design, e.g. "03". Fixed. */
  readonly code: string;
  readonly title: string;
  readonly summary: string;
  /** Section-level branch gate. Absent means always enabled. */
  readonly visibleWhen?: VisibilityPredicate;
}

export type FieldErrors = Partial<Record<QuestionId | keyof Consents, string>>;
