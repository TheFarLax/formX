'use client';

/**
 * Completion screen.
 *
 * The reward is stated exactly as the rules allow: a random selection of eligible
 * participants, one month of Pro, at no cost. Nobody is told they have won
 * anything, because at this point nobody has been selected.
 *
 * The first thing on the screen is confirmation that the response was recorded —
 * the mark and the label say it before the heading does.
 */

import { buttonClass } from '@/components/ui/button';
import { REWARD, XASRI_LINKS } from '@/lib/site';

export function ThankYou({
  betaOptIn,
  returning,
}: {
  betaOptIn: boolean;
  returning: boolean;
}) {
  return (
    <div className="xa-step rounded-panel bg-surface p-6 shadow-panel sm:p-10">
      <div className="flex items-center gap-3.5">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper"
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" className="size-[1.125rem]">
            <path
              d="M4.5 10.5l3.6 3.6L15.5 6.7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="u-mono-label text-ink-4">Response recorded</p>
      </div>

      <h2 className="mt-6 text-balance text-h1 font-semibold text-ink">Thank you.</h2>
      <p className="u-prose-measure mt-4 text-pretty text-lead text-ink-2">
        {returning
          ? 'Your response has already been recorded from this device. Your feedback will help XASRI AI understand the problems that matter most to people using AI today.'
          : 'Your response has been submitted successfully. Your feedback will help XASRI AI understand the problems that matter most to people using AI today.'}
      </p>

      <div className="mt-8 rounded-card bg-bone/70 p-5 shadow-inset-line sm:p-6">
        <p className="flex items-center gap-3 text-body font-medium text-ink">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-control bg-surface text-body shadow-inset-line"
            aria-hidden="true"
          >
            🎁
          </span>
          Thank you for participating
        </p>
        <p className="u-prose-measure mt-3 text-note text-ink-3">
          {REWARD.participantCount} eligible participants will be randomly selected to receive{' '}
          {REWARD.prize} at no cost.
        </p>
      </div>

      {betaOptIn ? (
        <p className="u-prose-measure mt-5 text-note text-ink-3">
          You asked to hear about XASRI AI beta testing and product updates. We will email you when
          early testing opens.
        </p>
      ) : null}

      <a
        href={XASRI_LINKS.website}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass('primary', 'lg', 'group mt-9 w-full sm:w-auto')}
      >
        Learn About XASRI AI
        <span
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:translate-x-0.5"
        >
          →
        </span>
      </a>
    </div>
  );
}
