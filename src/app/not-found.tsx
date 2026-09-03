import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="u-hero-wash">
      <div className="mx-auto flex max-w-3xl flex-col items-start px-5 py-24 sm:px-8 sm:py-32">
        <p className="u-mono-label text-ink-4">404</p>
        <h1 className="mt-3 text-balance text-h1 font-semibold text-ink">
          This page doesn&apos;t exist.
        </h1>
        <p className="u-prose-measure mt-4 text-pretty text-lead text-ink-3">
          The survey, and everything linked from it, starts on the home page.
        </p>
        <Link href="/" className={buttonClass('primary', 'md', 'mt-8')}>
          Back to the survey
        </Link>
      </div>
    </div>
  );
}
