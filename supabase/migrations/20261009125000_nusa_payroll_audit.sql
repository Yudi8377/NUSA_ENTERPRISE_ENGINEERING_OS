create table if not exists public.nusa_payroll_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.nusa_tenants(id) on delete cascade,
  payroll_run_id uuid references public.nusa_payroll_runs(id) on delete cascade,
  payroll_line_id uuid references public.nusa_payroll_lines(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check(action in ('INSERT','UPDATE')),
  before_state jsonb,
  after_state jsonb not null,
  created_at timestamptz not null default now(),
  check(payroll_run_id is not null or payroll_line_id is not null)
);
create index if not exists idx_nusa_payroll_events_tenant_time on public.nusa_payroll_events(tenant_id,created_at desc);
create index if not exists idx_nusa_payroll_events_run on public.nusa_payroll_events(payroll_run_id,created_at desc) where payroll_run_id is not null;
create index if not exists idx_nusa_payroll_events_line on public.nusa_payroll_events(payroll_line_id,created_at desc) where payroll_line_id is not null;
alter table public.nusa_payroll_events enable row level security;
revoke all on public.nusa_payroll_events from anon,authenticated;
grant select on public.nusa_payroll_events to authenticated;
drop policy if exists nusa_payroll_events_restricted_select on public.nusa_payroll_events;
create policy nusa_payroll_events_restricted_select on public.nusa_payroll_events for select to authenticated using (
 exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_payroll_events.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','hr_manager','payroll_manager','payroll','finance_manager','finance'))
);
create or replace function public.nusa_capture_payroll_event()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_tenant uuid; v_run uuid; v_line uuid;
begin
 if tg_table_name='nusa_payroll_runs' then
   v_tenant:=coalesce(new.tenant_id,old.tenant_id);
   v_run:=coalesce(new.id,old.id);
   if tg_op='INSERT' then
     insert into public.nusa_payroll_events(tenant_id,payroll_run_id,actor_id,action,after_state) values(v_tenant,v_run,auth.uid(),'INSERT',to_jsonb(new));
     return new;
   end if;
   insert into public.nusa_payroll_events(tenant_id,payroll_run_id,actor_id,action,before_state,after_state) values(v_tenant,v_run,auth.uid(),'UPDATE',to_jsonb(old),to_jsonb(new));
   return new;
 else
   v_tenant:=coalesce(new.tenant_id,old.tenant_id);
   v_run:=coalesce(new.payroll_run_id,old.payroll_run_id);
   v_line:=coalesce(new.id,old.id);
   if tg_op='INSERT' then
     insert into public.nusa_payroll_events(tenant_id,payroll_run_id,payroll_line_id,actor_id,action,after_state) values(v_tenant,v_run,v_line,auth.uid(),'INSERT',to_jsonb(new));
     return new;
   end if;
   insert into public.nusa_payroll_events(tenant_id,payroll_run_id,payroll_line_id,actor_id,action,before_state,after_state) values(v_tenant,v_run,v_line,auth.uid(),'UPDATE',to_jsonb(old),to_jsonb(new));
   return new;
 end if;
end $$;
revoke all on function public.nusa_capture_payroll_event() from public,anon,authenticated;
drop trigger if exists nusa_payroll_run_audit on public.nusa_payroll_runs;
create trigger nusa_payroll_run_audit after insert or update on public.nusa_payroll_runs for each row execute function public.nusa_capture_payroll_event();
drop trigger if exists nusa_payroll_line_audit on public.nusa_payroll_lines;
create trigger nusa_payroll_line_audit after insert or update on public.nusa_payroll_lines for each row execute function public.nusa_capture_payroll_event();