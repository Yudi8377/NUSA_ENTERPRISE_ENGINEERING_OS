import { supabase } from "./supabase";

export async function currentUser(){ const {data}=await supabase.auth.getUser(); return data.user ?? null; }
export async function myTenants(){ return supabase.from("nusa_tenants").select("id,name,code,status").order("created_at",{ascending:true}); }
export async function projects(tenantId:string){ return supabase.from("nusa_projects").select("id,code,name,category,status,progress,budget,target_date").eq("tenant_id",tenantId).is("deleted_at",null).order("updated_at",{ascending:false}); }
export async function agentFleet(){ return supabase.from("nusa_agents").select("code,name,domain,status,risk_level,requires_approval").order("domain",{ascending:true}); }

export async function createTenant(name:string,code:string,userId:string){
  const tenant=await supabase.from("nusa_tenants").insert({name,code,created_by:userId}).select("id,name,code").single();
  if(tenant.error||!tenant.data) return tenant;
  const membership=await supabase.from("nusa_memberships").insert({tenant_id:tenant.data.id,user_id:userId,role_code:"owner"});
  if(membership.error){ await supabase.from("nusa_tenants").delete().eq("id",tenant.data.id); return {data:null,error:membership.error}; }
  await supabase.from("nusa_settings").insert({tenant_id:tenant.data.id});
  return tenant;
}
export async function queueCommand(tenantId:string,userId:string,intent:string,actionCode="ASK_NUSA",projectId?:string){
  return supabase.from("nusa_commands").insert({tenant_id:tenantId,requested_by:userId,intent,action_code:actionCode,project_id:projectId??null,payload:{source:"web",locale:"id-ID"}}).select().single();
}
