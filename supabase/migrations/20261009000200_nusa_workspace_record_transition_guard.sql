-- Guard enterprise workspace state transitions and preserve tenant/module identity.
create or replace function public.nusa_guard_workspace_record_transition()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
  if new.tenant_id is distinct from old.tenant_id or new.module_code is distinct from old.module_code or new.record_type is distinct from old.record_type then
    raise exception 'Tenant, module, and record type are immutable after creation';
  end if;
  if new.status='approved' and old.status is distinct from 'approved' then
    raise exception 'Approval must be recorded through a separately authorized human approval workflow';
  end if;
  if old.status='approved' and new.status is distinct from 'approved' then
    raise exception 'Approved records must use a controlled reversal workflow';
  end if;
  return new;
end; $$;
revoke all on function public.nusa_guard_workspace_record_transition() from public,anon,authenticated;
create trigger nusa_workspace_record_transition_guard before update on public.nusa_workspace_records for each row execute function public.nusa_guard_workspace_record_transition();
