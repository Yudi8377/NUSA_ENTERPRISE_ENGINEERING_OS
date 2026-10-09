-- Atomic human approval decision: record reviewer decision and transition the linked run together.
create or replace function public.nusa_decide_approval(
  p_approval_id uuid,
  p_decision text,
  p_decision_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_approval public.nusa_approvals%rowtype;
  v_actor uuid := (select auth.uid());
begin
  if v_actor is null then
    raise exception 'authentication required' using errcode='42501';
  end if;
  if p_decision not in ('approved','rejected') then
    raise exception 'decision must be approved or rejected' using errcode='22023';
  end if;
  if length(coalesce(p_decision_note,'')) > 2000 then
    raise exception 'decision note must be 2000 characters or fewer' using errcode='22023';
  end if;

  select * into v_approval
  from public.nusa_approvals
  where id=p_approval_id
  for update;
  if not found then
    raise exception 'approval not found or not accessible' using errcode='P0002';
  end if;
  if v_approval.status <> 'pending' then
    raise exception 'only pending approvals can be decided' using errcode='55000';
  end if;
  if v_approval.requested_by is not distinct from v_actor then
    raise exception 'the requester cannot approve their own request' using errcode='42501';
  end if;
  if not exists (
    select 1 from public.nusa_memberships m
    where m.tenant_id=v_approval.tenant_id
      and m.user_id=v_actor
      and lower(m.role_code) in ('owner','admin','approver','engineering_lead')
  ) then
    raise exception 'reviewer role required for this organization' using errcode='42501';
  end if;

  update public.nusa_approvals
  set status=p_decision,
      decided_by=v_actor,
      decision_note=nullif(trim(coalesce(p_decision_note,'')),''),
      decided_at=now()
  where id=v_approval.id;

  if v_approval.run_id is not null then
    update public.nusa_engineering_runs
    set status=case when p_decision='approved' then 'approved' else 'rejected' end
    where id=v_approval.run_id and tenant_id=v_approval.tenant_id;
  end if;

  return v_approval.id;
end
$$;
revoke all on function public.nusa_decide_approval(uuid,text,text) from public,anon,authenticated;
grant execute on function public.nusa_decide_approval(uuid,text,text) to authenticated;
