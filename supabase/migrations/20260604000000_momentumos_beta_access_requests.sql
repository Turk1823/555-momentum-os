create extension if not exists "pgcrypto";

create table if not exists public.momentumos_beta_access_requests (
  id uuid primary key default gen_random_uuid(),
  submission_id text,
  first_name text,
  work_email text not null,
  company text,
  role_title text,
  momentum_score integer,
  primary_constraint text,
  maturity_level text,
  strongest_category text,
  weakest_category text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.momentumos_beta_access_requests enable row level security;

drop policy if exists "Allow beta access request inserts" on public.momentumos_beta_access_requests;
create policy "Allow beta access request inserts"
  on public.momentumos_beta_access_requests
  for insert
  to anon, authenticated
  with check (true);

create index if not exists momentumos_beta_access_requests_work_email_idx
  on public.momentumos_beta_access_requests (work_email);

create index if not exists momentumos_beta_access_requests_company_idx
  on public.momentumos_beta_access_requests (company);

create index if not exists momentumos_beta_access_requests_status_idx
  on public.momentumos_beta_access_requests (status);

create index if not exists momentumos_beta_access_requests_created_at_idx
  on public.momentumos_beta_access_requests (created_at desc);
