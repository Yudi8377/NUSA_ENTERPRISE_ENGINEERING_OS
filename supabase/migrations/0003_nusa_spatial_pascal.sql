create table if not exists public.nusa_spatial_models (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.nusa_tenants(id) on delete cascade,
  project_id uuid references public.nusa_projects(id) on delete set null,
  code text not null,
  name text not null,
  engine text not null default 'pascal',
  engine_version text,
  schema_version text not null default 'nusa.spatial.v1',
  status text not null default 'draft' check (status in ('draft','processing','review','approved','superseded','archived')),
  source_kind text not null default 'nusa',
  scene_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table if not exists public.nusa_spatial_model_versions (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.nusa_spatial_models(id) on delete cascade,
  version_no integer not null,
  source_hash text not null,
  manifest jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (model_id, version_no)
);

create table if not exists public.nusa_spatial_artifacts (
  id uuid primary key default gen_random_uuid(),
  model_version_id uuid not null references public.nusa_spatial_model_versions(id) on delete cascade,
  artifact_type text not null,
  file_name text not null,
  storage_path text,
  local_path text,
  sha256 text,
  mime_type text,
  size_bytes bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.nusa_spatial_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.nusa_tenants(id) on delete cascade,
  project_id uuid references public.nusa_projects(id) on delete set null,
  model_id uuid references public.nusa_spatial_models(id) on delete set null,
  evidence_type text not null,
  claim text not null,
  result text not null,
  severity text not null default 'info' check (severity in ('info','warning','high','critical')),
  evidence jsonb not null default '{}'::jsonb,
  source_hash text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_nusa_spatial_models_tenant on public.nusa_spatial_models(tenant_id,updated_at desc);
create index if not exists idx_nusa_spatial_versions_model on public.nusa_spatial_model_versions(model_id,version_no desc);
create index if not exists idx_nusa_spatial_artifacts_version on public.nusa_spatial_artifacts(model_version_id);
create index if not exists idx_nusa_spatial_evidence_project on public.nusa_spatial_evidence(tenant_id,project_id,created_at desc);

alter table public.nusa_spatial_models enable row level security;
alter table public.nusa_spatial_model_versions enable row level security;
alter table public.nusa_spatial_artifacts enable row level security;
alter table public.nusa_spatial_evidence enable row level security;

create policy nusa_spatial_models_member_select on public.nusa_spatial_models for select to authenticated
using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_spatial_models.tenant_id and m.user_id=auth.uid()));
create policy nusa_spatial_models_member_insert on public.nusa_spatial_models for insert to authenticated
with check (created_by=auth.uid() and exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_spatial_models.tenant_id and m.user_id=auth.uid()));

create policy nusa_spatial_versions_member_select on public.nusa_spatial_model_versions for select to authenticated
using (exists (select 1 from public.nusa_spatial_models sm join public.nusa_memberships m on m.tenant_id=sm.tenant_id where sm.id=nusa_spatial_model_versions.model_id and m.user_id=auth.uid()));
create policy nusa_spatial_versions_member_insert on public.nusa_spatial_model_versions for insert to authenticated
with check (exists (select 1 from public.nusa_spatial_models sm join public.nusa_memberships m on m.tenant_id=sm.tenant_id where sm.id=nusa_spatial_model_versions.model_id and m.user_id=auth.uid()));

create policy nusa_spatial_artifacts_member_select on public.nusa_spatial_artifacts for select to authenticated
using (exists (select 1 from public.nusa_spatial_model_versions sv join public.nusa_spatial_models sm on sm.id=sv.model_id join public.nusa_memberships m on m.tenant_id=sm.tenant_id where sv.id=nusa_spatial_artifacts.model_version_id and m.user_id=auth.uid()));

create policy nusa_spatial_evidence_member_select on public.nusa_spatial_evidence for select to authenticated
using (exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_spatial_evidence.tenant_id and m.user_id=auth.uid()));
create policy nusa_spatial_evidence_member_insert on public.nusa_spatial_evidence for insert to authenticated
with check ((created_by is null or created_by=auth.uid()) and exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_spatial_evidence.tenant_id and m.user_id=auth.uid()));
