-- 555 MomentumOS beta data collection schema
-- Matches the exact insert payload used by lib/supabase/submissions.ts.

create table if not exists public.momentumos_beta_submissions (
  name text not null,
  email text not null,
  company text not null,
  role text not null,
  total_score integer not null check (total_score between 0 and 100),
  maturity_level text not null,
  lowest_scoring_category text not null,
  strategy_score integer not null check (strategy_score between 0 and 20),
  activation_score integer not null check (activation_score between 0 and 20),
  cosell_score integer not null check (cosell_score between 0 and 20),
  economics_score integer not null check (economics_score between 0 and 20),
  velocity_score integer not null check (velocity_score between 0 and 20),
  raw_scores jsonb not null,
  metadata jsonb not null
);

alter table public.momentumos_beta_submissions enable row level security;

drop policy if exists "Allow beta assessment inserts" on public.momentumos_beta_submissions;
create policy "Allow beta assessment inserts"
  on public.momentumos_beta_submissions
  for insert
  to anon, authenticated
  with check (true);

create index if not exists momentumos_beta_submissions_company_idx
  on public.momentumos_beta_submissions (company);

create index if not exists momentumos_beta_submissions_lowest_category_idx
  on public.momentumos_beta_submissions (lowest_scoring_category);

create index if not exists momentumos_beta_submissions_metadata_submitted_at_idx
  on public.momentumos_beta_submissions ((metadata->>'submitted_at'));

create or replace view public.momentumos_beta_admin_summary as
select
  date_trunc('day', (metadata->>'submitted_at')::timestamptz) as submission_day,
  count(*) as submissions,
  round(avg(total_score), 1) as average_total_score,
  lowest_scoring_category,
  count(*) filter (where lowest_scoring_category is not null) as lowest_category_count
from public.momentumos_beta_submissions
group by 1, lowest_scoring_category
order by submission_day desc, lowest_category_count desc;
