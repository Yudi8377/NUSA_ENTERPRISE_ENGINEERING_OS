import { supabase } from "./supabase";

export type KnowledgeItem = {
  id: string;
  tenant_id?: string | null;
  domain_code: string | null;
  item_type: string;
  title: string;
  content: string;
  authority_level: string;
  confidence: number;
  sensitivity: string;
  metadata: Record<string, unknown>;
};

export async function knowledgeDomains() {
  return supabase
    .from("nusa_knowledge_domains")
    .select("code,name,description,parent_code,status")
    .eq("status", "active")
    .order("name");
}

export async function retrieveKnowledge(input: {
  tenantId?: string | null;
  query: string;
  domainCode?: string | null;
  limit?: number;
}) {
  const limit = Math.min(Math.max(input.limit ?? 8, 1), 50);
  let q = supabase
    .from("nusa_knowledge_items")
    .select("id,tenant_id,domain_code,item_type,title,content,authority_level,confidence,sensitivity,metadata")
    .textSearch("search_vector", input.query, { type: "plain", config: "simple" })
    .order("confidence", { ascending: false })
    .limit(limit);

  if (input.tenantId) q = q.or(`tenant_id.is.null,tenant_id.eq.${input.tenantId}`);
  else q = q.is("tenant_id", null);
  if (input.domainCode) q = q.eq("domain_code", input.domainCode);
  return q;
}

export async function saveMemory(input: {
  tenantId?: string | null;
  projectId?: string | null;
  memoryType: "episodic" | "semantic" | "procedural" | "preference" | "project" | "lesson_learned";
  subject: string;
  content: string;
  importance?: number;
  confidence?: number;
  sourceRef?: string | null;
  evidence?: Record<string, unknown>;
  userId?: string | null;
}) {
  return supabase.from("nusa_memory").insert({
    tenant_id: input.tenantId ?? null,
    project_id: input.projectId ?? null,
    memory_type: input.memoryType,
    subject: input.subject,
    content: input.content,
    importance: input.importance ?? 0.5,
    confidence: input.confidence ?? 0.5,
    source_ref: input.sourceRef ?? null,
    evidence: input.evidence ?? {},
    created_by: input.userId ?? null,
  }).select().single();
}

export async function knowledgeSearch(input: { tenantId?: string | null; query: string; domainCode?: string | null; limit?: number }) {
  return retrieveKnowledge(input);
}

export async function startReasoningRun(input: {
  tenantId?: string | null;
  projectId?: string | null;
  requestedBy?: string | null;
  agentCode?: string | null;
  intent: string;
  input?: Record<string, unknown>;
  contextRefs?: unknown[];
  approvalRequired?: boolean;
}) {
  return supabase.from("nusa_reasoning_runs").insert({
    tenant_id: input.tenantId ?? null,
    project_id: input.projectId ?? null,
    requested_by: input.requestedBy ?? null,
    agent_code: input.agentCode ?? "nusa.orchestrator",
    intent: input.intent,
    input: input.input ?? {},
    context_refs: input.contextRefs ?? [],
    approval_required: input.approvalRequired ?? true,
    approval_state: input.approvalRequired === false ? "not_required" : "pending",
    status: "running",
  }).select().single();
}
