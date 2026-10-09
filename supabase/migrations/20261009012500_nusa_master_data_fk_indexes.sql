-- Cover foreign-key lookups used by master data and append-only audit evidence.
create index if not exists idx_nusa_employees_created_by on public.nusa_employees(created_by);
create index if not exists idx_nusa_employees_updated_by on public.nusa_employees(updated_by);
create index if not exists idx_nusa_assets_created_by on public.nusa_assets(created_by);
create index if not exists idx_nusa_assets_updated_by on public.nusa_assets(updated_by);
create index if not exists idx_nusa_assets_employee_tenant on public.nusa_assets(tenant_id,assigned_employee_id) where assigned_employee_id is not null;
create index if not exists idx_nusa_master_data_events_actor on public.nusa_master_data_events(actor_id) where actor_id is not null;
