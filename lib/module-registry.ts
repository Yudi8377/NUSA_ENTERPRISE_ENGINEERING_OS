export type ModuleState="foundation"|"building"|"pilot"|"planned"|"blocked"|"ready";
export type NusaModule={code:string;name:string;domain:string;state:ModuleState;critical:boolean;ownerAgent?:string;description:string};
export const NUSA_MODULES:NusaModule[]=[
{code:"command",name:"Command Center",domain:"core",state:"foundation",critical:true,ownerAgent:"nusa.orchestrator",description:"Intent, commands, context, delegation and audit."},
{code:"knowledge",name:"Knowledge Brain",domain:"ai",state:"building",critical:true,ownerAgent:"nusa.orchestrator",description:"Sources, chunks, retrieval, provenance and reasoning context."},
{code:"finance",name:"Finance & Accounting",domain:"finance",state:"planned",critical:true,description:"Ledger, AP/AR, cash flow and management accounting."},
{code:"crm",name:"CRM & Sales",domain:"crm",state:"planned",critical:false,description:"Customers, opportunities, quotations and sales workflow."},
{code:"hr",name:"HRD & Payroll",domain:"hr",state:"planned",critical:true,description:"People, attendance, payroll and controlled HR records."},
{code:"tax",name:"Tax & Compliance",domain:"legal",state:"planned",critical:true,description:"Tax records, compliance calendar and evidence."},
{code:"procurement",name:"Procurement & Asset",domain:"procurement",state:"planned",critical:true,description:"Sourcing, purchase orders, inventory and assets."},
{code:"construction",name:"Project & Construction",domain:"construction",state:"building",critical:true,ownerAgent:"nusa.orchestrator",description:"Project controls, schedule, cost, QA/QC and HSE."},
{code:"architecture",name:"Architecture / CAD / BIM",domain:"architecture",state:"building",critical:true,ownerAgent:"bim.coordinator",description:"Requirements, spatial design, CAD/BIM and digital twin."},
{code:"structural",name:"Structural & SAP2000",domain:"structural",state:"building",critical:true,ownerAgent:"engineering.structural",description:"Analysis workflows with evidence and human approval."},
{code:"mep",name:"MEP",domain:"mep",state:"planned",critical:true,description:"Electrical, plumbing, HVAC and coordination."},
{code:"qs",name:"QS / RAB / BOQ",domain:"qs",state:"building",critical:true,ownerAgent:"qs.estimator",description:"Quantity takeoff, estimates, RAB and cost evidence."},
{code:"field",name:"Field Intelligence",domain:"hse",state:"planned",critical:true,ownerAgent:"field.vision",description:"Photo/video evidence, inspection, NCR/RFI and progress."},
{code:"interior",name:"Interior Intelligence",domain:"interior",state:"planned",critical:false,description:"Interior layout, materials, lighting, furniture and AR/VR."},
{code:"voice",name:"NUSA Voice",domain:"voice",state:"planned",critical:false,ownerAgent:"nusa.orchestrator",description:"Indonesian-first contextual voice interaction."},
{code:"guardian",name:"AI Guardian",domain:"ai",state:"building",critical:true,ownerAgent:"nusa.orchestrator",description:"Policy, evaluation, approvals and unsafe-output prevention."},
{code:"selfhealing",name:"Self Inspection / Self Healing",domain:"ai",state:"planned",critical:true,ownerAgent:"nusa.orchestrator",description:"Observe, diagnose, snapshot, repair, verify and learn."},
{code:"bi",name:"Reporting & Forecast",domain:"finance",state:"planned",critical:false,description:"Management reporting, EAC/ETC, KPI and scenario forecasts."}
];
