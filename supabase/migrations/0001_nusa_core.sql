create extension if not exists pgcrypto;

create table if not exists public.nusa_tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  status text not null default 'active' check (status in ('active','suspended','archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nusa_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.nusa_tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_code text not null default 'member',
  created_at timestamptz not null default now(),
  unique (tenant_id,user_id)
);

create table if not exists public.nusa_settings (
  tenant_id uuid primary key references public.nusa_tenants(id) on delete cascade,
  locale text not null default 'id-ID',
  timezone text not null default 'Asia/Jakarta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nusa_projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.nusa_tenants(id) on delete cascade,
  code text not null,
  name text not null,
  category text not null default 'engineering',
  status text not null default 'active',
  progress numeric(5,2) not null default 0 check (progress >= 0 and progress <= 100),
  budget numeric(20,2),
  target_date date,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id,code)
);

create table if not exists public.nusa_agents (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  domain text not null,
  status text not null default 'ready',
  risk_level text not null default 'normal',
  requires_approval boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nusa_commands (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.nusa_tenants(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete restrict,
  project_id uuid references public.nusa_projects(id) on delete set null,
  intent text not null,
  action_code text not null default 'ASK_NUSA',
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_nusa_memberships_user on public.nusa_memberships(user_id);
create index if not exists idx_nusa_memberships_tenant on public.nusa_memberships(tenant_id);
create index if not exists idx_nusa_projects_tenant on public.nusa_projects(tenant_id) where deleted_at is null;
create index if not exists idx_nusa_commands_tenant_created on public.nusa_commands(tenant_id,created_at desc);

alter table public.nusa_tenants enable row level security;
alter table public.nusa_memberships enable row level security;
alter table public.nusa_settings enable row level security;
alter table public.nusa_projects enable row level security;
alter table public.nusa_agents enable row level security;
alter table public.nusa_commands enable row level security;

create policy nusa_tenants_select_member on public.nusa_tenants for select to authenticated
using (exists (select 1 from public.nusa_memberships m where m.tenant_id=id and m.user_id=auth.uid()));
create policy nusa_memberships_select_self on public.nusa_memberships for select to authenticated
using (user_id=auth.uid());
create policy nusa_settings_select_member on public.nusa_settings for select to authenticated
using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_settings.tenant_id and m.user_id=auth.uid()));
create policy nusa_projects_member_select on public.nusa_projects for select to authenticated
using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_projects.tenant_id and m.user_id=auth.uid()));
create policy nusa_agents_authenticated_select on public.nusa_agents for select to authenticated
using (true);
create policy nusa_commands_member_insert on public.nusa_commands for insert to authenticated
with check (requested_by=auth.uid() and exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_commands.tenant_id and m.user_id=auth.uid()));
create policy nusa_commands_member_select on public.nusa_commands for select to authenticated
using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_commands.tenant_id and m.user_id=auth.uid()));

create or replace function public.nusa_create_workspace(p_name text,p_code text)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if nullif(trim(p_name),'') is null or nullif(trim(p_code),'') is null then raise exception 'workspace name and code are required'; end if;
  insert into public.nusa_tenants(name,code,created_by) values(trim(p_name),upper(trim(p_code)),auth.uid()) returning id into v_id;
  insert into public.nusa_memberships(tenant_id,user_id,role_code) values(v_id,auth.uid(),'owner');
  insert into public.nusa_settings(tenant_id) values(v_id);
  return v_id;
end
$$;

revoke all on function public.nusa_create_workspace(text,text) from public, anon;
grant execute on function public.nusa_create_workspace(text,text) to authenticated;

insert into public.nusa_agents(code,name,domain,status,risk_level,requires_approval) values
('nusa.orchestrator','NUSA Orchestrator','orchestration','online','normal',false),
('engineering.structural','Structural Engineer','structural','ready','high',true),
('engineering.sap2000','SAP2000 Copilot','structural-analysis','ready','critical',true),
('engineering.geotechnical','Geotechnical Agent','geotechnical','ready','high',true),
('engineering.seismic','Seismic Engine','seismic','ready','critical',true),
('bim.coordinator','BIM Coordinator','bim','ready','high',true),
('qs.estimator','QS / Estimator','quantity-surveying','ready','medium',false),
('field.vision','Vision QA Agent','field-intelligence','ready','high',true)
on conflict (code) do update set name=excluded.name,domain=excluded.domain,status=excluded.status,risk_level=excluded.risk_level,requires_approval=excluded.requires_approval,updated_at=now();
