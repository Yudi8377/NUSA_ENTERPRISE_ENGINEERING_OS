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
 if(/data contoh|25 data|data demo/.test(q))return "Buka Master Data, lalu tekan Muat 25 data contoh. NUSA akan menyiapkan 5 proyek, 10 pegawai, dan 10 aset sintetis pada organisasi yang dipilih atau membuat organisasi demo jika belum ada.";
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
