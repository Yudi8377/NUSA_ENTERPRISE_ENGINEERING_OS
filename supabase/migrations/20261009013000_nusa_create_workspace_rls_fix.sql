-- Permit safe first-workspace onboarding despite tenant/member/settings RLS.
-- This narrowly scoped SECURITY DEFINER function is callable only by authenticated users,
-- checks auth.uid(), and writes only the workspace + owner membership + settings records.
create or replace function public.nusa_create_workspace(p_name text,p_code text)
returns uuid
language plpgsql
security definer
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
