-- Restrict approval decisions to designated tenant reviewers and prevent self-approval.
-- Forward-only migration: do not reset or replay the existing database.
drop policy if exists nusa_approvals_member_update on public.nusa_approvals;

create policy nusa_approvals_reviewer_update
on public.nusa_approvals
for update
to authenticated
using (
  requested_by is distinct from (select auth.uid())
  and exists (
    select 1
    from public.nusa_memberships m
    where m.tenant_id = nusa_approvals.tenant_id
      and m.user_id = (select auth.uid())
      and lower(m.role_code) in ('owner', 'admin', 'approver', 'engineering_lead')
  )
)
with check (
  decided_by = (select auth.uid())
  and requested_by is distinct from (select auth.uid())
  and exists (
    select 1
    from public.nusa_memberships m
    where m.tenant_id = nusa_approvals.tenant_id
      and m.user_id = (select auth.uid())
      and lower(m.role_code) in ('owner', 'admin', 'approver', 'engineering_lead')
  )
);
