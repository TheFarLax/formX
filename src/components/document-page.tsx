import Link from 'next/link';

/** Shared shell for the reward, privacy and terms routes. */
export function DocumentPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="u-hero-wash">
      <div className="mx-auto max-w-3xl px-5 pt-14 pb-4 sm:px-8 sm:pt-20">
        <Link
          href="/"
          className="group -mx-2 inline-flex min-h-11 items-center gap-2 rounded-control px-2 text-note text-ink-3 transition-colors duration-200 hover:bg-bone hover:text-ink"
        >
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          >
            ←
          </span>
          Back to the survey
        </Link>

        <p className="u-mono-label mt-9 text-ink-4">{eyebrow}</p>
        <h1 className="mt-3 text-balance text-h1 font-semibold text-ink">{title}</h1>
        {intro ? (
          <p className="u-prose-measure mt-4 text-pretty text-lead text-ink-3">{intro}</p>
        ) : null}
      </div>

      <div className="mx-auto max-w-3xl px-5 pb-6 sm:px-8">
        <div className="mt-10 rounded-panel bg-surface p-6 shadow-panel sm:p-10">{children}</div>
      </div>
    </div>
  );
}
