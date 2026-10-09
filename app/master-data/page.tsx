"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Building2, FolderKanban, Users, Boxes, Plus, RefreshCw, Search, Pencil, Archive, Save, X, ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { currentUser, myTenants, createTenant } from "../../lib/nusa";

type Tenant = {id:string;name:string;code:string;status:string;legal_name?:string|null;industry?:string|null;tax_id?:string|null;address?:string|null;city?:string|null;phone?:string|null;contact_email?:string|null;website?:string|null};
type Project = {id:string;tenant_id:string;code:string;name:string;category:string;status:string;progress:number;budget:number|null;target_date:string|null;deleted_at:string|null;updated_at:string};
type Employee = {id:string;tenant_id:string;project_id:string|null;employee_code:string;full_name:string;email:string|null;phone:string|null;position_title:string|null;employment_status:string;joined_on:string|null;notes:string|null;updated_at:string};
type Asset = {id:string;tenant_id:string;project_id:string|null;assigned_employee_id:string|null;asset_code:string;name:string;category:string;condition_status:string;asset_status:string;acquisition_date:string|null;acquisition_cost:number|null;location:string|null;notes:string|null;updated_at:string};
type MasterEvent = {id:string;entity_table:string;entity_id:string;actor_id:string|null;action:string;created_at:string;after_state:Record<string,unknown>};
type Tab = "organization"|"projects"|"employees"|"assets";
type FormValues = Record<string,string>;
const tabs:{id:Tab;label:string;description:string;icon:typeof Building2}[]=[
 {id:"organization",label:"Organisasi",description:"Profil legal dan kontak organisasi",icon:Building2},
 {id:"projects",label:"Proyek",description:"Portofolio, anggaran, progres, dan target",icon:FolderKanban},
 {id:"employees",label:"Pegawai",description:"Data SDM dan penempatan proyek",icon:Users},
 {id:"assets",label:"Aset",description:"Inventaris, penanggung jawab, dan kondisi",icon:Boxes}
];
const blank:Record<Tab,FormValues>={
 organization:{name:"",legal_name:"",industry:"",tax_id:"",address:"",city:"",phone:"",contact_email:"",website:""},
 projects:{code:"",name:"",category:"engineering",status:"active",progress:"0",budget:"",target_date:""},
 employees:{employee_code:"",full_name:"",email:"",phone:"",position_title:"",employment_status:"active",joined_on:"",project_id:"",notes:""},
 assets:{asset_code:"",name:"",category:"equipment",condition_status:"good",asset_status:"available",acquisition_date:"",acquisition_cost:"",location:"",project_id:"",assigned_employee_id:"",notes:""}
};
const fieldStyle:React.CSSProperties={display:"block",width:"100%",boxSizing:"border-box",marginTop:6,padding:11,background:"#0b1712",color:"#e7f2eb",border:"1px solid #29463a",borderRadius:9,font:"inherit"};
const labelStyle:React.CSSProperties={display:"block",fontSize:12,color:"#c4d7cc"};
const dateValue=(v:string|null|undefined)=>v?String(v).slice(0,10):"";
export default function MasterDataPage(){
 const [tab,setTab]=useState<Tab>("organization");
 const [userId,setUserId]=useState("");
 const [tenants,setTenants]=useState<Tenant[]>([]);
 const [tenantId,setTenantId]=useState("");
 const [projects,setProjects]=useState<Project[]>([]);
 const [employees,setEmployees]=useState<Employee[]>([]);
 const [assets,setAssets]=useState<Asset[]>([]);
 const [events,setEvents]=useState<MasterEvent[]>([]);
 const [values,setValues]=useState<FormValues>({...blank.organization});
 const [editingId,setEditingId]=useState("");
 const [query,setQuery]=useState("");
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [newOrgName,setNewOrgName]=useState("");
 const [newOrgCode,setNewOrgCode]=useState("");

 useEffect(()=>{const requested=new URLSearchParams(window.location.search).get("tab");if(requested&&tabs.some(t=>t.id===requested))setTab(requested as Tab);},[]);
 const refresh=useCallback(async()=>{
   setLoading(true);setError("");
   const u=await currentUser();
   if(!u){setUserId("");setTenants([]);setProjects([]);setEmployees([]);setAssets([]);setEvents([]);setLoading(false);return;}
   setUserId(u.id);
   const t=await myTenants();
   if(t.error){setError(t.error.message);setLoading(false);return;}
   const tenantRows=(t.data??[]) as Tenant[];
   setTenants(tenantRows);
   const active=tenantRows.some(x=>x.id===tenantId)?tenantId:(tenantRows[0]?.id??"");
   setTenantId(active);
   if(!active){setProjects([]);setEmployees([]);setAssets([]);setEvents([]);setLoading(false);return;}
   const [p,e,a,ev]=await Promise.all([
    supabase.from("nusa_projects").select("id,tenant_id,code,name,category,status,progress,budget,target_date,deleted_at,updated_at").eq("tenant_id",active).is("deleted_at",null).order("updated_at",{ascending:false}),
    supabase.from("nusa_employees").select("id,tenant_id,project_id,employee_code,full_name,email,phone,position_title,employment_status,joined_on,notes,updated_at").eq("tenant_id",active).is("archived_at",null).order("updated_at",{ascending:false}),
    supabase.from("nusa_assets").select("id,tenant_id,project_id,assigned_employee_id,asset_code,name,category,condition_status,asset_status,acquisition_date,acquisition_cost,location,notes,updated_at").eq("tenant_id",active).is("archived_at",null).order("updated_at",{ascending:false}),
    supabase.from("nusa_master_data_events").select("id,entity_table,entity_id,actor_id,action,created_at,after_state").eq("tenant_id",active).order("created_at",{ascending:false}).limit(12)
   ]);
   if(p.error)setError("Gagal memuat proyek: "+p.error.message);else setProjects((p.data??[]) as Project[]);
   if(e.error)setError("Gagal memuat pegawai: "+e.error.message);else setEmployees((e.data??[]) as Employee[]);
   if(a.error)setError("Gagal memuat aset: "+a.error.message);else setAssets((a.data??[]) as Asset[]);
   if(ev.error)setError("Gagal memuat riwayat: "+ev.error.message);else setEvents((ev.data??[]) as MasterEvent[]);
   setLoading(false);
 },[tenantId]);
 useEffect(()=>{const timer=window.setTimeout(()=>{void refresh();},0);return()=>window.clearTimeout(timer);},[refresh]);
 useEffect(()=>{setEditingId("");setValues({...blank[tab]});setQuery("");setNotice("");setError("");},[tab,tenantId]);

 const change=(key:string,value:string)=>setValues(v=>({...v,[key]:value}));
 const edit=(row:Tenant|Project|Employee|Asset)=>{
   setEditingId(row.id);
   if(tab==="organization"){
    const t=row as Tenant;setValues({name:t.name??"",legal_name:t.legal_name??"",industry:t.industry??"",tax_id:t.tax_id??"",address:t.address??"",city:t.city??"",phone:t.phone??"",contact_email:t.contact_email??"",website:t.website??""});
   }else if(tab==="projects"){
    const p=row as Project;setValues({code:p.code,name:p.name,category:p.category,status:p.status,progress:String(p.progress??0),budget:p.budget==null?"":String(p.budget),target_date:dateValue(p.target_date)});
   }else if(tab==="employees"){
    const e=row as Employee;setValues({employee_code:e.employee_code,full_name:e.full_name,email:e.email??"",phone:e.phone??"",position_title:e.position_title??"",employment_status:e.employment_status,joined_on:dateValue(e.joined_on),project_id:e.project_id??"",notes:e.notes??""});
   }else{
    const a=row as Asset;setValues({asset_code:a.asset_code,name:a.name,category:a.category,condition_status:a.condition_status,asset_status:a.asset_status,acquisition_date:dateValue(a.acquisition_date),acquisition_cost:a.acquisition_cost==null?"":String(a.acquisition_cost),location:a.location??"",project_id:a.project_id??"",assigned_employee_id:a.assigned_employee_id??"",notes:a.notes??""});
   }
   setNotice("");setError("");
   document.getElementById("master-data-form")?.scrollIntoView({behavior:"smooth",block:"start"});
 };
 const cancelEdit=()=>{setEditingId("");setValues({...blank[tab]});setError("");setNotice("");};

 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!userId||!tenantId)return;
  setSaving(true);setError("");setNotice("");
  let result:{error:{message:string}|null}|null=null;
  if(tab==="organization"){
   result=await supabase.from("nusa_tenants").update({
    name:values.name.trim(),legal_name:values.legal_name.trim()||null,industry:values.industry.trim()||null,tax_id:values.tax_id.trim()||null,address:values.address.trim()||null,city:values.city.trim()||null,phone:values.phone.trim()||null,contact_email:values.contact_email.trim()||null,website:values.website.trim()||null,updated_at:new Date().toISOString()
   }).eq("id",tenantId).select("id").single();
  }else if(tab==="projects"){
   const progress=Number(values.progress||0),budget=values.budget.trim()?Number(values.budget):null;
   if(!Number.isFinite(progress)||progress<0||progress>100){setError("Progres harus di antara 0 dan 100.");setSaving(false);return;}
   if(budget!==null&&(!Number.isFinite(budget)||budget<0)){setError("Anggaran tidak boleh negatif.");setSaving(false);return;}
   const payload={code:values.code.trim().toUpperCase(),name:values.name.trim(),category:values.category.trim()||"engineering",status:values.status,progress,budget,target_date:values.target_date||null,updated_at:new Date().toISOString()};
   result=editingId?await supabase.from("nusa_projects").update(payload).eq("id",editingId).eq("tenant_id",tenantId).select("id").single():await supabase.from("nusa_projects").insert({...payload,tenant_id:tenantId}).select("id").single();
  }else if(tab==="employees"){
   const payload={employee_code:values.employee_code.trim().toUpperCase(),full_name:values.full_name.trim(),email:values.email.trim()||null,phone:values.phone.trim()||null,position_title:values.position_title.trim()||null,employment_status:values.employment_status,joined_on:values.joined_on||null,project_id:values.project_id||null,notes:values.notes.trim()||null,updated_by:userId};
   result=editingId?await supabase.from("nusa_employees").update(payload).eq("id",editingId).eq("tenant_id",tenantId).select("id").single():await supabase.from("nusa_employees").insert({...payload,tenant_id:tenantId,created_by:userId}).select("id").single();
  }else{
   const cost=values.acquisition_cost.trim()?Number(values.acquisition_cost):null;
   if(cost!==null&&(!Number.isFinite(cost)||cost<0)){setError("Nilai perolehan tidak valid.");setSaving(false);return;}
   const payload={asset_code:values.asset_code.trim().toUpperCase(),name:values.name.trim(),category:values.category.trim()||"general",condition_status:values.condition_status,asset_status:values.asset_status,acquisition_date:values.acquisition_date||null,acquisition_cost:cost,location:values.location.trim()||null,project_id:values.project_id||null,assigned_employee_id:values.assigned_employee_id||null,notes:values.notes.trim()||null,updated_by:userId};
   result=editingId?await supabase.from("nusa_assets").update(payload).eq("id",editingId).eq("tenant_id",tenantId).select("id").single():await supabase.from("nusa_assets").insert({...payload,tenant_id:tenantId,created_by:userId}).select("id").single();
  }
  if(result?.error)setError("Tidak berhasil menyimpan: "+result.error.message);
  else{setNotice(editingId?"Perubahan berhasil disimpan.":"Data master berhasil dibuat.");setEditingId("");setValues({...blank[tab]});await refresh();}
  setSaving(false);
 }
 async function archive(row:Project|Employee|Asset){
  if(!tenantId||!userId)return;
  const label=tab==="projects"?"proyek":tab==="employees"?"pegawai":"aset";
  if(!window.confirm("Arsipkan "+label+" ini? Data tidak dihapus permanen."))return;
  setError("");setNotice("");
  const now=new Date().toISOString();
  const result=tab==="projects"
   ?await supabase.from("nusa_projects").update({deleted_at:now,status:"archived",updated_at:now}).eq("id",row.id).eq("tenant_id",tenantId).select("id").single()
   :tab==="employees"
    ?await supabase.from("nusa_employees").update({archived_at:now,employment_status:"inactive",updated_by:userId}).eq("id",row.id).eq("tenant_id",tenantId).select("id").single()
    :await supabase.from("nusa_assets").update({archived_at:now,asset_status:"retired",updated_by:userId}).eq("id",row.id).eq("tenant_id",tenantId).select("id").single();
  if(result.error)setError("Arsip gagal: "+result.error.message);else{setNotice("Data berhasil diarsipkan.");if(editingId===row.id)cancelEdit();await refresh();}
 }
 async function createOrganization(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!userId||!newOrgName.trim())return;
  setSaving(true);setError("");setNotice("");
  const code=newOrgCode.trim().toUpperCase().replace(/[^A-Z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,30);
  if(!code){setError("Kode organisasi wajib diisi.");setSaving(false);return;}
  const r=await createTenant(newOrgName.trim(),code,userId);
  if(r.error)setError("Organisasi gagal dibuat: "+r.error.message);else{setNotice("Organisasi berhasil dibuat dan akun Anda menjadi owner.");setNewOrgName("");setNewOrgCode("");await refresh();}
  setSaving(false);
 }
 const activeTenant=tenants.find(t=>t.id===tenantId);
 const visibleProjects=projects.filter(x=>[x.code,x.name,x.category,x.status].join(" ").toLowerCase().includes(query.toLowerCase()));
 const visibleEmployees=employees.filter(x=>[x.employee_code,x.full_name,x.position_title??"",x.email??""].join(" ").toLowerCase().includes(query.toLowerCase()));
 const visibleAssets=assets.filter(x=>[x.asset_code,x.name,x.category,x.location??""].join(" ").toLowerCase().includes(query.toLowerCase()));
 const input=(key:string,label:string,required=false,type="text",placeholder="")=><label style={labelStyle}>{label}<input required={required} type={type} value={values[key]??""} onChange={e=>change(key,e.target.value)} placeholder={placeholder} style={fieldStyle}/></label>;
 const select=(key:string,label:string,options:{value:string;label:string}[],required=false)=><label style={labelStyle}>{label}<select required={required} value={values[key]??""} onChange={e=>change(key,e.target.value)} style={fieldStyle}>{!required&&<option value="">— Tidak dipilih —</option>}{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
 const textarea=(key:string,label:string)=><label style={labelStyle}>{label}<textarea value={values[key]??""} onChange={e=>change(key,e.target.value)} rows={2} style={fieldStyle}/></label>;

 return <main className="nusa gridbg"><div style={{minHeight:"100vh",padding:"24px",maxWidth:1440,margin:"0 auto"}}>
  <Link href="/" style={{display:"inline-flex",gap:8,alignItems:"center",color:"#a9d8b7",textDecoration:"none",fontSize:13}}><ArrowLeft size={16}/> Command Center</Link>
  <header style={{marginTop:28,display:"flex",justifyContent:"space-between",gap:18,alignItems:"end",flexWrap:"wrap"}}><div><div className="muted" style={{fontSize:11,letterSpacing:".13em"}}>NUSA / DATA GOVERNANCE</div><h1 className="brand" style={{fontSize:40,margin:"8px 0"}}>Master Data</h1><p className="muted" style={{fontSize:14,lineHeight:1.7,maxWidth:760}}>Satu sumber data untuk organisasi, proyek, pegawai, dan aset. Data turunan terhubung ke organisasi aktif dan—bila relevan—ke proyek yang sama.</p></div><button onClick={()=>void refresh()} className="glass" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,color:"#dcebe4",border:"1px solid #29463a",cursor:"pointer"}}><RefreshCw size={15}/> Muat ulang</button></header>
  {!userId?<section className="glass" style={{marginTop:24,padding:24,borderRadius:16}}><h2>Masuk diperlukan</h2><p className="muted">Masuk melalui Command Center untuk mengelola master data organisasi.</p><Link href="/" style={{color:"#a9d8b7"}}>Kembali ke Command Center →</Link></section>:<>
   <section className="glass" style={{marginTop:18,padding:16,borderRadius:14,display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}><div style={{flex:1,minWidth:240}}><div className="muted" style={{fontSize:10,marginBottom:6}}>ORGANISASI AKTIF</div><select aria-label="Organisasi aktif" value={tenantId} onChange={e=>setTenantId(e.target.value)} style={{...fieldStyle,marginTop:0,maxWidth:560}}><option value="">Pilih organisasi</option>{tenants.map(t=><option key={t.id} value={t.id}>{t.name} · {t.code}</option>)}</select></div><div><div className="muted" style={{fontSize:10}}>PROYEK</div><strong style={{fontSize:22}}>{projects.length}</strong></div><div><div className="muted" style={{fontSize:10}}>PEGAWAI AKTIF</div><strong style={{fontSize:22}}>{employees.length}</strong></div><div><div className="muted" style={{fontSize:10}}>ASET AKTIF</div><strong style={{fontSize:22}}>{assets.length}</strong></div></section>
   <nav aria-label="Jenis master data" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginTop:14}}>{tabs.map(t=>{const Icon=t.icon;return <button key={t.id} onClick={()=>setTab(t.id)} aria-pressed={tab===t.id} className="glass" style={{textAlign:"left",padding:15,borderRadius:12,border:tab===t.id?"1px solid #8ed8a6":"1px solid #29463a",background:tab===t.id?"rgba(42,105,72,.22)":"rgba(13,28,23,.78)",color:"#e7f2eb",cursor:"pointer"}}><div style={{display:"flex",gap:9,alignItems:"center"}}><Icon size={18}/><b>{t.label}</b></div><div className="muted" style={{fontSize:11,marginTop:8}}>{t.description}</div></button>})}</nav>
   <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1.25fr)",gap:14,marginTop:14,alignItems:"start"}} className="master-data-columns">
    <section id="master-data-form" className="glass" style={{padding:18,borderRadius:14}}>
     <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"}}><div><div className="muted" style={{fontSize:10,letterSpacing:".12em"}}>{editingId?"EDIT MASTER DATA":"NEW MASTER DATA"}</div><h2 style={{fontSize:19,margin:"7px 0 4px"}}>{editingId?"Ubah "+tabs.find(t=>t.id===tab)?.label:"Tambah "+tabs.find(t=>t.id===tab)?.label}</h2></div>{editingId&&<button aria-label="Batalkan edit" onClick={cancelEdit} className="glass" style={{padding:8,color:"white",borderRadius:8}}><X size={16}/></button>}</div>
     {tab==="organization"&&!activeTenant?<><p className="muted" style={{fontSize:12}}>Belum ada organisasi. Buat organisasi terlebih dahulu untuk menyiapkan workspace dan pemisahan data.</p><form onSubmit={createOrganization} style={{display:"grid",gap:10}}><label style={labelStyle}>Nama organisasi<input required value={newOrgName} onChange={e=>setNewOrgName(e.target.value)} style={fieldStyle} placeholder="Contoh: PT NUSA Engineering"/></label><label style={labelStyle}>Kode organisasi<input required value={newOrgCode} onChange={e=>setNewOrgCode(e.target.value)} style={fieldStyle} placeholder="Contoh: NUSA-ENG"/></label><button disabled={saving} style={{padding:12,border:0,borderRadius:9,background:"#a9d8b7",color:"#10251a",fontWeight:700,cursor:"pointer"}}><Plus size={15} style={{verticalAlign:"middle",marginRight:6}}/>Buat organisasi</button></form></>:tab==="organization"?<form onSubmit={submit} style={{display:"grid",gap:10}}>{input("name","Nama organisasi",true,"text","Nama tampilan")} {input("legal_name","Nama legal")}{input("industry","Bidang usaha")}{input("tax_id","NPWP / identitas pajak")}{input("contact_email","Email kontak",false,"email")}{input("phone","Telepon")}{input("website","Website",false,"url","https://")}{input("address","Alamat")}{input("city","Kota / kabupaten") }<button disabled={saving||!tenantId} style={{padding:12,border:0,borderRadius:9,background:"#a9d8b7",color:"#10251a",fontWeight:700,cursor:"pointer"}}><Save size={15} style={{verticalAlign:"middle",marginRight:6}}/>{saving?"Menyimpan…":"Simpan profil organisasi"}</button><p className="muted" style={{fontSize:11,margin:0}}>Kode organisasi: {activeTenant?.code}. Profil hanya dapat diubah owner/admin.</p></form>
     :tab==="projects"?<form onSubmit={submit} style={{display:"grid",gap:10}}>{input("code","Kode proyek",true,"text","NGW-2026-001")}{input("name","Nama proyek",true,"text","Nama proyek")}{input("category","Kategori")}{select("status","Status",[{value:"active",label:"Aktif"},{value:"on_hold",label:"Ditahan"},{value:"completed",label:"Selesai"},{value:"archived",label:"Diarsipkan"}],true)}{input("progress","Progres (%)",true,"number")}{input("budget","Anggaran (IDR)",false,"number")}{input("target_date","Target selesai",false,"date")}<button disabled={saving||!tenantId} style={{padding:12,border:0,borderRadius:9,background:"#a9d8b7",color:"#10251a",fontWeight:700,cursor:"pointer"}}><Save size={15} style={{verticalAlign:"middle",marginRight:6}}/>{saving?"Menyimpan…":editingId?"Simpan perubahan":"Buat proyek"}</button></form>
     :tab==="employees"?<form onSubmit={submit} style={{display:"grid",gap:10}}>{input("employee_code","NIP / kode pegawai",true)}{input("full_name","Nama lengkap",true)}{input("position_title","Jabatan")}{input("email","Email",false,"email")}{input("phone","Telepon")}{select("employment_status","Status pegawai",[{value:"active",label:"Aktif"},{value:"leave",label:"Cuti"},{value:"inactive",label:"Tidak aktif"},{value:"contractor",label:"Kontrak / vendor"}],true)}{input("joined_on","Tanggal bergabung",false,"date")}{select("project_id","Penempatan proyek",projects.map(p=>({value:p.id,label:p.code+" — "+p.name})))}{textarea("notes","Catatan") }<button disabled={saving||!tenantId} style={{padding:12,border:0,borderRadius:9,background:"#a9d8b7",color:"#10251a",fontWeight:700,cursor:"pointer"}}><Save size={15} style={{verticalAlign:"middle",marginRight:6}}/>{saving?"Menyimpan…":editingId?"Simpan perubahan":"Tambah pegawai"}</button><p className="muted" style={{fontSize:11,margin:0}}>Data pegawai dibatasi ke anggota organisasi; gunakan hanya data yang diperlukan.</p></form>
     :<form onSubmit={submit} style={{display:"grid",gap:10}}>{input("asset_code","Kode aset",true)}{input("name","Nama aset",true)}{input("category","Kategori",true)}{select("condition_status","Kondisi",[{value:"new",label:"Baru"},{value:"good",label:"Baik"},{value:"maintenance",label:"Perlu perawatan"},{value:"damaged",label:"Rusak"},{value:"disposed",label:"Dilepas"}],true)}{select("asset_status","Status aset",[{value:"available",label:"Tersedia"},{value:"assigned",label:"Ditugaskan"},{value:"in_use",label:"Digunakan"},{value:"maintenance",label:"Dalam perawatan"},{value:"retired",label:"Pensiun"}],true)}{input("acquisition_date","Tanggal perolehan",false,"date")}{input("acquisition_cost","Nilai perolehan (IDR)",false,"number")}{input("location","Lokasi")}{select("project_id","Proyek terkait",projects.map(p=>({value:p.id,label:p.code+" — "+p.name})))}{select("assigned_employee_id","Penanggung jawab",employees.filter(e=>e.employment_status==="active").map(e=>({value:e.id,label:e.employee_code+" — "+e.full_name})))}{textarea("notes","Catatan") }<button disabled={saving||!tenantId} style={{padding:12,border:0,borderRadius:9,background:"#a9d8b7",color:"#10251a",fontWeight:700,cursor:"pointer"}}><Save size={15} style={{verticalAlign:"middle",marginRight:6}}/>{saving?"Menyimpan…":editingId?"Simpan perubahan":"Tambah aset"}</button></form>}
    </section>
    <section className="glass" style={{padding:18,borderRadius:14,minWidth:0}}><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}><div><div className="muted" style={{fontSize:10}}>MASTER REGISTER</div><h2 style={{fontSize:19,margin:"7px 0 0"}}>{tabs.find(t=>t.id===tab)?.label}</h2></div><div style={{position:"relative",flex:"1 1 170px",maxWidth:260}}><Search size={15} style={{position:"absolute",left:10,top:12,opacity:.65}}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari data…" style={{...fieldStyle,paddingLeft:32,marginTop:0}}/></div></div>
     {loading?<p className="muted">Memuat master data…</p>:!tenantId?<div className="empty-state">Pilih atau buat organisasi untuk mulai mengelola master data.</div>:tab==="organization"?<div style={{marginTop:14}}><div className="glass" style={{padding:14,borderRadius:10}}><div style={{fontWeight:700}}>{activeTenant?.name}</div><div className="muted" style={{fontSize:11,marginTop:4}}>{activeTenant?.code} · {activeTenant?.status}</div><div className="muted" style={{fontSize:12,marginTop:10}}>{activeTenant?.legal_name||"Nama legal belum diisi"}</div><div className="muted" style={{fontSize:12,marginTop:4}}>{activeTenant?.address||"Alamat belum diisi"}{activeTenant?.city?", "+activeTenant.city:""}</div><div className="muted" style={{fontSize:12,marginTop:4}}>{activeTenant?.contact_email||"Email kontak belum diisi"}{activeTenant?.phone?" · "+activeTenant.phone:""}</div><button onClick={()=>activeTenant&&edit(activeTenant)} style={{marginTop:12,display:"inline-flex",alignItems:"center",gap:6,padding:"8px 10px",borderRadius:8,border:"1px solid #29463a",background:"transparent",color:"#cce9d5",cursor:"pointer"}}><Pencil size={14}/> Ubah profil</button></div><p className="muted" style={{fontSize:11,lineHeight:1.6}}>Organisasi adalah tenant utama. Semua proyek, pegawai, dan aset berada di dalam batas organisasi ini.</p></div>
     :tab==="projects"?visibleProjects.length===0?<div className="empty-state">Belum ada proyek. Buat proyek pertama dari formulir.</div>:<div style={{overflowX:"auto",marginTop:14}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:520}}><thead><tr>{["Proyek","Progres","Status","Aksi"].map(x=><th key={x} style={{textAlign:"left",padding:"10px 8px",borderBottom:"1px solid #29463a",color:"#9eb5a7"}}>{x}</th>)}</tr></thead><tbody>{visibleProjects.map(p=><tr key={p.id}><td style={{padding:"12px 8px",borderBottom:"1px solid #1e3329"}}><b>{p.name}</b><div className="muted" style={{fontSize:10,marginTop:4}}>{p.code} · {p.category}</div><div className="muted" style={{fontSize:10,marginTop:4}}>Anggaran: {p.budget==null?"—":new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(p.budget))}</div></td><td style={{padding:8,borderBottom:"1px solid #1e3329"}}>{Number(p.progress||0)}%</td><td style={{padding:8,borderBottom:"1px solid #1e3329"}}>{p.status}</td><td style={{padding:8,borderBottom:"1px solid #1e3329",whiteSpace:"nowrap"}}><button aria-label={"Ubah "+p.name} onClick={()=>edit(p)} className="glass" style={{padding:7,color:"white",borderRadius:7,marginRight:5}}><Pencil size={14}/></button><button aria-label={"Arsipkan "+p.name} onClick={()=>void archive(p)} className="glass" style={{padding:7,color:"#f0c3a5",borderRadius:7}}><Archive size={14}/></button></td></tr>)}</tbody></table></div>
     :tab==="employees"?visibleEmployees.length===0?<div className="empty-state">Belum ada pegawai. Tambahkan pegawai lalu pilih proyek bila diperlukan.</div>:<div style={{overflowX:"auto",marginTop:14}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:500}}><thead><tr>{["Pegawai","Jabatan","Status","Aksi"].map(x=><th key={x} style={{textAlign:"left",padding:"10px 8px",borderBottom:"1px solid #29463a",color:"#9eb5a7"}}>{x}</th>)}</tr></thead><tbody>{visibleEmployees.map(p=><tr key={p.id}><td style={{padding:"12px 8px",borderBottom:"1px solid #1e3329"}}><b>{p.full_name}</b><div className="muted" style={{fontSize:10,marginTop:4}}>{p.employee_code} · {p.email||"email belum diisi"}</div><div className="muted" style={{fontSize:10,marginTop:4}}>{projects.find(x=>x.id===p.project_id)?.name||"Belum ditempatkan ke proyek"}</div></td><td style={{padding:8,borderBottom:"1px solid #1e3329"}}>{p.position_title||"—"}</td><td style={{padding:8,borderBottom:"1px solid #1e3329"}}>{p.employment_status}</td><td style={{padding:8,borderBottom:"1px solid #1e3329",whiteSpace:"nowrap"}}><button aria-label={"Ubah "+p.full_name} onClick={()=>edit(p)} className="glass" style={{padding:7,color:"white",borderRadius:7,marginRight:5}}><Pencil size={14}/></button><button aria-label={"Arsipkan "+p.full_name} onClick={()=>void archive(p)} className="glass" style={{padding:7,color:"#f0c3a5",borderRadius:7}}><Archive size={14}/></button></td></tr>)}</tbody></table></div>
     :visibleAssets.length===0?<div className="empty-state">Belum ada aset. Tambahkan aset dan hubungkan dengan proyek atau pegawai.</div>:<div style={{overflowX:"auto",marginTop:14}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:520}}><thead><tr>{["Aset","Kondisi","Penempatan","Aksi"].map(x=><th key={x} style={{textAlign:"left",padding:"10px 8px",borderBottom:"1px solid #29463a",color:"#9eb5a7"}}>{x}</th>)}</tr></thead><tbody>{visibleAssets.map(a=><tr key={a.id}><td style={{padding:"12px 8px",borderBottom:"1px solid #1e3329"}}><b>{a.name}</b><div className="muted" style={{fontSize:10,marginTop:4}}>{a.asset_code} · {a.category}</div><div className="muted" style={{fontSize:10,marginTop:4}}>{a.acquisition_cost==null?"Nilai belum diisi":new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(a.acquisition_cost))}</div></td><td style={{padding:8,borderBottom:"1px solid #1e3329"}}>{a.condition_status}<div className="muted" style={{fontSize:10,marginTop:4}}>{a.asset_status}</div></td><td style={{padding:8,borderBottom:"1px solid #1e3329"}}>{projects.find(p=>p.id===a.project_id)?.name||"—"}<div className="muted" style={{fontSize:10,marginTop:4}}>{employees.find(e=>e.id===a.assigned_employee_id)?.full_name||"Belum ada PIC"}</div></td><td style={{padding:8,borderBottom:"1px solid #1e3329",whiteSpace:"nowrap"}}><button aria-label={"Ubah "+a.name} onClick={()=>edit(a)} className="glass" style={{padding:7,color:"white",borderRadius:7,marginRight:5}}><Pencil size={14}/></button><button aria-label={"Arsipkan "+a.name} onClick={()=>void archive(a)} className="glass" style={{padding:7,color:"#f0c3a5",borderRadius:7}}><Archive size={14}/></button></td></tr>)}</tbody></table></div>}
    </section>
   </div>
   <section className="glass" style={{marginTop:14,padding:18,borderRadius:14}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><div><div className="muted" style={{fontSize:10,letterSpacing:".12em"}}>AUDIT EVIDENCE</div><h2 style={{fontSize:19,margin:"7px 0 0"}}>Riwayat perubahan master data</h2></div><span className="muted" style={{fontSize:11}}>{events.length} event terbaru</span></div>{events.length===0?<p className="muted" style={{fontSize:12}}>Belum ada perubahan tercatat untuk organisasi ini.</p>:<div style={{overflowX:"auto",marginTop:10}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:500}}><thead><tr>{["Waktu","Jenis data","Aksi","Referensi"].map(x=><th key={x} style={{textAlign:"left",padding:"10px 8px",borderBottom:"1px solid #29463a",color:"#9eb5a7"}}>{x}</th>)}</tr></thead><tbody>{events.map(ev=>{const state=ev.after_state??{};const reference=String(state.name??state.full_name??state.title??state.asset_code??state.code??ev.entity_id);return <tr key={ev.id}><td style={{padding:"10px 8px",borderBottom:"1px solid #1e3329",whiteSpace:"nowrap"}}>{new Date(ev.created_at).toLocaleString("id-ID")}</td><td style={{padding:"10px 8px",borderBottom:"1px solid #1e3329"}}>{ev.entity_table.replace("nusa_","").replaceAll("_"," ")}</td><td style={{padding:"10px 8px",borderBottom:"1px solid #1e3329"}}>{ev.action==="INSERT"?"Dibuat":"Diubah"}</td><td style={{padding:"10px 8px",borderBottom:"1px solid #1e3329"}}>{reference}</td></tr>})}</tbody></table></div>}</section>
   {error&&<p role="alert" style={{marginTop:14,padding:12,border:"1px solid #8b4949",borderRadius:9,color:"#ffc4c4"}}>{error}</p>}{notice&&<p role="status" style={{marginTop:14,padding:12,border:"1px solid #35674b",borderRadius:9,color:"#a9d8b7"}}>{notice}</p>}
   <div className="glass" style={{marginTop:14,padding:14,borderRadius:12,display:"flex",gap:10,alignItems:"start"}}><ShieldCheck size={17}/><div className="muted" style={{fontSize:11,lineHeight:1.7}}>RLS membatasi akses berdasarkan keanggotaan organisasi. Relasi proyek dan pegawai divalidasi agar aset tidak dapat ditautkan ke proyek atau PIC milik tenant lain. Arsip tidak menghapus data permanen; perubahan dicatat pada event trail.</div></div>
  </>}
 </div></main>;
}
