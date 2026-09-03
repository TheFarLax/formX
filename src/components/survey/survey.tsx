'use client';

/**
 * The survey.
 *
 * One section at a time, with visibility, requiredness and pruning delegated
 * entirely to `@/lib/survey`. This component owns navigation, focus, drafts and
 * the single POST — it makes no decisions about what a valid response is, which is
 * why the browser and the route handler cannot drift apart.
 */

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ConsentBlock } from './consent-block';
import { SurveyProgress } from './progress';
import { QuestionField } from './question-field';
import { ResumePrompt } from './resume-prompt';
import { ThankYou } from './thank-you';
import { buttonClass } from '@/components/ui/button';
import {
  clearDraft,
  isResumable,
  loadDraft,
  markSubmitted,
  newEntryId,
  saveDraft,
  submittedEntryId,
} from '@/lib/draft';
import type { Draft } from '@/lib/draft';
import { QUESTIONS_BY_ID } from '@/lib/survey/questions';
import type {
  Answers,
  Consents,
  FieldErrors,
  QuestionId,
  SectionId,
  SurveyState,
} from '@/lib/survey/types';
import { firstErrorId, hasErrors, labelFor, validateAll, validateSection } from '@/lib/survey/validate';
import {
  pruneAnswers,
  sectionProgress,
  visibleQuestions,
  visibleSections,
} from '@/lib/survey/visibility';

type Phase = 'boot' | 'resume' | 'form' | 'done';
type Failure = 'generic' | 'duplicate_email' | 'rate_limited';

const EMPTY_CONSENTS: Consents = { research: false, marketing: false, reward: false };

const FAILURE_COPY: Record<Failure, string> = {
  // Exact wording required by the survey design. Never surfaces a server error.
  generic:
    'Something went wrong while submitting your response. Your answers are still saved on this device. Please try again.',
  duplicate_email:
    'This email address has already been used for a response. Only one entry per person is possible.',
  rate_limited:
    'Too many attempts from this connection. Please wait a few minutes and try again.',
};

function answeredCount(answers: Answers): number {
  return Object.values(answers).filter((value) =>
    Array.isArray(value) ? value.length > 0 : typeof value === 'string' && value.trim() !== '',
  ).length;
}

interface ApiResult {
  ok?: boolean;
  error?: string;
  fields?: FieldErrors;
}

// ── Boot ─────────────────────────────────────────────────────────────────────

/**
 * What this device already knows before the participant does anything.
 *
 * `localStorage` does not exist while the page is rendered on the server, so this is
 * read through `useSyncExternalStore`: the server snapshot renders the placeholder,
 * the client snapshot replaces it once hydration is finished, and no state has to be
 * written from an effect to get there. The client read is memoised because React
 * requires a stable snapshot.
 */
interface Boot {
  phase: Phase;
  /** The draft worth offering to resume, when there is one. */
  draft: Draft | null;
  /** A draft left behind by a visit that answered nothing. Cleared on mount. */
  stale: boolean;
  entryId: string;
  startedAt: number;
}

const SERVER_BOOT: Boot = { phase: 'boot', draft: null, stale: false, entryId: '', startedAt: 0 };

let clientBoot: Boot | null = null;

function readBoot(): Boot {
  if (clientBoot) return clientBoot;

  if (submittedEntryId() !== null) {
    clientBoot = { ...SERVER_BOOT, phase: 'done' };
    return clientBoot;
  }

  const draft = loadDraft();
  clientBoot = isResumable(draft)
    ? { phase: 'resume', draft, stale: false, entryId: draft.entryId, startedAt: draft.startedAt }
    : {
        phase: 'form',
        draft: null,
        stale: draft !== null,
        entryId: newEntryId(),
        startedAt: Date.now(),
      };
  return clientBoot;
}

function readServerBoot(): Boot {
  return SERVER_BOOT;
}

/** Only this component writes the draft, so there is no external change to hear about. */
function subscribeBoot(): () => void {
  return () => {
    /* nothing to unsubscribe */
  };
}

export function Survey() {
  const boot = useSyncExternalStore(subscribeBoot, readBoot, readServerBoot);

  /** Overrides the booted phase. `null` means "whatever this device already had". */
  const [chosenPhase, setChosenPhase] = useState<Phase | null>(null);
  /** Overrides the booted entry. Replaced only by starting over. */
  const [entryOverride, setEntryOverride] = useState<{ entryId: string; startedAt: number } | null>(
    null,
  );
  const [answers, setAnswers] = useState<Answers>({});
  const [consents, setConsents] = useState<Consents>(EMPTY_CONSENTS);
  const [sectionId, setSectionId] = useState<SectionId>('usage');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [betaOptIn, setBetaOptIn] = useState(false);
  /** A new object each request, so the focus effect re-runs even for the same id. */
  const [focusRequest, setFocusRequest] = useState<{ id: string } | null>(null);

  const honeypot = useRef<HTMLInputElement | null>(null);
  const heading = useRef<HTMLHeadingElement | null>(null);
  const root = useRef<HTMLDivElement | null>(null);
  const focusHeading = useRef(false);

  const phase = chosenPhase ?? boot.phase;
  /** `done` straight out of boot means the response was submitted on an earlier visit. */
  const returning = chosenPhase === null && boot.phase === 'done';
  const entry = useMemo(
    () => entryOverride ?? { entryId: boot.entryId, startedAt: boot.startedAt },
    [entryOverride, boot],
  );

  // An abandoned visit with nothing in it leaves an empty record behind. Drop it
  // rather than letting it sit in the browser until the next submission.
  useEffect(() => {
    if (boot.stale) clearDraft();
  }, [boot.stale]);

  // ── Derived navigation ─────────────────────────────────────────────────────

  const sections = useMemo(() => visibleSections(answers), [answers]);
  // A section can only stop being visible because of an answer in an earlier one, so
  // the id should always be found. Resolving it through the list rather than trusting
  // it means a stale id can never render an empty step.
  const found = sections.findIndex((s) => s.id === sectionId);
  const index = found === -1 ? 0 : found;
  const current = sections[index];
  const isLast = index === sections.length - 1;

  const questions = useMemo(
    () => (current ? visibleQuestions(current.id, answers) : []),
    [current, answers],
  );

  // ── Draft persistence ──────────────────────────────────────────────────────

  const savedSectionId = current?.id ?? sectionId;

  useEffect(() => {
    if (phase !== 'form' || entry.entryId === '') return;
    // Nothing is written until there is something worth keeping, so simply
    // scrolling past the survey leaves no trace in the browser.
    if (answeredCount(answers) === 0) return;

    const timer = window.setTimeout(() => {
      saveDraft({
        version: 1,
        entryId: entry.entryId,
        startedAt: entry.startedAt,
        savedAt: Date.now(),
        sectionId: savedSectionId,
        answers,
        consents,
      });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [phase, entry, answers, consents, savedSectionId]);

  // ── Focus management ───────────────────────────────────────────────────────

  const focusField = useCallback((id: string) => {
    const control = document.getElementById(`field-${id}`);
    control?.focus({ preventScroll: true });
    const block = document.getElementById(`question-${id}`) ?? control;
    block?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  useEffect(() => {
    if (focusRequest) focusField(focusRequest.id);
  }, [focusRequest, focusField]);

  useEffect(() => {
    if (!focusHeading.current) return;
    focusHeading.current = false;
    heading.current?.focus({ preventScroll: true });
  }, [sectionId]);

  // ── Answer changes ─────────────────────────────────────────────────────────

  const setAnswer = useCallback((id: QuestionId, value: string | string[]) => {
    // Pruning on every change is what enforces cascade clearing: an answer whose
    // branch just closed is gone before it can be rendered, validated or sent.
    setAnswers((previous) => pruneAnswers({ ...previous, [id]: value }));
    setErrors((previous) => {
      if (!previous[id]) return previous;
      const next = { ...previous };
      delete next[id];
      return next;
    });
    setFailure(null);
  }, []);

  const setConsent = useCallback((key: keyof Consents, value: boolean) => {
    setConsents((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
    setFailure(null);
  }, []);

  // ── Resume decision ────────────────────────────────────────────────────────

  function continueDraft() {
    const draft = boot.draft;
    if (!draft) return;

    // Rules may have changed since the draft was written; prune before trusting it.
    const restored = pruneAnswers(draft.answers);
    const available = visibleSections(restored);
    const target = available.some((s) => s.id === draft.sectionId)
      ? (draft.sectionId as SectionId)
      : (available[0]?.id ?? 'usage');

    setEntryOverride({ entryId: draft.entryId, startedAt: draft.startedAt });
    setAnswers(restored);
    setConsents(draft.consents);
    setSectionId(target);
    setChosenPhase('form');
  }

  function startOver() {
    clearDraft();
    setEntryOverride({ entryId: newEntryId(), startedAt: Date.now() });
    setAnswers({});
    setConsents(EMPTY_CONSENTS);
    setSectionId('usage');
    setErrors({});
    setFailure(null);
    setChosenPhase('form');
  }

  // ── Step navigation ────────────────────────────────────────────────────────

  function goToSection(id: SectionId) {
    focusHeading.current = true;
    setSectionId(id);
    root.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Moves to the section that owns `id` when it is not the one on screen. */
  function revealError(fieldErrors: FieldErrors) {
    const first = firstErrorId(fieldErrors, answers);
    if (!first) return;
    const owner = QUESTIONS_BY_ID[first]?.section;
    if (owner && owner !== current?.id) goToSection(owner);
    setFocusRequest({ id: first });
  }

  function goBack() {
    const previous = sections[index - 1];
    if (!previous) return;
    setErrors({});
    setFailure(null);
    goToSection(previous.id);
  }

  function goNext() {
    if (!current) return;
    const sectionErrors = validateSection(current.id, { answers, consents });
    if (hasErrors(sectionErrors)) {
      setErrors(sectionErrors);
      revealError(sectionErrors);
      return;
    }

    setErrors({});
    const next = sections[index + 1];
    if (next) goToSection(next.id);
  }

  // ── Submission ─────────────────────────────────────────────────────────────

  async function submit() {
    if (submitting) return;

    const state: SurveyState = { answers, consents };
    const found = validateAll(state);
    if (hasErrors(found)) {
      setErrors(found);
      revealError(found);
      return;
    }

    setErrors({});
    setFailure(null);
    setSubmitting(true);

    let result: ApiResult | null = null;
    let ok = false;

    try {
      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_id: entry.entryId,
          answers: pruneAnswers(answers),
          consents,
          started_at: entry.startedAt,
          x_ref: honeypot.current?.value ?? '',
        }),
      });

      const parsed: unknown = await response.json().catch(() => null);
      result = typeof parsed === 'object' && parsed !== null ? (parsed as ApiResult) : null;
      ok = response.ok && result?.ok === true;
    } catch {
      // Offline or aborted. Indistinguishable from a server fault to the
      // participant, and treated the same way: the draft stays put.
      result = null;
    }

    if (ok) {
      markSubmitted(entry.entryId);
      clearDraft();
      setBetaOptIn(consents.marketing);
      setSubmitting(false);
      setChosenPhase('done');
      root.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setSubmitting(false);

    if (result?.error === 'validation' && result.fields) {
      setErrors(result.fields);
      revealError(result.fields);
      return;
    }

    if (result?.error === 'duplicate_email') {
      setErrors({ email: 'This email address has already been used for a response.' });
      setFailure('duplicate_email');
      setFocusRequest({ id: 'email' });
      return;
    }

    setFailure(result?.error === 'rate_limited' ? 'rate_limited' : 'generic');
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (phase === 'boot') {
    return (
      <div ref={root} className="min-h-[20rem] scroll-mt-24">
        <noscript>
          <p className="rounded-card bg-surface p-5 text-body text-ink-2 shadow-inset-line">
            The survey needs JavaScript to run. Please enable it and reload this page.
          </p>
        </noscript>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div ref={root} className="scroll-mt-24">
        <ThankYou betaOptIn={betaOptIn} returning={returning} />
      </div>
    );
  }

  if (phase === 'resume' && boot.draft) {
    return (
      <div ref={root} className="scroll-mt-24">
        <ResumePrompt
          savedAt={boot.draft.savedAt}
          answered={answeredCount(boot.draft.answers)}
          onContinue={continueDraft}
          onRestart={startOver}
        />
      </div>
    );
  }

  if (!current) return null;

  const progress = sectionProgress(current.id, answers);
  const listed = [
    ...questions.map((q) => q.id),
    ...(isLast ? (['research', 'reward'] as const) : []),
  ].filter((id) => errors[id]);
  const saved = answeredCount(answers) > 0;

  return (
    <div ref={root} className="scroll-mt-24">
      <SurveyProgress
        label={progress.label}
        position={progress.position}
        total={progress.total}
        title={current.title}
        summary={current.summary}
        headingRef={heading}
      />

      <form
        noValidate
        aria-busy={submitting || undefined}
        onSubmit={(event) => {
          event.preventDefault();
          if (isLast) void submit();
          else goNext();
        }}
        className="mt-8"
      >
        {/* Honeypot. Off-screen and out of the tab order; only a bot fills it. */}
        <div className="u-offscreen" aria-hidden="true">
          <label htmlFor="x_ref">Referral code</label>
          <input
            ref={honeypot}
            id="x_ref"
            name="x_ref"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>

        {listed.length > 0 ? (
          <div
            role="alert"
            className="mb-5 rounded-card bg-danger-surface p-4 shadow-inset-danger sm:p-5"
          >
            <p className="text-note font-medium text-ink">
              {listed.length === 1
                ? 'Please check this answer before continuing.'
                : `Please check these ${listed.length} answers before continuing.`}
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {listed.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setFocusRequest({ id })}
                    className="rounded-sm text-left text-note text-ink-2 underline decoration-danger-line underline-offset-[3px] transition-colors duration-200 hover:decoration-danger"
                  >
                    {labelFor(id)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div key={current.id} className="xa-step rounded-panel bg-surface p-5 shadow-panel sm:p-8">
          <div className="space-y-9 sm:space-y-11">
            {questions.map((question) => (
              <QuestionField
                key={question.id}
                question={question}
                value={answers[question.id]}
                error={errors[question.id]}
                onChange={setAnswer}
              />
            ))}
          </div>

          {isLast ? (
            <div className="mt-10 border-t border-line pt-8 sm:mt-11">
              <p className="u-mono-label text-ink-4">Before you submit</p>
              <div className="mt-4">
                <ConsentBlock consents={consents} errors={errors} onChange={setConsent} />
              </div>
            </div>
          ) : null}
        </div>

        {failure ? (
          <div
            role="alert"
            className="mt-5 rounded-card bg-danger-surface p-4 text-body text-ink-2 shadow-inset-danger sm:p-5"
          >
            {FAILURE_COPY[failure]}
          </div>
        ) : null}

        <div className="sticky bottom-0 z-20 -mx-5 mt-6 flex items-center gap-2.5 border-t border-line bg-paper px-5 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:mt-8 sm:border-0 sm:bg-transparent sm:px-0 sm:pt-0 sm:pb-0">
          {index > 0 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={submitting}
              className={buttonClass('secondary', 'md')}
            >
              Back
            </button>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className={buttonClass('primary', 'md', 'group flex-1 sm:flex-none')}
          >
            {isLast ? (submitting ? 'Submitting…' : 'Submit & Complete Survey') : 'Continue'}
            {isLast ? null : (
              <span
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                →
              </span>
            )}
          </button>

          {saved ? (
            <p className="ml-auto hidden text-note text-ink-4 sm:block">
              Progress saved on this device
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
