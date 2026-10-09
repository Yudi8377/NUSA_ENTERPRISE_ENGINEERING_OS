# NUSA Contextual Module Workspaces

## Design rule

Every business menu opens a workflow-specific workspace, not a generic title/description/amount form. All records remain scoped to the selected organization. Project association is optional only where the record can legitimately exist at organization level. Workspace records are drafts/register entries unless a dedicated, verified transaction engine performs the downstream action.

## Module map

| Module | Submenus | Context-specific fields / controls |
|---|---|---|
| CRM & Sales | Leads, Contacts, Quotations, Activities | Lead source, industry, pipeline stage, probability, next action; contact role and communication consent; quotation validity and payment terms; activity result and follow-up |
| HRD & Payroll | Recruitment, Attendance, Training, Payroll Control | Requisition code, department, employment type, headcount; period, shift, supervisor review; competency, provider, evaluation; payroll period, employee count, reviewer, exceptions |
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
