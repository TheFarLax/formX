# XASRI AI — User Research Survey

A single-page research survey that asks what AI still fails to solve. Landing page,
15-question multi-step form with conditional branching, and a thank-you screen.
Responses are written server-side to Supabase; the browser never touches the database.

- `/` — landing page and the survey
- `/reward` — participant reward conditions
- `/privacy`, `/terms` — legal documents
- `POST /api/survey` — the only write path

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase · Vitest

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill in the three values below
# apply supabase/migrations/0001_survey_schema.sql (see "Database" below)
npm run dev                    # http://localhost:3000
```

## Environment

All three are **server-only**. None is prefixed `NEXT_PUBLIC_`, so none of them can
reach the browser bundle; `src/lib/server/env.ts` throws if it is ever imported from
client code.

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Project URL, e.g. `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key. Bypasses RLS — never expose it |
| `IP_HASH_SALT` | Secret used to hash submitter IPs. At least 32 characters: `openssl rand -hex 32` |

A missing or too-short value makes the endpoint fail with the generic error message
rather than starting up in a half-configured state.

## Database

Apply `supabase/migrations/0001_survey_schema.sql` once, in either way:

**Supabase dashboard** — SQL Editor → New query → paste the file → Run.

**Supabase CLI** — needs the database password from Project Settings → Database:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

The migration is idempotent — re-running it is safe. It creates:

- `survey_responses` — one row per completed survey. Branched-away questions are
  stored as `NULL`, never as placeholder values. Unique on `entry_id` (makes a
  retried submission idempotent) and on `email` (one entry per person).
- `reward_entries` — private reward tracking, created by a trigger inside the same
  transaction as the response, so it cannot be forgotten.
- `submission_attempts` — rate-limit ledger holding a salted SHA-256 of the IP, never
  the address itself.
- `record_submission_attempt`, `select_reward_winners`, `mark_reward_notified`,
  `prune_submission_attempts`.

Row Level Security is enabled on all three tables **with no policies**, and table
privileges are revoked from `anon` and `authenticated`. The browser therefore has no
path to them at all — nobody can read another participant's response because nobody
can read responses. Only the service-role key, held server-side, can write.

## Reward selection

Selection is random, happens inside the database, and is not reachable from the
browser: `EXECUTE` is revoked from `PUBLIC`, so only the SQL Editor or the service
role can call it. Re-running it never re-selects an entry that was already selected.

```sql
select * from public.select_reward_winners(25);
```

Returns `reward_entry_id`, `email` and `selected_at` for the newly selected
participants. After notifying them:

```sql
select public.mark_reward_notified(array['<reward_entry_id>', '...']::uuid[]);
```

Participant emails live only in `survey_responses` and are never exposed by the site.

## Abuse protection

- **Honeypot** — an off-screen `x_ref` field that must arrive empty.
- **Fill time** — a submission arriving less than 15 s after the survey was started is
  rejected (`MIN_FILL_MS` in `src/lib/server/abuse.ts`).
- **Rate limit** — 5 submissions per hour and 20 per day per hashed IP, counted and
  recorded in one atomic round trip so two racing requests cannot both slip past.
  If the ledger is unreachable the survey stays available; the unique constraint on
  `email` still enforces one entry per person.
- **Same-origin** — cross-site posts are rejected when an `Origin` header is present.

## How the survey stays consistent

One set of modules describes the survey, and both the browser and the route handler
import it, so they cannot disagree about what is visible or required:

- `src/lib/survey/questions.ts` — the 15 questions and 6 sections. Question ids are
  identical to the database column names, so no translation table exists to drift.
- `src/lib/survey/visibility.ts` — `visibleSections`, `visibleQuestions`, and
  `pruneAnswers`, which is the single mechanism that enforces three of the branching
  rules: a hidden question is never required, never submitted, and changing an earlier
  answer clears the answers that depended on it (including grandchildren, in one pass).
- `src/lib/survey/validate.ts` — only ever inspects *visible* questions.
- `src/lib/survey/payload.ts` — builds the row, prunes first, and stamps the legal
  versions server-side so a participant cannot be recorded as accepting a version
  they were not served.

The route handler re-runs all of it on the server. A tampered request carrying answers
for a branch the participant never saw has them dropped before the row is built.

Progress is shown as the position among the sections that are actually visible
(`02 / 05`), never as a percentage — branching changes how many questions there are,
so a percentage would be misleading.

## Verification

```bash
npm run verify     # typecheck → lint → tests → production build
```

`npm test` covers the branching rules, validation, row construction and the local
draft parser. There is no browser-level test suite, so after applying the migration
confirm the real path once by hand:

1. `npm run dev`, fill in the survey, submit, and check the thank-you screen appears.
2. Confirm the row: `select count(*), max(created_at) from public.survey_responses;`
3. Confirm the reward entry was created by the trigger:
   `select count(*) from public.reward_entries;`
4. Reload the page — it should say the response has already been recorded, rather
   than offering the form again.
5. Delete the test row when you are done:
   `delete from public.survey_responses where email = '<the address you used>';`

Refresh mid-survey to check the draft prompt: answers are kept in `localStorage` under
`xasri.survey.draft.v1`, written only once at least one question has been answered,
and cleared on successful submission.

## Before launch

- **Fill in the legal placeholders.** `src/lib/legal.ts` holds every detail XASRI must
  supply — legal entity, registered address, contact addresses, governing law,
  retention period, hosting region, eligibility restrictions, notification and claim
  windows. They render on the published pages in square brackets exactly as written,
  so an unfilled value is impossible to miss. Nothing there is invented.
- **Bump `LEGAL_VERSIONS`** in the same file whenever the Terms, Privacy Policy or
  reward rules change materially, and update `LAST_UPDATED`. Stored responses keep the
  version they actually agreed to.
- Set the three environment variables in the hosting provider as server-side secrets.
- Confirm the reward copy still matches what XASRI will honour: 25 randomly selected
  participants, one month of Pro, one entry per person, promotional access does not
  become a paid subscription.

## Deploying

Any Node host works; the endpoint declares `runtime = 'nodejs'` because it hashes IPs
with `node:crypto`. On Vercel, add the three variables as environment variables and
deploy — no build-time configuration is needed. Security headers (HSTS, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`) are set in `next.config.ts`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest, once |
| `npm run test:watch` | Vitest, watching |
| `npm run verify` | All four checks in order |
