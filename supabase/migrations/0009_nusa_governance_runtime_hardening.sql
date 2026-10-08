-- NUSA governance runtime hardening.
drop policy if exists nusa_reasoning_member_insert on public.nusa_reasoning_runs;
create policy nusa_reasoning_member_insert on public.nusa_reasoning_runs
for insert to authenticated
with check (
  (tenant_id is null or exists (
    select 1 from public.nusa_memberships m
    where m.tenant_id = nusa_reasoning_runs.tenant_id and m.user_id = auth.uid()
  ))
  and (requested_by is null or requested_by = auth.uid())
);

create or replace function public.nusa_guard_engineering_run()
returns trigger language plpgsql security invoker as $$
begin
  if (new.criticality in ('high','critical') or old.criticality in ('high','critical'))
     and new.status in ('approved','completed') then
    if not exists (
      select 1 from public.nusa_approvals a
      where a.run_id = new.id and a.status = 'approved'
        and a.decided_by is not null and a.decided_at is not null
    ) then
      raise exception 'NUSA governance: high/critical engineering run requires an approved human approval before status %', new.status using errcode = '42501';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists trg_nusa_guard_engineering_run on public.nusa_engineering_runs;
create trigger trg_nusa_guard_engineering_run before update on public.nusa_engineering_runs
for each row execute function public.nusa_guard_engineering_run();

create or replace function public.nusa_guard_approval_decision()
returns trigger language plpgsql security invoker as $$
begin
  if new.status <> old.status and new.status <> 'pending' then
    if auth.uid() is null or new.decided_by is distinct from auth.uid() then
      raise exception 'NUSA governance: approval decision must be attributed to the authenticated human approver' using errcode = '42501';
    end if;
    if new.decided_at is null then new.decided_at := now(); end if;
  end if;
  return new;
end; $$;

drop trigger if exists trg_nusa_guard_approval_decision on public.nusa_approvals;
create trigger trg_nusa_guard_approval_decision before update on public.nusa_approvals
for each row execute function public.nusa_guard_approval_decision();

comment on function public.nusa_guard_engineering_run() is 'NUSA safety boundary: high/critical engineering runs require approved human evidence before approval/completion.';
comment on function public.nusa_guard_approval_decision() is 'NUSA governance: approval decisions must be attributed to the authenticated human approver.';