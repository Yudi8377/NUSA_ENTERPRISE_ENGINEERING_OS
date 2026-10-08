-- NUSA performance + RLS hardening
-- Keeps tenant isolation semantics while making auth.uid() initplan-safe
-- and adding only missing foreign-key covering indexes.

do $$
declare r record; idx text; n int;
begin
  for r in select indexrelid::regclass::text idxname
           from pg_stat_user_indexes
           where schemaname='public' and indexrelname like 'idx_fk_%'
  loop
    execute format('drop index if exists public.%I', r.idxname);
  end loop;

  for r in
    select c.conrelid::regclass as tbl, c.conkey,
           string_agg(quote_ident(a.attname), ', ' order by u.ord) as cols,
           string_agg(a.attname, '_' order by u.ord) as colnames
    from pg_constraint c
    cross join lateral unnest(c.conkey) with ordinality as u(attnum,ord)
    join pg_attribute a on a.attrelid=c.conrelid and a.attnum=u.attnum
    where c.contype='f' and c.connamespace='public'::regnamespace
    group by c.conrelid,c.conkey
  loop
    select array_length(r.conkey,1) into n;
    if not exists (
      select 1 from pg_index i
      where i.indrelid=r.tbl::regclass
        and i.indisvalid
        and i.indnkeyatts >= n
        and i.indkey[0:n-1] = r.conkey
    ) then
      idx := 'idx_fk_' || regexp_replace(r.tbl::text,'[^a-zA-Z0-9]+','_','g') || '_' || regexp_replace(r.colnames,'[^a-zA-Z0-9]+','_','g');
      execute format('create index %I on %s (%s)', idx, r.tbl, r.cols);
    end if;
  end loop;
end $$;

do $$
declare p record; role_list text; using_sql text; check_sql text; create_sql text; command text;
begin
  for p in
    select pol.schemaname, pol.tablename, pol.policyname, pol.cmd, pol.permissive,
           pol.roles as policy_roles, pol.qual, pol.with_check
    from pg_policies pol
    where pol.schemaname='public'
  loop
    if p.tablename='nusa_tenants' and p.policyname='nusa_tenants_select_member' then
      using_sql := '(EXISTS (SELECT 1 FROM public.nusa_memberships m WHERE m.tenant_id = nusa_tenants.id AND m.user_id = (select auth.uid())))';
    else
      using_sql := case when p.qual is null then null else replace(p.qual,'auth.uid()','(select auth.uid())') end;
    end if;

    check_sql := case when p.with_check is null then null else replace(p.with_check,'auth.uid()','(select auth.uid())') end;
    role_list := array_to_string(p.policy_roles, ', ');
    command := lower(p.cmd);

    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);

    create_sql := format(
      'create policy %I on public.%I as %s for %s to %s',
      p.policyname,
      p.tablename,
      case when p.permissive='PERMISSIVE' then 'permissive' else 'restrictive' end,
      command,
      role_list
    );

    if using_sql is not null then
      create_sql := create_sql || ' using (' || using_sql || ')';
    end if;

    if check_sql is not null then
      create_sql := create_sql || ' with check (' || check_sql || ')';
    end if;

    execute create_sql;
  end loop;
end $$;
