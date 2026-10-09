# NUSA Enterprise Management System — Target Operating Model

> Scope: national Indonesian operating requirements plus internationally recognized management-system controls. This catalog is a target architecture and implementation backlog; it is not a statement that NUSA or a customer is certified or automatically compliant.

## Product rules

1. One organization (tenant) owns legal entities, departments, branches, cost centres, projects, people, suppliers, customers, warehouses, assets, chart of accounts, policies, and document numbering.
2. Business transactions have a lifecycle: draft → validation → independent review/approval → execution/posting → reconciliation → close. A status field alone is not a transaction engine.
3. A business object has a stable ID, human-readable number, owner, dates, project/cost-centre references, attachments/evidence, version history, and immutable audit events.
4. Segregation of duties: requester ≠ approver; master-data maker ≠ checker for sensitive changes; payroll preparer ≠ final approver; PO approver ≠ receiving verifier where practicable.
5. No financial, inventory, payroll, engineering, or compliance record is represented as final merely because a draft form was saved. Integrations and calculations must be validated before enabling production posting.
6. Personal data, payroll, bank, tax, medical/leave, and identity documents need least-privilege access, retention rules, and appropriate lawful basis. Never place secrets in free-text descriptions.
7. Every standard is versioned by edition, effective date, jurisdiction, contract, and project applicability. A checklist records evidence; it does not confer certification.

## Menu and workflow catalog

### 00 — Command Center & Governance
- Portfolio overview, organization/project switcher, pending tasks, approval inbox, exceptions, risk alerts, audit events, data-quality issues, integration health, notification centre.
- Administration: organization settings, branches, departments, roles, permissions, approval matrix, numbering, fiscal calendar, document templates, retention, import/export, integrations, backups, release/feature flags.
- Controls: tenant isolation, MFA/identity policy where configured, session management, access review, maker-checker, delegated authority, audit export.

### 01 — Master Data & Organization
- Organization/legal entity: legal name, registration/tax identifiers, address, contacts, bank-account references (restricted), industry, branches, business units.
- Organization structure: departments, positions, cost centres, approval limits, project offices, work locations, warehouse locations.
- Project register: code, client, contract, scope, WBS, baseline, budget, schedule, progress, risks, handover and closeout.
- People: employee code, employment status, department, position, supervisor, contract dates, competency and project assignment. Compensation and sensitive HR attributes belong in restricted tables.
- Customer and supplier master: due diligence, tax status, contacts, consent, qualification, sanctions/conflict declarations as appropriate.
- Item/SKU, units of measure, warehouse/bin, equipment/fixed asset, account/tax code, document type, currencies, calendar, KPI dictionary.
- Data governance: duplicate detection, steward, approval of critical master changes, source provenance, archive policy, data dictionary.

### 02 — ERP & Finance
- General ledger: chart of accounts, dimensions, journal templates, recurring journals, accruals, deferrals, intercompany, trial balance, period locks and closing.
- Accounts payable: vendor invoices, PO/receipt/three-way match, tax withholding, payment proposal, approval, payment evidence, vendor statement reconciliation.
- Accounts receivable: contract/milestone billing, invoice, credit note, receipt allocation, aging, collection promise, dispute and write-off approval.
- Cash and treasury: cashbook, bank accounts, payment batches, cash forecast, bank statement import, matching rules, reconciliation, petty cash and cash advance settlement.
- Budget and controlling: annual/project budget, cost centre, commitment, actual, estimate-to-complete, estimate-at-completion, variance and change control.
- Fixed assets: acquisition, capitalization, asset tag, location/custodian, useful life, depreciation policy, impairment, transfer, disposal, physical verification.
- Expenses: claim, receipt evidence, policy validation, per diem, advance settlement, approver and reimbursement.
- Tax: VAT/PPN, withholding taxes, PPh 21, PPh 23, PPh 4(2), corporate tax workpapers, tax calendar, e-Faktur/e-Bupot/e-Filing integrations only when implemented and verified.
- Reporting: balance sheet, profit and loss, cash flow, trial balance, ledger, AP/AR aging, budget-vs-actual, project margin, tax reconciliation, consolidation.
- Close: checklist, reconciliations, accruals, intercompany, reviewer sign-off, period lock, reversal rules, post-close adjustment log.
- Controls: balanced journals, valid open period, posting permissions, source-document traceability, no duplicate invoice, approval limits, immutable posted entries and controlled reversal.

### 03 — CRM, Sales & Customer Success
- Lead capture and qualification, account/contact registry, communication consent, opportunity pipeline, probability and next action.
- Tender/RFP, bid/no-bid review, quotation versions, cost/pricing approval, validity, assumptions/exclusions, terms, contract conversion.
- Customer activities, meetings, commitments, follow-up SLA, complaints/service cases, customer satisfaction, renewals and collections handoff.
- Handoffs: Won opportunity → contract/project setup → billing milestones → delivery → customer acceptance → invoice/AR.

### 04 — HR, Attendance & Payroll
- Workforce planning, requisition, recruitment pipeline, interview scorecards, offer, onboarding, contract/renewal, probation, exit and clearance.
- Employee file, department/position history, competency matrix, training/certification, performance objectives, appraisal, disciplinary case with restricted access.
- Attendance: shifts/rosters, check-in/out imports, timesheets, overtime request and supervisor approval, holidays, lateness, absence, corrections and audit.
- Leave/absence: annual leave, sick leave (medical evidence access restricted), maternity/paternity and other statutory/company leave, unpaid leave, balances, approvals, return-to-work.
- Compensation master (restricted): base salary, effective-dated changes, fixed and position allowances, variable incentives, bonus, overtime rules, THR eligibility/accrual, benefit and deduction setup.
- Payroll cycle: cutoff → attendance/leave lock → variable pay import → gross earnings → employee/employer contributions → tax calculation → net pay → HR review → Finance review → independent approval → payslip → payment file → reconciliation → close.
- Payroll components: salary, prorated days, approved overtime, shift/holiday premiums, bonus, performance/production incentives, position allowance, THR, reimbursements, arrears, BPJS Kesehatan/Ketenagakerjaan, PPh 21, loans/advances and other authorized deductions.
- Controls: effective dates, calculation-rule version, rounding rules, exception register, retroactive adjustment, duplicate-run prevention, segregation of duties, confidential payslips, payment reconciliation.
- Integration requirement: payroll consumes approved attendance/leave/overtime and effective-dated compensation data. Never calculate final payroll from free-text notes or unapproved timesheets.

### 05 — Procurement, Warehouse & Asset Lifecycle
- Purchase requisition, specification, budget check, sourcing/tender, vendor comparison, conflict check, purchase order, contract/terms and approval.
- Receiving: goods receipt against PO, quantity and condition check, quality inspection, nonconformance/quarantine, supplier return and invoice three-way match.
- Warehouse: warehouse/bin/location master, SKU/UOM/barcode, lot/batch/serial, expiry, minimum/maximum, reorder point, safety stock, ABC classification, reservation, pick/pack/issue, transfer, returns, stock count and approved adjustment.
- Project issue: material request, allocation to WBS/cost code, handover, consumption, wastage, return to stock and project-cost posting.
- Asset lifecycle: capitalization, tag, assignment, maintenance schedule, work order, spare parts, calibration, downtime, warranty, movement, physical audit, disposal.
- Controls: no negative stock without explicit policy; every movement has source/destination, quantity, UOM, actor, approver when required, timestamp and source document; stock ledger reconciles to GL under an approved valuation policy.

### 06 — Project & Construction Controls
- Contract and scope, WBS/cost code, baseline schedule, milestones, look-ahead, progress measurement, change orders, RFIs, submittals, meeting minutes, site instructions, claims and variations.
- QS/BOQ, takeoff, estimate basis, rate analysis, procurement packages, commitments, valuation/progress claims, payment certificates, retention, forecast final cost.
- Site diary, inspections/ITP, method statements, NCR/CAPA, HSE observations, permits, toolbox talks, incidents, photo/geotagged evidence and handover dossiers.
- Cost/schedule/risk: earned value where configured, critical path, delay/claim evidence, risk register, contingency, estimate-to-complete and forecast at completion.

### 07 — Engineering, CAD/BIM & Spatial
- Design basis, design inputs/assumptions, calculations, peer check, independent check, revision and approval register.
- Structural: loads/load combinations, model/version, member checks, foundation/soil report, SNI and project code matrix, design calculation package and engineer sign-off.
- MEP: equipment schedules, load/flow calculations, coordination issues, commissioning, test results and as-built records.
- CAD/BIM: drawing register, sheet/revision, transmittals, IFC/model version, CDE conventions, clash issue, design review, RFI, model element provenance and as-built.
- GIS/spatial: CRS, source/accuracy, parcel/asset geometry, survey evidence, access control and spatial revision history.
- Desktop solvers/CAD/BIM integrations remain labelled unavailable until a tested bridge returns verifiable output; an AI suggestion is not a sealed engineering calculation.

### 08 — GRC, Quality, HSE & Information Security
- Enterprise/project risk register, risk appetite, likelihood/impact, treatment, residual risk, owner and review date.
- Internal audit plan, criteria, sampling, evidence, findings, corrective/preventive action, root cause, due date, effectiveness verification and closure.
- Compliance obligations, control library, control owner, evidence schedule, assessment, exception and management attestation.
- Quality: document control, nonconformance, CAPA, inspection/test records, supplier quality, calibration and customer complaint.
- HSE: hazard/risk assessment, incident/near miss, investigation, corrective action, permits, training and emergency readiness.
- Information security/privacy: asset inventory, access review, incident response, vendor risk, data classification, retention, subject-rights and breach workflow.
- Continuity: business impact analysis, critical service register, recovery objectives, backup evidence, restore test and exercise lessons.

### 09 — Reports, BI & Management Review
- KPI dictionary with definition, owner, source, frequency, threshold and formula version.
- Financial/project/HR/procurement/quality dashboards, forecast scenarios, variance and root-cause analysis.
- Scheduled report packs, audience/permissions, distribution log, board/management review, action tracker and evidence pack.
- Every metric identifies source freshness, missing data, transformation logic and known limitations.

### 10 — Document & Records Management
- Controlled templates, document IDs, revision, owner, classification, effective date, review cycle, approval workflow, transmittal, acknowledgement and obsolete-copy control.
- Evidence attachments, hash/provenance, retention schedule, legal hold, export, archive, access history and record disposal approval.
- Forms and generated documents: contracts, purchase orders, invoices, HR letters, payroll slips, inspection forms, calculation reports, meeting minutes, NCR/CAPA and handover dossiers.

### 11 — AURA & AI / Integration Runtime
- Voice/avatar assistant, Indonesian speech normalization, contextual navigation, approved data retrieval, task preparation, document extraction, knowledge search, multi-agent orchestration and integration health.
- AI actions are scoped to the user's permissions; sensitive or irreversible actions require explicit human confirmation. Model output must be traceable to source/evidence and cannot approve its own work.
- AURA runtime/device features are separate from NUSA's organization, access, records and approval control plane. External AURA workflows/builds are links until a tested, versioned integration exists.

## Standards and regulatory mapping

Maintain a versioned applicability register instead of hardcoding a blanket “compliant” label. Candidate references to review with competent professionals include:
- Indonesia: applicable employment and payroll/tax regulations; BPJS rules; PPh/PPN and current DJP requirements; UU Perlindungan Data Pribadi; company, contract, construction, occupational safety and sector-specific obligations.
- Financial reporting: applicable Indonesian SAK/PSAK and, where required, IFRS reporting mappings; approved chart of accounts, tax-book reconciliation and period-close controls.
- Management systems: ISO 9001 (quality), ISO 14001 (environment), ISO 45001 (OH&S), ISO/IEC 27001 (information security), ISO 22301 (business continuity), ISO 31000 (risk guidance), ISO 37301 (compliance management), ISO 37001 (anti-bribery) and relevant records/document-control guidance.
- Project delivery: ISO 21502 / PMBOK-aligned project controls where contractually appropriate.
- BIM: ISO 19650 information management and project-specific CDE/BEP conventions.
- Engineering: current applicable SNI and authority requirements; for structural projects validate the applicable editions of seismic, loading, steel, concrete, geotechnical and fire/MEP standards with the responsible engineer. International references such as ASCE/AISC/ACI apply only where required and reconciled with local rules.

## Implementation and acceptance gates

### Gate A — Platform and master data
- First organization and owner membership, departments, cost centres, projects, employees, suppliers/customers, items, warehouses, assets, account/tax dictionaries.
- Import template, duplicate handling, field-level validation, source provenance and audit history.

### Gate B — Transaction foundations
- Dedicated normalized tables for financial postings, inventory ledger, attendance/leave/overtime and payroll lines; do not treat generic JSONB records as final accounting, stock or payroll ledgers.
- Server-side transactional operations, idempotency, unique document numbers, balanced postings, stock concurrency controls, period locks and role-aware RLS.
- Maker-checker, delegated authority, approval evidence, immutable event trail, controlled reversals.

### Gate C — Integrated workflows
- Requisition → budget check → sourcing → PO → receipt/QC → invoice match → approval → payment → bank reconciliation.
- Attendance/leave/overtime approval → payroll calculation → HR review → Finance review → independent approval → payslip/payment reconciliation.
- Contract/project → WBS/BOQ → procurement/material issue → progress valuation → cost forecast → billing/AR → project closeout.

### Gate D — National/international controls
- Applicable law/standard register, controlled procedures, document retention, evidence packs, internal audit and management review.
- Independent review of tax/payroll rules, financial policies, security, privacy, and engineering design basis.

### Gate E — Production readiness
- Unit/integration/E2E tests, at least two separate tenant identities, cross-tenant read/write denial, role-permission matrix, backup and tested restore, monitoring/alerting, incident runbook, disaster recovery, accessibility and responsive UI.
- Sign-off by process owners; no production-ready claim based only on static build or route checks.

## Current maturity policy

Use these labels in UI and release notes:
- **Implemented & tested** — automated checks plus relevant authenticated E2E evidence exist.
- **Workflow/register** — structured form and audit trail exist, but downstream posting/calculation/integration is not implemented.
- **Prototype** — UI or static path exists, but persistence/permissions/real-world workflow are not validated.
- **Planned** — catalogued target feature not yet implemented.

Do not use “A+ compliant/certified” as a software badge. A+ is a target quality objective, measured through explicit acceptance gates and independent review.
