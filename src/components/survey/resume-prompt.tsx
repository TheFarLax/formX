'use client';

/**
 * Resume prompt.
 *
 * Shown when a draft is found in this browser. Nothing unfinished has ever left
 * the device, so "saved on this device" is literally accurate — clearing browser
 * data is enough to remove it.
 */

import { buttonClass } from '@/components/ui/button';

function savedAgo(savedAt: number): string | null {
  const seconds = Math.floor((Date.now() - savedAt) / 1000);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  if (seconds < 90) return 'a moment ago';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? 'an hour ago' : `${hours} hours ago`;

  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

export function ResumePrompt({
  savedAt,
  answered,
  onContinue,
  onRestart,
}: {
  savedAt: number;
  answered: number;
  onContinue: () => void;
  onRestart: () => void;
}) {
  const ago = savedAgo(savedAt);

  return (
    <div className="xa-step rounded-panel bg-surface p-6 shadow-panel sm:p-8">
      <p className="u-mono-label text-ink-4">Draft found</p>
      <h2 className="mt-3 text-balance text-h3 font-semibold text-ink">Continue your survey?</h2>
      <p className="u-prose-measure mt-2.5 text-body text-ink-3">
        Your progress was saved on this device.
      </p>
      <p className="mt-1.5 text-note text-ink-4">
        {answered} {answered === 1 ? 'answer' : 'answers'} kept
        {ago ? ` · last saved ${ago}` : null}
      </p>

      <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
        <button type="button" onClick={onContinue} className={buttonClass('primary', 'md')}>
          Continue
        </button>
        <button type="button" onClick={onRestart} className={buttonClass('secondary', 'md')}>
          Start Over
        </button>
      </div>
      <p className="mt-4 text-note text-ink-4">
        Starting over clears the saved answers on this device.
      </p>
    </div>
  );
}
