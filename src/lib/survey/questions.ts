/**
 * The single source of truth for the survey.
 *
 * Both the browser form and the `/api/survey` route handler read this file, so
 * there is exactly one definition of what a question is, when it is visible and
 * whether it is required. Client and server cannot disagree.
 */

import type { Answers, Question, Section, VisibilityContext } from './types';

// ── Stable option values ──────────────────────────────────────────────────────
// Branching rules reference these constants, never display labels, so copy can
// be reworded without changing behaviour or invalidating stored answers.

export const USE_CASE_CODING = 'coding';
export const USE_CASE_APP_BUILDING = 'app_building';
export const USE_CASE_RESEARCH = 'research';

/** Q7 answer that switches off every downstream device question. */
export const DEVICE_NOT_CODING = 'not_coding';

/** Q9 / Q15 answers that open their follow-up. */
export const YES_MAYBE = ['yes', 'maybe'] as const;

/** Q11 answer that closes the engineering-areas follow-up. */
export const ENGINEERING_NO = 'no';

// ── Predicate helpers ────────────────────────────────────────────────────────

function toArray(value: Answers[keyof Answers]): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value !== '') return [value];
  return [];
}

function includesAny(value: Answers[keyof Answers], wanted: readonly string[]): boolean {
  const selected = toArray(value);
  return wanted.some((w) => selected.includes(w));
}

function answeredWith(ctx: VisibilityContext, id: Parameters<VisibilityContext['isVisible']>[0]) {
  const value = ctx.answers[id];
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * True when the controlling question is itself visible and has been answered
 * with something other than the listed opt-out values. Depending on the parent's
 * *visibility* — not just its value — is what makes cascade clearing correct in
 * a single pass: if a grandparent branch closes, the parent goes invisible and
 * every descendant follows.
 */
function parentAnsweredExcept(
  ctx: VisibilityContext,
  parent: Parameters<VisibilityContext['isVisible']>[0],
  optOuts: readonly string[],
): boolean {
  if (!ctx.isVisible(parent)) return false;
  const value = answeredWith(ctx, parent);
  return value !== null && !optOuts.includes(value);
}

function parentAnsweredWithin(
  ctx: VisibilityContext,
  parent: Parameters<VisibilityContext['isVisible']>[0],
  allowed: readonly string[],
): boolean {
  if (!ctx.isVisible(parent)) return false;
  const value = answeredWith(ctx, parent);
  return value !== null && allowed.includes(value);
}

const TEXT_MAX = 4000;

// ── Sections ─────────────────────────────────────────────────────────────────

export const SECTIONS: readonly Section[] = [
  {
    id: 'usage',
    code: '01',
    title: 'AI Usage',
    summary: 'How AI fits into your work today.',
  },
  {
    id: 'problems',
    code: '02',
    title: 'AI Problems',
    summary: 'Where current AI tools fall short for you.',
  },
  {
    id: 'coding',
    code: '03',
    title: 'Coding & Devices',
    summary: 'Building software with AI, and where you build it.',
    // Rule 1: Q1 controls this branch.
    visibleWhen: (ctx) =>
      includesAny(ctx.answers.ai_use_cases, [USE_CASE_CODING, USE_CASE_APP_BUILDING]),
  },
  {
    id: 'research_engineering',
    code: '04',
    // Always enabled: Q11 is unconditional, so this section can never be empty
    // even when Q10 is branched away.
    title: 'Research & Engineering',
    summary: 'Research reliability, and interest in engineering AI.',
  },
  {
    id: 'future',
    code: '05',
    title: 'Future AI',
    summary: 'What AI should solve next.',
  },
  {
    id: 'beta',
    code: '06',
    title: 'XASRI Beta',
    summary: 'Early testing, and how to reach you.',
  },
];

// ── Questions ────────────────────────────────────────────────────────────────

export const QUESTIONS: readonly Question[] = [
  // 01 — AI Usage
  {
    id: 'ai_use_cases',
    section: 'usage',
    kind: 'multi',
    code: 'Q1',
    label: 'What do you use AI for?',
    helper: 'Select everything that applies.',
    required: true,
    options: [
      { value: USE_CASE_CODING, label: 'Coding / Software Development' },
      { value: USE_CASE_APP_BUILDING, label: 'App / Website Building' },
      { value: USE_CASE_RESEARCH, label: 'Research' },
      { value: 'engineering', label: 'Engineering' },
      { value: 'data_analysis', label: 'Data / Analysis' },
      { value: 'ai_agents', label: 'AI Agents / Automation' },
      { value: 'education', label: 'Education / Learning' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'ai_tools',
    section: 'usage',
    kind: 'multi',
    code: 'Q2',
    label: 'Which AI tools do you currently use?',
    helper: 'Select everything that applies.',
    required: true,
    options: [
      { value: 'chatgpt', label: 'ChatGPT' },
      { value: 'claude', label: 'Claude' },
      { value: 'gemini', label: 'Gemini' },
      { value: 'codex', label: 'Codex' },
      { value: 'lovable', label: 'Lovable' },
      { value: 'cursor', label: 'Cursor' },
      { value: 'github_copilot', label: 'GitHub Copilot' },
      { value: 'perplexity', label: 'Perplexity' },
      { value: 'other', label: 'Other' },
    ],
  },

  // 02 — AI Problems
  {
    id: 'biggest_ai_problem',
    section: 'problems',
    kind: 'textarea',
    code: 'Q3',
    label: 'What is the biggest problem you currently face when using AI?',
    placeholder: "Tell us about a real problem you've experienced.",
    required: true,
    maxLength: TEXT_MAX,
  },
  {
    id: 'ai_frustrations',
    section: 'problems',
    kind: 'multi',
    code: 'Q4',
    label: 'What frustrates you most about current AI tools?',
    helper: 'Select everything that applies.',
    required: true,
    options: [
      { value: 'wrong_answers', label: 'Wrong answers' },
      { value: 'hallucinations', label: 'Hallucinations' },
      { value: 'context_loss', label: 'Context loss' },
      { value: 'complex_tasks', label: 'Cannot handle complex tasks' },
      { value: 'inconsistent_results', label: 'Inconsistent results' },
      { value: 'weak_verification', label: 'Weak verification' },
      { value: 'manual_work', label: 'Too much manual work' },
      { value: 'slow', label: 'Slow' },
      { value: 'expensive', label: 'Expensive' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'desired_ai_capability',
    section: 'problems',
    kind: 'textarea',
    code: 'Q5',
    label:
      'What is something you wish AI could do for you today—but current AI tools cannot reliably do?',
    placeholder: 'Describe the capability you keep reaching for.',
    required: true,
    maxLength: TEXT_MAX,
  },

  // 03 — Coding & Devices (whole section gated on Q1)
  {
    id: 'coding_problem',
    section: 'coding',
    kind: 'textarea',
    code: 'Q6',
    label: 'What is your biggest problem when using AI for coding or app building?',
    helper:
      'Examples: understanding large codebases, debugging, testing, context loss, deployment, architecture, maintaining projects, or something else.',
    placeholder: 'Describe what breaks down in practice.',
    required: true,
    maxLength: TEXT_MAX,
  },
  {
    id: 'coding_device',
    section: 'coding',
    kind: 'single',
    code: 'Q7',
    label: 'Where do you normally code?',
    required: true,
    options: [
      { value: 'pc', label: 'PC / Laptop' },
      { value: 'mobile', label: 'Mobile' },
      { value: 'tablet', label: 'Tablet' },
      { value: 'multiple', label: 'Multiple devices' },
      { value: DEVICE_NOT_CODING, label: "I currently don't code" },
    ],
  },
  {
    id: 'mobile_coding_interest',
    section: 'coding',
    kind: 'single',
    code: 'Q8',
    label: 'Would you be interested in serious coding from your mobile?',
    required: true,
    // Rule 2: Q7 controls the mobile / cross-device questions.
    visibleWhen: (ctx) => parentAnsweredExcept(ctx, 'coding_device', [DEVICE_NOT_CODING]),
    options: [
      { value: 'yes_regularly', label: 'Yes, regularly' },
      { value: 'yes_if_close_to_pc', label: 'Yes, if the experience is close to PC' },
      { value: 'sometimes', label: 'Sometimes' },
      { value: 'no', label: 'No' },
    ],
  },

  {
    id: 'cross_device_interest',
    section: 'coding',
    kind: 'single',
    code: 'Q9',
    label: 'Would you want to continue the same project from PC, mobile, or any device?',
    required: true,
    visibleWhen: (ctx) => parentAnsweredExcept(ctx, 'coding_device', [DEVICE_NOT_CODING]),
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'maybe', label: 'Maybe' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'cross_device_problem',
    section: 'coding',
    kind: 'textarea',
    code: null,
    label:
      'What is the biggest problem you would want solved when continuing a project across devices?',
    helper: 'Optional.',
    placeholder: 'Optional — what would need to work for this to be usable?',
    required: false,
    // Rule 3: Q9 controls this follow-up.
    visibleWhen: (ctx) => parentAnsweredWithin(ctx, 'cross_device_interest', YES_MAYBE),
    maxLength: TEXT_MAX,
  },

  // 04 — Research & Engineering
  {
    id: 'research_problem',
    section: 'research_engineering',
    kind: 'textarea',
    code: 'Q10',
    label: 'What is your biggest problem when using AI for research?',
    helper:
      'Examples: reliable sources, citations, latest information, hallucinations, verification, research papers, deep research, or something else.',
    placeholder: 'Describe where research with AI becomes unreliable.',
    required: true,
    // Rule 1: Q1 controls the research branch.
    visibleWhen: (ctx) => includesAny(ctx.answers.ai_use_cases, [USE_CASE_RESEARCH]),
    maxLength: TEXT_MAX,
  },

  {
    id: 'engineering_ai_interest',
    section: 'research_engineering',
    kind: 'single',
    code: 'Q11',
    // Always shown, so engineering interest is measured independently of Q1.
    label: 'Would you be interested in testing XASRI Engineering AI?',
    required: true,
    options: [
      { value: 'yes_definitely', label: 'Yes, definitely' },
      { value: 'yes_when_beta', label: 'Yes, when beta is available' },
      { value: 'maybe', label: 'Maybe' },
      { value: ENGINEERING_NO, label: 'No' },
    ],
  },
  {
    id: 'engineering_areas',
    section: 'research_engineering',
    kind: 'multi',
    code: null,
    label: 'Which engineering areas interest you?',
    helper: 'Select everything that applies.',
    required: true,
    // Rule 4: Q11 controls this follow-up.
    visibleWhen: (ctx) => parentAnsweredExcept(ctx, 'engineering_ai_interest', [ENGINEERING_NO]),
    options: [
      { value: 'calculations', label: 'Engineering calculations' },
      { value: 'design_cad_3d', label: 'Design / CAD / 3D' },
      { value: 'simulation', label: 'Simulation' },
      { value: 'mechanical', label: 'Mechanical' },
      { value: 'civil', label: 'Civil' },
      { value: 'electrical_electronics', label: 'Electrical / Electronics' },
      { value: 'manufacturing', label: 'Manufacturing' },
      { value: 'engineering_research', label: 'Engineering Research' },
      { value: 'other', label: 'Other' },
    ],
  },

  // 05 — Future AI
  {
    id: 'one_problem_to_solve',
    section: 'future',
    kind: 'textarea',
    code: 'Q12',
    label: 'If AI could solve ONE problem for you, what should it solve?',
    helper: 'Take your time with this one — it is the answer we care about most.',
    placeholder: 'The single problem you would hand over tomorrow.',
    required: true,
    prominent: true,
    maxLength: TEXT_MAX,
  },

  {
    id: 'desired_agent_task',
    section: 'future',
    kind: 'textarea',
    code: 'Q13',
    label: 'What task would you want an AI agent to perform independently?',
    placeholder: 'Something you would genuinely be willing to stop doing yourself.',
    required: true,
    maxLength: TEXT_MAX,
  },
  {
    id: 'unsolved_ai_problem',
    section: 'future',
    kind: 'textarea',
    code: 'Q14',
    label: 'What is one problem you believe AI companies are still not solving properly?',
    placeholder: 'Be direct. Critical answers are the useful ones.',
    required: true,
    maxLength: TEXT_MAX,
  },

  // 06 — XASRI Beta
  {
    id: 'beta_interest',
    section: 'beta',
    kind: 'single',
    code: 'Q15',
    label: 'Would you like to become an early tester of XASRI AI?',
    required: true,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'maybe', label: 'Maybe' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'beta_products',
    section: 'beta',
    kind: 'multi',
    code: null,
    label: 'Which XASRI AI products would you like to test?',
    helper: 'Select everything that applies.',
    required: true,
    // Rule 5: Q15 controls this follow-up.
    visibleWhen: (ctx) => parentAnsweredWithin(ctx, 'beta_interest', YES_MAYBE),
    options: [
      { value: 'ai_coding', label: 'AI Coding' },
      { value: 'ai_app_builder', label: 'AI App Builder' },
      { value: 'ai_research', label: 'AI Research' },
      { value: 'engineering_ai', label: 'Engineering AI' },
      { value: 'ai_agents', label: 'AI Agents' },
      { value: 'cross_device_coding', label: 'Cross-device Coding' },
      { value: 'other', label: 'Other' },
    ],
  },

  // Contact details. No name is collected.
  {
    id: 'email',
    section: 'beta',
    kind: 'email',
    code: null,
    label: 'Email Address',
    helper:
      'Your email is required to contact selected participants about the XASRI AI Pro thank-you reward.',
    placeholder: 'you@example.com',
    required: true,
    maxLength: 254,
  },
  {
    id: 'country',
    section: 'beta',
    kind: 'country',
    code: null,
    label: 'Country',
    required: true,
    maxLength: 100,
  },
  {
    id: 'website',
    section: 'beta',
    kind: 'text',
    code: null,
    label: 'Website / GitHub / Portfolio',
    helper: 'Optional.',
    placeholder: 'https://',
    required: false,
    maxLength: 500,
  },
];

// ── Lookups ──────────────────────────────────────────────────────────────────

export const QUESTIONS_BY_ID: Readonly<Record<string, Question>> = Object.freeze(
  Object.fromEntries(QUESTIONS.map((q) => [q.id, q])),
);

export const SECTIONS_BY_ID: Readonly<Record<string, Section>> = Object.freeze(
  Object.fromEntries(SECTIONS.map((s) => [s.id, s])),
);

/** Questions belonging to a section, in display order. */
export function sectionQuestions(sectionId: Section['id']): readonly Question[] {
  return QUESTIONS.filter((q) => q.section === sectionId);
}

/**
 * Numbered questions only — follow-ups and contact fields excluded. Drives the
 * "15 questions" figure on the landing page so the copy cannot drift from the
 * actual survey.
 */
export const NUMBERED_QUESTION_COUNT = QUESTIONS.filter((q) => q.code !== null).length;
