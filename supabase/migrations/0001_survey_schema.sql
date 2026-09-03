-- ============================================================================
--  XASRI AI — user research survey schema
--
--  Run once against the Supabase project (SQL Editor, or `supabase db push`).
--
--  Security posture: Row Level Security is enabled with NO policies for the
--  `anon` and `authenticated` roles, and their table privileges are revoked.
--  The browser therefore has no path to these tables at all — every write goes
--  through the Next.js route handler using the service-role key, which is never
--  exposed to the client. Nobody can read another participant's response
--  because nobody can read responses.
-- ============================================================================

create extension if not exists pgcrypto;

-- ── survey_responses ────────────────────────────────────────────────────────
-- One row per completed survey. Conditional columns are nullable: a question
-- that was branched away is stored as NULL, never as a placeholder value.

create table if not exists public.survey_responses (
  id                       uuid primary key default gen_random_uuid(),

  -- Client-generated per draft. Makes a retried submission idempotent instead
  -- of inserting the same response twice.
  entry_id                 uuid not null,

  email                    text not null,
  country                  text not null,
  website                  text,

  ai_use_cases             text[] not null,
  ai_tools                 text[] not null,
  biggest_ai_problem       text   not null,
  ai_frustrations          text[] not null,
  desired_ai_capability    text   not null,

  -- Coding & Devices branch (Q1 → Q6–Q9). NULL when the branch did not apply.
  coding_problem           text,
  coding_device            text,
  mobile_coding_interest   text,
  cross_device_interest    text,
  cross_device_problem     text,

  -- Research branch (Q1 → Q10). NULL when Research was not selected.
  research_problem         text,

  -- Engineering (Q11 always asked; areas only when interest is not "No").
  engineering_ai_interest  text not null,
  engineering_areas        text[],

  one_problem_to_solve     text not null,
  desired_agent_task       text not null,
  unsolved_ai_problem      text not null,

  beta_interest            text not null,
  beta_products            text[],

  beta_contact_consent     boolean not null default false,
  research_consent         boolean not null,
  marketing_consent        boolean not null default false,
  reward_acknowledgement   boolean not null,

  terms_version            text not null,
  privacy_policy_version   text not null,
  reward_rules_version     text not null,

  created_at               timestamptz not null default now(),

  constraint survey_responses_entry_id_key unique (entry_id),
  constraint survey_responses_email_key unique (email)
);

-- Defence in depth. The route handler validates everything already; these
-- constraints mean a bug there cannot quietly write junk.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'survey_responses_email_shape'
  ) then
    alter table public.survey_responses
      add constraint survey_responses_email_shape check (
        email = lower(email)
        and length(email) between 6 and 254
        and email like '%_@_%._%'
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'survey_responses_consent_required'
  ) then
    alter table public.survey_responses
      add constraint survey_responses_consent_required check (
        research_consent and reward_acknowledgement
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'survey_responses_text_lengths'
  ) then
    alter table public.survey_responses
      add constraint survey_responses_text_lengths check (
        length(biggest_ai_problem)     between 2 and 4000
        and length(desired_ai_capability) between 2 and 4000
        and length(one_problem_to_solve)  between 2 and 4000
        and length(desired_agent_task)    between 2 and 4000
        and length(unsolved_ai_problem)   between 2 and 4000
        and (coding_problem       is null or length(coding_problem)       between 2 and 4000)
        and (cross_device_problem is null or length(cross_device_problem) between 2 and 4000)
        and (research_problem     is null or length(research_problem)     between 2 and 4000)
        and (website              is null or length(website)              between 4 and 500)
        and length(country) between 2 and 100
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'survey_responses_multi_not_empty'
  ) then
    alter table public.survey_responses
      add constraint survey_responses_multi_not_empty check (
        cardinality(ai_use_cases) > 0
        and cardinality(ai_tools) > 0
        and cardinality(ai_frustrations) > 0
        and (engineering_areas is null or cardinality(engineering_areas) > 0)
        and (beta_products     is null or cardinality(beta_products)     > 0)
      );
  end if;
end
$$;

create index if not exists survey_responses_created_at_idx
  on public.survey_responses (created_at desc);

-- ── reward_entries ──────────────────────────────────────────────────────────
-- Minimal private tracking for the thank-you reward. Never read by the website.

create table if not exists public.reward_entries (
  id                 uuid primary key default gen_random_uuid(),
  survey_response_id uuid not null references public.survey_responses (id) on delete cascade,
  eligible           boolean not null default true,
  selected           boolean not null default false,
  selected_at        timestamptz,
  notified           boolean not null default false,
  created_at         timestamptz not null default now(),

  constraint reward_entries_response_key unique (survey_response_id),
  constraint reward_entries_selected_at_consistent check (
    (selected and selected_at is not null) or (not selected and selected_at is null)
  ),
  constraint reward_entries_notified_requires_selected check (not notified or selected)
);

create index if not exists reward_entries_pool_idx
  on public.reward_entries (eligible, selected);

-- Creating the reward entry in a trigger rather than in application code means
-- it cannot be forgotten, and it stays inside the insert's transaction.
create or replace function public.create_reward_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.reward_entries (survey_response_id, eligible)
  values (new.id, new.reward_acknowledgement)
  on conflict (survey_response_id) do nothing;
  return new;
end;
$$;

drop trigger if exists survey_responses_create_reward_entry on public.survey_responses;
create trigger survey_responses_create_reward_entry
  after insert on public.survey_responses
  for each row execute function public.create_reward_entry();

-- ── submission_attempts ─────────────────────────────────────────────────────
-- Rate-limit ledger. Stores a salted hash of the submitter's IP, never the IP
-- itself, and is kept out of survey_responses so the research table holds only
-- research data.

create table if not exists public.submission_attempts (
  id         bigserial primary key,
  ip_hash    text not null,
  created_at timestamptz not null default now()
);

create index if not exists submission_attempts_ip_hash_idx
  on public.submission_attempts (ip_hash, created_at desc);

-- ── Rate limiting ───────────────────────────────────────────────────────────
-- Records the attempt and reports whether it is within limits, in one round
-- trip. Returns false when the caller has exceeded either window.

create or replace function public.record_submission_attempt(
  p_ip_hash    text,
  p_hour_limit integer default 5,
  p_day_limit  integer default 20
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hour integer;
  v_day  integer;
begin
  if p_ip_hash is null or length(p_ip_hash) < 16 then
    raise exception 'p_ip_hash must be a hash of at least 16 characters';
  end if;

  -- Opportunistic pruning keeps the ledger bounded without requiring a
  -- scheduled job. See prune_submission_attempts() for the deterministic path.
  if random() < 0.02 then
    delete from public.submission_attempts where created_at < now() - interval '7 days';
  end if;

  select count(*) into v_hour
    from public.submission_attempts
   where ip_hash = p_ip_hash and created_at > now() - interval '1 hour';

  select count(*) into v_day
    from public.submission_attempts
   where ip_hash = p_ip_hash and created_at > now() - interval '1 day';

  insert into public.submission_attempts (ip_hash) values (p_ip_hash);

  return v_hour < p_hour_limit and v_day < p_day_limit;
end;
$$;

create or replace function public.prune_submission_attempts(p_older_than interval default interval '7 days')
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from public.submission_attempts where created_at < now() - p_older_than;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- ── Reward selection ────────────────────────────────────────────────────────
-- Random selection happens here, inside the database, in one atomic statement.
-- There is no frontend path to it: EXECUTE is revoked from PUBLIC below, so only
-- a privileged operator (SQL Editor) or the service role can run it. Re-running
-- it never re-selects an already-selected entry.

create or replace function public.select_reward_winners(p_count integer default 25)
returns table (reward_entry_id uuid, email text, selected_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_count is null or p_count < 1 or p_count > 1000 then
    raise exception 'p_count must be between 1 and 1000';
  end if;

  return query
  with pool as (
    select re.id
      from public.reward_entries re
     where re.eligible
       and not re.selected
     order by random()
     limit p_count
  ),
  chosen as (
    update public.reward_entries re
       set selected = true,
           selected_at = now()
     where re.id in (select id from pool)
    returning re.id, re.survey_response_id, re.selected_at
  )
  select c.id, sr.email, c.selected_at
    from chosen c
    join public.survey_responses sr on sr.id = c.survey_response_id;
end;
$$;

create or replace function public.mark_reward_notified(p_reward_entry_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  update public.reward_entries
     set notified = true
   where id = any(p_reward_entry_ids)
     and selected;
  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Enabled with zero policies. With RLS on and no policy present, every row is
-- invisible and unwritable to `anon` and `authenticated`. The service role holds
-- BYPASSRLS and continues to work. This is intentionally stricter than an
-- insert-only policy: the browser never touches Supabase directly, so it needs
-- no access whatsoever.

alter table public.survey_responses    enable row level security;
alter table public.reward_entries      enable row level security;
alter table public.submission_attempts enable row level security;

-- Also strip SQL-level privileges, so the tables are unreachable even if a
-- policy is added by mistake later. Guarded because these roles only exist on
-- Supabase.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on table public.survey_responses    from anon;
    revoke all on table public.reward_entries      from anon;
    revoke all on table public.submission_attempts from anon;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on table public.survey_responses    from authenticated;
    revoke all on table public.reward_entries      from authenticated;
    revoke all on table public.submission_attempts from authenticated;
  end if;
end
$$;

-- Functions are granted to PUBLIC by default; that must be undone before the
-- reward tooling can be called private.
revoke all on function public.create_reward_entry()                    from public;
revoke all on function public.record_submission_attempt(text, integer, integer) from public;
revoke all on function public.prune_submission_attempts(interval)      from public;
revoke all on function public.select_reward_winners(integer)           from public;
revoke all on function public.mark_reward_notified(uuid[])             from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    -- The route handler needs the rate limiter. Reward selection is granted so
    -- an operator can run it from a secure server-side context as well as the
    -- SQL Editor; it is never reachable from the browser.
    grant execute on function public.record_submission_attempt(text, integer, integer) to service_role;
    grant execute on function public.prune_submission_attempts(interval)      to service_role;
    grant execute on function public.select_reward_winners(integer)           to service_role;
    grant execute on function public.mark_reward_notified(uuid[])             to service_role;
  end if;
end
$$;
