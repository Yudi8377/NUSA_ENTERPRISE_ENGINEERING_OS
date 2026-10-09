"use client";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpenCheck, ClipboardList, FileCheck2, Gauge, ShieldCheck } from "lucide-react";

export type ModuleSection={title:string;description:string;href:string;label:string;stage?:string};
type Props={title:string;eyebrow:string;description:string;sections:ModuleSection[];principles:string[];};
export default function EnterpriseModuleHub({title,eyebrow,description,sections,principles}:Props){
 return <main className="nusa gridbg"><div style={{minHeight:"100vh",padding:"28px",maxWidth:1500,margin:"0 auto"}}>
  <Link href="/" style={{display:"inline-flex",gap:8,alignItems:"center",color:"#a9d8b7",textDecoration:"none",fontSize:13}}><ArrowLeft size={16}/> Command Center</Link>
  <header style={{marginTop:32,display:"flex",justifyContent:"space-between",alignItems:"end",gap:18,flexWrap:"wrap"}}>
   <div><div className="muted" style={{fontSize:11,letterSpacing:".14em"}}>{eyebrow}</div><h1 className="brand" style={{fontSize:40,margin:"8px 0"}}>{title}</h1><p className="muted" style={{maxWidth:900,fontSize:14,lineHeight:1.8}}>{description}</p></div>
   <div className="glass" style={{padding:"11px 14px",borderRadius:12,display:"flex",alignItems:"center",gap:8,fontSize:11}}><ShieldCheck size={16} color="#a9d8b7"/> ORGANIZATION-SCOPED</div>
  </header>
  <section className="glass" style={{marginTop:22,padding:18,borderRadius:16}}>
   <div style={{display:"flex",gap:10,alignItems:"center"}}><Gauge size={18} color="#a9d8b7"/><div><b style={{fontSize:15}}>Module control center</b><div className="muted" style={{fontSize:11,marginTop:4}}>Pilih proses bisnis yang tepat. Setiap submenu membuka form, jenis rekaman, dan status yang sesuai konteksnya.</div></div></div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,270px),1fr))",gap:12,marginTop:18}}>
    {sections.map((section,index)=><article key={section.href} className="glass" style={{padding:16,borderRadius:12,minHeight:176,display:"flex",flexDirection:"column",background:"rgba(11,23,18,.52)"}}>
     <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}><span className="muted" style={{fontSize:10,letterSpacing:".1em"}}>WORKFLOW {String(index+1).padStart(2,"0")}</span><BookOpenCheck size={16} color="#a9d8b7"/></div>
     <h2 style={{fontSize:17,margin:"13px 0 7px"}}>{section.title}</h2><p className="muted" style={{fontSize:12,lineHeight:1.65,margin:"0 0 14px",flex:1}}>{section.description}</p>
     <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}><Link href={section.href} style={{display:"inline-flex",gap:7,alignItems:"center",color:"#a9d8b7",textDecoration:"none",fontSize:12,fontWeight:700}}>{section.label} <ArrowUpRight size={14}/></Link>{section.stage&&<span style={{fontSize:9,border:"1px solid #345747",borderRadius:999,padding:"4px 7px",color:"#bdd7c7"}}>{section.stage}</span>}</div>
    </article>)}
   </div>
  </section>
  <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,280px),1fr))",gap:12,marginTop:14}}>
   {principles.map((item,i)=><div key={item} className="glass" style={{padding:15,borderRadius:12,display:"flex",gap:10,alignItems:"start"}}>{i===0?<ClipboardList size={17} color="#a9d8b7"/>:<FileCheck2 size={17} color="#a9d8b7"/>}<div className="muted" style={{fontSize:11,lineHeight:1.7}}>{item}</div></div>)}
  </section>
 </div></main>;
}
