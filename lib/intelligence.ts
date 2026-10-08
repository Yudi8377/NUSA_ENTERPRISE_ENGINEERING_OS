import { supabase } from "./supabase";
import type { KnowledgeItem } from "./knowledge";

export type KnowledgeContext = {
  items: KnowledgeItem[];
  domains: string[];
  evidenceRequired: boolean;
};

export async function buildKnowledgeContext(input: {
  tenantId?: string | null;
  query: string;
  domainCode?: string | null;
  limit?: number;
}): Promise<KnowledgeContext> {
  const limit = Math.min(Math.max(input.limit ?? 8, 1), 20);
  let q = supabase.from("nusa_knowledge_items")
    .select("id,tenant_id,domain_code,item_type,title,content,authority_level,confidence,sensitivity,metadata")
    .textSearch("search_vector", input.query, {type:"plain", config:"simple"})
    .order("confidence", {ascending:false})
    .limit(limit);
  if (input.tenantId) q=q.or(`tenant_id.is.null,tenant_id.eq.${input.tenantId}`);
  else q=q.is("tenant_id",null);
  if (input.domainCode) q=q.eq("domain_code",input.domainCode);
  const {data,error}=await q;
  if(error) throw error;
  const items=(data??[]) as KnowledgeItem[];
  return {items,domains:[...new Set(items.map(x=>x.domain_code).filter(Boolean) as string[])],evidenceRequired:true};
}

export function formatKnowledgeEvidence(context: KnowledgeContext) {
  return context.items.map((item,index)=>(
    `[K${index+1}] ${item.title} | domain=${item.domain_code ?? "core"} | authority=${item.authority_level} | confidence=${item.confidence}\n${item.content}`
  )).join("\n\n");
}

export function reasoningGuard(input: {
  criticalEngineering?: boolean;
  hasEvidence: boolean;
  approvalRequired?: boolean;
}) {
  if (input.criticalEngineering && (!input.hasEvidence || input.approvalRequired !== false)) {
    return {policyState:"review" as const, approvalRequired:true, reason:"Critical engineering decision requires evidence and human approval."};
  }
  if (!input.hasEvidence) return {policyState:"review" as const, approvalRequired:true, reason:"Evidence is insufficient."};
  return {policyState:"allowed" as const, approvalRequired:false, reason:"No critical approval gate detected."};
}
