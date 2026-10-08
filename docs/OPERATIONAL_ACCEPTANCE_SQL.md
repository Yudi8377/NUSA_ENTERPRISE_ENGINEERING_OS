-- NUSA operational acceptance assertions.
-- Read-only checks for CI/manual SQL review; no test data is persisted.
select count(*) as public_tables_with_rls
from pg_tables
where schemaname='public' and rowsecurity;

select count(*) as policies
from pg_policies
where schemaname='public';

select
  (select count(*) from public.nusa_knowledge_domains) as knowledge_domains,
  (select count(*) from public.nusa_knowledge_items) as knowledge_items,
  (select count(*) from public.nusa_engineering_runs) as engineering_runs,
  (select count(*) from public.nusa_approvals) as approvals,
  (select count(*) from public.nusa_ingestion_jobs) as ingestion_jobs;

select
  c.table_name,
  c.column_name
from information_schema.columns c
where c.table_schema='public'
  and c.column_name in ('tenant_id','project_id','created_by','requested_by','decided_by')
order by c.table_name,c.column_name;
