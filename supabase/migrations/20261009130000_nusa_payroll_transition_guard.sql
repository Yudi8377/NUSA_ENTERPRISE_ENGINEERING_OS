create or replace function public.nusa_payroll_run_updated_at()
returns trigger language plpgsql security invoker set search_path=pg_catalog,public as $$
declare v_allowed boolean := false; v_line_count integer := 0;
begin
  new.updated_at := now();
  if tg_op='UPDATE' then
    if new.approved_by is distinct from old.approved_by and new.status<>'approved' then
      raise exception 'Approval identity can only be set by the approval transition';
    end if;
    if new.paid_by is distinct from old.paid_by and new.status<>'paid' then
      raise exception 'Payment identity can only be set by the paid transition';
    end if;
    if new.status is distinct from old.status then
      v_allowed := case old.status
        when 'draft' then new.status in ('attendance_review','void')
        when 'attendance_review' then new.status in ('hr_review','draft')
        when 'hr_review' then new.status in ('finance_review','attendance_review')
        when 'finance_review' then new.status in ('approved','hr_review')
        when 'approved' then new.status='paid'
        when 'paid' then new.status='closed'
        else false
      end;
      if not v_allowed then raise exception 'Invalid payroll state transition: % -> %',old.status,new.status; end if;
    end if;
  end if;
  if tg_op='UPDATE' and new.status='approved' and old.status is distinct from 'approved' then
    if old.status<>'finance_review' then raise exception 'Payroll must complete Finance review before approval'; end if;
    if new.prepared_by=(select auth.uid()) then raise exception 'Payroll preparer cannot approve own run'; end if;
    if not exists(select 1 from public.nusa_memberships m where m.tenant_id=new.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','finance_manager')) then
      raise exception 'Independent finance approver role required';
    end if;
    select count(*) into v_line_count from public.nusa_payroll_lines l where l.tenant_id=new.tenant_id and l.payroll_run_id=new.id;
    if v_line_count=0 then raise exception 'Payroll must contain at least one employee line'; end if;
    new.approved_by := (select auth.uid());
    new.approved_at := now();
  end if;
  if tg_op='UPDATE' and new.status='paid' and old.status is distinct from 'paid' then
    if old.status<>'approved' then raise exception 'Only an approved payroll run can be marked paid'; end if;
    if nullif(btrim(new.payment_reference),'') is null then raise exception 'Payment evidence reference is required'; end if;
    if not exists(select 1 from public.nusa_memberships m where m.tenant_id=new.tenant_id and m.user_id=(select auth.uid()) and m.role_code in ('owner','admin','finance_manager','finance')) then
      raise exception 'Finance role required to record payment';
    end if;
    new.paid_by := (select auth.uid());
    new.paid_at := now();
  end if;
  if tg_op='UPDATE' and new.status='closed' and old.status<>'paid' then
    raise exception 'Payroll can only be closed after payment is recorded';
  end if;
  return new;
end $$;
revoke all on function public.nusa_payroll_run_updated_at() from public,anon,authenticated;