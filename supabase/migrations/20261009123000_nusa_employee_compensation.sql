create table if not exists public.nusa_employee_compensation (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.nusa_tenants(id) on delete cascade,
  employee_id uuid not null references public.nusa_employees(id) on delete restrict,
  effective_from date not null,
  effective_to date,
  base_salary numeric(20,2) not null check(base_salary>=0),
  fixed_allowance numeric(20,2) not null default 0 check(fixed_allowance>=0),
  position_allowance numeric(20,2) not null default 0 check(position_allowance>=0),
  overtime_rate numeric(20,2) not null default 0 check(overtime_rate>=0),
  currency char(3) not null default 'IDR' check(currency='IDR'),
  policy_reference text,
  status text not null default 'active' check(status in ('active','inactive','superseded')),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(effective_to is null or effective_to>=effective_from),
  unique(tenant_id,employee_id,effective_from)
);
create index if not exists idx_nusa_employee_compensation_effective on public.nusa_employee_compensation(tenant_id,employee_id,effective_from desc);
alter table public.nusa_employee_compensation enable row level security;
revoke all on public.nusa_employee_compensation from anon,authenticated;
grant select,insert,update on public.nusa_employee_compensation to authenticated;
drop policy if exists nusa_employee_compensation_restricted_select on public.nusa_employee_compensation;
create policy nusa_employee_compensation_restricted_select on public.nusa_employee_compensation for select to authenticated using (
  exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_employee_compensation.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','hr_manager','payroll_manager','payroll','finance_manager','finance'))
);
drop policy if exists nusa_employee_compensation_restricted_insert on public.nusa_employee_compensation;
create policy nusa_employee_compensation_restricted_insert on public.nusa_employee_compensation for insert to authenticated with check (
  created_by=(select auth.uid()) and updated_by=(select auth.uid()) and
  exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_employee_compensation.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','hr_manager','payroll_manager','payroll'))
  and exists(select 1 from public.nusa_employees e where e.id=employee_id and e.tenant_id=nusa_employee_compensation.tenant_id)
);
drop policy if exists nusa_employee_compensation_restricted_update on public.nusa_employee_compensation;
create policy nusa_employee_compensation_restricted_update on public.nusa_employee_compensation for update to authenticated using (
  exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_employee_compensation.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','hr_manager','payroll_manager','payroll'))
) with check (
  updated_by=(select auth.uid()) and
  exists(select 1 from public.nusa_employees e where e.id=employee_id and e.tenant_id=nusa_employee_compensation.tenant_id)
);
revoke delete on public.nusa_employee_compensation from anon,authenticated;
create or replace function public.nusa_employee_compensation_guard()
returns trigger language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
  new.updated_at := now();
  if new.updated_by is distinct from (select auth.uid()) then raise exception 'updated_by must match current user'; end if;
  if not exists(select 1 from public.nusa_employees e where e.id=new.employee_id and e.tenant_id=new.tenant_id) then raise exception 'Employee must belong to the same organization'; end if;
  if exists(select 1 from public.nusa_employee_compensation c where c.tenant_id=new.tenant_id and c.employee_id=new.employee_id and c.id<>new.id and daterange(c.effective_from,coalesce(c.effective_to,'infinity'::date),'[]') && daterange(new.effective_from,coalesce(new.effective_to,'infinity'::date),'[]')) then
    raise exception 'Effective compensation periods cannot overlap for one employee';
  end if;
  return new;
end $$;
revoke all on function public.nusa_employee_compensation_guard() from public,anon,authenticated;
drop trigger if exists nusa_employee_compensation_guard_trigger on public.nusa_employee_compensation;
create trigger nusa_employee_compensation_guard_trigger before insert or update on public.nusa_employee_compensation for each row execute function public.nusa_employee_compensation_guard();
