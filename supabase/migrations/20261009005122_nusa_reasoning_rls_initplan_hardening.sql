drop policy if exists nusa_reasoning_member_insert on public.nusa_reasoning_runs;
create policy nusa_reasoning_member_insert on public.nusa_reasoning_runs
for insert to authenticated
with check (
  ((tenant_id is null) or exists (
    select 1 from public.nusa_memberships m
    where m.tenant_id=nusa_reasoning_runs.tenant_id and m.user_id=(select auth.uid())
  ))
  and ((requested_by is null) or requested_by=(select auth.uid()))
);
