-- NUSA Knowledge Intelligence v2: chunks and knowledge graph relationships
create table if not exists public.nusa_knowledge_chunks (
 id uuid primary key default gen_random_uuid(),
 source_id uuid references public.nusa_knowledge_sources(id) on delete cascade,
 knowledge_item_id uuid references public.nusa_knowledge_items(id) on delete cascade,
 chunk_no integer not null,
 content text not null,
 token_estimate integer,
 content_hash text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 unique(knowledge_item_id,chunk_no)
);
create index if not exists idx_nusa_knowledge_chunks_item on public.nusa_knowledge_chunks(knowledge_item_id,chunk_no);
create index if not exists idx_nusa_knowledge_chunks_source on public.nusa_knowledge_chunks(source_id);
alter table public.nusa_knowledge_chunks enable row level security;
create policy nusa_knowledge_chunks_select on public.nusa_knowledge_chunks for select to authenticated
using (exists (select 1 from public.nusa_knowledge_items k where k.id=nusa_knowledge_chunks.knowledge_item_id and (k.tenant_id is null or exists(select 1 from public.nusa_memberships m where m.tenant_id=k.tenant_id and m.user_id=auth.uid()))));
create table if not exists public.nusa_knowledge_relationships (
 id uuid primary key default gen_random_uuid(),
 from_item_id uuid not null references public.nusa_knowledge_items(id) on delete cascade,
 to_item_id uuid not null references public.nusa_knowledge_items(id) on delete cascade,
 relation_type text not null,
 confidence numeric(5,4) not null default .5 check(confidence between 0 and 1),
 evidence jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 unique(from_item_id,to_item_id,relation_type)
);
alter table public.nusa_knowledge_relationships enable row level security;
create policy nusa_knowledge_relationships_select on public.nusa_knowledge_relationships for select to authenticated using (exists(select 1 from public.nusa_knowledge_items k where k.id=from_item_id and (k.tenant_id is null or exists(select 1 from public.nusa_memberships m where m.tenant_id=k.tenant_id and m.user_id=auth.uid()))));