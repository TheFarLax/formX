import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';
import { SITE, XASRI_LINKS } from '@/lib/site';

const NAV = [
  { label: 'XASRI AI', href: XASRI_LINKS.website, external: true },
  { label: 'About', href: '/#purpose', external: false },
  { label: 'Pro', href: XASRI_LINKS.website, external: true },
] as const;

const NAV_LINK =
  'rounded-control px-3 py-2 text-note text-ink-3 transition-colors duration-200 ' +
  'hover:bg-bone hover:text-ink';

/**
 * Minimal, sticky, solid. Deliberately not translucent — a blurred bar over
 * fifteen scrolling questions reads as decoration, and the brief asks for
 * restraint. On mobile the nav collapses to brand plus one action.
 *
 * The container matches the page content width so the wordmark sits on the same
 * left edge as the headline below it.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5 sm:h-18 sm:px-8">
        <Link
          href="/"
          className="-mx-2 rounded-control px-2 py-1.5 text-body font-semibold tracking-[-0.02em] text-ink transition-colors duration-200 hover:bg-bone"
        >
          {SITE.brand}
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <nav aria-label="XASRI" className="hidden items-center gap-0.5 sm:flex">
            {NAV.map((item) =>
              item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={NAV_LINK}
                >
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} href={item.href} className={NAV_LINK}>
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <Link href="/#survey" className={buttonClass('primary', 'sm')}>
            Take Survey
          </Link>
        </div>
      </div>
    </header>
  );
}
