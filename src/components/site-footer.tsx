import Link from 'next/link';
import { SOCIAL_ICONS } from '@/components/ui/social-icons';
import { SITE, SOCIAL_LINKS, XASRI_LINKS } from '@/lib/site';

const SURVEY_LINKS = [
  { label: 'XASRI AI', href: XASRI_LINKS.website, external: true },
  { label: 'Privacy Policy', href: '/privacy', external: false },
  { label: 'Terms & Conditions', href: '/terms', external: false },
  { label: 'Participant Reward', href: '/reward', external: false },
] as const;

const linkClass =
  'inline-block py-0.5 text-note text-ink-3 transition-colors duration-200 hover:text-ink';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface sm:mt-32">
      <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-18">
        <div className="grid gap-12 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] sm:gap-16 lg:gap-24">
          {/* Brand */}
          <div>
            <p className="text-body font-semibold tracking-[-0.02em] text-ink">{SITE.brand}</p>
            <p className="mt-1.5 text-note text-ink-3">{SITE.tagline}</p>
            <p className="mt-7 max-w-sm text-balance text-h3 font-medium text-ink">
              {SITE.footerLine}
            </p>
            <a
              href={XASRI_LINKS.website}
              target="_blank"
              rel="noreferrer noopener"
              className="group mt-7 inline-flex min-h-11 items-center gap-2 rounded-control bg-surface px-5 py-2.5 text-body font-medium text-ink shadow-inset-line transition-[background-color,box-shadow] duration-200 hover:bg-bone hover:shadow-inset-strong"
            >
              Visit XASRI
              <span
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                →
              </span>
            </a>
          </div>
          {/* Links */}
          <div className="grid gap-10 sm:grid-cols-2 sm:gap-8">
            <nav aria-label="Survey">
              <h2 className="u-mono-label text-ink-4">Survey</h2>
              <ul className="mt-4 space-y-2">
                {SURVEY_LINKS.map((item) => (
                  <li key={item.label}>
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={linkClass}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link href={item.href} className={linkClass}>
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Follow XASRI">
              <h2 className="u-mono-label text-ink-4">Follow XASRI</h2>
              <ul className="mt-4 space-y-2">
                {SOCIAL_LINKS.map((item) => {
                  const Icon = SOCIAL_ICONS[item.label];
                  return (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="group inline-flex items-center gap-2.5 py-0.5 text-note text-ink-3 transition-colors duration-200 hover:text-ink"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 opacity-55 transition-opacity duration-200 group-hover:opacity-100" />
                        <span>{item.name}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-line pt-7 text-meta text-ink-4 sm:mt-18 sm:flex-row sm:items-center sm:justify-between">
          <p>© XASRI. All rights reserved.</p>
          <p>Research initiative by {SITE.brand}.</p>
        </div>
      </div>
    </footer>
  );
}
