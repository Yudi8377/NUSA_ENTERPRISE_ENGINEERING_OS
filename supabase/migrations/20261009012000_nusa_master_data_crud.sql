-- NUSA master data: organizations, projects, employees and assets.
-- Tenant isolation is enforced in Postgres; child project links must belong to the same tenant.
alter table public.nusa_tenants
  add column if not exists legal_name text,
  add column if not exists industry text,
  add column if not exists tax_id text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists phone text,
  add column if not exists contact_email text,
  add column if not exists website text;

create unique index if not exists idx_nusa_projects_tenant_id_id on public.nusa_projects(tenant_id,id);

create table if not exists public.nusa_employees (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.nusa_tenants(id) on delete cascade,
  project_id uuid,
  employee_code text not null,
  full_name text not null,
  email text,
  phone text,
  position_title text,
  employment_status text not null default 'active' check (employment_status in ('active','leave','inactive','contractor')),
  joined_on date,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (tenant_id, employee_code),
  constraint nusa_employees_project_tenant_fk foreign key (tenant_id,project_id) references public.nusa_projects(tenant_id,id) on delete set null (project_id)
);

create unique index if not exists idx_nusa_employees_tenant_id_id on public.nusa_employees(tenant_id,id);

create table if not exists public.nusa_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.nusa_tenants(id) on delete cascade,
  project_id uuid,
  assigned_employee_id uuid,
  asset_code text not null,
  name text not null,
  category text not null default 'general',
  condition_status text not null default 'good' check (condition_status in ('new','good','maintenance','damaged','disposed')),
  asset_status text not null default 'available' check (asset_status in ('available','assigned','in_use','maintenance','retired')),
  acquisition_date date,
  acquisition_cost numeric(20,2) check (acquisition_cost is null or acquisition_cost >= 0),
  location text,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (tenant_id, asset_code),
  constraint nusa_assets_project_tenant_fk foreign key (tenant_id,project_id) references public.nusa_projects(tenant_id,id) on delete set null (project_id),
  constraint nusa_assets_employee_tenant_fk foreign key (tenant_id,assigned_employee_id) references public.nusa_employees(tenant_id,id) on delete set null (assigned_employee_id)
);

create table if not exists public.nusa_master_data_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.nusa_tenants(id) on delete cascade,
  entity_table text not null check (entity_table in ('nusa_tenants','nusa_projects','nusa_employees','nusa_assets')),
  entity_id uuid not null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('INSERT','UPDATE')),
  before_state jsonb,
  after_state jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_nusa_employees_tenant_project on public.nusa_employees(tenant_id,project_id) where archived_at is null;
create index if not exists idx_nusa_assets_tenant_project on public.nusa_assets(tenant_id,project_id) where archived_at is null;
create index if not exists idx_nusa_master_events_tenant_created on public.nusa_master_data_events(tenant_id,created_at desc);

alter table public.nusa_employees enable row level security;
alter table public.nusa_assets enable row level security;
alter table public.nusa_master_data_events enable row level security;

drop policy if exists nusa_tenants_owner_update on public.nusa_tenants;
create policy nusa_tenants_owner_update on public.nusa_tenants for update to authenticated
using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_tenants.id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin')))
with check (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_tenants.id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin')));

drop policy if exists nusa_projects_member_insert on public.nusa_projects;
create policy nusa_projects_member_insert on public.nusa_projects for insert to authenticated
with check (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_projects.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','project_manager','engineering_lead')));
drop policy if exists nusa_projects_member_update on public.nusa_projects;
create policy nusa_projects_member_update on public.nusa_projects for update to authenticated
using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_projects.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','project_manager','engineering_lead')))
with check (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_projects.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','project_manager','engineering_lead')));
grant select, insert, update on public.nusa_projects to authenticated;
revoke delete on public.nusa_projects from anon,authenticated;

drop policy if exists nusa_employees_member_select on public.nusa_employees;
create policy nusa_employees_member_select on public.nusa_employees for select to authenticated
using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_employees.tenant_id and m.user_id=(select auth.uid())));
drop policy if exists nusa_employees_manager_insert on public.nusa_employees;
create policy nusa_employees_manager_insert on public.nusa_employees for insert to authenticated
with check (created_by=(select auth.uid()) and updated_by=(select auth.uid()) and exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_employees.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','hr_manager')));
drop policy if exists nusa_employees_manager_update on public.nusa_employees;
create policy nusa_employees_manager_update on public.nusa_employees for update to authenticated
using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_employees.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','hr_manager')))
with check (updated_by=(select auth.uid()) and exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_employees.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','hr_manager')));
grant select,insert,update on public.nusa_employees to authenticated;
revoke delete on public.nusa_employees from anon,authenticated;

drop policy if exists nusa_assets_member_select on public.nusa_assets;
create policy nusa_assets_member_select on public.nusa_assets for select to authenticated
using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_assets.tenant_id and m.user_id=(select auth.uid())));
drop policy if exists nusa_assets_manager_insert on public.nusa_assets;
create policy nusa_assets_manager_insert on public.nusa_assets for insert to authenticated
with check (created_by=(select auth.uid()) and updated_by=(select auth.uid()) and exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_assets.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','asset_manager')));
drop policy if exists nusa_assets_manager_update on public.nusa_assets;
create policy nusa_assets_manager_update on public.nusa_assets for update to authenticated
using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_assets.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','asset_manager')))
with check (updated_by=(select auth.uid()) and exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_assets.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','asset_manager')));
grant select,insert,update on public.nusa_assets to authenticated;
revoke delete on public.nusa_assets from anon,authenticated;

drop policy if exists nusa_master_data_events_member_select on public.nusa_master_data_events;
create policy nusa_master_data_events_member_select on public.nusa_master_data_events for select to authenticated
using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_master_data_events.tenant_id and m.user_id=(select auth.uid())));
grant select on public.nusa_master_data_events to authenticated;
revoke insert,update,delete on public.nusa_master_data_events from anon,authenticated;

create or replace function public.nusa_capture_master_data_event()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_tenant uuid; v_id uuid;
begin
  if tg_op='INSERT' then
    if tg_table_name='nusa_tenants' then v_tenant:=new.id; else v_tenant:=new.tenant_id; end if;
    v_id:=new.id;
    insert into public.nusa_master_data_events(tenant_id,entity_table,entity_id,actor_id,action,after_state)
    values(v_tenant,tg_table_name,v_id,(select auth.uid()),'INSERT',to_jsonb(new));
    return new;
  end if;
  if tg_table_name='nusa_tenants' then v_tenant:=new.id; else v_tenant:=new.tenant_id; end if;
  v_id:=new.id;
  new.updated_at:=now();
  insert into public.nusa_master_data_events(tenant_id,entity_table,entity_id,actor_id,action,before_state,after_state)
  values(v_tenant,tg_table_name,v_id,(select auth.uid()),'UPDATE',to_jsonb(old),to_jsonb(new));
  return new;
end; $$;
revoke all on function public.nusa_capture_master_data_event() from public,anon,authenticated;
drop trigger if exists nusa_projects_master_event on public.nusa_projects;
create trigger nusa_projects_master_event before insert or update on public.nusa_projects for each row execute function public.nusa_capture_master_data_event();
drop trigger if exists nusa_employees_master_event on public.nusa_employees;
create trigger nusa_employees_master_event before insert or update on public.nusa_employees for each row execute function public.nusa_capture_master_data_event();
drop trigger if exists nusa_assets_master_event on public.nusa_assets;
create trigger nusa_assets_master_event before insert or update on public.nusa_assets for each row execute function public.nusa_capture_master_data_event();
drop trigger if exists nusa_tenants_master_event on public.nusa_tenants;
create trigger nusa_tenants_master_event before insert or update on public.nusa_tenants for each row execute function public.nusa_capture_master_data_event();
