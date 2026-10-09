-- Enterprise workspace records: tenant-scoped CRUD with append-only event evidence.
create table if not exists public.nusa_workspace_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.nusa_tenants(id) on delete cascade,
  project_id uuid references public.nusa_projects(id) on delete set null,
  module_code text not null check (module_code in ('erp','crm','hr','procurement','reports','grc')),
  record_type text not null, record_code text, title text not null, description text,
  status text not null default 'draft' check (status in ('draft','open','submitted','approved','rejected','closed','archived','void')),
  amount numeric(20,2), currency char(3) not null default 'IDR', data jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique (tenant_id,module_code,record_type,record_code)
);
create index if not exists idx_nusa_workspace_records_tenant_module_updated on public.nusa_workspace_records(tenant_id,module_code,updated_at desc) where archived_at is null;
create index if not exists idx_nusa_workspace_records_project on public.nusa_workspace_records(tenant_id,project_id) where project_id is not null;
alter table public.nusa_workspace_records enable row level security;
create policy nusa_workspace_records_member_select on public.nusa_workspace_records for select to authenticated using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_workspace_records.tenant_id and m.user_id=auth.uid()));
create policy nusa_workspace_records_member_insert on public.nusa_workspace_records for insert to authenticated with check (created_by=auth.uid() and updated_by=auth.uid() and exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_workspace_records.tenant_id and m.user_id=auth.uid()));
create policy nusa_workspace_records_member_update on public.nusa_workspace_records for update to authenticated using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_workspace_records.tenant_id and m.user_id=auth.uid())) with check (updated_by=auth.uid() and exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_workspace_records.tenant_id and m.user_id=auth.uid()));
revoke delete on public.nusa_workspace_records from anon, authenticated;
grant select, insert, update on public.nusa_workspace_records to authenticated;
create table if not exists public.nusa_workspace_record_events (
  id uuid primary key default gen_random_uuid(), record_id uuid not null references public.nusa_workspace_records(id) on delete restrict,
  tenant_id uuid not null references public.nusa_tenants(id) on delete cascade, actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('INSERT','UPDATE')), before_state jsonb, after_state jsonb not null, created_at timestamptz not null default now()
);
create index if not exists idx_nusa_workspace_record_events_tenant_time on public.nusa_workspace_record_events(tenant_id,created_at desc);
alter table public.nusa_workspace_record_events enable row level security;
create policy nusa_workspace_record_events_member_select on public.nusa_workspace_record_events for select to authenticated using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_workspace_record_events.tenant_id and m.user_id=auth.uid()));
revoke insert, update, delete on public.nusa_workspace_record_events from anon, authenticated;
grant select on public.nusa_workspace_record_events to authenticated;
create or replace function public.nusa_capture_workspace_record_event() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if tg_op='INSERT' then
  insert into public.nusa_workspace_record_events(record_id,tenant_id,actor_id,action,after_state) values(new.id,new.tenant_id,auth.uid(),'INSERT',to_jsonb(new));
  return new;
 end if;
 new.updated_at:=now();
 insert into public.nusa_workspace_record_events(record_id,tenant_id,actor_id,action,before_state,after_state) values(new.id,new.tenant_id,auth.uid(),'UPDATE',to_jsonb(old),to_jsonb(new));
 return new;
end; $$;
revoke all on function public.nusa_capture_workspace_record_event() from public,anon,authenticated;
create trigger nusa_workspace_record_event_capture before insert or update on public.nusa_workspace_records for each row execute function public.nusa_capture_workspace_record_event();
