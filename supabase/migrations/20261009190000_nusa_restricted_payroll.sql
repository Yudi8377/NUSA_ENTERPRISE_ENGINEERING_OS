-- Dedicated restricted payroll storage. Do not put individual compensation in generic workspace JSON.
create table if not exists public.nusa_payroll_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.nusa_tenants(id) on delete cascade,
  period_code text not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft','attendance_review','hr_review','finance_review','approved','paid','closed','void')),
  currency char(3) not null default 'IDR' check (currency='IDR'),
  prepared_by uuid not null references auth.users(id) on delete restrict,
  reviewed_by uuid references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete restrict,
  paid_by uuid references auth.users(id) on delete restrict,
  approved_at timestamptz,
  paid_at timestamptz,
  payment_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id,period_code),
  check(period_end >= period_start),
  check(approved_by is null or approved_by <> prepared_by)
);
create table if not exists public.nusa_payroll_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.nusa_tenants(id) on delete cascade,
  payroll_run_id uuid not null references public.nusa_payroll_runs(id) on delete cascade,
  employee_id uuid not null references public.nusa_employees(id) on delete restrict,
  attendance_record_id uuid references public.nusa_workspace_records(id) on delete set null,
  base_salary numeric(20,2) not null default 0 check(base_salary>=0),
  fixed_allowance numeric(20,2) not null default 0 check(fixed_allowance>=0),
  position_allowance numeric(20,2) not null default 0 check(position_allowance>=0),
  overtime_hours numeric(10,2) not null default 0 check(overtime_hours>=0),
  overtime_rate numeric(20,2) not null default 0 check(overtime_rate>=0),
  overtime_pay numeric(20,2) not null default 0 check(overtime_pay>=0),
  bonus numeric(20,2) not null default 0 check(bonus>=0),
  incentive numeric(20,2) not null default 0 check(incentive>=0),
  thr numeric(20,2) not null default 0 check(thr>=0),
  sick_leave_days numeric(8,2) not null default 0 check(sick_leave_days>=0),
  unpaid_leave_days numeric(8,2) not null default 0 check(unpaid_leave_days>=0),
  unpaid_leave_deduction numeric(20,2) not null default 0 check(unpaid_leave_deduction>=0),
  bpjs_health_employee numeric(20,2) not null default 0 check(bpjs_health_employee>=0),
  bpjs_employment_employee numeric(20,2) not null default 0 check(bpjs_employment_employee>=0),
  pph21 numeric(20,2) not null default 0 check(pph21>=0),
  other_deductions numeric(20,2) not null default 0 check(other_deductions>=0),
  gross_pay numeric(20,2) not null default 0 check(gross_pay>=0),
  net_pay numeric(20,2) not null default 0 check(net_pay>=0),
  calculation_version text not null default 'manual-reviewed-v1',
  calculation_notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(payroll_run_id,employee_id),
  check(gross_pay = base_salary + fixed_allowance + position_allowance + overtime_pay + bonus + incentive + thr),
  check(net_pay = gross_pay - unpaid_leave_deduction - bpjs_health_employee - bpjs_employment_employee - pph21 - other_deductions)
);
create index if not exists idx_nusa_payroll_runs_tenant_period on public.nusa_payroll_runs(tenant_id,period_start desc);
create index if not exists idx_nusa_payroll_lines_tenant_run on public.nusa_payroll_lines(tenant_id,payroll_run_id);
create index if not exists idx_nusa_payroll_lines_employee on public.nusa_payroll_lines(tenant_id,employee_id);

alter table public.nusa_payroll_runs enable row level security;
alter table public.nusa_payroll_lines enable row level security;
revoke all on public.nusa_payroll_runs from anon, authenticated;
revoke all on public.nusa_payroll_lines from anon, authenticated;
grant select,insert,update on public.nusa_payroll_runs to authenticated;
grant select,insert,update on public.nusa_payroll_lines to authenticated;

drop policy if exists nusa_payroll_runs_restricted_select on public.nusa_payroll_runs;
create policy nusa_payroll_runs_restricted_select on public.nusa_payroll_runs for select to authenticated using (
  exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_payroll_runs.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','hr_manager','payroll_manager','payroll','finance_manager','finance'))
);
drop policy if exists nusa_payroll_runs_restricted_insert on public.nusa_payroll_runs;
create policy nusa_payroll_runs_restricted_insert on public.nusa_payroll_runs for insert to authenticated with check (
  prepared_by=(select auth.uid()) and status='draft' and approved_by is null and paid_by is null and
  exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_payroll_runs.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','hr_manager','payroll_manager','payroll'))
);
drop policy if exists nusa_payroll_runs_restricted_update on public.nusa_payroll_runs;
create policy nusa_payroll_runs_restricted_update on public.nusa_payroll_runs for update to authenticated using (
  exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_payroll_runs.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','hr_manager','payroll_manager','payroll','finance_manager','finance'))
) with check (
  approved_by is distinct from prepared_by and
  exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_payroll_runs.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','hr_manager','payroll_manager','payroll','finance_manager','finance'))
);
drop policy if exists nusa_payroll_lines_restricted_select on public.nusa_payroll_lines;
create policy nusa_payroll_lines_restricted_select on public.nusa_payroll_lines for select to authenticated using (
  exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_payroll_lines.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','hr_manager','payroll_manager','payroll','finance_manager','finance'))
);
drop policy if exists nusa_payroll_lines_restricted_insert on public.nusa_payroll_lines;
create policy nusa_payroll_lines_restricted_insert on public.nusa_payroll_lines for insert to authenticated with check (
  created_by=(select auth.uid()) and updated_by=(select auth.uid()) and
  exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_payroll_lines.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','hr_manager','payroll_manager','payroll'))
  and exists(select 1 from public.nusa_payroll_runs r where r.id=payroll_run_id and r.tenant_id=nusa_payroll_lines.tenant_id and r.status in ('draft','attendance_review','hr_review'))
  and exists(select 1 from public.nusa_employees e where e.id=employee_id and e.tenant_id=nusa_payroll_lines.tenant_id)
);
drop policy if exists nusa_payroll_lines_restricted_update on public.nusa_payroll_lines;
create policy nusa_payroll_lines_restricted_update on public.nusa_payroll_lines for update to authenticated using (
  exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_payroll_lines.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','hr_manager','payroll_manager','payroll'))
) with check (
  updated_by=(select auth.uid()) and
  exists(select 1 from public.nusa_payroll_runs r where r.id=payroll_run_id and r.tenant_id=nusa_payroll_lines.tenant_id and r.status in ('draft','attendance_review','hr_review'))
);
revoke delete on public.nusa_payroll_runs from anon,authenticated;
revoke delete on public.nusa_payroll_lines from anon,authenticated;

create or replace function public.nusa_payroll_run_updated_at()
returns trigger language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
  new.updated_at := now();
  if tg_op='UPDATE' and old.status in ('approved','paid','closed') and new.status<>old.status then
    raise exception 'Approved/paid/closed payroll runs cannot be reopened through direct update';
  end if;
  if tg_op='UPDATE' and new.status='approved' then
    if new.prepared_by=(select auth.uid()) then raise exception 'Payroll preparer cannot approve own run'; end if;
    if not exists(select 1 from public.nusa_memberships m where m.tenant_id=new.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','finance_manager')) then
      raise exception 'Independent finance approver role required';
    end if;
    new.approved_by := (select auth.uid());
    new.approved_at := now();
  end if;
  if tg_op='UPDATE' and new.status='paid' then
    if old.status<>'approved' then raise exception 'Only an approved payroll run can be marked paid'; end if;
    if not exists(select 1 from public.nusa_memberships m where m.tenant_id=new.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','finance_manager','finance')) then
      raise exception 'Finance role required to record payment';
    end if;
    new.paid_by := (select auth.uid());
    new.paid_at := now();
  end if;
  return new;
end $$;
revoke all on function public.nusa_payroll_run_updated_at() from public,anon,authenticated;
drop trigger if exists nusa_payroll_run_guard on public.nusa_payroll_runs;
create trigger nusa_payroll_run_guard before update on public.nusa_payroll_runs for each row execute function public.nusa_payroll_run_updated_at();

create or replace function public.nusa_payroll_line_updated_at()
returns trigger language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
  new.updated_at := now();
  if new.updated_by is distinct from (select auth.uid()) then raise exception 'updated_by must match current user'; end if;
  return new;
end $$;
revoke all on function public.nusa_payroll_line_updated_at() from public,anon,authenticated;
drop trigger if exists nusa_payroll_line_guard on public.nusa_payroll_lines;
create trigger nusa_payroll_line_guard before insert or update on public.nusa_payroll_lines for each row execute function public.nusa_payroll_line_updated_at();
