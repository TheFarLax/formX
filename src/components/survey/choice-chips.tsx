'use client';

/**
 * Option chips for single- and multi-select questions.
 *
 * These are real `<input type="radio">` / `<input type="checkbox">` elements
 * inside labels — visually hidden, never removed. Keyboard behaviour, screen
 * reader semantics and form autofill all keep working; only the paint is custom.
 */

import { cn } from '@/lib/cn';
import type { QuestionOption } from '@/lib/survey/types';

/*
 * Rest, hover, selected and focus are all expressed on the same two properties —
 * the surface and its hairline — so a group of ten options reads as one control
 * rather than ten competing ones. Selected is an ink fill because the palette has
 * no accent colour to spend on it.
 */
const CHIP =
  'group relative inline-flex min-h-11 cursor-pointer select-none items-center gap-2.5 ' +
  'rounded-control bg-surface py-2.5 pl-3 pr-4 text-body text-ink-2 shadow-inset-line ' +
  'transition-[background-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ' +
  'hover:bg-bone hover:shadow-inset-strong active:translate-y-px ' +
  'has-[:checked]:bg-ink has-[:checked]:text-paper has-[:checked]:shadow-button ' +
  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink';

const INDICATOR =
  'flex size-4 shrink-0 items-center justify-center border border-line-strong bg-paper ' +
  'transition-colors duration-200 group-hover:border-ink-4 group-has-[:checked]:border-paper';

interface ChoiceChipsProps {
  questionId: string;
  kind: 'multi' | 'single';
  options: readonly QuestionOption[];
  /** Normalised to an array for both kinds. */
  value: readonly string[];
  invalid: boolean;
  describedBy?: string;
  labelledBy: string;
  onChange: (next: string[]) => void;
}

export function ChoiceChips({
  questionId,
  kind,
  options,
  value,
  invalid,
  describedBy,
  labelledBy,
  onChange,
}: ChoiceChipsProps) {
  const multiple = kind === 'multi';

  function toggle(optionValue: string, checked: boolean) {
    if (!multiple) {
      onChange(checked ? [optionValue] : []);
      return;
    }
    // Order follows the option list rather than click order, so stored arrays are
    // comparable between participants.
    const selected = new Set(value);
    if (checked) selected.add(optionValue);
    else selected.delete(optionValue);
    onChange(options.map((o) => o.value).filter((v) => selected.has(v)));
  }

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className="flex flex-wrap gap-2"
    >
      {options.map((option, index) => {
        const checked = value.includes(option.value);
        return (
          <label key={option.value} className={CHIP}>
            <input
              type={multiple ? 'checkbox' : 'radio'}
              id={index === 0 ? `field-${questionId}` : undefined}
              name={questionId}
              value={option.value}
              checked={checked}
              aria-invalid={invalid || undefined}
              onChange={(event) => toggle(option.value, event.target.checked)}
              className="sr-only"
            />
            <span className={cn(INDICATOR, multiple ? 'rounded-[5px]' : 'rounded-full')}>
              {multiple ? (
                <svg
                  viewBox="0 0 16 16"
                  className="size-3 text-ink opacity-0 transition-opacity duration-200 group-has-[:checked]:opacity-100"
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
              ) : (
                <span className="size-1.5 rounded-full bg-ink opacity-0 transition-opacity duration-200 group-has-[:checked]:opacity-100" />
              )}
            </span>
            <span className="font-medium">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
