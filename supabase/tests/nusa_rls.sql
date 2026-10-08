-- NUSA RLS smoke assertions.
-- Execute in a disposable authenticated test environment with two users.
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace='public'::regnamespace
  and relname like 'nusa_%'
  and relkind='r'
order by relname;

-- Expected: every nusa_* table has rls_enabled = true.
