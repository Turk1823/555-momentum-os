-- 555 MomentumOS beta data collection schema
-- Run this in the Supabase SQL editor before enabling live submissions.

create table if not exists public.momentumos_beta_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  name text not null,
  email text not null,
  company text not null,
  role text not null,
  email_capture text,
  total_score integer not null check (total_score between 0 and 100),
  maturity_level text not null,
  lowest_category_key text not null,
  lowest_category_name text not null,
  lowest_category_score integer not null check (lowest_category_score between 0 and 20),
  highest_category_key text not null,
  highest_category_name text not null,
  highest_category_score integer not null check (highest_category_score between 0 and 20),
  primary_constraint text not null,
  category_scores jsonb not null,
  question_scores jsonb not null,
  executive_summary text not null
);

alter table public.momentumos_beta_submissions enable row level security;

drop policy if exists "Allow beta assessment inserts" on public.momentumos_beta_submissions;
create policy "Allow beta assessment inserts"
  on public.momentumos_beta_submissions
  for insert
  to anon, authenticated
  with check (true);

create index if not exists momentumos_beta_submissions_submitted_at_idx
  on public.momentumos_beta_submissions (submitted_at desc);

create index if not exists momentumos_beta_submissions_company_idx
  on public.momentumos_beta_submissions (company);

create index if not exists momentumos_beta_submissions_lowest_category_idx
  on public.momentumos_beta_submissions (lowest_category_key);

create or replace view public.momentumos_beta_admin_summary as
select
  date_trunc('day', submitted_at) as submission_day,
  count(*) as submissions,
  round(avg(total_score), 1) as average_total_score,
  lowest_category_key,
  lowest_category_name,
  count(*) filter (where lowest_category_key is not null) as lowest_category_count
from public.momentumos_beta_submissions
group by 1, lowest_category_key, lowest_category_name
order by submission_day desc, lowest_category_count desc;
