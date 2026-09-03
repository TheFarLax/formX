'use client';

/**
 * One question: label, helper, control, error.
 *
 * The shell is shared so every question type lines up on the same grid, and the
 * label/helper/error wiring (`htmlFor`, `aria-describedby`) is written once
 * instead of per kind.
 */

import { ChoiceChips } from './choice-chips';
import { CountryField, TextAreaField, TextField } from './text-inputs';
import { cn } from '@/lib/cn';
import type { Question, QuestionId } from '@/lib/survey/types';

interface QuestionFieldProps {
  question: Question;
  value: string | string[] | undefined;
  error?: string;
  onChange: (id: QuestionId, value: string | string[]) => void;
}

export function QuestionField({ question, value, error, onChange }: QuestionFieldProps) {
  const { id, kind, code, label, helper, placeholder, required, options, maxLength } = question;

  const labelId = `label-${id}`;
  const helperId = helper ? `helper-${id}` : null;
  const errorId = error ? `error-${id}` : null;
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

  const isGroup = kind === 'multi' || kind === 'single';
  const invalid = Boolean(error);
  const asText = typeof value === 'string' ? value : '';
  const asList = Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : [];

  /** Only render the metadata row when it has something in it. */
  const hasMeta = code !== null || !required;

  const heading = (
    <>
      {hasMeta ? (
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          {code ? <span className="u-mono-label text-ink-4">{code}</span> : null}
          {!required ? (
            <span className="u-mono-label rounded-full bg-bone px-2 py-[0.2rem] text-ink-4">
              Optional
            </span>
          ) : null}
        </span>
      ) : null}
      <span
        className={cn(
          'block text-pretty font-medium text-ink',
          hasMeta && 'mt-2',
          question.prominent ? 'text-h3' : 'text-lead',
        )}
      >
        {label}
      </span>
    </>
  );

  return (
    <div
      id={`question-${id}`}
      className={cn(
        // A follow-up sits on a hairline and is indented, so its dependence on the
        // answer above it is visible and not only implied by the order.
        question.visibleWhen && 'xa-reveal border-l border-line pl-4 sm:pl-5',
        // One question in the survey is marked prominent. It gets a warmer inset
        // rather than a heavier card, and does the rest of the work with type.
        question.prominent && 'rounded-card bg-bone/65 p-5 shadow-inset-line sm:p-6',
      )}
    >
      {isGroup ? (
        <p id={labelId}>{heading}</p>
      ) : (
        <label id={labelId} htmlFor={`field-${id}`} className="block">
          {heading}
        </label>
      )}

      {helper ? (
        <p id={helperId ?? undefined} className="mt-2 max-w-xl text-note text-ink-3">
          {helper}
        </p>
      ) : null}

      <div className="mt-4">
        {isGroup ? (
          <ChoiceChips
            questionId={id}
            kind={kind}
            options={options ?? []}
            value={asList}
            invalid={invalid}
            labelledBy={labelId}
            describedBy={describedBy}
            onChange={(next) => onChange(id, kind === 'multi' ? next : (next[0] ?? ''))}
          />
        ) : null}

        {kind === 'textarea' ? (
          <TextAreaField
            questionId={id}
            value={asText}
            invalid={invalid}
            describedBy={describedBy}
            placeholder={placeholder}
            maxLength={maxLength}
            tall={question.prominent}
            onChange={(next) => onChange(id, next)}
          />
        ) : null}

        {kind === 'email' || kind === 'text' ? (
          <TextField
            questionId={id}
            value={asText}
            invalid={invalid}
            describedBy={describedBy}
            placeholder={placeholder}
            maxLength={maxLength}
            type={kind === 'email' ? 'email' : 'url'}
            onChange={(next) => onChange(id, next)}
          />
        ) : null}

        {kind === 'country' ? (
          <CountryField
            questionId={id}
            value={asText}
            invalid={invalid}
            describedBy={describedBy}
            onChange={(next) => onChange(id, next)}
          />
        ) : null}
      </div>

      {error ? (
        <p id={errorId ?? undefined} className="mt-2.5 text-note font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
