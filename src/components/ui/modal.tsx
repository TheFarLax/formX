'use client';

/**
 * Accessible dialog.
 *
 * Used for the reward details, which must be readable without leaving a
 * part-finished survey. Escape closes it, Tab is trapped inside it, focus returns
 * to whatever opened it, and the page behind it cannot scroll.
 */

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, eyebrow, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [open, onClose]);

  // Nothing opens a dialog during server rendering or hydration, so `open` is the
  // only guard `createPortal` needs before it reaches for `document.body`.
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div
        className="xa-fade absolute inset-0 bg-ink/28 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="xa-step relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-panel bg-paper shadow-lift sm:max-w-2xl sm:rounded-panel"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-7 sm:py-5">
          <div>
            {eyebrow ? <p className="u-mono-label text-ink-4">{eyebrow}</p> : null}
            <h2 id="modal-title" className="mt-1.5 text-balance text-h3 font-semibold text-ink">
              {title}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-control text-ink-3 transition-colors duration-200 hover:bg-bone hover:text-ink"
          >
            <svg viewBox="0 0 20 20" className="size-4.5" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 py-6 sm:px-7 sm:py-7">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
