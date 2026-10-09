"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import { currentUser, myTenants } from "../lib/nusa";

type Tenant={id:string;name:string;code:string;status:string};
type RecordRow={id:string;record_type:string;record_code:string|null;title:string;description:string|null;status:string;amount:number|null;currency:string;created_at:string;updated_at:string};
type Props={moduleCode:"erp"|"crm"|"hr"|"procurement"|"reports"|"grc";title:string;eyebrow:string;description:string;recordType:string;recordLabel:string;};
const statuses=["draft","open","submitted","approved","rejected","closed","archived","void"];
const statusLabel:Record<string,string>={draft:"Draf",open:"Terbuka",submitted:"Diajukan",approved:"Disetujui",rejected:"Ditolak",closed:"Selesai",archived:"Diarsipkan",void:"Dibatalkan"};
export default function EnterpriseWorkspace({moduleCode,title,eyebrow,description,recordType,recordLabel}:Props){
 const [tenantList,setTenantList]=useState<Tenant[]>([]);
 const [tenantId,setTenantId]=useState("");
 const [rows,setRows]=useState<RecordRow[]>([]);
 const [userId,setUserId]=useState("");
 const [query,setQuery]=useState("");
 const [newTitle,setNewTitle]=useState("");
 const [newDescription,setNewDescription]=useState("");
 const [newAmount,setNewAmount]=useState("");
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const refresh=useCallback(async()=>{
   setLoading(true);setError("");
   const user=await currentUser();
   if(!user){setUserId("");setRows([]);setTenantList([]);setLoading(false);return;}
   setUserId(user.id);
   const tenantResult=await myTenants();
   if(tenantResult.error){setError(tenantResult.error.message);setLoading(false);return;}
   const tenants=(tenantResult.data??[]) as Tenant[];
   setTenantList(tenants);
   const activeId=tenants.some(t=>t.id===tenantId)?tenantId:(tenants[0]?.id??"");
   setTenantId(activeId);
   if(!activeId){setRows([]);setLoading(false);return;}
   const result=await supabase.from("nusa_workspace_records").select("id,record_type,record_code,title,description,status,amount,currency,created_at,updated_at").eq("tenant_id",activeId).eq("module_code",moduleCode).is("archived_at",null).order("updated_at",{ascending:false}).limit(100);
   if(result.error)setError(result.error.message);else setRows((result.data??[]) as RecordRow[]);
   setLoading(false);
 },[moduleCode,tenantId]);
 useEffect(()=>{void refresh();},[refresh]);
 const visible=useMemo(()=>rows.filter(row=>[row.title,row.record_type,row.record_code??"",row.status].join(" ").toLowerCase().includes(query.toLowerCase())),[rows,query]);
 async function addRecord(event:React.FormEvent<HTMLFormElement>){
   event.preventDefault();if(!userId||!tenantId||!newTitle.trim())return;
   setSaving(true);setError("");setNotice("");
   const amount=newAmount.trim()?Number(newAmount):null;
   if(amount!==null&&!Number.isFinite(amount)){setError("Nilai nominal tidak valid.");setSaving(false);return;}
   const result=await supabase.from("nusa_workspace_records").insert({tenant_id:tenantId,module_code:moduleCode,record_type:recordType,title:newTitle.trim(),description:newDescription.trim()||null,amount,currency:"IDR",status:"draft",created_by:userId,updated_by:userId,data:{source:"nusa-web",locale:"id-ID"}}).select("id").single();
   if(result.error)setError(result.error.message);else{setNewTitle("");setNewDescription("");setNewAmount("");setNotice("Draf berhasil disimpan dan jejak audit dicatat.");await refresh();}
   setSaving(false);
 }
 async function updateStatus(row:RecordRow,status:string){
   if(!userId||!tenantId)return;
   setError("");setNotice("");
   const result=await supabase.from("nusa_workspace_records").update({status,updated_by:userId,archived_at:status==="archived"?new Date().toISOString():null}).eq("id",row.id).eq("tenant_id",tenantId).select("id").single();
   if(result.error)setError(result.error.message);else{setNotice("Status diperbarui; perubahan tercatat pada audit trail.");await refresh();}
 }
 return <main className="nusa gridbg"><div style={{minHeight:"100vh",padding:"24px",maxWidth:1440,margin:"0 auto"}}>
 <Link href="/" style={{display:"inline-flex",gap:8,alignItems:"center",color:"#a9d8b7",textDecoration:"none",fontSize:13}}><ArrowLeft size={16}/> Command Center</Link>
 <header style={{marginTop:34,display:"flex",justifyContent:"space-between",alignItems:"end",gap:18,flexWrap:"wrap"}}><div><div className="muted" style={{fontSize:11,letterSpacing:".13em"}}>{eyebrow}</div><h1 className="brand" style={{fontSize:40,margin:"8px 0"}}>{title}</h1><p className="muted" style={{fontSize:14,lineHeight:1.7,maxWidth:760}}>{description}</p></div><button onClick={()=>void refresh()} className="glass" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,color:"#dcebe4",border:"1px solid #29463a",cursor:"pointer"}}><RefreshCw size={15}/> Muat ulang</button></header>
 {!userId?<section className="glass" style={{marginTop:24,padding:24,borderRadius:16}}><h2 style={{marginTop:0}}>Sesi pengguna diperlukan</h2><p className="muted">Masuk melalui Command Center untuk membuka data organisasi. Akses dibatasi oleh keanggotaan tenant di database.</p><Link href="/" style={{color:"#a9d8b7"}}>Kembali ke Command Center →</Link></section>:<><section className="glass" style={{marginTop:22,padding:16,borderRadius:14,display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}><div style={{flex:1,minWidth:220}}><div className="muted" style={{fontSize:10,marginBottom:6}}>ORGANISASI / TENANT</div><select value={tenantId} onChange={e=>setTenantId(e.target.value)} style={{width:"100%",maxWidth:480,padding:11,background:"#0b1712",color:"#e7f2eb",border:"1px solid #29463a",borderRadius:9}}><option value="">Pilih organisasi</option>{tenantList.map(t=><option key={t.id} value={t.id}>{t.name} · {t.code}</option>)}</select></div><div><div className="muted" style={{fontSize:10}}>REKAMAN AKTIF</div><div style={{fontSize:26,fontWeight:700}}>{rows.length}</div></div><div style={{display:"flex",alignItems:"center",gap:7,color:"#9fd5ae",fontSize:12}}><ShieldCheck size={16}/> Tenant-scoped + audit trail</div></section>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,360px),1fr))",gap:16,marginTop:16,alignItems:"start"}}><section className="glass" style={{padding:18,borderRadius:14}}><h2 style={{fontSize:18,marginTop:0}}>Buat {recordLabel.toLowerCase()}</h2><p className="muted" style={{fontSize:12,lineHeight:1.6}}>Rekaman baru disimpan sebagai draf. Persetujuan final tetap mengikuti kewenangan organisasi.</p><form onSubmit={addRecord} style={{display:"grid",gap:10}}><label style={{fontSize:12}}>Judul<input required value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Contoh: {recordLabel} periode berjalan" style={fieldStyle}/></label><label style={{fontSize:12}}>Keterangan<textarea value={newDescription} onChange={e=>setNewDescription(e.target.value)} rows={3} placeholder="Ringkasan, referensi, atau catatan" style={fieldStyle}/></label><label style={{fontSize:12}}>Nilai (IDR, opsional)<input inputMode="decimal" value={newAmount} onChange={e=>setNewAmount(e.target.value)} placeholder="0" style={fieldStyle}/></label><button disabled={saving||!tenantId} type="submit" style={{display:"inline-flex",justifyContent:"center",alignItems:"center",gap:8,padding:12,border:0,borderRadius:9,background:"#a9d8b7",color:"#10251a",fontWeight:700,cursor:"pointer"}}><Plus size={16}/>{saving?"Menyimpan…":"Simpan draf"}</button></form></section>
 <section className="glass" style={{padding:18,borderRadius:14,minWidth:0}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><h2 style={{fontSize:18,margin:0}}>Daftar rekaman</h2><div style={{position:"relative",flex:"1 1 180px",maxWidth:280}}><Search size={15} style={{position:"absolute",left:10,top:12,opacity:.65}}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari judul atau status…" style={{...fieldStyle,paddingLeft:32,marginTop:0}}/></div></div>
 {loading?<p className="muted">Memuat data organisasi…</p>:!tenantId?<p className="muted">Pilih organisasi yang dapat Anda akses.</p>:visible.length===0?<div style={{padding:"28px 8px",textAlign:"center"}}><div style={{fontWeight:700}}>Belum ada rekaman</div><p className="muted" style={{fontSize:12}}>Buat draf pertama di panel sebelah kiri.</p></div>:<div style={{overflowX:"auto",marginTop:14}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:470}}><thead><tr>{["Rekaman","Status","Nilai","Tindakan"].map(x=><th key={x} style={{textAlign:"left",padding:"10px 8px",borderBottom:"1px solid #29463a",color:"#9eb5a7"}}>{x}</th>)}</tr></thead><tbody>{visible.map(row=><tr key={row.id}><td style={{padding:"12px 8px",borderBottom:"1px solid #1e3329"}}><div style={{fontWeight:700}}>{row.title}</div><div className="muted" style={{fontSize:10,marginTop:4}}>{row.record_type} · {new Date(row.updated_at).toLocaleDateString("id-ID")}</div></td><td style={{padding:"12px 8px",borderBottom:"1px solid #1e3329"}}>{statusLabel[row.status]??row.status}</td><td style={{padding:"12px 8px",borderBottom:"1px solid #1e3329",whiteSpace:"nowrap"}}>{row.amount===null?"—":new Intl.NumberFormat("id-ID",{style:"currency",currency:row.currency??"IDR",maximumFractionDigits:0}).format(Number(row.amount))}</td><td style={{padding:"12px 8px",borderBottom:"1px solid #1e3329"}}><select aria-label={"Ubah status "+row.title} value={row.status} onChange={e=>void updateStatus(row,e.target.value)} style={{background:"#0b1712",color:"#e7f2eb",border:"1px solid #29463a",padding:7,borderRadius:7}}>{statuses.map(s=><option key={s} value={s} disabled={s==="approved"}>{statusLabel[s]}</option>)}</select></td></tr>)}</tbody></table></div>}
 </section></div></>}
 {error&&<p role="alert" style={{marginTop:14,padding:12,border:"1px solid #8b4949",borderRadius:9,color:"#ffc4c4"}}>{error}</p>}{notice&&<p role="status" style={{marginTop:14,padding:12,border:"1px solid #35674b",borderRadius:9,color:"#a9d8b7"}}>{notice}</p>}
 <div style={{marginTop:18,padding:14,border:"1px solid #29463a",borderRadius:12,display:"flex",gap:10,alignItems:"start"}}><ShieldCheck size={17}/><div className="muted" style={{fontSize:11,lineHeight:1.7}}>Akses dibatasi ke tenant yang diikuti. Perubahan disimpan di database dan dicatat pada event trail. Data berstatus draf bukan persetujuan legal, akuntansi, pajak, atau engineering final.</div></div>
 </div></main>
}
const fieldStyle:React.CSSProperties={display:"block",width:"100%",boxSizing:"border-box",marginTop:6,padding:11,background:"#0b1712",color:"#e7f2eb",border:"1px solid #29463a",borderRadius:9,font:"inherit"};
