-- Keep workspace onboarding SECURITY INVOKER by granting only constrained insert paths.
-- A creator can read their own tenant before the owner membership row exists.
drop policy if exists nusa_tenants_select_member on public.nusa_tenants;
create policy nusa_tenants_select_member on public.nusa_tenants for select to authenticated
using (created_by=(select auth.uid()) or exists (
  select 1 from public.nusa_memberships m where m.tenant_id=nusa_tenants.id and m.user_id=(select auth.uid())
));

drop policy if exists nusa_tenants_creator_insert on public.nusa_tenants;
create policy nusa_tenants_creator_insert on public.nusa_tenants for insert to authenticated
with check (created_by=(select auth.uid()));

drop policy if exists nusa_memberships_owner_self_insert on public.nusa_memberships;
create policy nusa_memberships_owner_self_insert on public.nusa_memberships for insert to authenticated
with check (
  user_id=(select auth.uid()) and role_code='owner'
  and exists (select 1 from public.nusa_tenants t where t.id=nusa_memberships.tenant_id and t.created_by=(select auth.uid()))
);

drop policy if exists nusa_settings_creator_insert on public.nusa_settings;
create policy nusa_settings_creator_insert on public.nusa_settings for insert to authenticated
with check (exists (select 1 from public.nusa_tenants t where t.id=nusa_settings.tenant_id and t.created_by=(select auth.uid())));

grant select,insert,update on public.nusa_tenants to authenticated;
grant select,insert on public.nusa_memberships to authenticated;
grant select,insert on public.nusa_settings to authenticated;
revoke insert on public.nusa_tenants,public.nusa_memberships,public.nusa_settings from anon;

create or replace function public.nusa_create_workspace(p_name text,p_code text)
returns uuid
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_id uuid;
  v_name text := nullif(trim(p_name),'');
  v_code text := upper(nullif(trim(p_code),''));
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required' using errcode='42501';
  end if;
  if v_name is null or length(v_name) > 160 then
    raise exception 'workspace name is required and must be 160 characters or fewer' using errcode='22023';
  end if;
  if v_code is null or length(v_code) > 30 or v_code !~ '^[A-Z0-9]+(-[A-Z0-9]+)*$' then
    raise exception 'workspace code must use letters, numbers, and single hyphens (max 30 characters)' using errcode='22023';
  end if;
  insert into public.nusa_tenants(name,code,created_by)
    values(v_name,v_code,(select auth.uid()))
    returning id into v_id;
  insert into public.nusa_memberships(tenant_id,user_id,role_code)
    values(v_id,(select auth.uid()),'owner');
  insert into public.nusa_settings(tenant_id) values(v_id);
  return v_id;
end
$$;
revoke all on function public.nusa_create_workspace(text,text) from public, anon, authenticated;
grant execute on function public.nusa_create_workspace(text,text) to authenticated;
