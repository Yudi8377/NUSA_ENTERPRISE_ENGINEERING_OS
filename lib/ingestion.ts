import { supabase } from "./supabase";

export type IngestionSourceKind = "pdf"|"docx"|"txt"|"csv"|"xlsx"|"image"|"cad"|"bim"|"json"|"url"|"other";
export type IngestionStatus = "queued"|"extracting"|"classifying"|"chunking"|"review"|"published"|"rejected"|"failed";

export async function queueIngestion(input:{tenantId:string;projectId?:string|null;userId:string;sourceKind:IngestionSourceKind;sourceName:string;sourceUri?:string|null;sourceHash?:string|null;metadata?:Record<string,unknown>}) {
  return supabase.from("nusa_ingestion_jobs").insert({tenant_id:input.tenantId,project_id:input.projectId??null,requested_by:input.userId,source_kind:input.sourceKind,source_name:input.sourceName,source_uri:input.sourceUri??null,source_hash:input.sourceHash??null,metadata:input.metadata??{},status:"queued"}).select().single();
}
export async function ingestionQueue(tenantId:string) {
  return supabase.from("nusa_ingestion_jobs").select("id,project_id,source_kind,source_name,source_hash,status,error_message,created_at,updated_at").eq("tenant_id",tenantId).order("created_at",{ascending:false});
}
export async function registerExtractedDocument(input:{jobId:string;versionNo?:number;mimeType?:string|null;pageCount?:number|null;languageCode?:string;authorityLevel?:string;effectiveFrom?:string|null;effectiveTo?:string|null;extractedText:string;extractionMethod:string;extractionConfidence:number;contentHash?:string|null;metadata?:Record<string,unknown>}) {
  return supabase.from("nusa_ingestion_documents").insert({job_id:input.jobId,version_no:input.versionNo??1,mime_type:input.mimeType??null,page_count:input.pageCount??null,language_code:input.languageCode??"id",authority_level:input.authorityLevel??"internal",effective_from:input.effectiveFrom??null,effective_to:input.effectiveTo??null,extracted_text:input.extractedText,extraction_method:input.extractionMethod,extraction_confidence:input.extractionConfidence,content_hash:input.contentHash??null,metadata:input.metadata??{}}).select().single();
}
export async function setIngestionStatus(jobId:string,status:IngestionStatus,errorMessage?:string|null) {
  return supabase.from("nusa_ingestion_jobs").update({status,error_message:errorMessage??null,updated_at:new Date().toISOString()}).eq("id",jobId).select().single();
}
