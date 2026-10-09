-- Fix audit event FK ordering: workspace parent rows must exist before event inserts.
drop trigger if exists nusa_workspace_record_event_capture on public.nusa_workspace_records;
drop trigger if exists nusa_workspace_record_updated_at on public.nusa_workspace_records;

create or replace function public.nusa_set_workspace_record_updated_at()
returns trigger
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.nusa_set_workspace_record_updated_at() from public, anon, authenticated;

create trigger nusa_workspace_record_updated_at
before update on public.nusa_workspace_records
for each row execute function public.nusa_set_workspace_record_updated_at();

create or replace function public.nusa_capture_workspace_record_event()
returns trigger
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.nusa_workspace_record_events(record_id,tenant_id,actor_id,action,after_state)
    values(new.id,new.tenant_id,auth.uid(),'INSERT',to_jsonb(new));
    return new;
  end if;
  insert into public.nusa_workspace_record_events(record_id,tenant_id,actor_id,action,before_state,after_state)
  values(new.id,new.tenant_id,auth.uid(),'UPDATE',to_jsonb(old),to_jsonb(new));
  return new;
end;
$$;
revoke all on function public.nusa_capture_workspace_record_event() from public,anon,authenticated;

create trigger nusa_workspace_record_event_capture
after insert or update on public.nusa_workspace_records
for each row execute function public.nusa_capture_workspace_record_event();
