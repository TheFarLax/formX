'use client';

/**
 * Step indicator.
 *
 * The denominator is the number of sections this participant will actually see,
 * so it stays truthful when a branch is skipped. There is deliberately no
 * percentage: conditional questions change the length of the survey while it is
 * being answered, and a percentage would move backwards.
 */

import type { Ref } from 'react';
import { cn } from '@/lib/cn';

interface SurveyProgressProps {
  label: string;
  position: number;
  total: number;
  title: string;
  summary: string;
  headingRef: Ref<HTMLHeadingElement>;
}

export function SurveyProgress({
  label,
  position,
  total,
  title,
  summary,
  headingRef,
}: SurveyProgressProps) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <p className="u-mono-label shrink-0 text-ink">{label}</p>
        {/* The count above is the accessible version of this bar. */}
        <div className="flex h-0.5 flex-1 items-center gap-1" aria-hidden="true">
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={cn(
                'h-full flex-1 rounded-full transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                index < position ? 'bg-ink' : 'bg-line-strong',
              )}
            />
          ))}
        </div>
      </div>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-6 text-balance text-h2 font-semibold text-ink focus-visible:outline-none"
      >
        {title}
      </h2>
      <p className="u-prose-measure mt-2.5 text-body text-ink-3">{summary}</p>
    </div>
  );
}
