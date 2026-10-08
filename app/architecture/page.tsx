"use client";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, ShieldCheck } from "lucide-react";

const sections = [
  ["Spatial Workspace","Pascal scene authoring, floorplan interpretation, space program and project geometry.","/operations/"],
  ["CAD / DWG / DXF","Drawing intake, layer intelligence, revision control and local engineering bridge."],
  ["BIM / IFC","Model coordination, object metadata, quantities and exchange evidence."],
  ["Clash & Coordination","Architecture, structure and MEP coordination with review evidence."],
  ["Design Review","Requirements, assumptions, revisions, comments and approval checkpoints."],
  ["Interior Intelligence","Layout, material, lighting, furniture and QTO pipeline for interior design."]
];

export default function ModulePage(){
  return <main className="nusa gridbg"><div style={{minHeight:"100vh",padding:"28px",maxWidth:1500,margin:"0 auto"}}>
    <Link href="/" style={{display:"inline-flex",gap:8,alignItems:"center",color:"#a9d8b7",textDecoration:"none",fontSize:13}}><ArrowLeft size={16}/> Command Center</Link>
    <header style={{marginTop:42,display:"flex",justifyContent:"space-between",gap:20,alignItems:"end",flexWrap:"wrap"}}>
      <div><div className="muted" style={{fontSize:12,letterSpacing:".12em"}}>NUSA / ARCHITECTURE ENGINEERING</div><h1 className="brand" style={{fontSize:42,margin:"8px 0 10px"}}>Architecture / CAD / BIM</h1><p className="muted" style={{fontSize:15,lineHeight:1.7,maxWidth:850}}>Satu workspace untuk ruang, gambar, model BIM, koordinasi lintas disiplin dan design review — dengan evidence sebagai sumber kebenaran.</p></div>
      <div className="glass" style={{padding:"10px 14px",borderRadius:999,fontSize:11}}><span style={{display:"inline-block",width:7,height:7,borderRadius:99,background:"#8ed8a6",marginRight:8}}/>GOVERNED WORKSPACE</div>
    </header>
    <div className="glass" style={{marginTop:24,padding:16,borderRadius:14,display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}>
      <div><div className="muted" style={{fontSize:10}}>WORKSPACE MAP</div><b>{sections.length} workstreams</b></div>
      <div style={{display:"flex",gap:8}}><button className="glass" style={{padding:"9px 12px",borderRadius:9,color:"#dcebe4",border:0}}>Evidence</button><button className="glass" style={{padding:"9px 12px",borderRadius:9,color:"#dcebe4",border:0}}>History</button></div>
    </div>
    <section style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:14,marginTop:16}}>
      {sections.map(([title,desc,href])=>{const card=<div className="glass" style={{padding:18,borderRadius:14,minHeight:175}}><div style={{display:"flex",justifyContent:"space-between"}}><CheckCircle2 size={18}/><ArrowUpRight size={15}/></div><h2 style={{fontSize:17,margin:"16px 0 7px"}}>{title}</h2><p className="muted" style={{fontSize:12,lineHeight:1.6,margin:0}}>{desc}</p><div style={{marginTop:18,fontSize:10,color:"#91c7a7"}}>{href?"OPEN WORKSPACE":"IMPLEMENTATION SURFACE"}</div></div>; return href?<Link href={href} key={title} style={{textDecoration:"none",color:"inherit"}}>{card}</Link>:<div key={title}>{card}</div>})}
    </section>
    <div className="glass" style={{marginTop:16,padding:16,borderRadius:14,display:"flex",gap:12,alignItems:"center"}}><ShieldCheck size={19}/><div><b>Evidence-first governance</b><div className="muted" style={{fontSize:11,marginTop:4}}>Critical engineering outputs remain behind human approval. CAD/BIM artifacts carry provenance and revision evidence.</div></div></div>
  </div></main>;
}