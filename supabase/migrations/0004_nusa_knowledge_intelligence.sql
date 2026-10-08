create table if not exists public.nusa_knowledge_domains (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  parent_code text,
  status text not null default 'active' check (status in ('active','draft','archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.nusa_knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.nusa_tenants(id) on delete cascade,
  domain_code text references public.nusa_knowledge_domains(code) on delete set null,
  source_type text not null check (source_type in ('standard','regulation','law','sop','manual','project','drawing','model','dataset','web','vendor','lesson_learned','user','agent','other')),
  title text not null,
  publisher text,
  source_uri text,
  version text,
  source_hash text,
  authority_level text not null default 'internal' check (authority_level in ('primary','official','secondary','internal','unverified')),
  effective_from timestamptz,
  effective_to timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.nusa_knowledge_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.nusa_tenants(id) on delete cascade,
  source_id uuid references public.nusa_knowledge_sources(id) on delete cascade,
  domain_code text references public.nusa_knowledge_domains(code) on delete set null,
  item_type text not null default 'knowledge' check (item_type in ('knowledge','requirement','rule','procedure','fact','definition','lesson','assumption','constraint')),
  title text not null,
  content text not null,
  language_code text not null default 'id-ID',
  authority_level text not null default 'internal' check (authority_level in ('primary','official','secondary','internal','unverified')),
  confidence numeric(5,4) not null default 0.5000 check (confidence >= 0 and confidence <= 1),
  valid_from timestamptz,
  valid_to timestamptz,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  metadata jsonb not null default '{}'::jsonb,
  search_vector tsvector generated always as (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,''))) stored,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nusa_memory (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.nusa_tenants(id) on delete cascade,
  project_id uuid references public.nusa_projects(id) on delete cascade,
  memory_type text not null check (memory_type in ('episodic','semantic','procedural','preference','project','lesson_learned')),
  subject text not null,
  content text not null,
  importance numeric(5,4) not null default 0.5000 check (importance >= 0 and importance <= 1),
  confidence numeric(5,4) not null default 0.5000 check (confidence >= 0 and confidence <= 1),
  source_ref text,
  evidence jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nusa_reasoning_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.nusa_tenants(id) on delete cascade,
  project_id uuid references public.nusa_projects(id) on delete set null,
  requested_by uuid references auth.users(id) on delete set null,
  agent_code text references public.nusa_agents(code) on delete set null,
  intent text not null,
  input jsonb not null default '{}'::jsonb,
  context_refs jsonb not null default '[]'::jsonb,
  assumptions jsonb not null default '[]'::jsonb,
  findings jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  uncertainty jsonb not null default '[]'::jsonb,
  evidence_refs jsonb not null default '[]'::jsonb,
  policy_state text not null default 'review' check (policy_state in ('allowed','review','blocked')),
  approval_required boolean not null default true,
  approval_state text not null default 'not_required' check (approval_state in ('not_required','pending','approved','rejected')),
  status text not null default 'draft' check (status in ('draft','running','completed','failed','cancelled')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.nusa_agent_skills (
  id uuid primary key default gen_random_uuid(),
  agent_code text not null references public.nusa_agents(code) on delete cascade,
  skill_code text not null,
  skill_name text not null,
  description text,
  input_contract jsonb not null default '{}'::jsonb,
  output_contract jsonb not null default '{}'::jsonb,
  policy jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','draft','disabled')),
  created_at timestamptz not null default now(),
  unique(agent_code, skill_code)
);

create index if not exists idx_nusa_knowledge_items_search on public.nusa_knowledge_items using gin(search_vector);
create index if not exists idx_nusa_knowledge_items_scope on public.nusa_knowledge_items(tenant_id,domain_code,item_type);
create index if not exists idx_nusa_knowledge_sources_scope on public.nusa_knowledge_sources(tenant_id,domain_code,source_type);
create index if not exists idx_nusa_memory_scope on public.nusa_memory(tenant_id,project_id,memory_type,updated_at desc);
create index if not exists idx_nusa_reasoning_scope on public.nusa_reasoning_runs(tenant_id,project_id,created_at desc);
create index if not exists idx_nusa_agent_skills_agent on public.nusa_agent_skills(agent_code,status);

alter table public.nusa_knowledge_domains enable row level security;
alter table public.nusa_knowledge_sources enable row level security;
alter table public.nusa_knowledge_items enable row level security;
alter table public.nusa_memory enable row level security;
alter table public.nusa_reasoning_runs enable row level security;
alter table public.nusa_agent_skills enable row level security;

create policy nusa_knowledge_domains_select on public.nusa_knowledge_domains for select to authenticated using (true);
create policy nusa_knowledge_sources_member_select on public.nusa_knowledge_sources for select to authenticated
using (tenant_id is null or exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_knowledge_sources.tenant_id and m.user_id=auth.uid()));
create policy nusa_knowledge_sources_member_insert on public.nusa_knowledge_sources for insert to authenticated
with check (tenant_id is null or exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_knowledge_sources.tenant_id and m.user_id=auth.uid()));
create policy nusa_knowledge_items_member_select on public.nusa_knowledge_items for select to authenticated
using (tenant_id is null or exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_knowledge_items.tenant_id and m.user_id=auth.uid()));
create policy nusa_knowledge_items_member_insert on public.nusa_knowledge_items for insert to authenticated
with check (tenant_id is null or exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_knowledge_items.tenant_id and m.user_id=auth.uid()));
create policy nusa_memory_member_select on public.nusa_memory for select to authenticated
using (tenant_id is null or exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_memory.tenant_id and m.user_id=auth.uid()));
create policy nusa_memory_member_insert on public.nusa_memory for insert to authenticated
with check (tenant_id is null or exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_memory.tenant_id and m.user_id=auth.uid()));
create policy nusa_reasoning_member_select on public.nusa_reasoning_runs for select to authenticated
using (tenant_id is null or exists (select 1 from public.nusa_memberships m where m.tenant_id=nusa_reasoning_runs.tenant_id and m.user_id=auth.uid()));
create policy nusa_reasoning_member_insert on public.nusa_reasoning_runs for insert to authenticated
with check (requested_by is null or requested_by=auth.uid());
create policy nusa_agent_skills_select on public.nusa_agent_skills for select to authenticated using (true);

insert into public.nusa_knowledge_domains(code,name,description) values
('core','NUSA Core','Intent, reasoning, governance, safety and system operation'),
('architecture','Architecture','Architecture, space planning, interior and design'),
('structural','Structural Engineering','Structural engineering and governed calculations'),
('geotechnical','Geotechnical Engineering','Soil, foundation and site investigation'),
('mep','MEP Engineering','Mechanical, electrical, plumbing, fire and building services'),
('bim','BIM & Digital Twin','BIM, IFC, spatial models and digital twin'),
('qs','Quantity Surveying','QTO, BOQ, RAB, cost and procurement'),
('construction','Construction','Methods, sequencing, QA/QC and field execution'),
('hse','HSE','Health, safety and environmental controls'),
('legal','Law & Compliance','Regulation, contracts, compliance and governance'),
('finance','Finance','Accounting, budgeting, cash flow and financial controls'),
('hr','Human Resources','HR, payroll and organizational knowledge'),
('procurement','Procurement','Vendor, purchasing, inventory and asset knowledge'),
('ai','AI & Data','AI evaluation, prompts, models, data and agent operations'),
('voice','Voice & Language','Indonesian language, pronunciation and contextual voice'),
('spatial','Spatial Computing','Computer vision, AR, VR, MR, sensors and spatial reasoning'),
('interior','Interior Design','Interior design, materials, lighting, furniture and finishes')
on conflict(code) do update set name=excluded.name, description=excluded.description;

insert into public.nusa_agent_skills(agent_code,skill_code,skill_name,description,policy) values
('nusa.orchestrator','knowledge.retrieve','Knowledge Retrieval','Retrieve governed knowledge relevant to an intent.','{"evidence_required":true,"prefer_authoritative_sources":true}'),
('nusa.orchestrator','reasoning.plan','Task Planning','Decompose intent into governed steps and delegate to specialist agents.','{"approval_gate_for_critical":true}'),
('engineering.structural','structural.check','Structural Review','Check structural inputs, assumptions and governed calculation outputs.','{"final_safety_approval_human":true}'),
('engineering.sap2000','sap2000.bridge','SAP2000 Bridge','Prepare/inspect local SAP2000 jobs and evidence packages.','{"execution_local_only":true,"final_approval_human":true}'),
('engineering.geotechnical','geotech.assess','Geotechnical Assessment','Assess site and soil evidence with explicit uncertainty.','{"missing_site_data_must_be_flagged":true}'),
('bim.coordinator','bim.coordinate','BIM Coordination','Coordinate spatial, BIM and clash evidence.','{"source_provenance_required":true}'),
('qs.estimator','qs.estimate','QTO/BOQ/RAB','Generate quantity and cost estimates with assumptions and source evidence.','{"estimate_not_final_contract":true}'),
('field.vision','vision.inspect','Field Vision','Analyze field imagery/video and produce evidence-backed findings.','{"single_frame_not_conclusive":true}'),
('nusa.orchestrator','policy.guard','Policy Guard','Check whether an action is allowed, requires review or is blocked.','{"critical_engineering_requires_human":true}')
on conflict(agent_code,skill_code) do update set description=excluded.description, policy=excluded.policy;