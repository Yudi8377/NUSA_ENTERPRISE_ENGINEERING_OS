import { supabase } from "./supabase";

export type EngineeringRun = {
  id: string;
  run_type: string;
  status: string;
  criticality: string;
  agent_code: string | null;
  created_at: string;
  updated_at: string;
};

export type Approval = {
  id: string;
  approval_type: string;
  status: string;
  created_at: string;
  decided_at: string | null;
};

export type IngestionJob = {
  id: string;
  source_kind: string;
  source_name: string;
  status: string;
  authority_level: string | null;
  created_at: string;
  updated_at: string;
};

export async function engineeringRuns(tenantId: string) {
  return supabase
    .from("nusa_engineering_runs")
    .select("id,run_type,status,criticality,agent_code,created_at,updated_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(8);
}

export async function approvals(tenantId: string) {
  return supabase
    .from("nusa_approvals")
    .select("id,approval_type,status,created_at,decided_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(8);
}

export async function ingestionJobs(tenantId: string) {
  return supabase
    .from("nusa_ingestion_jobs")
    .select("id,source_kind,source_name,status,created_at,updated_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(8);
}

export async function createEngineeringRun(input: {
  tenantId: string;
  projectId?: string | null;
  requestedBy: string;
  agentCode?: string | null;
  runType: string;
  criticality?: "normal" | "high" | "critical";
  payload?: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from("nusa_engineering_runs")
    .insert({
      tenant_id: input.tenantId,
      project_id: input.projectId ?? null,
      requested_by: input.requestedBy,
      agent_code: input.agentCode ?? null,
      run_type: input.runType,
      criticality: input.criticality ?? "normal",
      input: input.payload ?? {},
    })
    .select("id,run_type,status,criticality,agent_code,created_at,updated_at")
    .single();

  if (error) return { data: null, error };

  if (input.criticality === "critical" || input.criticality === "high") {
    const approval = await supabase.from("nusa_approvals").insert({
      tenant_id: input.tenantId,
      project_id: input.projectId ?? null,
      run_id: data.id,
      requested_by: input.requestedBy,
      approval_type: "engineering_review",
      status: "pending",
    });
    if (approval.error) return { data, error: approval.error };
  }

  return { data, error: null };
}
