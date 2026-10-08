import { supabase } from "./supabase";

export type PascalAction = "CREATE_SCENE" | "OPEN_SCENE" | "IMPORT" | "EXPORT" | "QUERY_SCENE";

export type PascalJob = {
  schema: "nusa.pascal.job.v1";
  job_id: string;
  action: PascalAction;
  tenant_id: string;
  project_id?: string | null;
  model_code: string;
  engine: { name: "pascal"; version?: string | null };
  units: "m";
  approval: { required: boolean; state: "draft" | "approved" };
  scene?: Record<string, unknown>;
  evidence?: Record<string, unknown>;
};

export async function spatialModels(tenantId: string) {
  return supabase.from("nusa_spatial_models")
    .select("id,project_id,code,name,engine,engine_version,status,schema_version,scene_ref,metadata,updated_at")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false });
}

export async function createSpatialModel(input: {
  tenantId: string;
  projectId?: string | null;
  code: string;
  name: string;
  userId: string;
  metadata?: Record<string, unknown>;
}) {
  return supabase.from("nusa_spatial_models").insert({
    tenant_id: input.tenantId,
    project_id: input.projectId ?? null,
    code: input.code,
    name: input.name,
    engine: "pascal",
    source_kind: "nusa",
    created_by: input.userId,
    metadata: input.metadata ?? {},
  }).select().single();
}

export async function queuePascalJob(
  tenantId: string,
  userId: string,
  job: PascalJob,
  projectId?: string | null,
) {
  return supabase.from("nusa_commands").insert({
    tenant_id: tenantId,
    requested_by: userId,
    project_id: projectId ?? null,
    intent: `Pascal: ${job.action} ${job.model_code}`,
    action_code: `PASCAL.${job.action}`,
    payload: job,
    status: "queued",
  }).select().single();
}
