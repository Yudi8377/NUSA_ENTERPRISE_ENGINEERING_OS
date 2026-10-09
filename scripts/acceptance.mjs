import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const assert = (ok, message) => { if (!ok) throw new Error("ACCEPTANCE FAIL: " + message); };

const governance = read("supabase/migrations/0007_nusa_engineering_governance.sql");
const ingestion = read("supabase/migrations/0006_nusa_ingestion.sql");
const operations = read("lib/operations.ts");
const rls = read("supabase/tests/nusa_rls.sql");
const smoke = read("scripts/smoke.mjs");
const master = read("supabase/migrations/20261009012000_nusa_master_data_crud.sql");
const onboarding = read("supabase/migrations/20261009014000_nusa_workspace_onboarding_invoker.sql");
const masterPage = read("app/master-data/page.tsx");
const operationsPage = read("app/operations/page.tsx");

assert(governance.includes("status text not null default 'queued' check(status in ('queued','running','review','approved','rejected','completed','failed','cancelled'))"), "engineering run status enum missing");
assert(governance.includes("criticality text not null default 'normal' check(criticality in ('normal','high','critical'))"), "engineering criticality enum missing");
assert(governance.includes("source_hash text"), "engineering provenance source_hash missing");
assert(governance.includes("evidence jsonb not null"), "engineering evidence field missing");
assert(governance.includes("nusa_engineering_runs_member_insert"), "engineering insert RLS missing");
assert(governance.includes("nusa_engineering_runs_member_update"), "engineering update RLS missing");
assert(governance.includes("nusa_approvals_member_select"), "approval select RLS missing");
assert(governance.includes("nusa_approvals_member_update"), "approval update RLS missing");
assert(operations.includes("input.criticality === \"critical\" || input.criticality === \"high\""), "application approval gate missing");
assert(operations.includes('approval_type: "engineering_review"'), "engineering approval record missing");

assert(ingestion.includes("source_hash text"), "ingestion source_hash missing");
assert(ingestion.includes("content_hash text"), "ingestion document content_hash missing");
assert(ingestion.includes("status text not null default 'queued' check (status in ('queued','extracting','classifying','chunking','review','published','rejected','failed'))"), "ingestion status enum missing");
assert(ingestion.includes("nusa_ingestion_jobs_member_insert"), "ingestion insert RLS missing");
assert(ingestion.includes("nusa_ingestion_jobs_member_update"), "ingestion update RLS missing");
assert(ingestion.includes("nusa_ingestion_documents_member_insert"), "document insert RLS missing");

assert(/relrowsecurity/.test(rls), "RLS test does not inspect RLS enablement");
assert(smoke.includes("Run & Approval Queue"), "smoke coverage missing governance queue");
assert(smoke.includes("Ingestion Queue"), "smoke coverage missing ingestion queue");
assert(master.includes("create table if not exists public.nusa_employees"), "employee master table missing");
assert(master.includes("create table if not exists public.nusa_assets"), "asset master table missing");
assert(master.includes("nusa_employees_project_tenant_fk"), "employee project tenant binding missing");
assert(master.includes("nusa_assets_employee_tenant_fk"), "asset employee tenant binding missing");
assert(master.includes("nusa_master_data_events"), "master data audit trail missing");
assert(master.includes("alter table public.nusa_employees enable row level security"), "employee RLS missing");
assert(master.includes("alter table public.nusa_assets enable row level security"), "asset RLS missing");
assert(onboarding.includes("security invoker"), "workspace onboarding should respect explicit RLS policies");
assert(onboarding.includes("(select auth.uid()) is null"), "workspace onboarding must require an authenticated actor");
assert(onboarding.includes("nusa_tenants_creator_insert"), "tenant creator insert policy missing");
assert(onboarding.includes("nusa_memberships_owner_self_insert"), "owner membership insert policy missing");
assert(onboarding.includes("revoke all on function public.nusa_create_workspace"), "workspace RPC grants must be restricted");
assert(masterPage.includes("createOrganization"), "organization onboarding action missing");
assert(masterPage.includes("async function submit"), "master data create/update action missing");
assert(masterPage.includes("async function archive"), "master data archive action missing");
assert(operationsPage.includes("reviewerAllowed"), "reviewer authorization state missing");
assert(operationsPage.includes("Setujui"), "approval decision action missing");
assert(operationsPage.includes("Tolak"), "approval rejection action missing");
assert(operationsPage.includes("decided_by:currentUserId"), "approval decision actor must be recorded");

console.log("NUSA operational acceptance static assertions: PASS");
