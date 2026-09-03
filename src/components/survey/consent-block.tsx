'use client';

/**
 * Consent and acknowledgement.
 *
 * Three separate decisions, never bundled: the Terms and Privacy agreement, the
 * reward acknowledgement, and an optional marketing opt-in. Marketing is not a
 * condition of taking part or of reward eligibility.
 *
 * The three rows share one hairline panel, split by dividers, so the block reads
 * as a single step rather than three stacked cards at the end of the survey.
 *
 * Links and buttons sit outside the `<label>` elements on purpose — a link inside
 * a label toggles the checkbox as well as following the link.
 */

import Link from 'next/link';
import type { ReactNode } from 'react';
import { RewardDetailsButton } from './reward-details-button';
import { cn } from '@/lib/cn';
import { REWARD } from '@/lib/site';
import type { Consents, FieldErrors } from '@/lib/survey/types';

const ROW =
  'group flex cursor-pointer items-start gap-3.5 p-4 transition-colors duration-200 ' +
  'hover:bg-bone/60 sm:p-5 ' +
  'has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 ' +
  'has-[:focus-visible]:outline-ink';

const BOX =
  'mt-px flex size-[1.125rem] shrink-0 items-center justify-center rounded-[6px] border ' +
  'border-line-strong bg-paper transition-colors duration-200 group-hover:border-ink-4 ' +
  'group-has-[:checked]:border-ink group-has-[:checked]:bg-ink';

/** Aligns secondary text under the label, clear of the checkbox. */
const INDENT = 'pl-12 pr-4 sm:pl-13 sm:pr-5';

const DOC_LINK =
  'font-medium text-ink underline decoration-line-strong underline-offset-[3px] ' +
  'transition-colors duration-200 hover:decoration-ink';

function Row({
  id,
  checked,
  invalid,
  onChange,
  label,
  note,
  error,
}: {
  id: keyof Consents;
  checked: boolean;
  invalid: boolean;
  onChange: (value: boolean) => void;
  label: ReactNode;
  note?: ReactNode;
  error?: string;
}) {
  return (
    <div className={cn('transition-colors duration-200', invalid && 'bg-danger-surface')}>
      <label className={ROW}>
        <input
          type="checkbox"
          id={`field-${id}`}
          name={id}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `error-${id}` : undefined}
          className="sr-only"
        />
        <span className={BOX}>
          <svg
            viewBox="0 0 16 16"
            className="size-3 text-paper opacity-0 transition-opacity duration-200 group-has-[:checked]:opacity-100"
            aria-hidden="true"
          >
            <path
              d="M3.5 8.4l2.9 2.9 6.1-6.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="text-note text-ink-2">{label}</span>
      </label>

      {error ? (
        <p
          id={`error-${id}`}
          className={cn(INDENT, '-mt-1 pb-4 text-note font-medium text-danger')}
        >
          {error}
        </p>
      ) : null}

      {note ? <p className={cn(INDENT, '-mt-1 pb-4 text-note text-ink-3')}>{note}</p> : null}
    </div>
  );
}

export function ConsentBlock({
  consents,
  errors,
  onChange,
}: {
  consents: Consents;
  errors: FieldErrors;
  onChange: (key: keyof Consents, value: boolean) => void;
}) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-card bg-surface shadow-inset-line">
      <Row
        id="research"
        checked={consents.research}
        invalid={Boolean(errors.research)}
        onChange={(value) => onChange('research', value)}
        error={errors.research}
        label="I agree to the XASRI AI Terms & Conditions and acknowledge the Privacy Policy."
        note={
          <>
            Read the{' '}
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className={DOC_LINK}>
              Terms &amp; Conditions
            </Link>{' '}
            and{' '}
            <Link href="/privacy" target="_blank" rel="noopener noreferrer" className={DOC_LINK}>
              Privacy Policy
            </Link>
            . Both open in a new tab, so your answers stay where they are.
          </>
        }
      />

      <Row
        id="reward"
        checked={consents.reward}
        invalid={Boolean(errors.reward)}
        onChange={(value) => onChange('reward', value)}
        error={errors.reward}
        label="I have read and understand the participant reward information."
        note={
          <>
            <RewardDetailsButton /> — {REWARD.participantCount} randomly selected participants,{' '}
            {REWARD.prize}, one entry per person.
          </>
        }
      />

      <Row
        id="marketing"
        checked={consents.marketing}
        invalid={false}
        onChange={(value) => onChange('marketing', value)}
        label={
          <>
            I&apos;d like to receive XASRI AI beta-testing and product updates.{' '}
            <span className="text-ink-4">Optional.</span>
          </>
        }
      />
    </div>
  );
}
