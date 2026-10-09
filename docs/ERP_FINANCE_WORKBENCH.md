# NUSA ERP & Finance Workbench

## Purpose
Provide a context-specific finance workspace for each operating area. All records are scoped to the selected organization (tenant_id) and may optionally be linked to a project. User-facing copy must distinguish operational registers and estimates from posted accounting entries, bank instructions, tax submissions, and statutory reports.

## Navigation
The ERP & Finance hub exposes 21 areas:
- Accounting: Chart of Accounts, General Journals, General Ledger.
- Working capital: Cash & Bank, Bank Reconciliation, Accounts Receivable, Accounts Payable, Expenses & Claims.
- Planning and controls: Budgets & Forecast, Cost Centers, Fixed Assets, Tax & Compliance, Period Close, Financial Reports.
- Advanced controls: Recurring Journals & Accruals, Payment Runs, Cash Forecast, Financial Dimensions, Intercompany, Project Profitability.

Every submenu uses the shared FinanceWorkspace implementation with a dedicated field schema, record type, list filter, contextual labels, detail view, edit, archive, CSV export and print view.

## Data and controls
- Persistent records use public.nusa_workspace_records with module_code = 'erp', tenant_id, optional project_id, contextual record_type, JSONB data, and common status/amount metadata.
- The current field schemas are versioned in data.schema_version and tagged with data.source = 'nusa-erp-finance'.
- Organization access is resolved from the signed-in user's memberships; queries and mutations include the selected tenant.
- Archiving is soft-delete behavior with an app-owned confirmation dialog. Data is not physically deleted.
- Journal draft validation requires a positive debit and matching credit for the current two-sided entry form.
- Numeric amounts cannot be negative; period end cannot precede period start; bill due dates cannot precede bill dates.
- The dashboard's six-month visualization reflects record creation and register nominal values only. It must not be labelled actual cash flow, recognized revenue, posted ledger balance, or audited financial performance.

## Operational maturity boundaries
The following are operational registers, not implemented external or statutory integrations:
- Journal drafts are not automatically posted to a ledger.
- Cash/bank entries do not instruct banks or fetch bank statements.
- Payment runs do not send payments; independent verification and approval are still required.
- Tax register entries do not calculate/submit official tax returns.
- Financial report requests do not constitute a reconciled trial balance, statutory balance sheet, or profit-and-loss statement.
- Recurring journals are templates only; there is no background scheduler.
- Cash forecasts and project profitability are manually maintained management estimates until source data is integrated and reconciled.
- Intercompany entries do not automatically generate eliminations or consolidated statements.

## Verification contract
- Smoke test must confirm every route exists.
- Acceptance test must confirm each added route resolves to FinanceWorkspace, the submenu configuration is present, the dashboard labels nominal activity honestly, and the tenant-scoped record persistence remains in place.
- Run the repository's quality workflow (smoke, acceptance, lint, production build) before merge.
- Live end-to-end verification still requires a signed-in pilot account with at least one organization and representative test records.
