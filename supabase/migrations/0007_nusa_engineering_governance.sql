create table if not exists public.nusa_engineering_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.nusa_tenants(id) on delete cascade,
  project_id uuid references public.nusa_projects(id) on delete set null,
  requested_by uuid references auth.users(id) on delete set null,
  agent_code text references public.nusa_agents(code) on delete set null,
  run_type text not null,
  status text not null default 'queued' check(status in ('queued','running','review','approved','rejected','completed','failed','cancelled')),
  criticality text not null default 'normal' check(criticality in ('normal','high','critical')),
  input jsonb not null default '{}'::jsonb,
  assumptions jsonb not null default '[]'::jsonb,
  outputs jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  source_hash text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.nusa_approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.nusa_tenants(id) on delete cascade,
  project_id uuid references public.nusa_projects(id) on delete set null,
  run_id uuid references public.nusa_engineering_runs(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  decided_by uuid references auth.users(id) on delete set null,
  approval_type text not null,
  status text not null default 'pending' check(status in ('pending','approved','rejected','returned','recalled')),
  decision_note text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists idx_nusa_engineering_runs_project on public.nusa_engineering_runs(tenant_id,project_id,created_at desc);
create index if not exists idx_nusa_approvals_pending on public.nusa_approvals(tenant_id,status,created_at desc);
alter table public.nusa_engineering_runs enable row level security;
alter table public.nusa_approvals enable row level security;
create policy nusa_engineering_runs_member_select on public.nusa_engineering_runs for select to authenticated
using(exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_engineering_runs.tenant_id and m.user_id=auth.uid()));
create policy nusa_engineering_runs_member_insert on public.nusa_engineering_runs for insert to authenticated
with check((requested_by is null or requested_by=auth.uid()) and exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_engineering_runs.tenant_id and m.user_id=auth.uid()));
create policy nusa_engineering_runs_member_update on public.nusa_engineering_runs for update to authenticated
using(exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_engineering_runs.tenant_id and m.user_id=auth.uid()))
with check(exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_engineering_runs.tenant_id and m.user_id=auth.uid()));
create policy nusa_approvals_member_select on public.nusa_approvals for select to authenticated
using(exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_approvals.tenant_id and m.user_id=auth.uid()));
create policy nusa_approvals_member_insert on public.nusa_approvals for insert to authenticated
with check((requested_by is null or requested_by=auth.uid()) and exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_approvals.tenant_id and m.user_id=auth.uid()));
create policy nusa_approvals_member_update on public.nusa_approvals for update to authenticated
using(exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_approvals.tenant_id and m.user_id=auth.uid()))
with check(exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_approvals.tenant_id and m.user_id=auth.uid()));
