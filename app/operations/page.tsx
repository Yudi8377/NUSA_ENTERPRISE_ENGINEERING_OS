"use client";

import { FormEvent, useEffect, useState } from "react";
import { Activity, ArrowLeft, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { currentUser, myTenants } from "../../lib/nusa";
import { approvals, createEngineeringRun, engineeringRuns } from "../../lib/operations";

type Tenant = { id: string; name: string };
type Run = { id: string; run_type: string; status: string; criticality: string; agent_code: string | null; created_at: string };
type Approval = { id: string; approval_type: string; status: string; created_at: string };

export default function OperationsPage() {
  const [tenant,setTenant]=useState<Tenant|null>(null);
  const [runs,setRuns]=useState<Run[]>([]);
  const [approvalRows,setApprovalRows]=useState<Approval[]>([]);
  const [runType,setRunType]=useState("structural_analysis");
  const [criticality,setCriticality]=useState<"normal"|"high"|"critical">("high");
  const [agent,setAgent]=useState("engineering.structural");
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");

  const refresh=async()=>{
    const u=await currentUser();
    if(!u){ setNotice("Masuk ke NUSA untuk menjalankan engineering workflow."); return; }
    const t=await myTenants();
    if(t.error||!t.data?.[0]){ setNotice("Workspace belum tersedia."); return; }
    const selected=t.data[0] as Tenant;
    setTenant(selected);
    const [r,a]=await Promise.all([engineeringRuns(selected.id),approvals(selected.id)]);
    if(!r.error) setRuns((r.data||[]) as Run[]);
    if(!a.error) setApprovalRows((a.data||[]) as Approval[]);
  };

  useEffect(()=>{ let active=true; void (async()=>{ if(active) await refresh(); })(); const {data}=supabase.auth.onAuthStateChange(()=>{ if(active) void refresh(); }); return ()=>{ active=false; data.subscription.unsubscribe(); }; },[]);

  const submit=async(e:FormEvent)=>{
    e.preventDefault();
    const u=await currentUser();
    if(!u||!tenant) return;
    setBusy(true); setNotice("");
    const result=await createEngineeringRun({
      tenantId:tenant.id,
      requestedBy:u.id,
      agentCode:agent,
      runType:runType.trim(),
      criticality,
      payload:{source:"NUSA Operations Studio",requested_at:new Date().toISOString()},
    });
    if(result.error) setNotice("Run gagal dibuat: "+result.error.message);
    else {
      setNotice(criticality==="normal" ? "Engineering run tercatat." : "Engineering run tercatat dan human approval dibuat otomatis.");
      await refresh();
    }
    setBusy(false);
  };

  const pending=approvalRows.filter(a=>a.status==="pending").length;

  return <main className="nusa gridbg nusa-ops">
    <section className="ops-shell">
      <header className="ops-header">
        <a href="./" className="ops-back"><ArrowLeft size={15}/> Command Center</a>
        <div className="ops-eyebrow">NUSA ENGINEERING CONTROL PLANE</div>
        <h1 className="brand ops-title">Operations Studio</h1>
        <p className="muted">Create governed engineering work. High/critical runs remain behind a human approval boundary.</p>
      </header>

      <div className="ops-grid">
        <form className="glass ops-card" onSubmit={submit}>
          <div className="ops-card-head"><div><span className="muted ops-label">NEW ENGINEERING RUN</span><h2>Start governed work</h2></div><Zap size={18}/></div>
          <label>Run type<input value={runType} onChange={e=>setRunType(e.target.value)} required /></label>
          <label>Agent<select value={agent} onChange={e=>setAgent(e.target.value)}>
            <option>engineering.structural</option><option>engineering.sap2000</option><option>engineering.geotechnical</option><option>engineering.seismic</option><option>bim.coordinator</option><option>qs.estimator</option><option>field.vision</option>
          </select></label>
          <label>Criticality<select value={criticality} onChange={e=>setCriticality(e.target.value as typeof criticality)}>
            <option value="normal">Normal</option><option value="high">High — approval required</option><option value="critical">Critical — approval required</option>
          </select></label>
          <div className="ops-safety"><ShieldCheck size={16}/><span>AI may calculate, check and recommend. Critical engineering decisions require human approval and evidence.</span></div>
          <button className="ops-primary" disabled={busy||!tenant}>{busy?"Creating…":"Create engineering run"}</button>
          {notice&&<div className="ops-notice">{notice}</div>}
        </form>

        <div className="glass ops-card">
          <div className="ops-card-head"><div><span className="muted ops-label">GOVERNANCE</span><h2>Live queue</h2></div><Activity size={18}/></div>
          <div className="ops-metrics"><div><b>{runs.length}</b><span>Runs</span></div><div><b>{pending}</b><span>Pending approvals</span></div><div><b>{runs.filter(r=>r.criticality!=="normal").length}</b><span>Gated</span></div></div>
          <div className="ops-list">{runs.length?runs.slice(0,8).map(r=><div className="ops-row" key={r.id}><div><b>{r.run_type}</b><span>{r.agent_code||"unassigned"} · {r.criticality}</span></div><em>{r.status}</em></div>):<div className="empty-state">No engineering runs yet. Start the first governed run.</div>}</div>
        </div>
      </div>

      <div className="glass ops-card ops-approvals">
        <div className="ops-card-head"><div><span className="muted ops-label">HUMAN APPROVAL</span><h2>Decision queue</h2></div><CheckCircle2 size={18}/></div>
        {approvalRows.length?approvalRows.slice(0,8).map(a=><div className="ops-row" key={a.id}><div><b>{a.approval_type}</b><span>{new Date(a.created_at).toLocaleString("id-ID")}</span></div><em>{a.status}</em></div>):<div className="empty-state">Approval queue is empty.</div>}
      </div>
    </section>
  </main>;
}
