"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Activity, ArrowLeft, CheckCircle2, ShieldCheck, Zap, FolderKanban } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { currentUser, myTenants, projects as getProjects } from "../../lib/nusa";
import { approvals, createEngineeringRun, engineeringRuns } from "../../lib/operations";

type Tenant = { id:string; name:string; code?:string };
type Project = { id:string; code:string; name:string; status:string };
type Run = { id:string; run_type:string; status:string; criticality:string; agent_code:string|null; created_at:string };
type Approval = { id:string; approval_type:string; status:string; created_at:string };

export default function OperationsPage(){
 const [tenantList,setTenantList]=useState<Tenant[]>([]);
 const [tenant,setTenant]=useState<Tenant|null>(null);
 const [tenantId,setTenantId]=useState("");
 const [projectList,setProjectList]=useState<Project[]>([]);
 const [projectId,setProjectId]=useState("");
 const [runs,setRuns]=useState<Run[]>([]);
 const [approvalRows,setApprovalRows]=useState<Approval[]>([]);
 const [runType,setRunType]=useState("structural_analysis");
 const [criticality,setCriticality]=useState<"normal"|"high"|"critical">("high");
 const [agent,setAgent]=useState("engineering.structural");
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [notice,setNotice]=useState("");

 const refresh=useCallback(async()=>{
  setLoading(true);
  const u=await currentUser();
  if(!u){setTenant(null);setTenantList([]);setProjectList([]);setRuns([]);setApprovalRows([]);setNotice("Masuk ke NUSA untuk menjalankan engineering workflow.");setLoading(false);return;}
  const t=await myTenants();
  if(t.error){setNotice("Organisasi gagal dimuat: "+t.error.message);setLoading(false);return;}
  const list=(t.data??[]) as Tenant[];
  setTenantList(list);
  const activeId=list.some(x=>x.id===tenantId)?tenantId:(list[0]?.id??"");
  setTenantId(activeId);
  const selected=list.find(x=>x.id===activeId)??null;
  setTenant(selected);
  if(!selected){setProjectList([]);setProjectId("");setRuns([]);setApprovalRows([]);setNotice("Belum ada organisasi. Buat organisasi dan proyek dari Master Data.");setLoading(false);return;}
  const [p,r,a]=await Promise.all([getProjects(selected.id),engineeringRuns(selected.id),approvals(selected.id)]);
  if(p.error){setNotice("Proyek gagal dimuat: "+p.error.message);setProjectList([]);setProjectId("");}
  else{
   const ps=(p.data??[]) as Project[];
   setProjectList(ps);
   setProjectId(current=>ps.some(x=>x.id===current)?current:(ps[0]?.id??""));
  }
  if(!r.error)setRuns((r.data??[]) as Run[]);else setNotice("Engineering runs gagal dimuat: "+r.error.message);
  if(!a.error)setApprovalRows((a.data??[]) as Approval[]);else setNotice("Approval queue gagal dimuat: "+a.error.message);
  setLoading(false);
 },[tenantId]);
 useEffect(()=>{
  const timer=window.setTimeout(()=>{void refresh();},0);
  const {data}=supabase.auth.onAuthStateChange(()=>{void refresh();});
  return ()=>{window.clearTimeout(timer);data.subscription.unsubscribe();};
 },[refresh]);

 const submit=async(e:FormEvent)=>{
  e.preventDefault();
  if(!tenant){setNotice("Pilih organisasi terlebih dahulu.");return;}
  setBusy(true);setNotice("");
  const u=await currentUser();
  if(!u){setNotice("Sesi berakhir. Masuk kembali ke NUSA.");setBusy(false);return;}
  const result=await createEngineeringRun({
   tenantId:tenant.id,projectId:projectId||null,requestedBy:u.id,agentCode:agent,
   runType:runType.trim(),criticality,payload:{source:"NUSA Operations Studio",requested_at:new Date().toISOString()}
  });
  if(result.error)setNotice("Run gagal dibuat: "+result.error.message);
  else{setNotice(criticality==="normal"?"Engineering run tercatat pada proyek terpilih.":"Engineering run tercatat pada proyek terpilih dan human approval dibuat otomatis.");await refresh();}
  setBusy(false);
 };
 const pending=approvalRows.filter(a=>a.status==="pending").length;

 return <main className="nusa gridbg nusa-ops"><section className="ops-shell">
  <header className="ops-header"><Link href="/" className="ops-back"><ArrowLeft size={15}/> Command Center</Link><div className="ops-eyebrow">NUSA ENGINEERING CONTROL PLANE</div><h1 className="brand ops-title">Operations Studio</h1><p className="muted">Buat workflow engineering yang terikat ke organisasi dan proyek. Run berisiko tinggi tetap membutuhkan persetujuan manusia.</p></header>
  {tenantList.length>0&&<div className="glass ops-card" style={{marginBottom:16,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
   <label>Organisasi<select value={tenantId} onChange={e=>{setTenantId(e.target.value);setProjectId("");}}><option value="">Pilih organisasi</option>{tenantList.map(t=><option key={t.id} value={t.id}>{t.name}{t.code?" · "+t.code:""}</option>)}</select></label>
   <label>Proyek terkait<select value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">Tanpa proyek spesifik</option>{projectList.map(p=><option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select></label>
   <div className="muted" style={{fontSize:11,alignSelf:"end"}}>{projectList.length} proyek tersedia · pilihan proyek diterapkan pada run dan approval.</div>
  </div>}
  {!tenant?<div className="glass ops-card"><h2>Organisasi belum tersedia</h2><p className="muted">Buat organisasi dan proyek agar workflow dapat dikaitkan dengan master data yang benar.</p><Link href="/master-data/" style={{color:"#a9d8b7"}}>Buka Master Data →</Link></div>:<div className="ops-grid">
   <form className="glass ops-card" onSubmit={submit}>
    <div className="ops-card-head"><div><span className="muted ops-label">NEW ENGINEERING RUN</span><h2>Start governed work</h2></div><Zap size={18}/></div>
    <label>Run type<input value={runType} onChange={e=>setRunType(e.target.value)} required /></label>
    <label>Agent<select value={agent} onChange={e=>setAgent(e.target.value)}><option>engineering.structural</option><option>engineering.sap2000</option><option>engineering.geotechnical</option><option>engineering.seismic</option><option>bim.coordinator</option><option>qs.estimator</option><option>field.vision</option></select></label>
    <label>Criticality<select value={criticality} onChange={e=>setCriticality(e.target.value as typeof criticality)}><option value="normal">Normal</option><option value="high">High — approval required</option><option value="critical">Critical — approval required</option></select></label>
    <div className="ops-safety"><ShieldCheck size={16}/><span>AI dapat menghitung dan merekomendasikan. Keputusan engineering kritis memerlukan persetujuan manusia dan evidence.</span></div>
    <button className="ops-primary" disabled={busy||loading||!tenant}>{busy?"Creating…":"Create engineering run"}</button>
    {notice&&<div role="status" className="ops-notice">{notice}</div>}
   </form>
   <div className="glass ops-card"><div className="ops-card-head"><div><span className="muted ops-label">GOVERNANCE</span><h2>Live queue</h2></div><Activity size={18}/></div><div className="ops-metrics"><div><b>{runs.length}</b><span>Runs</span></div><div><b>{pending}</b><span>Pending approvals</span></div><div><b>{runs.filter(r=>r.criticality!=="normal").length}</b><span>Gated</span></div></div>
    <div className="ops-list">{loading?<div className="empty-state">Memuat workflow…</div>:runs.length?runs.slice(0,8).map(r=><div className="ops-row" key={r.id}><div><b>{r.run_type}</b><span>{r.agent_code||"unassigned"} · {r.criticality}</span></div><em>{r.status}</em></div>):<div className="empty-state">Belum ada engineering run pada organisasi ini.</div>}</div>
   </div>
  </div>}
  {tenant&&<div className="glass ops-card ops-approvals"><div className="ops-card-head"><div><span className="muted ops-label">HUMAN APPROVAL</span><h2>Decision queue</h2></div><CheckCircle2 size={18}/></div>{approvalRows.length?approvalRows.slice(0,8).map(a=><div className="ops-row" key={a.id}><div><b>{a.approval_type}</b><span>{new Date(a.created_at).toLocaleString("id-ID")}</span></div><em>{a.status}</em></div>):<div className="empty-state">Approval queue kosong.</div>}</div>}
  {notice&&tenant&&<div role="status" className="ops-notice" style={{marginTop:12}}>{notice}</div>}
  <div className="muted" style={{fontSize:11,marginTop:12,display:"flex",gap:8,alignItems:"center"}}><FolderKanban size={14}/> Data disaring berdasarkan organisasi terpilih; run dapat dihubungkan ke proyek tertentu.</div>
 </section></main>;
}
