create table if not exists public.nusa_ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.nusa_tenants(id) on delete cascade,
  project_id uuid references public.nusa_projects(id) on delete set null,
  requested_by uuid not null references auth.users(id) on delete restrict,
  source_kind text not null check (source_kind in ('pdf','docx','txt','csv','xlsx','image','cad','bim','json','url','other')),
  source_name text not null,
  source_uri text,
  source_hash text,
  status text not null default 'queued' check (status in ('queued','extracting','classifying','chunking','review','published','rejected','failed')),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.nusa_ingestion_documents (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.nusa_ingestion_jobs(id) on delete cascade,
  version_no integer not null default 1,
  mime_type text,
  page_count integer,
  language_code text default 'id',
  authority_level text not null default 'internal',
  effective_from date,
  effective_to date,
  extracted_text text,
  extraction_method text,
  extraction_confidence numeric(5,4) not null default 0,
  content_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(job_id,version_no)
);
create index if not exists idx_nusa_ingestion_jobs_tenant_status on public.nusa_ingestion_jobs(tenant_id,status,created_at desc);
create index if not exists idx_nusa_ingestion_documents_job on public.nusa_ingestion_documents(job_id,version_no desc);
alter table public.nusa_ingestion_jobs enable row level security;
alter table public.nusa_ingestion_documents enable row level security;
create policy nusa_ingestion_jobs_member_select on public.nusa_ingestion_jobs for select to authenticated
using (exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_ingestion_jobs.tenant_id and m.user_id=auth.uid()));
create policy nusa_ingestion_jobs_member_insert on public.nusa_ingestion_jobs for insert to authenticated
with check (requested_by=auth.uid() and exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_ingestion_jobs.tenant_id and m.user_id=auth.uid()));
create policy nusa_ingestion_jobs_member_update on public.nusa_ingestion_jobs for update to authenticated
using (exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_ingestion_jobs.tenant_id and m.user_id=auth.uid()))
with check (exists(select 1 from public.nusa_memberships m where m.tenant_id=nusa_ingestion_jobs.tenant_id and m.user_id=auth.uid()));
create policy nusa_ingestion_documents_member_select on public.nusa_ingestion_documents for select to authenticated
using (exists(select 1 from public.nusa_ingestion_jobs j join public.nusa_memberships m on m.tenant_id=j.tenant_id where j.id=nusa_ingestion_documents.job_id and m.user_id=auth.uid()));
create policy nusa_ingestion_documents_member_insert on public.nusa_ingestion_documents for insert to authenticated
with check (exists(select 1 from public.nusa_ingestion_jobs j join public.nusa_memberships m on m.tenant_id=j.tenant_id where j.id=nusa_ingestion_documents.job_id and m.user_id=auth.uid()));
