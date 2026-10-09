import { supabase } from "./supabase";

export async function currentUser(){ const {data}=await supabase.auth.getUser(); return data.user ?? null; }
export async function myTenants(){ return supabase.from("nusa_tenants").select("id,name,code,status,legal_name,industry,tax_id,address,city,phone,contact_email,website,created_at,updated_at").order("created_at",{ascending:true}); }
export async function projects(tenantId:string){ return supabase.from("nusa_projects").select("id,code,name,category,status,progress,budget,target_date").eq("tenant_id",tenantId).is("deleted_at",null).order("updated_at",{ascending:false}); }
export async function agentFleet(){ return supabase.from("nusa_agents").select("code,name,domain,status,risk_level,requires_approval").order("domain",{ascending:true}); }

export async function createTenant(name:string,code:string,_userId:string){
  const r=await supabase.rpc("nusa_create_workspace",{p_name:name,p_code:code});
  if(r.error) return {data:null,error:r.error};
  return {data:{id:r.data,name,code},error:null};
}
export async function queueCommand(tenantId:string,userId:string,intent:string,actionCode="ASK_NUSA",projectId?:string){
  return supabase.from("nusa_commands").insert({tenant_id:tenantId,requested_by:userId,intent,action_code:actionCode,project_id:projectId??null,payload:{source:"web",locale:"id-ID"}}).select().single();
}
