# NUSA Contextual Module Workspaces

## Design rule

Every business menu opens a workflow-specific workspace, not a generic title/description/amount form. All records remain scoped to the selected organization. Project association is optional only where the record can legitimately exist at organization level. Workspace records are drafts/register entries unless a dedicated, verified transaction engine performs the downstream action.

## Module map

| Module | Submenus | Context-specific fields / controls |
|---|---|---|
| CRM & Sales | Leads, Contacts, Quotations, Activities | Lead source, industry, pipeline stage, probability, next action; contact role and communication consent; quotation validity and payment terms; activity result and follow-up |
| HRD & Payroll | Recruitment, Attendance/Timesheet, Training, Payroll Run | Requisition code, department, employment type, headcount; employee-master selection, period, shift, workdays, approved overtime, sick/unpaid leave and supervisor verification; competency/provider/evaluation; restricted payroll lines with base salary, fixed/position allowance, overtime, bonus, incentive, THR, BPJS/PPh 21 inputs, deductions, gross/net arithmetic and independent approval |
| Procurement & Asset | Requisitions, Vendors, Purchase Orders, Inventory | Category, quantity, unit, need-by; vendor qualification and risk; PO/PR cross-reference, delivery and terms; SKU, warehouse, stock and reorder point |
| Reports & Forecast | KPI Dictionary, Forecast, Report Packs, Decision Scenarios | KPI unit/target/frequency/owner; scenario/horizon/confidence/driver; report period/audience/format/classification; decision owner, schedule and cost impact |
| GRC & Compliance | Risk Register, Audit/CAPA, Compliance Controls, Incidents | Likelihood/impact/residual rating; audit criteria/evidence/CAPA owner; obligation source/control owner/evidence; incident severity, immediate action, investigation |
| Engineering & SAP2000 | Structural Analysis, Geotechnical, SAP2000 Model Review, MEP, Quantity Surveying, Site Inspection | Design basis, load cases, model revision; soil report and investigation method; SAP model/version/units/analysis; discipline and interface issues; estimate basis and package; inspection stage/ITP/evidence |
| Architecture / CAD / BIM | CAD Drawing Register, BIM/IFC, Clash Review, Design Review, Spatial/GIS | Drawing number/revision/status; model version/schema/CRS; clash ID/severity/owner/due date; design basis and impact; dataset/geometry/CRS/source/accuracy |
| ERP & Finance | Chart of Accounts, Journals, Ledger, Cash/Bank, Receivables, Payables, Budgets, Tax, Reports, Reconciliation, Expenses, Fixed Assets, Cost Centres, Period Close | Dedicated FinanceWorkspace schemas and validations already present, including balanced debit/credit draft journal validation and record export/search |

## Standards and governance

- Structural forms include Indonesian SNI design-basis choices (including SNI 1726, SNI 1727, SNI 1729, and SNI 2847) plus explicit international references such as AISC/ASCE where applicable. The engineer must confirm current editions, amendments, authority requirements, and project specifications before use.
- MEP fields provide a place to record applicable SNI/PUIL and project standards. The form does not certify compliance.
- ISO-like GRC workflows are represented as evidence registers; no module automatically certifies ISO or legal compliance.
- Finance records remain drafts/registers until controlled posting, bank integration, tax calculations, or close routines are implemented and validated.
- Payroll Control is an exception/review register, not a production payroll calculator or payment service.
- CAD/BIM/SAP2000 pages create structured workflow requests. They do not claim to run desktop CAD/BIM/SAP2000 solvers without an installed and tested bridge.

## Data and audit

CRM/HR/Procurement/Reports/GRC contextual records use the existing tenant-scoped `nusa_workspace_records` table. Each submenu uses a distinct `record_type`, and the page filters to that type so unrelated module records do not appear in the register. The database trigger records INSERT/UPDATE events. Engineering disciplines use the existing `nusa_engineering_runs` and approval path; high/critical runs require human review.

## Validation gates

1. Smoke test checks all module route files exist.
2. Acceptance assertions check each module has its contextual schema and submenu routes.
3. ESLint and Next production build must pass.
4. Runtime acceptance checks the deployed static routes and asset references.
5. Authenticated E2E should verify create/read/update/archive, tenant isolation, event history, and high/critical approval using two separate test tenants before marking the whole platform production-ready.

## Recent controls added
- `nusa_payroll_runs` and `nusa_payroll_lines` are dedicated tables, not generic workspace JSON. RLS limits access to owner/admin and explicitly assigned HR/Payroll/Finance role codes. Payroll lines retain an optional attendance record reference.
- Payroll worksheet links employee master records to attendance records marked `Terverifikasi`. It calculates overtime pay as approved hours × entered rate, gross components, deductions and net estimate. PPh 21 and BPJS values are entered only after external/current-rule verification; this is not yet a legally validated Indonesian payroll engine.
- Procurement adds dedicated routes for warehouse master, goods receipt/QC, stock movement, stock opname and material issue to project. These are audited registers; automatic stock ledger posting, valuation and GL integration remain a separate acceptance gate.
- Submenu queries filter by each route's `record_type` to prevent one submenu showing unrelated records from the same module.


- Added restricted effective-dated compensation master for base salary, fixed/position allowances and overtime rate; overlapping effective periods for one employee are rejected by the database trigger.
- Payroll worksheet preloads compensation effective on the payroll period start date, offers only verified attendance records for the selected employee, and snapshots compensation and attendance evidence into the payroll line. It shows a gross/net worksheet, not a final tax calculation.
- Payroll run and line changes are captured by an append-only, role-restricted payroll event table. The event view is available to users who have the payroll role.
