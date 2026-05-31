create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  user_profile_id uuid not null references public.user_profiles (id) on delete cascade,
  member_role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (company_id, user_profile_id)
);

create index if not exists company_members_company_id_idx
  on public.company_members (company_id);

create index if not exists company_members_user_profile_id_idx
  on public.company_members (user_profile_id);

alter table public.company_members enable row level security;

drop policy if exists "Users can read their companies" on public.companies;
create policy "Users can read their companies"
  on public.companies
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.company_members
      where company_members.company_id = companies.id
        and company_members.user_profile_id = auth.uid()
    )
  );

drop policy if exists "Users can read own company memberships" on public.company_members;
create policy "Users can read own company memberships"
  on public.company_members
  for select
  to authenticated
  using (user_profile_id = auth.uid());

alter table public.momentumos_beta_submissions
  add column if not exists company_id uuid references public.companies (id) on delete set null,
  add column if not exists user_profile_id uuid references public.user_profiles (id) on delete set null;

create index if not exists momentumos_beta_submissions_company_id_idx
  on public.momentumos_beta_submissions (company_id);

create index if not exists momentumos_beta_submissions_user_profile_id_idx
  on public.momentumos_beta_submissions (user_profile_id);

create or replace view public.platform_company_overview as
select
  companies.id as company_id,
  companies.name as company_name,
  count(momentumos_beta_submissions.*)::integer as assessment_count,
  max((momentumos_beta_submissions.metadata->>'submitted_at')::timestamptz) as latest_assessment_date,
  round(avg(momentumos_beta_submissions.total_score), 1) as average_momentum_score,
  round(avg(momentumos_beta_submissions.strategy_score), 1) as average_strategy_score,
  round(avg(momentumos_beta_submissions.activation_score), 1) as average_activation_score,
  round(avg(momentumos_beta_submissions.cosell_score), 1) as average_cosell_score,
  round(avg(momentumos_beta_submissions.economics_score), 1) as average_economics_score,
  round(avg(momentumos_beta_submissions.velocity_score), 1) as average_velocity_score
from public.companies
left join public.momentumos_beta_submissions
  on momentumos_beta_submissions.company_id = companies.id
group by companies.id, companies.name;
