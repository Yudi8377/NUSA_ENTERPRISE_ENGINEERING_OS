"use client";

import Link from "next/link";
import { ArrowLeft, BrainCircuit, ExternalLink, Smartphone, Monitor, ShieldCheck, Puzzle, Activity, Github, Database, Workflow } from "lucide-react";

const links = [
  { title: "AURA Source", detail: "Repository utama dan riwayat perubahan", href: "https://github.com/akvisomr-eng/AURA", icon: Github },
  { title: "AURA Android CI", detail: "Build Android terbaru dan artefak yang tersedia", href: "https://github.com/akvisomr-eng/AURA/actions/workflows/android-build.yml", icon: Smartphone },
  { title: "AURA Windows CI", detail: "Build runtime desktop Windows", href: "https://github.com/akvisomr-eng/AURA/actions/workflows/windows.yml", icon: Monitor },
  { title: "AURA Browser Guardian", detail: "Ekstensi browser di dalam repository AURA", href: "https://github.com/akvisomr-eng/AURA/tree/main/aura-browser-extension", icon: Puzzle },
];

export default function AuraIntegrationPage() {
  return <main className="nusa gridbg"><div style={{minHeight:"100vh",padding:24,maxWidth:1320,margin:"0 auto"}}>
    <Link href="/" style={{display:"inline-flex",gap:8,alignItems:"center",color:"#a9d8b7",textDecoration:"none",fontSize:13}}><ArrowLeft size={16}/> Command Center</Link>
    <header style={{marginTop:30,display:"flex",justifyContent:"space-between",gap:20,alignItems:"start",flexWrap:"wrap"}}>
      <div style={{maxWidth:800}}><div className="muted" style={{fontSize:11,letterSpacing:".14em"}}>NUSA / COGNITIVE RUNTIME</div><h1 className="brand" style={{fontSize:42,margin:"8px 0"}}>AURA Integration Hub</h1><p className="muted" style={{fontSize:14,lineHeight:1.8}}>AURA menjadi pendamping kognitif untuk perangkat, suara, visi kamera, dan desktop. NUSA tetap menjadi control plane organisasi, proyek, data, audit, dan approval engineering.</p></div>
      <div className="glass" style={{padding:"10px 14px",borderRadius:12,display:"flex",alignItems:"center",gap:9,fontSize:12}}><span style={{width:8,height:8,borderRadius:8,background:"#8ed8a6",display:"inline-block"}}/> <span>Repository AURA terhubung</span></div>
    </header>
    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,240px),1fr))",gap:12,marginTop:20}}>
      {[{icon:BrainCircuit,label:"AURA Cognitive Runtime",value:"Android + Desktop",note:"Runtime native; berjalan di perangkat sendiri"},{icon:Activity,label:"AURA CI",value:"Build berhasil",note:"Workflow terbaru yang terlihat di GitHub berstatus sukses"},{icon:ShieldCheck,label:"Governance",value:"NUSA tetap mengendalikan",note:"Approval engineering kritis tidak dialihkan ke AURA"},{icon:Database,label:"Data kerja",value:"Tenant-scoped",note:"Data contoh dimuat dari Master Data setelah pengguna menekan tombol"}].map(x=><div key={x.label} className="glass" style={{padding:18,borderRadius:14}}><x.icon size={20} color="#a9d8b7"/><div className="muted" style={{fontSize:11,marginTop:12}}>{x.label}</div><div style={{fontSize:18,fontWeight:700,marginTop:5}}>{x.value}</div><div className="muted" style={{fontSize:12,lineHeight:1.6,marginTop:6}}>{x.note}</div></div>)}
    </section>
    <section className="glass" style={{padding:20,borderRadius:16,marginTop:16}}>
      <div style={{display:"flex",gap:10,alignItems:"center"}}><Workflow size={20} color="#a9d8b7"/><h2 style={{fontSize:20,margin:0}}>Pola integrasi NUSA × AURA</h2></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,220px),1fr))",gap:12,marginTop:16}}>
        <div style={{padding:15,border:"1px solid #29463a",borderRadius:12}}><div className="muted" style={{fontSize:10}}>01 / CONTROL PLANE</div><b style={{display:"block",marginTop:8}}>NUSA Web + Supabase</b><p className="muted" style={{fontSize:12,lineHeight:1.7}}>Identitas, tenant, proyek, master data, audit, knowledge, dan human approval.</p></div>
        <div style={{padding:15,border:"1px solid #29463a",borderRadius:12}}><div className="muted" style={{fontSize:10}}>02 / DEVICE RUNTIME</div><b style={{display:"block",marginTop:8}}>AURA Android / Windows</b><p className="muted" style={{fontSize:12,lineHeight:1.7}}>Suara Indonesia, penglihatan kamera, pendamping perangkat, dan runtime desktop sesuai kemampuan build AURA.</p></div>
        <div style={{padding:15,border:"1px solid #29463a",borderRadius:12}}><div className="muted" style={{fontSize:10}}>03 / GOVERNED BRIDGE</div><b style={{display:"block",marginTop:8}}>Kontrak integrasi berikutnya</b><p className="muted" style={{fontSize:12,lineHeight:1.7}}>Untuk komunikasi runtime langsung diperlukan endpoint bridge yang terautentikasi, scope tenant, validasi payload, dan log audit. Halaman ini tidak berpura-pura bahwa koneksi runtime langsung sudah aktif.</p></div>
      </div>
    </section>
    <section style={{marginTop:16}}>
      <div className="panel-heading"><div><div className="muted" style={{fontSize:11,letterSpacing:".12em"}}>BUILD & SOURCE</div><h2 style={{fontSize:21,margin:"6px 0"}}>Akses AURA</h2><p className="muted" style={{fontSize:12,lineHeight:1.6}}>Tautan mengarah ke sumber resmi. Build sukses tidak otomatis berarti binary sudah diunduh atau runtime sudah terhubung ke sesi NUSA.</p></div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,250px),1fr))",gap:12,marginTop:12}}>
        {links.map(item=>{const Icon=item.icon;return <a key={item.title} href={item.href} target="_blank" rel="noreferrer" className="glass" style={{display:"flex",gap:12,alignItems:"start",padding:16,borderRadius:13,textDecoration:"none",color:"#e7f2eb"}}><Icon size={20} color="#a9d8b7"/><div style={{flex:1}}><b>{item.title}</b><p className="muted" style={{fontSize:12,lineHeight:1.6,margin:"6px 0 0"}}>{item.detail}</p></div><ExternalLink size={15}/></a>})}
      </div>
    </section>
    <section className="glass" style={{padding:18,borderRadius:14,marginTop:16,display:"flex",gap:12,alignItems:"start"}}><ShieldCheck size={18} color="#a9d8b7"/><div><b>Batas keselamatan integrasi</b><p className="muted" style={{fontSize:12,lineHeight:1.7,marginBottom:0}}>AURA dapat membantu observasi dan interaksi, tetapi tidak boleh menyetujui desain struktur, hasil SAP2000, atau keputusan engineering kritis secara mandiri. NUSA mempertahankan approval manusia, tenant isolation, dan jejak bukti.</p></div></section>
    <footer className="muted" style={{fontSize:11,marginTop:18}}>NUSA Enterprise Engineering OS · AURA Integration Hub · <Link href="/master-data/" style={{color:"#a9d8b7"}}>Buka Master Data</Link></footer>
  </div></main>;
}
