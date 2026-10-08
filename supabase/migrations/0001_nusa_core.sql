create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key,
  display_name text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_code text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique(tenant_id,user_id,role_code)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text not null,
  name text not null,
  category text not null default 'engineering',
  status text not null default 'active',
  progress numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(tenant_id,code)
);

create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  agent_code text not null,
  intent text not null,
  status text not null default 'queued',
  model text,
  evidence jsonb not null default '[]'::jsonb,
  approval_status text not null default 'not_required',
  created_at timestamptz not null default now()
);

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.projects enable row level security;
alter table public.ai_runs enable row level security;

create index if not exists memberships_user_idx on public.memberships(user_id);
create index if not exists projects_tenant_idx on public.projects(tenant_id);
create index if not exists ai_runs_tenant_idx on public.ai_runs(tenant_id);

-- Policies are intentionally introduced in the next migration after membership helper functions
-- are established. Never expose these tables with unrestricted anon/authenticated grants.
