'use client';

/**
 * "Reward details" trigger.
 *
 * Opens the same content that `/reward` renders, so the conditions can be read
 * without abandoning a part-finished survey. The route still exists for anyone
 * who wants a linkable page.
 */

import Link from 'next/link';
import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { RewardDetails } from '@/content/reward';
import { cn } from '@/lib/cn';

const TRIGGER =
  'font-medium text-ink underline decoration-line-strong underline-offset-[3px] ' +
  'transition-colors duration-200 hover:decoration-ink';

export function RewardDetailsButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(TRIGGER, className)}>
        Reward details
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Thank-you reward"
        title="Participant reward details"
      >
        {/* `RewardDetails` brings its own `Prose` wrapper. */}
        <RewardDetails />
        <p className="mt-8 border-t border-line pt-5 text-note text-ink-3">
          These conditions are also on the{' '}
          <Link
            href="/reward"
            className="font-medium text-ink underline decoration-line-strong underline-offset-[3px] transition-colors duration-200 hover:decoration-ink"
          >
            participant reward page
          </Link>
          .
        </p>
      </Modal>
    </>
  );
}
