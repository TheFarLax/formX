import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-control text-center font-medium ' +
  'transition-[background-color,color,box-shadow,transform] duration-200 ' +
  'ease-[cubic-bezier(0.22,1,0.36,1)] select-none ' +
  // One disabled treatment for all three variants: recessed rather than faded,
  // because a translucent ink button on warm paper reads as a rendering fault.
  'disabled:cursor-not-allowed disabled:bg-bone-deep disabled:text-ink-4 ' +
  'disabled:shadow-none disabled:translate-y-0';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-ink text-paper shadow-button hover:bg-ink-soft hover:shadow-button-lift ' +
    'active:translate-y-px active:shadow-button',
  secondary:
    'bg-surface text-ink shadow-inset-line hover:bg-bone hover:shadow-inset-strong ' +
    'active:translate-y-px',
  quiet: 'text-ink-3 hover:bg-bone hover:text-ink active:translate-y-px',
};

/**
 * Sizes are expressed as a minimum height with real vertical padding, not a fixed
 * height: a long label on a narrow phone grows the button instead of spilling out
 * of it. Touch targets stay at 44px or more, and only relax on pointer screens.
 */
const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-4 py-2 text-note sm:min-h-10 sm:px-3.5',
  md: 'min-h-12 px-4 py-2.5 text-body sm:min-h-11 sm:px-5',
  lg: 'min-h-12 px-5 py-3 text-lead sm:min-h-13 sm:px-7',
};

export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  extra?: string,
): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], extra);
}
