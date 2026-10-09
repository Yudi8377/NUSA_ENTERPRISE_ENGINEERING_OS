"use client";

import { useEffect, useRef, useState } from "react";
import { AudioLines, Mic, MicOff, Send, Volume2, X, Sparkles } from "lucide-react";

type RecognitionResult = { [index:number]: { transcript:string }; length:number };
type RecognitionEvent = { results: RecognitionResult[] };
type RecognitionLike = {
  lang:string; continuous:boolean; interimResults:boolean;
  onresult:((event:RecognitionEvent)=>void)|null;
  onerror:((event:{error?:string})=>void)|null;
  onend:(()=>void)|null;
  start:()=>void; stop:()=>void;
};
type SpeechWindow = Window & { SpeechRecognition?:new()=>RecognitionLike; webkitSpeechRecognition?:new()=>RecognitionLike };

const routes:{label:string;path:string;keywords:string[]}[]=[
 {label:"Lead & Opportunity Pipeline",path:"/crm/leads/",keywords:["pipeline","prospek","lead crm"]},
 {label:"Account & Contact Registry",path:"/crm/contacts/",keywords:["kontak crm","account customer","contact registry"]},
 {label:"Quotation & Commercial Offer",path:"/crm/quotations/",keywords:["quotation","penawaran","quotation crm"]},
 {label:"Customer Activities",path:"/crm/activities/",keywords:["aktivitas pelanggan","customer activities","follow up pelanggan"]},
 {label:"Workforce Planning & Recruitment",path:"/hr/recruitment/",keywords:["rekrutmen","requisition","kebutuhan tenaga kerja"]},
 {label:"Attendance & Shift Review",path:"/hr/attendance/",keywords:["kehadiran","timesheet","shift pegawai"]},
 {label:"Training & Competency",path:"/hr/training/",keywords:["pelatihan","kompetensi","training hr"]},
 {label:"Payroll Control Center",path:"/hr/payroll/",keywords:["payroll control","kontrol payroll"]},
 {label:"Purchase Requisition",path:"/procurement/requests/",keywords:["purchase requisition","permintaan pembelian"]},
 {label:"Vendor Qualification",path:"/procurement/vendors/",keywords:["vendor qualification","vendor"]},
 {label:"Purchase Order & Contract Draft",path:"/procurement/orders/",keywords:["purchase order","draft po","po vendor"]},
 {label:"Inventory & Materials",path:"/procurement/inventory/",keywords:["inventory","stok gudang","material gudang"]},
 {label:"KPI Dictionary",path:"/reports/kpi/",keywords:["kpi","kamus indikator"]},
 {label:"Forecast & Scenario",path:"/reports/forecast/",keywords:["forecast","peramalan","proyeksi bisnis"]},
 {label:"Report Packs & Distribution",path:"/reports/packs/",keywords:["paket laporan","report pack"]},
 {label:"Decision Scenarios",path:"/reports/scenarios/",keywords:["skenario keputusan","decision scenario"]},
 {label:"Enterprise Risk Register",path:"/grc/risks/",keywords:["risk register","risiko perusahaan"]},
 {label:"Audit Findings & CAPA",path:"/grc/audit/",keywords:["temuan audit","audit finding","capa"]},
 {label:"Compliance Obligations & Controls",path:"/grc/compliance/",keywords:["kontrol kepatuhan","compliance control"]},
 {label:"Incident & Near Miss",path:"/grc/incidents/",keywords:["insiden","near miss","incident management"]},
 {label:"Structural Analysis & SAP2000",path:"/operations/structural-analysis/",keywords:["analisis struktur","structural analysis","desain struktur"]},
 {label:"Geotechnical & Foundation Review",path:"/operations/geotechnical/",keywords:["geoteknik","fondasi","soil report"]},
 {label:"SAP2000 Model Preparation",path:"/operations/sap2000-model/",keywords:["model sap2000","sap2000 model"]},
 {label:"MEP Engineering Coordination",path:"/operations/mep-coordination/",keywords:["koordinasi mep","mep coordination"]},
 {label:"Quantity Surveying & Cost Estimate",path:"/operations/quantity-surveying/",keywords:["quantity surveying","qs engineering","kuantitas pekerjaan"]},
 {label:"Site Inspection & Field Evidence",path:"/operations/site-inspection/",keywords:["inspeksi lapangan","site inspection","itp inspeksi"]},
 {label:"CAD Drawing Register",path:"/architecture/cad-drawings/",keywords:["cad drawing","register gambar","revisi gambar"]},
 {label:"BIM / IFC Coordination",path:"/architecture/bim-coordination/",keywords:["bim","ifc coordination","model bim"]},
 {label:"Clash Detection & Issue Review",path:"/architecture/clash-review/",keywords:["clash detection","benturan model","clash review"]},
 {label:"Design Review & Technical Query",path:"/architecture/design-review/",keywords:["design review","review desain","technical query"]},
 {label:"Spatial / GIS Engineering Register",path:"/architecture/spatial-data/",keywords:["data spasial","gis engineering","crs gis"]},
 {label:"Chart of Accounts",path:"/erp/chart-of-accounts/",keywords:["bagan akun","chart of accounts"]},
 {label:"General Journal",path:"/erp/journals/",keywords:["jurnal umum","general journal","jurnal debit kredit"]},
 {label:"General Ledger",path:"/erp/general-ledger/",keywords:["buku besar","general ledger"]},
 {label:"Cash & Bank",path:"/erp/cash-bank/",keywords:["kas dan bank","cash bank"]},
 {label:"Receivables",path:"/erp/receivables/",keywords:["piutang usaha","receivables"]},
 {label:"Payables",path:"/erp/payables/",keywords:["utang usaha","payables"]},
 {label:"Budgets & Forecast",path:"/erp/budgets/",keywords:["anggaran erp","budget control"]},
 {label:"Tax & Compliance",path:"/erp/tax/",keywords:["pajak erp","tax compliance"]},
 {label:"Bank Reconciliation",path:"/erp/bank-reconciliation/",keywords:["rekonsiliasi bank","bank reconciliation"]},
 {label:"Fixed Assets",path:"/erp/fixed-assets/",keywords:["aset tetap","depresiasi","fixed assets"]},
 {label:"Expenses & Claims",path:"/erp/expenses/",keywords:["biaya","expense","klaim biaya","expenses"]},
 {label:"Financial Reports",path:"/erp/reports/",keywords:["laporan keuangan","financial reports","neraca","laba rugi","arus kas"]},
 {label:"Cost Centres",path:"/erp/cost-centers/",keywords:["pusat biaya","cost center"]},
 {label:"Period Close",path:"/erp/period-close/",keywords:["tutup buku","period close"]},
 {label:"Command Center",path:"/",keywords:["beranda","command center","dashboard","utama"]},
 {label:"Master Data",path:"/master-data/",keywords:["master data","organisasi","pegawai","aset","proyek","data contoh"]},
 {label:"Projects & Construction",path:"/projects/",keywords:["proyek","konstruksi","project"]},
 {label:"Engineering & SAP2000",path:"/operations/",keywords:["engineering","sap2000","operasi","approval","persetujuan"]},
 {label:"Architecture / CAD / BIM",path:"/architecture/",keywords:["arsitektur","cad","bim","gambar"]},
 {label:"ERP & Finance",path:"/erp/",keywords:["erp","keuangan","finance","transaksi"]},
 {label:"CRM",path:"/crm/",keywords:["crm","pelanggan","sales","penjualan"]},
 {label:"HRD & Payroll",path:"/hr/",keywords:["hrd","hr","pegawai","payroll","penggajian","sdm"]},
 {label:"Procurement & Asset",path:"/procurement/",keywords:["procurement","pengadaan","pembelian","asset","aset"]},
 {label:"Reports & Forecast",path:"/reports/",keywords:["laporan","report","forecast","perkiraan"]},
 {label:"GRC & Compliance",path:"/grc/",keywords:["grc","risiko","kepatuhan","compliance"]},
 {label:"AURA Integration",path:"/aura/",keywords:["aura","integrasi aura"]}
];

function pageContext(path:string){
 const route=routes.find(r=>path.replace(/^\/NUSA_ENTERPRISE_ENGINEERING_OS/,"").replace(/\/?$/,"/")===r.path)||routes.find(r=>path.includes(r.path.replace(/^\//,"").replace(/\/$/,"")));
 if(route?.path==="/master-data/")return "Anda sedang berada di Master Data. Mulai dengan membuat atau memilih organisasi, lalu kelola proyek, pegawai, dan aset. Tombol Muat 25 data contoh menambahkan data sintetis untuk uji coba.";
 if(route?.path==="/hr/")return "Anda berada di HRD dan Payroll. Catatan SDM sebaiknya dibatasi pada data yang diperlukan. Data payroll final membutuhkan proses dan kontrol terpisah.";
 if(route?.path==="/operations/")return "Anda berada di Engineering Operations. Jalankan analisis hanya dengan data sumber yang jelas. Keputusan kritis tetap membutuhkan reviewer manusia.";
 return route ? "Anda berada di "+route.label+". Saya dapat membantu menemukan menu NUSA, menjelaskan fungsi halaman, dan membacakan ringkasan navigasi." : "Saya adalah AURA, pendamping suara NUSA. Saya dapat membantu navigasi dan menjelaskan fungsi menu.";
}

function makeReply(text:string,path:string){
 const q=text.toLocaleLowerCase("id-ID");
 if(/halo|hai|selamat pagi|selamat siang|selamat sore|selamat malam/.test(q))return "Halo, saya AURA. Saya siap membantu Anda menggunakan NUSA.";
 if(/siapa kamu|nama kamu|aura/.test(q))return "Saya AURA, avatar pendamping suara pada NUSA Enterprise Engineering OS. Saat ini saya membantu navigasi dan panduan penggunaan melalui suara.";
 if(/bantuan|bisa apa|fungsi halaman|halaman ini/.test(q))return pageContext(path);
 const route=routes.find(r=>r.keywords.some(k=>q.includes(k)));
 if(route){
  if(/buka|pergi|masuk|tampilkan|menuju|navigasi/.test(q))return "Baik, saya membuka "+route.label+".";
  return route.label+". "+(route.path==="/master-data/"?"Di sini Anda mengelola organisasi, proyek, pegawai, dan aset.":route.path==="/operations/"?"Di sini Anda mengelola pekerjaan engineering dan alur persetujuan.":"Gunakan menu ini untuk membuka workspace "+route.label+".");
 }
 if(/data contoh|25 data|data demo/.test(q))return "Buka Master Data, lalu tekan Muat 25 data contoh. NUSA akan menyiapkan 5 proyek, 10 pegawai, 10 aset, serta contoh transaksi ERP/Finance dan payroll sintetis pada organisasi aktif atau organisasi demo baru.";
 if(/organisasi|tenant/.test(q))return "Organisasi adalah batas utama data NUSA. Buat atau pilih organisasi terlebih dahulu; proyek, pegawai, dan aset harus berada dalam organisasi yang sama.";
 if(/terima kasih|makasih/.test(q))return "Sama-sama. Saya siap membantu Anda.";
 return "Saya menangkap: "+text+". Untuk saat ini saya dapat membantu navigasi NUSA dan panduan menu. Untuk analisis substantif atau tindakan yang mengubah data, gunakan modul terkait dan ikuti kontrol akses serta persetujuan yang berlaku.";
}

export default function AuraVoiceAvatar(){
 const [open,setOpen]=useState(false);
 const [listening,setListening]=useState(false);
 const [speaking,setSpeaking]=useState(false);
 const [input,setInput]=useState("");
 const [reply,setReply]=useState("Halo, saya AURA. Tekan mikrofon untuk berbicara atau ketik pertanyaan.");
 const recognition=useRef<RecognitionLike|null>(null);
 const inputRef=useRef<HTMLInputElement>(null);
 useEffect(()=>()=>{recognition.current?.stop();if(typeof window!=="undefined")window.speechSynthesis?.cancel();},[]);
 const speak=(text:string)=>{
  if(typeof window==="undefined"||!("speechSynthesis" in window))return;
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);utterance.lang="id-ID";utterance.rate=0.94;utterance.pitch=1.04;
  const voices=window.speechSynthesis.getVoices();
  const voice=voices.find(v=>v.lang.toLowerCase().startsWith("id"));
  if(voice)utterance.voice=voice;
  utterance.onstart=()=>setSpeaking(true);utterance.onend=()=>setSpeaking(false);utterance.onerror=()=>setSpeaking(false);
  window.speechSynthesis.speak(utterance);
 };
 const respond=(raw:string)=>{
  const text=raw.trim();if(!text)return;
  const answer=makeReply(text,window.location.pathname);setInput("");setReply(answer);
  speak(answer);
  const q=text.toLocaleLowerCase("id-ID");
  const route=routes.find(r=>r.keywords.some(k=>q.includes(k)));
  if(route&&/buka|pergi|masuk|tampilkan|menuju|navigasi/.test(q)){
   window.setTimeout(()=>{const prefix=window.location.pathname.startsWith("/NUSA_ENTERPRISE_ENGINEERING_OS")?"/NUSA_ENTERPRISE_ENGINEERING_OS":"";window.location.href=prefix+route.path;},700);
  }
 };
 const startListening=()=>{
  const w=window as SpeechWindow;const Constructor=w.SpeechRecognition||w.webkitSpeechRecognition;
  if(!Constructor){setReply("Browser ini belum mendukung input suara. Gunakan kolom teks di bawah, atau buka NUSA dengan Chrome atau Edge terbaru.");return;}
  if(listening){recognition.current?.stop();setListening(false);return;}
  const rec=new Constructor();recognition.current=rec;rec.lang="id-ID";rec.continuous=false;rec.interimResults=false;
  rec.onresult=(event)=>{const transcript=Array.from({length:event.results.length},(_,i)=>event.results[i][0].transcript).join(" ");setInput(transcript);respond(transcript);};
  rec.onerror=(event)=>{setListening(false);setReply(event.error==="not-allowed"?"Izin mikrofon ditolak. Aktifkan izin mikrofon pada browser untuk berbicara dengan AURA.":"Input suara tidak tersedia saat ini. Silakan gunakan kolom teks.");};
  rec.onend=()=>setListening(false);
  try{rec.start();setListening(true);setReply("Saya mendengarkan. Silakan bicara dalam bahasa Indonesia.");}catch{setListening(false);setReply("Mikrofon belum dapat dimulai. Coba lagi atau gunakan teks.");}
 };
 return <div className="aura-voice-root">
  {open&&<section className="aura-voice-panel glass" aria-label="AURA asisten suara">
   <header className="aura-voice-header"><div className="aura-avatar aura-avatar-small" aria-hidden="true"><span/></div><div className="aura-voice-heading"><b>AURA</b><span>Pendamping suara NUSA · Bahasa Indonesia</span></div><button className="aura-icon-button" aria-label="Tutup AURA" onClick={()=>{setOpen(false);recognition.current?.stop();setListening(false);}}><X size={17}/></button></header>
   <div className="aura-voice-message" aria-live="polite">{reply}</div>
   <div className="aura-voice-state"><span className={listening?"aura-live-dot":"aura-idle-dot"}/>{listening?"Mendengarkan…":speaking?"Sedang berbicara…":"Siap membantu"}</div>
   <form className="aura-voice-compose" onSubmit={e=>{e.preventDefault();respond(input);}}>
    <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} aria-label="Tulis pertanyaan untuk AURA" placeholder="Tanyakan atau perintahkan…" />
    <button type="submit" aria-label="Kirim pertanyaan" disabled={!input.trim()}><Send size={16}/></button>
   </form>
   <div className="aura-voice-actions"><button onClick={startListening} className={listening?"is-active":""}><Mic size={15}/>{listening?"Berhenti mendengar":"Bicara"}</button><button onClick={()=>speak(reply)}><Volume2 size={15}/>Bacakan</button></div>
   <p className="aura-voice-footnote"><Sparkles size={12}/> Navigasi dan panduan suara. Aksi yang mengubah data tetap dilakukan melalui modul resmi NUSA.</p>
  </section>}
  <button className={"aura-avatar-launcher"+(open?" is-open":"")} aria-label={open?"Tutup avatar AURA":"Buka avatar suara AURA"} aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
   <span className={"aura-avatar"+(listening?" is-listening":"")+(speaking?" is-speaking":"")} aria-hidden="true"><i/><i/><i/><span/></span>
   <span className="aura-launcher-label">AURA</span>
   {(listening||speaking)&&<span className="aura-avatar-pulse"/>}
  </button>
 </div>;
}
