import { RewardDetailsButton } from '@/components/survey/reward-details-button';
import { Survey } from '@/components/survey/survey';
import { buttonClass } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { NUMBERED_QUESTION_COUNT, SECTIONS } from '@/lib/survey/questions';
import { REWARD, SITE } from '@/lib/site';

const FACTS = [
  'No account and no sign-up. Answer, submit, done.',
  'Progress is saved in this browser, so you can close the tab and finish later.',
  'Your email is used to contact selected reward participants, and for product updates only if you ask for them.',
];

/** One measure for every band, so nothing on the page has its own left edge. */
const CONTAINER = 'mx-auto max-w-5xl px-5 sm:px-8';

export default function HomePage() {
  return (
    <>
      <section className="u-hero-wash">
        <div className={cn(CONTAINER, 'pt-14 pb-18 sm:pt-22 sm:pb-26')}>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-7 shrink-0 bg-line-strong" />
            <p className="u-mono-label text-ink-4">{SITE.brand} · User research</p>
          </div>

          <h1 className="mt-6 max-w-[46rem] text-balance text-hero font-semibold text-ink">
            {SITE.headline}
          </h1>

          {/* Two levels on purpose: the claim first, then what we do about it. */}
          <p className="mt-7 max-w-[38rem] text-pretty text-lead text-ink-2">{SITE.lede}</p>
          <p className="mt-3.5 max-w-[36rem] text-pretty text-body text-ink-3">
            {SITE.description}
          </p>

          <div className="mt-10 flex flex-col items-start gap-5 sm:mt-11 sm:flex-row sm:items-center sm:gap-6">
            <a href="#survey" className={buttonClass('primary', 'lg', 'group w-full sm:w-auto')}>
              Start the Survey
              <span
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                →
              </span>
            </a>
            <p className="u-mono-label text-ink-3">
              {NUMBERED_QUESTION_COUNT} questions · {SITE.estimatedMinutes}
            </p>
          </div>
        </div>
      </section>
      <section id="purpose" className="scroll-mt-20 border-t border-line">
        <div className={cn(CONTAINER, 'py-16 sm:py-22')}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
            <div>
              <p className="u-mono-label text-ink-4">Why this exists</p>
              <h2 className="mt-3.5 text-balance text-h2 font-semibold text-ink">
                Built around real problems, not benchmarks.
              </h2>
              <p className="u-prose-measure mt-5 text-body text-ink-2">
                Most AI feedback arrives as a rating. This survey asks for problems instead: what
                you were trying to do, where the tool stopped being reliable, and what you would
                hand over tomorrow if it actually worked. Concrete answers are more useful here than
                polite ones.
              </p>
              <ul className="mt-7 space-y-3">
                {FACTS.map((fact) => (
                  <li key={fact} className="flex gap-3 text-note text-ink-3">
                    <span
                      aria-hidden="true"
                      className="mt-[0.62em] size-1 shrink-0 rounded-full bg-ink-4"
                    />
                    <span className="text-pretty">{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="u-mono-label text-ink-4">What we ask</p>
              <ol className="mt-4 divide-y divide-line overflow-hidden rounded-panel bg-surface shadow-inset-line">
                {SECTIONS.map((section) => (
                  <li
                    key={section.id}
                    className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 px-5 py-4 sm:px-6"
                  >
                    <span className="u-mono-label mt-[0.35rem] text-ink-4">{section.code}</span>
                    <span>
                      <span className="block text-body font-medium text-ink">{section.title}</span>
                      <span className="mt-0.5 block text-note text-ink-3">{section.summary}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-3.5 text-note text-ink-4">
                Sections and follow-up questions only appear when they apply to you.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="border-t border-line bg-bone/45">
        <div className={cn(CONTAINER, 'py-14 sm:py-18')}>
          <div className="rounded-panel bg-surface p-6 shadow-panel sm:p-9">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-control bg-bone text-body"
              >
                🎁
              </span>
              <p className="u-mono-label text-ink-4">As a thank you</p>
            </div>
            <h2 className="mt-5 max-w-[36rem] text-balance text-h3 font-semibold text-ink">
              {REWARD.participantCount} randomly selected participants receive {REWARD.prize} at no
              cost.
            </h2>
            <p className="u-prose-measure mt-4 text-body text-ink-3">
              A valid email address is required and there is one entry per person. Selection is
              random among eligible participants, and promotional access does not automatically
              become a paid subscription.
            </p>
            <p className="mt-6 text-note">
              <RewardDetailsButton />
            </p>
          </div>
        </div>
      </section>

      <section id="survey" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
          <Survey />
        </div>
      </section>
    </>
  );
}
