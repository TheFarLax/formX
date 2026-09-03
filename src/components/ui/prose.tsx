import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Typography for the legal and reward documents. Descendant selectors keep the
 * document bodies as plain semantic HTML — no wrapper component per paragraph.
 */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'text-body text-ink-2',
        '[&>*+*]:mt-4',
        '[&_h2]:mt-10 [&_h2]:text-body [&_h2]:font-semibold [&_h2]:tracking-[-0.01em] [&_h2]:text-ink',
        '[&_h3]:mt-8 [&_h3]:text-note [&_h3]:font-semibold [&_h3]:text-ink',
        '[&_p]:text-pretty',
        '[&_ul]:space-y-2 [&_ul]:pl-0',
        '[&_li]:relative [&_li]:list-none [&_li]:pl-5',
        "[&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.6em] [&_li]:before:h-1 [&_li]:before:w-1 [&_li]:before:rounded-full [&_li]:before:bg-ink-4 [&_li]:before:content-['']",
        '[&_strong]:font-semibold [&_strong]:text-ink',
        '[&_a]:font-medium [&_a]:text-ink [&_a]:underline [&_a]:decoration-line-strong [&_a]:underline-offset-[3px] [&_a]:transition-colors [&_a]:duration-200 hover:[&_a]:decoration-ink',
        '[&_code]:rounded [&_code]:bg-bone [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-note [&_code]:text-ink-2',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Marks a value XASRI must supply before launch. Impossible to miss in review. */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-bone-deep px-1.5 py-0.5 font-mono text-note text-ink-2">
      {children}
    </span>
  );
}
