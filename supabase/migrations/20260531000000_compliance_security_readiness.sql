-- MomentumOS Compliance & Security Readiness Layer

alter table public.companies
  add column if not exists deleted_at timestamptz,
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_requested_by uuid references public.user_profiles(id) on delete set null;

alter table public.user_profiles
  add column if not exists deleted_at timestamptz,
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_requested_by uuid references public.user_profiles(id) on delete set null;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references public.user_profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_company_id_idx
  on public.audit_logs (company_id);

create index if not exists audit_logs_user_id_idx
  on public.audit_logs (user_id);

create index if not exists audit_logs_action_idx
  on public.audit_logs (action);

create index if not exists audit_logs_entity_idx
  on public.audit_logs (entity_type, entity_id);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

create table if not exists public.ai_activity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references public.user_profiles(id) on delete set null,
  feature text not null,
  input_summary text,
  output_summary text,
  model_used text,
  created_at timestamptz not null default now()
);

create index if not exists ai_activity_logs_company_id_idx
  on public.ai_activity_logs (company_id);

create index if not exists ai_activity_logs_user_id_idx
  on public.ai_activity_logs (user_id);

create index if not exists ai_activity_logs_feature_idx
  on public.ai_activity_logs (feature);

create index if not exists ai_activity_logs_created_at_idx
  on public.ai_activity_logs (created_at desc);

create table if not exists public.data_retention_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  label text not null,
  retention_period text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists data_retention_settings_setting_key_idx
  on public.data_retention_settings (setting_key);

insert into public.data_retention_settings (
  setting_key,
  label,
  retention_period,
  description
)
values
  (
    'assessment_data',
    'Assessment Data',
    'retained_until_deletion',
    'Assessment records are retained until a user, company admin, or platform admin deletion workflow is completed.'
  ),
  (
    'ai_activity_logs',
    'AI Activity Logs',
    '12_months',
    'AI activity metadata is retained for 12 months by default. Full sensitive prompts should not be stored here.'
  ),
  (
    'integration_sync_logs',
    'Integration Sync Logs',
    '90_days',
    'Integration sync metadata is retained for 90 days by default.'
  )
on conflict (setting_key) do update
set
  label = excluded.label,
  retention_period = excluded.retention_period,
  description = excluded.description,
  updated_at = now();

create table if not exists public.subprocessors (
  id uuid primary key default gen_random_uuid(),
  vendor_name text not null unique,
  purpose text not null,
  data_processed text not null,
  region text not null,
  security_link text,
  created_at timestamptz not null default now()
);

create index if not exists subprocessors_vendor_name_idx
  on public.subprocessors (vendor_name);

insert into public.subprocessors (
  vendor_name,
  purpose,
  data_processed,
  region,
  security_link
)
values
  (
    'Supabase',
    'Database, authentication, and platform data storage',
    'Account, company, assessment, usage, audit, and AI activity metadata',
    'Configurable project region',
    'https://supabase.com/security'
  ),
  (
    'Vercel',
    'Application hosting, deployment, and runtime infrastructure',
    'Application logs, deployment metadata, runtime telemetry, and edge delivery metadata',
    'Global edge network',
    'https://vercel.com/security'
  ),
  (
    'OpenAI',
    'AI-generated executive recommendations, briefings, and action plans',
    'Summarised assessment and company performance context for AI generation',
    'Provider-managed processing regions',
    'https://openai.com/security'
  ),
  (
    'Stripe',
    'Billing, subscription, checkout, and payment processing',
    'Billing contact data, Stripe customer IDs, subscription metadata, and payment records',
    'Global',
    'https://stripe.com/docs/security'
  )
on conflict (vendor_name) do update
set
  purpose = excluded.purpose,
  data_processed = excluded.data_processed,
  region = excluded.region,
  security_link = excluded.security_link;

alter table public.audit_logs enable row level security;
alter table public.ai_activity_logs enable row level security;
alter table public.data_retention_settings enable row level security;
alter table public.subprocessors enable row level security;

drop policy if exists "audit logs are readable by platform admins and company members" on public.audit_logs;
create policy "audit logs are readable by platform admins and company members"
  on public.audit_logs
  for select
  to authenticated
  using (
    public.current_user_is_platform_admin()
    or company_id in (select company_id from public.current_user_company_ids())
    or user_id = public.current_user_profile_id()
  );

drop policy if exists "ai activity logs are readable by platform admins and company members" on public.ai_activity_logs;
create policy "ai activity logs are readable by platform admins and company members"
  on public.ai_activity_logs
  for select
  to authenticated
  using (
    public.current_user_is_platform_admin()
    or company_id in (select company_id from public.current_user_company_ids())
    or user_id = public.current_user_profile_id()
  );

drop policy if exists "retention settings are readable by authenticated users" on public.data_retention_settings;
create policy "retention settings are readable by authenticated users"
  on public.data_retention_settings
  for select
  to authenticated
  using (true);

drop policy if exists "subprocessors are readable by authenticated users" on public.subprocessors;
create policy "subprocessors are readable by authenticated users"
  on public.subprocessors
  for select
  to authenticated
  using (true);

drop policy if exists "platform admins can manage retention settings" on public.data_retention_settings;
create policy "platform admins can manage retention settings"
  on public.data_retention_settings
  for all
  to authenticated
  using (public.current_user_is_platform_admin())
  with check (public.current_user_is_platform_admin());

drop policy if exists "platform admins can manage subprocessors" on public.subprocessors;
create policy "platform admins can manage subprocessors"
  on public.subprocessors
  for all
  to authenticated
  using (public.current_user_is_platform_admin())
  with check (public.current_user_is_platform_admin());