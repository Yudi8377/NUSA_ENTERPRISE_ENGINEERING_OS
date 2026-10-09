"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Building2, FolderKanban, Users, Boxes, Plus, RefreshCw, Search, Pencil, Archive, Save, X, ShieldCheck, Sparkles, Eye, Printer } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { currentUser, myTenants, createTenant } from "../../lib/nusa";

type Tenant = {id:string;name:string;code:string;status:string;legal_name?:string|null;industry?:string|null;tax_id?:string|null;address?:string|null;city?:string|null;phone?:string|null;contact_email?:string|null;website?:string|null};
type Project = {id:string;tenant_id:string;code:string;name:string;category:string;status:string;progress:number;budget:number|null;target_date:string|null;deleted_at:string|null;updated_at:string};
type Employee = {id:string;tenant_id:string;project_id:string|null;employee_code:string;full_name:string;email:string|null;phone:string|null;position_title:string|null;employment_status:string;joined_on:string|null;notes:string|null;updated_at:string};
type Asset = {id:string;tenant_id:string;project_id:string|null;assigned_employee_id:string|null;asset_code:string;name:string;category:string;condition_status:string;asset_status:string;acquisition_date:string|null;acquisition_cost:number|null;location:string|null;notes:string|null;updated_at:string};
type MasterEvent = {id:string;entity_table:string;entity_id:string;actor_id:string|null;action:string;created_at:string;after_state:Record<string,unknown>};\ntype ProjectWorkspaceRecord = {id:string;module_code:string;record_type:string;record_code:string|null;title:string;description:string|null;status:string;amount:number|null;currency:string;data:Record<string,unknown>;updated_at:string};
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
 const [events,setEvents]=useState<MasterEvent[]>([]);\n const [detailProjectId,setDetailProjectId]=useState("");\n const [detailRecords,setDetailRecords]=useState<ProjectWorkspaceRecord[]>([]);\n const [detailLoading,setDetailLoading]=useState(false);\n const [masterDetail,setMasterDetail]=useState<{kind:"employees"|"assets";row:Employee|Asset}|null>(null);
 const [values,setValues]=useState<FormValues>({...blank.organization});
 const [editingId,setEditingId]=useState("");
 const [query,setQuery]=useState("");
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [seedingDemo,setSeedingDemo]=useState(false);
 const [seedStep,setSeedStep]=useState("");
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
 function openMasterDetail(kind:"employees"|"assets",row:Employee|Asset){setMasterDetail({kind,row});}\n async function openProjectDetail(project:Project){
  setDetailProjectId(project.id);setDetailRecords([]);setDetailLoading(true);setError("");
  const result=await supabase.from("nusa_workspace_records").select("id,module_code,record_type,record_code,title,description,status,amount,currency,data,updated_at").eq("tenant_id",project.tenant_id).eq("project_id",project.id).is("archived_at",null).order("updated_at",{ascending:false}).limit(100);
  if(result.error)setError("Detail proyek dimuat, tetapi data payroll/ERP gagal dibaca: "+result.error.message);
  else setDetailRecords((result.data??[]) as ProjectWorkspaceRecord[]);
  setDetailLoading(false);
 }
 async function seedDemoData(){
  if(!userId||seedingDemo||saving)return;
  if(!window.confirm("Muat data contoh SINTETIS ke organisasi aktif: 10 proyek, 10 pegawai, 10 aset, payroll, dan ERP/Finance? Jika belum ada organisasi, NUSA akan membuat tenant bernama NUSA Demo Engineering. Data akan diberi kode DEMO dan dapat diarsipkan seperti data biasa."))return;
  setSeedingDemo(true);setError("");setNotice("");setSeedStep("Memeriksa organisasi dan sesi pengguna…");
  try{
   let targetTenantId=tenantId;
   if(!targetTenantId){
    const code="NUSA-DEMO-"+new Date().toISOString().slice(0,10).replace(/-/g,"")+"-"+String(Date.now()).slice(-4);
    const created=await createTenant("NUSA Demo Engineering (DATA CONTOH)",code,userId);
    if(created.error||!created.data?.id)throw new Error("Organisasi demo gagal dibuat: "+(created.error?.message??"ID organisasi tidak diterima."));
    targetTenantId=created.data.id;
    setTenantId(targetTenantId);
   }
   setSeedStep("Menyiapkan proyek contoh…");
   const projectSeed=[
    {code:"DEMO-PRJ-01",name:"Gedung Kantor NUSA",category:"building",status:"active",progress:35,budget:12500000000,target_date:"2027-06-30"},
    {code:"DEMO-PRJ-02",name:"Gudang dan Logistik",category:"industrial",status:"active",progress:20,budget:7800000000,target_date:"2027-09-30"},
    {code:"DEMO-PRJ-03",name:"Renovasi Fasilitas",category:"renovation",status:"on_hold",progress:10,budget:1850000000,target_date:"2027-03-31"},
    {code:"DEMO-PRJ-04",name:"Infrastruktur Kawasan",category:"infrastructure",status:"active",progress:48,budget:5600000000,target_date:"2027-12-15"},
    {code:"DEMO-PRJ-05",name:"Workshop Engineering",category:"engineering",status:"active",progress:65,budget:2350000000,target_date:"2027-04-30"},
    {code:"DEMO-PRJ-06",name:"Pembangunan Klinik",category:"healthcare",status:"active",progress:28,budget:9200000000,target_date:"2027-10-31"},
    {code:"DEMO-PRJ-07",name:"Sekolah Terpadu",category:"education",status:"active",progress:42,budget:14800000000,target_date:"2028-01-31"},
    {code:"DEMO-PRJ-08",name:"Jembatan Akses",category:"infrastructure",status:"planning",progress:5,budget:6700000000,target_date:"2027-11-30"},
    {code:"DEMO-PRJ-09",name:"Perumahan Tahap I",category:"residential",status:"active",progress:52,budget:22400000000,target_date:"2028-03-31"},
    {code:"DEMO-PRJ-10",name:"Instalasi MEP Pabrik",category:"mep",status:"active",progress:31,budget:4850000000,target_date:"2027-08-31"}
   ];
   let p=await supabase.from("nusa_projects").select("id,code").eq("tenant_id",targetTenantId).like("code","DEMO-PRJ-%").is("deleted_at",null);
   if(p.error)throw new Error("Gagal memeriksa proyek contoh: "+p.error.message);
   const knownProjectCodes=new Set((p.data??[]).map(x=>x.code));
   const newProjects=projectSeed.filter(x=>!knownProjectCodes.has(x.code));
   if(newProjects.length){
    const inserted=await supabase.from("nusa_projects").insert(newProjects.map(x=>({...x,tenant_id:targetTenantId}))).select("id,code");
    if(inserted.error)throw new Error("Gagal menambah proyek contoh: "+inserted.error.message);
   }
   p=await supabase.from("nusa_projects").select("id,code").eq("tenant_id",targetTenantId).like("code","DEMO-PRJ-%").is("deleted_at",null);
   if(p.error)throw new Error("Gagal membaca proyek contoh: "+p.error.message);
   const projectRows=(p.data??[]) as {id:string;code:string}[];
   if(projectRows.length<10)throw new Error("Belum tersedia 10 proyek contoh. Periksa izin organisasi lalu jalankan lagi.");
   const projectByCode=new Map(projectRows.map(x=>[x.code,x.id]));
   setSeedStep("Proyek siap. Menyiapkan 10 pegawai…");
   const employeeSeed=[
    ["DEMO-EMP-01","Andi Pratama","Direktur Operasional"],
    ["DEMO-EMP-02","Siti Rahmawati","Project Manager"],
    ["DEMO-EMP-03","Bima Santoso","Site Engineer"],
    ["DEMO-EMP-04","Dewi Anggraini","Arsitek"],
    ["DEMO-EMP-05","Rizky Firmansyah","Structural Engineer"],
    ["DEMO-EMP-06","Nadia Putri","Quantity Surveyor"],
    ["DEMO-EMP-07","Fajar Hidayat","Procurement Officer"],
    ["DEMO-EMP-08","Intan Permata","HR & Administration"],
    ["DEMO-EMP-09","Bagus Wicaksono","HSE Officer"],
    ["DEMO-EMP-10","Maya Lestari","Document Controller"]
   ];
   let e=await supabase.from("nusa_employees").select("id,employee_code").eq("tenant_id",targetTenantId).like("employee_code","DEMO-EMP-%").is("archived_at",null);
   if(e.error)throw new Error("Gagal memeriksa pegawai contoh: "+e.error.message);
   const knownEmployeeCodes=new Set((e.data??[]).map(x=>x.employee_code));
   const newEmployees=employeeSeed.filter(x=>!knownEmployeeCodes.has(x[0])).map((x,i)=>({tenant_id:targetTenantId,employee_code:x[0],full_name:x[1],position_title:x[2],email:x[0].toLowerCase()+"@example.com",employment_status:"active",joined_on:"2026-01-05",project_id:projectByCode.get(projectSeed[i%10].code)??null,notes:"DATA CONTOH SINTETIS — bukan data pegawai nyata.",created_by:userId,updated_by:userId}));
   if(newEmployees.length){
    const inserted=await supabase.from("nusa_employees").insert(newEmployees).select("id,employee_code");
    if(inserted.error)throw new Error("Gagal menambah pegawai contoh: "+inserted.error.message);
   }
   e=await supabase.from("nusa_employees").select("id,employee_code").eq("tenant_id",targetTenantId).like("employee_code","DEMO-EMP-%").is("archived_at",null);
   if(e.error)throw new Error("Gagal membaca pegawai contoh: "+e.error.message);
   const employeeRows=(e.data??[]) as {id:string;employee_code:string}[];
   if(employeeRows.length<10)throw new Error("Belum tersedia 10 pegawai contoh. Periksa izin HR organisasi lalu jalankan lagi.");
   const employeeByCode=new Map(employeeRows.map(x=>[x.employee_code,x.id]));
   setSeedStep("Pegawai siap. Menyiapkan 10 aset…");
   const assetSeed=[
    ["DEMO-AST-01","Laptop Engineering 01","IT equipment",18500000,"Kantor pusat"],
    ["DEMO-AST-02","Laptop Engineering 02","IT equipment",18500000,"Kantor pusat"],
    ["DEMO-AST-03","Workstation CAD","IT equipment",32500000,"Studio desain"],
    ["DEMO-AST-04","Total Station","Survey equipment",68000000,"Gudang alat"],
    ["DEMO-AST-05","Drone Survey","Survey equipment",42000000,"Gudang alat"],
    ["DEMO-AST-06","Generator Portable","Power equipment",27500000,"Workshop"],
    ["DEMO-AST-07","Concrete Test Hammer","QA equipment",9500000,"Lab mutu"],
    ["DEMO-AST-08","Pickup Operasional","Vehicle",285000000,"Pool kendaraan"],
    ["DEMO-AST-09","Printer A3","Office equipment",16500000,"Ruang dokumen"],
    ["DEMO-AST-10","Safety Kit Set","HSE equipment",7500000,"Gudang HSE"]
   ];
   const a=await supabase.from("nusa_assets").select("id,asset_code").eq("tenant_id",targetTenantId).like("asset_code","DEMO-AST-%").is("archived_at",null);
   if(a.error)throw new Error("Gagal memeriksa aset contoh: "+a.error.message);
   const knownAssetCodes=new Set((a.data??[]).map(x=>x.asset_code));
   const newAssets=assetSeed.filter(x=>!knownAssetCodes.has(x[0])).map((x,i)=>({tenant_id:targetTenantId,asset_code:x[0],name:x[1],category:x[2],condition_status:"good",asset_status:i<3?"assigned":"available",acquisition_date:"2026-01-12",acquisition_cost:x[3],location:x[4],project_id:projectByCode.get(projectSeed[i%10].code)??null,assigned_employee_id:employeeByCode.get(employeeSeed[i%10][0])??null,notes:"DATA CONTOH SINTETIS — nilai dan penempatan hanya untuk uji coba.",created_by:userId,updated_by:userId}));
   if(newAssets.length){
    const inserted=await supabase.from("nusa_assets").insert(newAssets).select("id,asset_code");
    if(inserted.error)throw new Error("Gagal menambah aset contoh: "+inserted.error.message);
   }
   setSeedStep("Menyiapkan payroll dan transaksi ERP/Finance per proyek…");
   const demoWorkspaceRecords:{record_code:string;project_id:string;module_code:"erp"|"hr";record_type:string;title:string;description:string;amount:number|null;status:"draft"|"open";data:Record<string,unknown>}[]=[];
   for(let i=0;i<projectSeed.length;i++){
    const project=projectSeed[i], projectId=projectByCode.get(project.code);
    if(!projectId)throw new Error("Relasi proyek tidak ditemukan: "+project.code);
    const n=String(i+1).padStart(2,"0");
    const base={project_code:project.code,project_name:project.name,period:"2026-09",currency:"IDR",demo:true,notice:"DATA CONTOH SINTETIS — bukan data keuangan/payroll aktual."};
    const salary=12500000+(i*850000);
    demoWorkspaceRecords.push(
     {record_code:"DEMO-PAY-"+n,project_id:projectId,module_code:"hr",record_type:"hr_payroll_control",title:"Payroll "+project.code+" — September 2026",description:"Kontrol payroll demo; bukan slip gaji atau perhitungan pajak final.",amount:salary*3,status:"draft",data:{...base,payroll_period:"2026-09",employee_count:3,gross_pay:salary*3,allowances:1500000+i*100000,deductions:500000+i*50000,net_pay:salary*3+1500000+i*100000-(500000+i*50000),currency:"IDR",approval_status:"Belum disetujui",calculation_note:"Contoh sederhana; PPh 21, BPJS, lembur dan potongan riil belum dihitung."}},
     {record_code:"DEMO-BUD-"+n,project_id:projectId,module_code:"erp",record_type:"budget",title:"Baseline anggaran "+project.code,description:"Anggaran awal demo proyek; belum disahkan sebagai budget kontrol.",amount:project.budget,status:"draft",data:{...base,budget_code:"BUD-"+project.code,cost_center:project.code,period_start:"2026-01-01",period_end:project.target_date,budget_owner:"Project Manager",baseline_version:"0.1",contingency_percent:10}},
     {record_code:"DEMO-AR-"+n,project_id:projectId,module_code:"erp",record_type:"receivable",title:"Piutang pelanggan "+project.code,description:"Invoice contoh untuk latihan alur piutang dan penagihan.",amount:Math.round(project.budget*0.08),status:"open",data:{...base,invoice_no:"INV-"+project.code,customer_name:"Klien Demo "+n,invoice_date:"2026-09-01",due_date:"2026-10-01",payment_status:"Terkirim",tax_status:"Perlu review",demo_invoice:true}},
     {record_code:"DEMO-AP-"+n,project_id:projectId,module_code:"erp",record_type:"payable",title:"Tagihan vendor "+project.code,description:"Tagihan vendor sintetis; bukan instruksi pembayaran.",amount:Math.round(project.budget*0.035),status:"open",data:{...base,bill_no:"BILL-"+project.code,vendor_name:"Vendor Material Demo "+n,bill_date:"2026-09-03",due_date:"2026-10-15",verification_status:"Menunggu verifikasi",payment_instruction:"Tidak ada — data demo"}},
     {record_code:"DEMO-EXP-"+n,project_id:projectId,module_code:"erp",record_type:"expense",title:"Biaya lapangan "+project.code,description:"Biaya operasional contoh untuk pengujian laporan proyek.",amount:Math.round(project.budget*0.012),status:"draft",data:{...base,expense_date:"2026-09-05",expense_category:"Operasional proyek",cost_center:project.code,claimant:"PIC Demo "+n,receipt_reference:"DEMO-KWT-"+n,review_status:"Draf"}}
    );
   }
   const demoCodes=demoWorkspaceRecords.map(x=>x.record_code);
   const existingWorkspace=await supabase.from("nusa_workspace_records").select("record_code").eq("tenant_id",targetTenantId).in("record_code",demoCodes);
   if(existingWorkspace.error)throw new Error("Gagal memeriksa rekaman payroll/ERP: "+existingWorkspace.error.message);
   const existingCodes=new Set((existingWorkspace.data??[]).map(x=>x.record_code));
   const newWorkspace=demoWorkspaceRecords.filter(x=>!existingCodes.has(x.record_code)).map(x=>({...x,tenant_id:targetTenantId,currency:"IDR",created_by:userId,updated_by:userId}));
   if(newWorkspace.length){
    const inserted=await supabase.from("nusa_workspace_records").insert(newWorkspace);
    if(inserted.error)throw new Error("Gagal menyimpan data payroll/ERP demo: "+inserted.error.message);
   }
   setSeedStep("Memverifikasi proyek, pegawai, aset, payroll, dan ERP/Finance…");
   const [pCount,eCount,aCount]=await Promise.all([
    supabase.from("nusa_projects").select("id",{count:"exact",head:true}).eq("tenant_id",targetTenantId).like("code","DEMO-PRJ-%").is("deleted_at",null),
    supabase.from("nusa_employees").select("id",{count:"exact",head:true}).eq("tenant_id",targetTenantId).like("employee_code","DEMO-EMP-%").is("archived_at",null),
    supabase.from("nusa_assets").select("id",{count:"exact",head:true}).eq("tenant_id",targetTenantId).like("asset_code","DEMO-AST-%").is("archived_at",null)
   ]);
   if(pCount.error||eCount.error||aCount.error)throw new Error("Data contoh dibuat, tetapi verifikasi jumlah belum selesai. Tekan Muat Ulang lalu periksa tab proyek, pegawai, dan aset.");
   if((pCount.count??0)<10||(eCount.count??0)<10||(aCount.count??0)<10)throw new Error("Sebagian data contoh belum lengkap. Tekan tombol ini lagi untuk melanjutkan tanpa menggandakan kode data.");
   setTab("projects");
   setNotice("SELESAI — data sintetis terverifikasi: "+pCount.count+" proyek, "+eCount.count+" pegawai, dan "+aCount.count+" aset. Data terhubung ke organisasi dan relasi proyek/PIC di tenant yang sama.");
   setSeedStep("Selesai — 10 proyek, SDM, aset, payroll, dan 40 rekaman ERP/Finance demo siap.");
   await refresh();
  }catch(err){
   setError(err instanceof Error?err.message:"Data contoh gagal dimuat. Periksa koneksi dan izin organisasi.");
   setSeedStep("Belum selesai — periksa pesan kesalahan lalu coba lagi.");
  }finally{
   setSeedingDemo(false);
  }
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
  <header style={{marginTop:28,display:"flex",justifyContent:"space-between",gap:18,alignItems:"end",flexWrap:"wrap"}}><div><div className="muted" style={{fontSize:11,letterSpacing:".13em"}}>NUSA / DATA GOVERNANCE</div><h1 className="brand" style={{fontSize:40,margin:"8px 0"}}>Master Data</h1><p className="muted" style={{fontSize:14,lineHeight:1.7,maxWidth:760}}>Satu sumber data untuk organisasi, proyek, pegawai, dan aset. Data turunan terhubung ke organisasi aktif dan—bila relevan—ke proyek yang sama.</p></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{userId&&<button onClick={()=>void seedDemoData()} disabled={seedingDemo||saving||loading} className="glass" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,color:"#dcebe4",border:"1px solid #426c54",cursor:seedingDemo?"wait":"pointer",opacity:seedingDemo||saving||loading?0.65:1}}><Sparkles size={15}/>{seedingDemo?(seedStep||"Memuat data demo…"):"Muat data demo lengkap"}</button>}<button onClick={()=>void refresh()} className="glass" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,color:"#dcebe4",border:"1px solid #29463a",cursor:"pointer"}}><RefreshCw size={15}/> Muat ulang</button></div></header>
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
     :tab==="projects"?visibleProjects.length===0?<div className="empty-state">Belum ada proyek. Buat proyek pertama dari formulir.</div>:<div style={{overflowX:"auto",marginTop:14}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:520}}><thead><tr>{["Proyek","Progres","Status","Aksi"].map(x=><th key={x} style={{textAlign:"left",padding:"10px 8px",borderBottom:"1px solid #29463a",color:"#9eb5a7"}}>{x}</th>)}</tr></thead><tbody>{visibleProjects.map(p=><tr key={p.id}><td style={{padding:"12px 8px",borderBottom:"1px solid #1e3329"}}><b>{p.name}</b><div className="muted" style={{fontSize:10,marginTop:4}}>{p.code} · {p.category}</div><div className="muted" style={{fontSize:10,marginTop:4}}>Anggaran: {p.budget==null?"—":new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(p.budget))}</div></td><td style={{padding:8,borderBottom:"1px solid #1e3329"}}>{Number(p.progress||0)}%</td><td style={{padding:8,borderBottom:"1px solid #1e3329"}}>{p.status}</td><td style={{padding:8,borderBottom:"1px solid #1e3329",whiteSpace:"nowrap"}}><button aria-label={"Detail "+p.name} title="Lihat detail proyek" onClick={()=>void openProjectDetail(p)} className="glass" style={{padding:7,color:"#a9d8b7",borderRadius:7,marginRight:5}}><Eye size={14}/></button><button aria-label={"Ubah "+p.name} onClick={()=>edit(p)} className="glass" style={{padding:7,color:"white",borderRadius:7,marginRight:5}}><Pencil size={14}/></button><button aria-label={"Arsipkan "+p.name} onClick={()=>void archive(p)} className="glass" style={{padding:7,color:"#f0c3a5",borderRadius:7}}><Archive size={14}/></button></td></tr>)}</tbody></table></div>
     :tab==="employees"?visibleEmployees.length===0?<div className="empty-state">Belum ada pegawai. Tambahkan pegawai lalu pilih proyek bila diperlukan.</div>:<div style={{overflowX:"auto",marginTop:14}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:500}}><thead><tr>{["Pegawai","Jabatan","Status","Aksi"].map(x=><th key={x} style={{textAlign:"left",padding:"10px 8px",borderBottom:"1px solid #29463a",color:"#9eb5a7"}}>{x}</th>)}</tr></thead><tbody>{visibleEmployees.map(p=><tr key={p.id}><td style={{padding:"12px 8px",borderBottom:"1px solid #1e3329"}}><b>{p.full_name}</b><div className="muted" style={{fontSize:10,marginTop:4}}>{p.employee_code} · {p.email||"email belum diisi"}</div><div className="muted" style={{fontSize:10,marginTop:4}}>{projects.find(x=>x.id===p.project_id)?.name||"Belum ditempatkan ke proyek"}</div></td><td style={{padding:8,borderBottom:"1px solid #1e3329"}}>{p.position_title||"—"}</td><td style={{padding:8,borderBottom:"1px solid #1e3329"}}>{p.employment_status}</td><td style={{padding:8,borderBottom:"1px solid #1e3329",whiteSpace:"nowrap"}}><button aria-label={"Detail "+p.full_name} title="Detail pegawai" onClick={()=>openMasterDetail("employees",p)} className="glass" style={{padding:7,color:"#a9d8b7",borderRadius:7,marginRight:5}}><Eye size={14}/></button><button aria-label={"Ubah "+p.full_name} onClick={()=>edit(p)} className="glass" style={{padding:7,color:"white",borderRadius:7,marginRight:5}}><Pencil size={14}/></button><button aria-label={"Arsipkan "+p.full_name} onClick={()=>void archive(p)} className="glass" style={{padding:7,color:"#f0c3a5",borderRadius:7}}><Archive size={14}/></button></td></tr>)}</tbody></table></div>
     :visibleAssets.length===0?<div className="empty-state">Belum ada aset. Tambahkan aset dan hubungkan dengan proyek atau pegawai.</div>:<div style={{overflowX:"auto",marginTop:14}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:520}}><thead><tr>{["Aset","Kondisi","Penempatan","Aksi"].map(x=><th key={x} style={{textAlign:"left",padding:"10px 8px",borderBottom:"1px solid #29463a",color:"#9eb5a7"}}>{x}</th>)}</tr></thead><tbody>{visibleAssets.map(a=><tr key={a.id}><td style={{padding:"12px 8px",borderBottom:"1px solid #1e3329"}}><b>{a.name}</b><div className="muted" style={{fontSize:10,marginTop:4}}>{a.asset_code} · {a.category}</div><div className="muted" style={{fontSize:10,marginTop:4}}>{a.acquisition_cost==null?"Nilai belum diisi":new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(a.acquisition_cost))}</div></td><td style={{padding:8,borderBottom:"1px solid #1e3329"}}>{a.condition_status}<div className="muted" style={{fontSize:10,marginTop:4}}>{a.asset_status}</div></td><td style={{padding:8,borderBottom:"1px solid #1e3329"}}>{projects.find(p=>p.id===a.project_id)?.name||"—"}<div className="muted" style={{fontSize:10,marginTop:4}}>{employees.find(e=>e.id===a.assigned_employee_id)?.full_name||"Belum ada PIC"}</div></td><td style={{padding:8,borderBottom:"1px solid #1e3329",whiteSpace:"nowrap"}}><button aria-label={"Detail "+a.name} title="Detail aset" onClick={()=>openMasterDetail("assets",a)} className="glass" style={{padding:7,color:"#a9d8b7",borderRadius:7,marginRight:5}}><Eye size={14}/></button><button aria-label={"Ubah "+a.name} onClick={()=>edit(a)} className="glass" style={{padding:7,color:"white",borderRadius:7,marginRight:5}}><Pencil size={14}/></button><button aria-label={"Arsipkan "+a.name} onClick={()=>void archive(a)} className="glass" style={{padding:7,color:"#f0c3a5",borderRadius:7}}><Archive size={14}/></button></td></tr>)}</tbody></table></div>}
    </section>
   </div>
   <section className="glass" style={{marginTop:14,padding:18,borderRadius:14}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><div><div className="muted" style={{fontSize:10,letterSpacing:".12em"}}>AUDIT EVIDENCE</div><h2 style={{fontSize:19,margin:"7px 0 0"}}>Riwayat perubahan master data</h2></div><span className="muted" style={{fontSize:11}}>{events.length} event terbaru</span></div>{events.length===0?<p className="muted" style={{fontSize:12}}>Belum ada perubahan tercatat untuk organisasi ini.</p>:<div style={{overflowX:"auto",marginTop:10}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:500}}><thead><tr>{["Waktu","Jenis data","Aksi","Referensi"].map(x=><th key={x} style={{textAlign:"left",padding:"10px 8px",borderBottom:"1px solid #29463a",color:"#9eb5a7"}}>{x}</th>)}</tr></thead><tbody>{events.map(ev=>{const state=ev.after_state??{};const reference=String(state.name??state.full_name??state.title??state.asset_code??state.code??ev.entity_id);return <tr key={ev.id}><td style={{padding:"10px 8px",borderBottom:"1px solid #1e3329",whiteSpace:"nowrap"}}>{new Date(ev.created_at).toLocaleString("id-ID")}</td><td style={{padding:"10px 8px",borderBottom:"1px solid #1e3329"}}>{ev.entity_table.replace("nusa_","").replaceAll("_"," ")}</td><td style={{padding:"10px 8px",borderBottom:"1px solid #1e3329"}}>{ev.action==="INSERT"?"Dibuat":"Diubah"}</td><td style={{padding:"10px 8px",borderBottom:"1px solid #1e3329"}}>{reference}</td></tr>})}</tbody></table></div>}</section>
   {masterDetail&&<div role="dialog" aria-modal="true" aria-label={"Detail "+("full_name" in masterDetail.row?masterDetail.row.full_name:masterDetail.row.name)} className="master-detail-overlay" style={{position:"fixed",inset:0,zIndex:1001,background:"rgba(0,0,0,.78)",padding:18,overflowY:"auto"}}><section className="master-detail-print glass" style={{maxWidth:850,margin:"24px auto",padding:24,borderRadius:16,background:"#0b1712"}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start"}}><div><div className="muted" style={{fontSize:11,letterSpacing:".12em"}}>NUSA / MASTER RECORD DETAIL</div><h2 style={{fontSize:26,margin:"8px 0"}}>{"full_name" in masterDetail.row?masterDetail.row.full_name:masterDetail.row.name}</h2><div className="muted" style={{fontSize:12}}>{masterDetail.kind==="employees"?(masterDetail.row as Employee).employee_code:(masterDetail.row as Asset).asset_code}</div></div><div className="master-detail-actions" style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={()=>window.print()} className="glass" style={{padding:"9px 12px",borderRadius:8,color:"#eef7f2",display:"inline-flex",gap:6,alignItems:"center"}}><Printer size={14}/> Cetak / PDF</button><button onClick={()=>{const d=masterDetail;setMasterDetail(null);setTab(d.kind);edit(d.row);}} className="glass" style={{padding:"9px 12px",borderRadius:8,color:"#eef7f2",display:"inline-flex",gap:6,alignItems:"center"}}><Pencil size={14}/> Update</button><button onClick={()=>setMasterDetail(null)} className="glass" style={{padding:"9px 12px",borderRadius:8,color:"#eef7f2"}}><X size={14}/></button></div></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10,marginTop:18}}>{Object.entries(masterDetail.row).filter(([k,v])=>!["id","tenant_id","created_by","updated_by","archived_at","deleted_at"].includes(k)&&v!==null&&v!==undefined&&v!=="").map(([k,v])=><div key={k} className="glass" style={{padding:12,borderRadius:9}}><div className="muted" style={{fontSize:10}}>{k.replaceAll("_"," ")}</div><div style={{marginTop:5,overflowWrap:"anywhere"}}>{typeof v==="string"&&v.includes("T")&&!Number.isNaN(Date.parse(v))?new Date(v).toLocaleString("id-ID"):String(v)}</div></div>)}</div><p className="muted" style={{fontSize:11,marginTop:20}}>Data tenant-scoped. Gunakan tombol Update untuk mengubah form atau Arsipkan pada register untuk menghentikan data tanpa menghilangkan jejak audit.</p></section><style>{'@media print { body * { visibility:hidden !important; } .master-detail-print,.master-detail-print * { visibility:visible !important; } .master-detail-overlay { position:static !important; overflow:visible !important; background:white !important; padding:0 !important; } .master-detail-print { max-width:none !important; margin:0 !important; color:#111 !important; background:white !important; border:0 !important; } .master-detail-print .muted { color:#444 !important; } .master-detail-print .glass { background:white !important; color:#111 !important; border-color:#ccc !important; } .master-detail-actions { display:none !important; } }'}</style></div>}
   {detailProjectId&&(()=>{const p=projects.find(x=>x.id===detailProjectId);if(!p)return null;const projectEmployees=employees.filter(e=>e.project_id===p.id);const projectAssets=assets.filter(a=>a.project_id===p.id);const payroll=detailRecords.filter(r=>r.module_code==="hr");const finance=detailRecords.filter(r=>r.module_code==="erp");const money=(v:number|null)=>v==null?"—":new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(v));return <div role="dialog" aria-modal="true" aria-label={"Detail proyek "+p.name} className="project-detail-overlay" style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.78)",padding:18,overflowY:"auto"}}><section className="glass project-detail-print" style={{maxWidth:1100,margin:"24px auto",padding:24,borderRadius:18,background:"#0b1712",border:"1px solid #426c54"}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",flexWrap:"wrap"}}><div><div className="muted" style={{fontSize:11,letterSpacing:".12em"}}>NUSA / PROJECT DOSSIER</div><h2 style={{fontSize:28,margin:"8px 0"}}>{p.name}</h2><div className="muted" style={{fontSize:12}}>{p.code} · {p.category} · {p.status}</div></div><div className="project-detail-actions" style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={()=>window.print()} className="glass" style={{padding:"9px 12px",borderRadius:8,color:"#e7f2eb",display:"inline-flex",gap:7,alignItems:"center"}}><Printer size={15}/> Cetak / PDF</button><button onClick={()=>{setDetailProjectId("");setDetailRecords([]);}} className="glass" style={{padding:"9px 12px",borderRadius:8,color:"#e7f2eb",display:"inline-flex",gap:7,alignItems:"center"}}><X size={15}/> Tutup</button></div></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginTop:18}}>{[{label:"Anggaran",value:money(p.budget)},{label:"Progres",value:Number(p.progress||0)+"%"},{label:"Target",value:p.target_date||"—"},{label:"Tim",value:String(projectEmployees.length)+" pegawai"},{label:"Aset",value:String(projectAssets.length)+" aset"},{label:"Payroll / Finance",value:payroll.length+" / "+finance.length+" rekaman"}].map(k=><div key={k.label} className="glass" style={{padding:13,borderRadius:10}}><div className="muted" style={{fontSize:10}}>{k.label}</div><div style={{fontSize:15,fontWeight:750,marginTop:7,overflowWrap:"anywhere"}}>{k.value}</div></div>)}</div><h3 style={{marginTop:22}}>1. Profil proyek & kontrol</h3><div className="project-detail-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>{[["Kode proyek",p.code],["Kategori",p.category],["Status",p.status],["Progres",Number(p.progress||0)+"%"],["Anggaran",money(p.budget)],["Tanggal target",p.target_date||"Belum ditentukan"]].map(([k,v])=><div key={k} className="glass" style={{padding:12,borderRadius:9}}><div className="muted" style={{fontSize:10}}>{k}</div><div style={{marginTop:5,fontWeight:600}}>{v}</div></div>)}</div><h3 style={{marginTop:22}}>2. Pegawai yang ditempatkan</h3>{projectEmployees.length?<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr>{["Kode","Nama","Jabatan","Status","Email"].map(x=><th key={x} style={{textAlign:"left",padding:9,borderBottom:"1px solid #29463a"}}>{x}</th>)}</tr></thead><tbody>{projectEmployees.map(e=><tr key={e.id}>{[e.employee_code,e.full_name,e.position_title||"—",e.employment_status,e.email||"—"].map((v,i)=><td key={i} style={{padding:9,borderBottom:"1px solid #1e3329"}}>{v}</td>)}</tr>)}</tbody></table></div>:<p className="muted">Belum ada pegawai yang terhubung dengan proyek ini.</p>}<h3 style={{marginTop:22}}>3. Aset & penanggung jawab</h3>{projectAssets.length?<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr>{["Kode","Aset","Kondisi","PIC","Nilai perolehan"].map(x=><th key={x} style={{textAlign:"left",padding:9,borderBottom:"1px solid #29463a"}}>{x}</th>)}</tr></thead><tbody>{projectAssets.map(a=><tr key={a.id}>{[a.asset_code,a.name,a.condition_status,employees.find(e=>e.id===a.assigned_employee_id)?.full_name||"—",money(a.acquisition_cost)].map((v,i)=><td key={i} style={{padding:9,borderBottom:"1px solid #1e3329"}}>{v}</td>)}</tr>)}</tbody></table></div>:<p className="muted">Belum ada aset terkait proyek.</p>}<h3 style={{marginTop:22}}>4. Payroll & SDM</h3>{detailLoading?<p className="muted">Memuat payroll dan keuangan…</p>:payroll.length?<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr>{["Periode / rekaman","Jumlah pegawai","Bruto","Potongan","Netto","Status"].map(x=><th key={x} style={{textAlign:"left",padding:9,borderBottom:"1px solid #29463a"}}>{x}</th>)}</tr></thead><tbody>{payroll.map(r=><tr key={r.id}><td style={{padding:9,borderBottom:"1px solid #1e3329"}}><b>{r.title}</b><div className="muted">{String(r.data.payroll_period||"—")} · {r.record_code||r.record_type}</div></td><td style={{padding:9,borderBottom:"1px solid #1e3329"}}>{String(r.data.employee_count??"—")}</td><td style={{padding:9,borderBottom:"1px solid #1e3329"}}>{money(Number(r.data.gross_pay??0))}</td><td style={{padding:9,borderBottom:"1px solid #1e3329"}}>{money(Number(r.data.deductions??0))}</td><td style={{padding:9,borderBottom:"1px solid #1e3329"}}>{money(Number(r.data.net_pay??0))}</td><td style={{padding:9,borderBottom:"1px solid #1e3329"}}>{r.status}</td></tr>)}</tbody></table></div>:<p className="muted">Belum ada rekaman payroll untuk proyek ini.</p>}<h3 style={{marginTop:22}}>5. ERP & Finance</h3>{detailLoading?<p className="muted">Memuat rekaman…</p>:finance.length?<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr>{["Register","Judul","Nilai","Status","Tanggal update"].map(x=><th key={x} style={{textAlign:"left",padding:9,borderBottom:"1px solid #29463a"}}>{x}</th>)}</tr></thead><tbody>{finance.map(r=><tr key={r.id}><td style={{padding:9,borderBottom:"1px solid #1e3329"}}>{r.record_type}<div className="muted">{r.record_code||"—"}</div></td><td style={{padding:9,borderBottom:"1px solid #1e3329"}}><b>{r.title}</b><div className="muted">{r.description||"—"}</div>{Object.entries(r.data||{}).filter(([k,v])=>!["notice"].includes(k)&&v!==null&&v!=="").slice(0,6).map(([k,v])=><div key={k} className="muted" style={{fontSize:10,marginTop:3}}>{k.replaceAll("_"," ")}: {String(v)}</div>)}</td><td style={{padding:9,borderBottom:"1px solid #1e3329",whiteSpace:"nowrap"}}>{money(r.amount)}</td><td style={{padding:9,borderBottom:"1px solid #1e3329"}}>{r.status}</td><td style={{padding:9,borderBottom:"1px solid #1e3329"}}>{new Date(r.updated_at).toLocaleDateString("id-ID")}</td></tr>)}</tbody></table></div>:<p className="muted">Belum ada rekaman ERP/Finance untuk proyek ini.</p>}<p className="muted" style={{fontSize:11,marginTop:22}}>Dokumen proyek NUSA • Data contoh sintetis diberi label DEMO • Status keuangan/payroll belum merupakan persetujuan atau transaksi final.</p></section><style>{'@media print { body * { visibility:hidden !important; } .project-detail-print,.project-detail-print * { visibility:visible !important; } .project-detail-overlay { position:static !important; overflow:visible !important; background:white !important; padding:0 !important; } .project-detail-print { max-width:none !important; margin:0 !important; color:#111 !important; background:white !important; border:0 !important; box-shadow:none !important; } .project-detail-print .muted { color:#444 !important; } .project-detail-print .glass { color:#111 !important; background:white !important; border-color:#ccc !important; } .project-detail-actions { display:none !important; } }'}</style></div>})()}
   {error&&<p role="alert" style={{marginTop:14,padding:12,border:"1px solid #8b4949",borderRadius:9,color:"#ffc4c4"}}>{error}</p>}{notice&&<p role="status" style={{marginTop:14,padding:12,border:"1px solid #35674b",borderRadius:9,color:"#a9d8b7"}}>{notice}</p>}
   <div className="glass" style={{marginTop:14,padding:14,borderRadius:12,display:"flex",gap:10,alignItems:"start"}}><ShieldCheck size={17}/><div className="muted" style={{fontSize:11,lineHeight:1.7}}>RLS membatasi akses berdasarkan keanggotaan organisasi. Relasi proyek dan pegawai divalidasi agar aset tidak dapat ditautkan ke proyek atau PIC milik tenant lain. Arsip tidak menghapus data permanen; perubahan dicatat pada event trail.</div></div>
  </>}
 </div></main>;
}
