'use client';

/**
 * Free-text, email and country controls.
 *
 * The global `:focus-visible` treatment in `globals.css` supplies the focus ring,
 * so nothing here removes an outline. Every control stays at 16px on mobile,
 * which is what stops iOS Safari from zooming when a field is focused.
 */

import { cn } from '@/lib/cn';
import { COUNTRIES } from '@/lib/countries';

const CONTROL =
  'w-full rounded-control bg-surface px-4 text-base text-ink shadow-inset-line ' +
  'placeholder:text-ink-4 transition-[box-shadow,background-color] duration-200 ' +
  'ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-inset-strong';

const INVALID = 'bg-danger-surface shadow-inset-danger hover:shadow-inset-danger';

interface BaseProps {
  questionId: string;
  value: string;
  invalid: boolean;
  describedBy?: string;
  placeholder?: string;
  maxLength?: number;
  onChange: (next: string) => void;
}

export function TextAreaField({
  questionId,
  value,
  invalid,
  describedBy,
  placeholder,
  maxLength,
  onChange,
  tall,
}: BaseProps & { tall?: boolean }) {
  // The counter only appears once it is genuinely relevant, so it never reads as
  // a target length for people writing a short honest answer.
  const showCount = maxLength !== undefined && value.length > maxLength - 250;

  return (
    <div>
      <textarea
        id={`field-${questionId}`}
        name={questionId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={tall ? 6 : 4}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(CONTROL, 'py-3.5 leading-relaxed', tall && 'sm:text-lg', invalid && INVALID)}
      />
      {showCount ? (
        <p className="mt-2 text-right text-meta text-ink-4" aria-live="polite">
          {(maxLength - value.length).toLocaleString('en-US')} characters left
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  questionId,
  value,
  invalid,
  describedBy,
  placeholder,
  maxLength,
  onChange,
  type,
}: BaseProps & { type: 'email' | 'url' }) {
  const email = type === 'email';

  return (
    <input
      id={`field-${questionId}`}
      name={questionId}
      type={email ? 'email' : 'text'}
      inputMode={email ? 'email' : 'url'}
      autoComplete={email ? 'email' : 'url'}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(CONTROL, 'h-12', invalid && INVALID)}
    />
  );
}

export function CountryField({
  questionId,
  value,
  invalid,
  describedBy,
  onChange,
}: Omit<BaseProps, 'placeholder' | 'maxLength'>) {
  return (
    <div className="group relative">
      <select
        id={`field-${questionId}`}
        name={questionId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="country-name"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(
          CONTROL,
          'h-12 cursor-pointer appearance-none pr-11',
          value === '' && 'text-ink-4',
          invalid && INVALID,
        )}
      >
        <option value="">Select your country</option>
        {COUNTRIES.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-4 transition-colors duration-200 group-hover:text-ink-2"
        aria-hidden="true"
      >
        <path
          d="M5.5 8l4.5 4.5L14.5 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
