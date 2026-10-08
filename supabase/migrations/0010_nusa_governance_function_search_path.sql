-- Harden governance trigger functions against mutable search_path resolution.
alter function public.nusa_guard_engineering_run() set search_path = public, pg_catalog;
alter function public.nusa_guard_approval_decision() set search_path = public, pg_catalog;