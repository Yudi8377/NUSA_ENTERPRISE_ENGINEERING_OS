"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, BarChart3, Building2, CheckCircle2, CircleDollarSign, ClipboardCheck, Command, FileText, Layers3, LogIn, Menu, MessageSquare, PanelLeft, Plus, ShieldCheck, Users, X, Zap } from "lucide-react";
import { supabase } from "../lib/supabase";
import { agentFleet, createTenant, currentUser, myTenants, projects, queueCommand } from "../lib/nusa";
import { spatialModels } from "../lib/pascal";
import { retrieveKnowledge } from "../lib/knowledge";
import { approvals, engineeringRuns, ingestionJobs } from "../lib/operations";

const modules = [
  ["Command Center", Command, "/"],["Enterprise Blueprint", FileText, "/system-blueprint/"],["Master Data", Building2, "/master-data/"],["AURA Integration", Activity, "/aura/"],["Projects & Construction", Building2, "/projects/"],["Engineering & SAP2000", Activity, "/operations/"],
  ["Architecture / CAD / BIM", Layers3, "/architecture/"],["ERP & Finance", CircleDollarSign, "/erp/"],["CRM", Users, "/crm/"],
  ["HRD & Payroll", Users, "/hr/"],["Procurement & Asset", ClipboardCheck, "/procurement/"],["Reports & Forecast", BarChart3, "/reports/"],["GRC & Compliance", ShieldCheck, "/grc/"],
] as const;

const phaseLabels = ["Platform","Finance","CRM","HR","Tax","Procurement","Construction","CAD","BIM","AI","Guardian","Self-Healing","BI","Integrations","Pilot","Hardening","Go Live"];
type NusaUser = { id: string; email?: string | null };
type NusaTenant = { id: string; name?: string | null };
type NusaProject = { id: string; progress?: number | null };
type NusaAgent = { code?: string | null; name?: string | null; domain?: string | null; status?: string | null; risk_level?: string | null };
type AgentFallback = [string, string, string];

export default function Home() {
  const [open,setOpen]=useState(true);
  const [q,setQ]=useState("");
  const [messages,setMessages]=useState<string[]>([]);
  const [user,setUser]=useState<NusaUser | null>(null);
  const [tenant,setTenant]=useState<NusaTenant | null>(null);
  const [projectList,setProjectList]=useState<NusaProject[]>([]);
  const [agents,setAgents]=useState<NusaAgent[]>([]);
  const [spatialList,setSpatialList]=useState<Array<{id:string;code:string;name:string;status:string;engine:string;updated_at:string}>>([]);
  const [authOpen,setAuthOpen]=useState(false);
  const [mode,setMode]=useState<"signin"|"signup">("signin");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [workspace,setWorkspace]=useState("");
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  const [knowledgeQuery,setKnowledgeQuery]=useState("");
  const [knowledgeResults,setKnowledgeResults]=useState<Array<{id:string;title:string;domain_code:string|null;content:string;authority_level:string;confidence:number}>>([]);
  const [knowledgeBusy,setKnowledgeBusy]=useState(false);
  const [runList,setRunList]=useState<Array<{id:string;run_type:string;status:string;criticality:string;agent_code:string|null;created_at:string}>>([]);
  const [approvalList,setApprovalList]=useState<Array<{id:string;approval_type:string;status:string;created_at:string}>>([]);
  const [ingestionList,setIngestionList]=useState<Array<{id:string;source_kind:string;source_name:string;status:string;created_at:string}>>([]);

  const load=async()=>{
    const u=await currentUser(); setUser(u as NusaUser | null);
    const a=await agentFleet(); if(!a.error) setAgents((a.data||[]) as NusaAgent[]);
    if(u){
      const t=await myTenants(); if(!t.error&&t.data?.[0]){
        setTenant(t.data[0]);
        const p=await projects(t.data[0].id); if(!p.error) setProjectList((p.data||[]) as NusaProject[]);
        const s=await spatialModels(t.data[0].id); if(!s.error) setSpatialList((s.data||[]) as Array<{id:string;code:string;name:string;status:string;engine:string;updated_at:string}>);
        const [runs,aps,ing]=await Promise.all([engineeringRuns(t.data[0].id),approvals(t.data[0].id),ingestionJobs(t.data[0].id)]);
        if(!runs.error) setRunList((runs.data||[]) as typeof runList);
        if(!aps.error) setApprovalList((aps.data||[]) as typeof approvalList);
        if(!ing.error) setIngestionList((ing.data||[]) as typeof ingestionList);
      }
    }
  };
  useEffect(()=>{
    const timer=window.setTimeout(()=>{ void load(); },0);
    const {data}=supabase.auth.onAuthStateChange(()=>{ void load(); });
    return ()=>{ window.clearTimeout(timer); data.subscription.unsubscribe(); };
  },[]);

  const ask=async()=>{
    const text=q.trim(); if(!text) return;
    setMessages(m=>[...m,"Anda: "+text]); setQ("");
    if(!user||!tenant){ setMessages(m=>[...m,"NUSA: Silakan masuk terlebih dahulu agar perintah tercatat dan memiliki jejak audit."]); return; }
    const r=await queueCommand(tenant.id,user.id,text);
    if(r.error) setMessages(m=>[...m,"NUSA: Perintah belum masuk antrean: "+r.error.message]);
    else setMessages(m=>[...m,"NUSA: Perintah diterima. Orchestrator akan mendelegasikan tugas sesuai kebijakan dan approval gate."]);
  };

  const searchKnowledge=async()=>{
    const query=knowledgeQuery.trim(); if(!query) return;
    setKnowledgeBusy(true); setNotice("");
    const r=await retrieveKnowledge({tenantId:tenant?.id,query,limit:6});
    if(r.error){setNotice("Knowledge search gagal: "+r.error.message);setKnowledgeResults([]);}
    else setKnowledgeResults((r.data||[]) as typeof knowledgeResults);
    setKnowledgeBusy(false);
  };

  const auth=async()=>{
    setBusy(true); setNotice("");
    const r=mode==="signin" ? await supabase.auth.signInWithPassword({email,password}) : await supabase.auth.signUp({email,password,options:{emailRedirectTo:"https://yudi8377.github.io/NUSA_ENTERPRISE_ENGINEERING_OS/"}});
    if(r.error) setNotice(r.error.message);
    else { setNotice(mode==="signup"?"Akun dibuat. Jika verifikasi email aktif, cek inbox lalu masuk.":"Berhasil masuk."); setAuthOpen(false); await load(); }
    setBusy(false);
  };

  const onboard=async()=>{
    if(!user||!workspace.trim()) return;
    setBusy(true);
    const code=workspace.trim().toUpperCase().replace(/[^A-Z0-9]+/g,"-").slice(0,30);
    const r=await createTenant(workspace.trim(),code,user.id);
    if(r.error) setNotice(r.error.message); else { setNotice("Workspace dibuat."); await load(); }
    setBusy(false);
  };

  const activeProjects=projectList.length;
  const progress=projectList.length ? Math.round(projectList.reduce((s,p)=>s+Number(p.progress||0),0)/projectList.length) : 0;
  const critical=agents.filter(a=>a.risk_level==="critical").length;
  const pendingApprovals=approvalList.filter(a=>a.status==="pending").length;

  return <main className="nusa nusa-home gridbg">
    <div style={{display:"grid",gridTemplateColumns:open?"272px 1fr":"72px 1fr",minHeight:"100vh"}}>
      <aside className={"glass nusa-sidebar "+(open?"is-open":"is-closed")} style={{padding:18,position:"sticky",top:0,height:"100vh",zIndex:5}}>
        <button onClick={()=>setOpen(!open)} aria-label="Navigasi" style={{background:"none",border:0,color:"white",cursor:"pointer"}}>{open?<PanelLeft/>:<Menu/>}</button>
        {open&&<><div style={{margin:"22px 4px 28px"}}><div className="brand" style={{fontSize:23,fontWeight:700}}>NUSA</div><div className="muted" style={{fontSize:12}}>ENTERPRISE ENGINEERING OS</div></div>
        {modules.map(([name,Icon,href])=><Link key={name} href={href} onClick={()=>setOpen(false)} style={{display:"flex",gap:11,alignItems:"center",padding:"11px 8px",borderRadius:10,color:"#b9c9c1",fontSize:13,textDecoration:"none"}}><Icon size={17}/>{name}</Link>)}
        <div style={{marginTop:20,padding:12,borderTop:"1px solid #20352d",fontSize:11}} className="muted">PHASE 0 → GO LIVE<br/>Parallel workstreams active</div></>}
      </aside>

      <section style={{padding:"24px 28px",maxWidth:1500,width:"100%",margin:"0 auto"}}>
        <header style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          <div><div className="muted" style={{fontSize:12}}>NUSA CONTROL PLANE / FREE-FIRST PRODUCTION</div><h1 className="brand" style={{fontSize:30,margin:"5px 0"}}>Enterprise Command Center</h1><div className="muted" style={{fontSize:12}}>Evidence-first · Indonesian-first · Human approval for critical engineering</div></div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {user?<><span className="muted" style={{fontSize:12}}>{user.email}</span><button onClick={()=>supabase.auth.signOut()} className="glass" style={{padding:"10px 14px",color:"#dcebe4",borderRadius:10,border:0}}>Keluar</button></>:<button onClick={()=>setAuthOpen(true)} style={{background:"#d8f5df",color:"#0b2116",border:0,borderRadius:10,padding:"10px 15px",fontWeight:700,display:"flex",gap:8,alignItems:"center"}}><LogIn size={16}/> Masuk NUSA</button>}
            <button onClick={()=>window.print()} title="Cetak Command Center" aria-label="Cetak Command Center" className="glass" style={{padding:"10px 14px",color:"#dcebe4",borderRadius:10,border:0,cursor:"pointer"}}><FileText size={16}/></button>
          </div>
        </header>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:14,marginTop:24}}>
          {[[ "Active Projects",String(activeProjects),user?"real-time tenant data":"sign-in required" ],["Engineering Runs","—","evidence tracked"],["Open Issues","—","guardian controlled"],["Pilot Progress",progress+"%","Yayasan Ngawi"]].map(([a,b,c])=><div className="glass" key={a} style={{padding:18,borderRadius:14}}><div className="muted" style={{fontSize:12}}>{a}</div><div className="brand" style={{fontSize:28,fontWeight:700,marginTop:8}}>{b}</div><div style={{fontSize:11,color:"#91c7a7",marginTop:4}}>{c}</div></div>)}
        </div>

        {!tenant&&user&&<div className="glass" style={{padding:18,borderRadius:16,marginTop:16,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}><div style={{flex:1}}><b>Belum ada workspace.</b><div className="muted" style={{fontSize:12}}>Buat tenant pertama untuk mengaktifkan isolasi data dan audit trail.</div></div><input value={workspace} onChange={e=>setWorkspace(e.target.value)} placeholder="Nama perusahaan / organisasi" style={{background:"#09150f",border:"1px solid #254438",borderRadius:9,padding:"10px 12px",color:"white"}}/><button onClick={onboard} disabled={busy} style={{background:"#d8f5df",border:0,borderRadius:9,padding:"10px 14px",fontWeight:700}}><Plus size={15}/> Buat Workspace</button></div>}

        <div className="glass" style={{padding:18,borderRadius:16,marginTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div className="muted" style={{fontSize:12}}>SPATIAL ENGINE</div><h2 style={{margin:"5px 0 3px",fontSize:19}}>Pascal Architectural Workspace</h2><div className="muted" style={{fontSize:11}}>Local-first 3D authoring · NUSA evidence · Human approval boundary</div></div>
            <Layers3 size={19}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1.3fr 1fr",gap:14,marginTop:14}}>
            <div style={{padding:14,background:"#0a1712",borderRadius:11}}>
              <div style={{fontSize:13,fontWeight:700}}>Yayasan Ngawi Spatial Pilot</div>
              <div className="muted" style={{fontSize:11,marginTop:5}}>26 × 8 m · 2 lantai · preliminary architectural scene</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
                {["CREATE_SCENE","OPEN_SCENE","IMPORT","EXPORT","QUERY_SCENE"].map(a=><span key={a} style={{border:"1px solid #29463a",borderRadius:999,padding:"5px 8px",fontSize:9,color:"#a9d8b7"}}>{a}</span>)}
              </div>
            </div>
            <div style={{padding:14,background:"#0a1712",borderRadius:11}}>
              <div className="muted" style={{fontSize:11}}>REGISTERED SPATIAL MODELS</div>
              <div className="brand" style={{fontSize:25,fontWeight:700,marginTop:4}}>{spatialList.length}</div>
              <div className="muted" style={{fontSize:10}}>Supabase metadata · Pascal artifacts remain local/cloud evidence</div>
            </div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:16,marginTop:16}}>
          <div className="glass" style={{padding:20,borderRadius:16}}>
            <div style={{display:"flex",justifyContent:"space-between"}}><div><div className="muted" style={{fontSize:12}}>PILOT PROJECT</div><h2 style={{margin:"5px 0 3px",fontSize:20}}>Yayasan Islami–Kejawen · Ngawi</h2><div className="muted" style={{fontSize:12}}>26 × 8 m · 2 floors · Design Development</div></div><ArrowUpRight/></div>
            <div style={{height:8,background:"#1c332a",borderRadius:10,marginTop:28}}><div style={{width:Math.max(4,progress)+"%",height:"100%",background:"#8ed8a6",borderRadius:10}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:12}}><span className="muted">Engineering workflow</span><b>{progress}%</b></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:22}}>{[["Structure","Human approval"],["MEP","Coordination"],["SAP2000","Awaiting site data"]].map(x=><div key={x[0]} style={{padding:12,background:"#0a1712",borderRadius:10}}><div className="muted" style={{fontSize:11}}>{x[0]}</div><div style={{fontSize:12,marginTop:5}}>{x[1]}</div></div>)}</div>
          </div>
          <div className="glass" style={{padding:20,borderRadius:16}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div className="muted" style={{fontSize:12}}>AI WORKFORCE</div><h2 style={{margin:"5px 0 18px",fontSize:20}}>Agent Fleet</h2></div><Zap size={18}/></div>
          {(agents.length?agents.slice(0,7):([["nusa.orchestrator","NUSA Orchestrator","online"],["engineering.structural","Structural Engineer","ready"],["engineering.sap2000","SAP2000 Copilot","ready"]] as AgentFallback[])).map((a) => <div key={Array.isArray(a) ? a[0] : (a.code || a.name || "agent")} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:"1px solid #173027"}}><div style={{width:8,height:8,borderRadius:50,background:"#8ed8a6"}}/><div style={{flex:1}}><div style={{fontSize:13}}>{Array.isArray(a)?a[1]:a.name}</div><div className="muted" style={{fontSize:10}}>{Array.isArray(a)?a[2]:a.domain}</div></div><span style={{fontSize:10}}>{Array.isArray(a)?a[2]:(a.status||"ready")}</span></div>)}
          <div className="muted" style={{fontSize:10,marginTop:12}}>{critical} critical-risk agents require approval.</div></div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr",gap:16,marginTop:16}}>
          <div className="glass" style={{padding:18,borderRadius:16}}>
            <div className="muted" style={{fontSize:11}}>ENGINEERING GOVERNANCE</div>
            <h2 style={{margin:"5px 0 12px",fontSize:18}}>Run & Approval Queue</h2>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
              <span className="status-pill">Runs {runList.length}</span><span className="status-pill">Pending approval {pendingApprovals}</span>
            </div>
            {runList.length?runList.slice(0,4).map(r=><div key={r.id} style={{padding:"9px 0",borderBottom:"1px solid #173027",fontSize:11}}><b>{r.run_type}</b><span className="muted"> · {r.criticality} · {r.status}</span><div className="muted">{r.agent_code||"unassigned"}</div></div>):<div className="empty-state">Belum ada engineering run tercatat.</div>}
          </div>
          <div className="glass" style={{padding:18,borderRadius:16}}>
            <div className="muted" style={{fontSize:11}}>HUMAN APPROVAL</div>
            <h2 style={{margin:"5px 0 12px",fontSize:18}}>Approval Gate</h2>
            {approvalList.length?approvalList.slice(0,4).map(a=><div key={a.id} style={{padding:"9px 0",borderBottom:"1px solid #173027",fontSize:11}}><b>{a.approval_type}</b><span className="muted"> · {a.status}</span></div>):<div className="empty-state">Tidak ada approval yang menunggu keputusan.</div>}
          </div>
          <div className="glass" style={{padding:18,borderRadius:16}}>
            <div className="muted" style={{fontSize:11}}>KNOWLEDGE INGESTION</div>
            <h2 style={{margin:"5px 0 12px",fontSize:18}}>Ingestion Queue</h2>
            {ingestionList.length?ingestionList.slice(0,4).map(j=><div key={j.id} style={{padding:"9px 0",borderBottom:"1px solid #173027",fontSize:11}}><b>{j.source_name}</b><span className="muted"> · {j.status}</span><div className="muted">{j.source_kind}</div></div>):<div className="empty-state">Belum ada dokumen dalam antrean.</div>}
          </div>
        </div>

        <div className="glass intelligence-panel" style={{padding:20,borderRadius:16,marginTop:16}}>
          <div className="panel-heading"><div><div className="muted" style={{fontSize:12}}>KNOWLEDGE BRAIN</div><h2 style={{margin:"5px 0 3px",fontSize:19}}>NUSA Intelligence Studio</h2><div className="muted" style={{fontSize:11}}>Cari pengetahuan terverifikasi sebelum NUSA melakukan reasoning.</div></div><ShieldCheck size={19}/></div>
          <div className="knowledge-search"><input value={knowledgeQuery} onChange={e=>setKnowledgeQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchKnowledge()} placeholder="Contoh: kebutuhan data untuk analisis struktur Yayasan Ngawi" /><button onClick={searchKnowledge} disabled={knowledgeBusy}>{knowledgeBusy?"Mencari…":"Cari Knowledge"}</button></div>
          {knowledgeResults.length>0&&<div className="knowledge-results">{knowledgeResults.map(k=><div className="knowledge-item" key={k.id}><div className="knowledge-top"><b>{k.title}</b><span>{k.domain_code||"core"} · {k.authority_level} · {Math.round(Number(k.confidence)*100)}%</span></div><div className="muted knowledge-content">{k.content}</div></div>)}</div>}
          {knowledgeQuery && knowledgeResults.length===0 && !knowledgeBusy && <div className="empty-state">Belum ada knowledge terindeks untuk pertanyaan ini. NUSA tidak mengarang jawaban dari data yang belum tersedia.</div>}
        </div>

        <div className="glass" style={{padding:18,borderRadius:16,marginTop:16}}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}><MessageSquare size={18}/><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} placeholder="Tanyakan NUSA: analisa proyek, buat RAB, cek risiko, siapkan laporan..." style={{flex:1,background:"transparent",border:0,outline:0,color:"white",fontSize:14}}/><button onClick={ask} style={{background:"#d8f5df",border:0,borderRadius:9,padding:"9px 14px",fontWeight:700}}>ASK NUSA</button></div>
          {messages.slice(-4).map((m,i)=><div key={i} style={{marginTop:8,padding:10,background:"#0a1712",borderRadius:8,fontSize:12}}>{m}</div>)}
        </div>

        <div className="glass" style={{padding:18,borderRadius:16,marginTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div className="muted" style={{fontSize:12}}>PARALLEL DELIVERY</div><h2 style={{margin:"5px 0 14px",fontSize:19}}>Phase 0 → 18</h2></div><CheckCircle2 size={18}/></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(9,minmax(0,1fr))",gap:6}}>{phaseLabels.map((p,i)=><div key={p} title={p} style={{height:8,borderRadius:6,background:i<5?"#8ed8a6":"#29463a"}}/>)}
          </div>
          <div className="muted" style={{fontSize:11,marginTop:10}}>Foundation, data governance, ERP, engineering, AI, self-healing, BI, pilot and hardening are tracked as one governed release train.</div>
        </div>

        <footer className="muted" style={{fontSize:11,marginTop:18,display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><span>GitHub + Supabase Free · Local Windows Engineering Bridge</span><span>v0.2.0 · Parallel Build</span></footer>
      </section>
    </div>

    {authOpen&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"grid",placeItems:"center",zIndex:20,padding:20}}>
      <div className="glass" style={{width:"min(440px,100%)",padding:24,borderRadius:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div className="muted" style={{fontSize:12}}>NUSA AUTH</div><h2 className="brand" style={{margin:"4px 0 18px"}}>{mode==="signin"?"Masuk ke NUSA":"Buat akun NUSA"}</h2></div><button onClick={()=>setAuthOpen(false)} style={{background:"none",border:0,color:"white"}}><X/></button></div>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={{width:"100%",marginBottom:10,background:"#09150f",border:"1px solid #254438",borderRadius:9,padding:11,color:"white"}}/>
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" style={{width:"100%",marginBottom:12,background:"#09150f",border:"1px solid #254438",borderRadius:9,padding:11,color:"white"}}/>
        {notice&&<div className="muted" style={{fontSize:12,marginBottom:10}}>{notice}</div>}
        <button onClick={auth} disabled={busy} style={{width:"100%",background:"#d8f5df",border:0,borderRadius:9,padding:11,fontWeight:700}}>{busy?"Memproses…":mode==="signin"?"Masuk":"Daftar"}</button>
        <button onClick={()=>setMode(mode==="signin"?"signup":"signin")} style={{width:"100%",marginTop:10,background:"none",border:0,color:"#a9d8b7",fontSize:12}}>{mode==="signin"?"Belum punya akun? Daftar":"Sudah punya akun? Masuk"}</button>
      </div>
    </div>}
  </main>;
}
