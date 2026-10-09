-- Optimize tenant RLS evaluation and cover workspace foreign keys.
drop policy if exists nusa_workspace_records_member_select on public.nusa_workspace_records;
create policy nusa_workspace_records_member_select on public.nusa_workspace_records
for select to authenticated
using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_workspace_records.tenant_id and m.user_id=(select auth.uid())));

drop policy if exists nusa_workspace_records_member_insert on public.nusa_workspace_records;
create policy nusa_workspace_records_member_insert on public.nusa_workspace_records
for insert to authenticated
with check (created_by=(select auth.uid()) and updated_by=(select auth.uid()) and exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_workspace_records.tenant_id and m.user_id=(select auth.uid())));

drop policy if exists nusa_workspace_records_member_update on public.nusa_workspace_records;
create policy nusa_workspace_records_member_update on public.nusa_workspace_records
for update to authenticated
using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_workspace_records.tenant_id and m.user_id=(select auth.uid())))
with check (updated_by=(select auth.uid()) and exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_workspace_records.tenant_id and m.user_id=(select auth.uid())));

drop policy if exists nusa_workspace_record_events_member_select on public.nusa_workspace_record_events;
create policy nusa_workspace_record_events_member_select on public.nusa_workspace_record_events
for select to authenticated
using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_workspace_record_events.tenant_id and m.user_id=(select auth.uid())));

create index if not exists idx_nusa_workspace_records_created_by on public.nusa_workspace_records(created_by);
create index if not exists idx_nusa_workspace_records_updated_by on public.nusa_workspace_records(updated_by);
create index if not exists idx_nusa_workspace_records_project_id on public.nusa_workspace_records(project_id) where project_id is not null;
create index if not exists idx_nusa_workspace_record_events_record_id on public.nusa_workspace_record_events(record_id);
create index if not exists idx_nusa_workspace_record_events_actor_id on public.nusa_workspace_record_events(actor_id) where actor_id is not null;
