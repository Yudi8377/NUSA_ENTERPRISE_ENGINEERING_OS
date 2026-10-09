# NUSA Go-Live Runbook

Last verified: 2026-10-09. Overall release state: **AMBER — automated release gates pass; production user/session acceptance is still blocked**.

GitHub is the source/version-control/CI/CD/static-hosting plane. Supabase Free is the data/auth/RLS plane. The Windows engineering workstation is the local SAP2000/CAD/BIM/local-AI bridge. The baseline does not require Vercel, Cloudflare, Hostinger or a paid runtime.

## Verified in the latest release candidate

- Master data database migration `20261009012000_nusa_master_data_crud`, foreign-key index migration `20261009012500_nusa_master_data_fk_indexes`, first-workspace RLS onboarding fixes `20261009013000_nusa_create_workspace_rls_fix` and `20261009014000_nusa_workspace_onboarding_invoker` applied successfully to Supabase. The final `nusa_create_workspace` RPC is `SECURITY INVOKER`, execution is restricted to authenticated users, and narrowly scoped INSERT policies allow a user to create only their own organization, owner membership, and settings. The `nusa_decide_approval` RPC atomically records an independent reviewer decision and updates the linked engineering run status. A direct catalog query confirmed RLS is enabled on `nusa_tenants`, `nusa_projects`, `nusa_employees`, `nusa_assets`, and `nusa_master_data_events`.
- Master Data UI is being added on a feature branch with organization profile, project CRUD/archiving, employee CRUD/archiving, asset CRUD/archiving, project/person assignment, tenant-scoped RLS, and audit-event triggers. It is not production-deployed until the PR quality and Pages runtime gates pass.

- Quality Gate #112 for commit `3f45ef888339dcf59cdfbc1f5df2d70f838c741a`: PASS. Smoke test, acceptance test, lint and production build completed successfully.
- GitHub Pages Deploy #109 for the same commit: build, static export, artifact upload and deployment steps completed successfully.
- Supabase Security Advisor: zero findings returned after the approval policy change.
- Live schema inspection confirmed RLS is enabled on the inspected `nusa_*` public tables, including tenants, memberships, engineering runs, approvals, spatial, knowledge, and workspace records.
- Applied Supabase migration history includes the core foundation, spatial/Pascal engine, governance hardening, enterprise workspace records, workspace transition/insert guards, workspace RLS/index hardening, reasoning RLS/initplan hardening, and `nusa_approval_reviewer_guard` (remote version `20261009005714`).
- Approval decision UPDATE policy now limits decisions to tenant memberships with role `owner`, `admin`, `approver`, or `engineering_lead`, requires the decision actor to be the signed-in user, and prevents the requester from approving their own request.
- Latest live database count check returned: auth users 0; tenants 0; memberships 0; workspace records 0; workspace events 0.

These results verify automated build/deployment, the currently inspected RLS configuration, and the current security advisor. They do **not** prove real-user sign-in, workspace creation, tenant isolation, or end-to-end transaction behavior.

## Release gates

| Gate | Current state | Required evidence |
|---|---|---|
| Static quality: smoke, acceptance, lint, production build | PASS | GitHub Quality Gate #112 |
| GitHub Pages deployment | PASS | GitHub Deploy #109 |
| Supabase migrations | PASS for the currently listed migrations | Migration history reviewed; do not reset production database |
| Supabase RLS and Security Advisor | PASS at last check | Re-run after schema/policy changes |
| Real sign-up/sign-in | BLOCKED / NOT YET VERIFIED | Pilot user signs up and completes configured email verification |
| First tenant/workspace onboarding | BLOCKED / NOT YET VERIFIED | Pilot user creates a workspace; membership is visible for that user |
| Tenant isolation | NOT VERIFIED | Two distinct test tenants/users; prove cross-tenant read/write denied |
| Workspace CRUD and audit trail | NOT VERIFIED against real sessions | Create/update/status transition; verify audit event and denied audit mutation |
| Master data: organization, project, employee, asset | Database migration applied; UI release pending | Owner profile update, create/edit/archive, project/employee/asset relations, tenant-isolation E2E, audit event checks |
| High/critical engineering approval | RLS reviewer policy and database guard present; live E2E NOT VERIFIED | Attempt transition without approval (must fail), then approved independent human flow succeeds |
| Backup/export and restore drill | NOT VERIFIED | Export/backup, restore to a safe test target, compare counts/hashes |
| Mobile/desktop UX and accessibility | PARTIAL / MANUAL | Test narrow and wide screens, keyboard flow, error states, and destructive confirmations |
| Engineering bridge allowlist and signed evidence | IMPLEMENTATION/LOCAL INTEGRATION REVIEW REQUIRED | Verify only allowlisted local commands run; inspect provenance and signature validation |
| Yayasan Ngawi engineering readiness | NOT FOR CONSTRUCTION | Site coordinates, soil/sondir/SPT, verified loads and human engineer review required |

## Required pilot acceptance sequence

1. A project owner registers with their own email/password through the public NUSA sign-up UI. Never share the password with the development team or place credentials in source control.
2. Complete email verification if enabled in Supabase Auth, then sign in.
3. Create a pilot workspace with a non-sensitive name. Confirm the signed-in user is a member of that workspace and can see only its records.
4. Use a second separately authenticated test identity and workspace to verify tenant boundaries in both directions. Do not use production personal data for this test.
5. Create, edit and change a low-risk workspace record. Confirm its audit event appears and audit events cannot be edited/deleted by an ordinary member.
6. Exercise the engineering run workflow with a non-critical test first. For high/critical runs, prove an unapproved transition is rejected by the database, then prove a designated independent human approval is recorded with actor and evidence.
7. Test sign-out, session expiry, failed requests, empty states, mobile layout, and unauthorized direct-route access.
8. Perform a backup/export and a restore drill in a safe test target. Record date, operator, row counts, hashes, and any gaps.
9. Re-run Quality Gate, deployment checks, and Supabase Security Advisor after any fixes. Record evidence and only then promote the release state to GREEN.

## Migration safety

Remote Supabase migration history uses timestamped versions, while parts of the repository retain historical numbered migration filenames. Preserve the existing remote database. Do not reset, drop/recreate, or blindly replay old migrations to make filenames appear aligned. Before future schema changes, map each remote version to its committed SQL content, verify idempotency, and append a new forward-only migration with a unique timestamp.

## Free-tier controls

Keep large CAD/DWG/BIM/raw video outside PostgreSQL. Store metadata, hashes, indexes and compact evidence in Supabase. Review Free-plan quotas before approaching limits. Do not add a paid runtime or hosting dependency without an explicit cost approval.

## Engineering safety

NUSA may calculate, check, compare, forecast, explain, and draft recommendations. It must not independently certify structural safety, approve final design/IFC, close a critical NCR, or declare a building safe. Critical engineering decisions require a qualified human reviewer and traceable evidence. The Yayasan Ngawi pilot remains **PRELIMINARY / NOT FOR CONSTRUCTION** until site and geotechnical inputs are verified and the responsible engineer signs off.

## Release levels

- **GREEN:** all automated gates and required manual/session, isolation, governance, and recovery gates pass with recorded evidence.
- **AMBER:** build/deploy works but one or more operational/manual gates remain.
- **RED:** build/security/deployment failure or an unsafe governance bypass exists.

Current overall state is **AMBER**, because the live project has no registered users or tenant data yet, so session-based acceptance cannot honestly be marked passed.


## Email confirmation redirect repair (2026-10-09)

The production sign-up client now explicitly requests this confirmation redirect:
`https://yudi8377.github.io/NUSA_ENTERPRISE_ENGINEERING_OS/`

Commit: `736ed8cb549639389a0467e19873f59e1d105617`.

The Supabase Auth dashboard configuration must also be verified manually because the current connected Supabase tools do not expose Auth URL Configuration write access:

1. Open [Supabase Auth URL Configuration](https://supabase.com/dashboard/project/abdhojyqvffprfqskwmt/auth/url-configuration).
2. Set **Site URL** to `https://yudi8377.github.io/NUSA_ENTERPRISE_ENGINEERING_OS/`.
3. Add that exact URL to **Redirect URLs** and save.
4. If the signup email template is customized, ensure its confirmation link respects the redirect target (use `{{ .ConfirmationURL }}`, or the appropriate `{{ .RedirectTo }}` pattern for a custom confirmation handler); do not hard-code `localhost` or `{{ .SiteURL }}` into a link that overrides the requested redirect.
5. Wait for the new GitHub Pages deployment to finish, then use a fresh confirmation email. Links already sent before this fix may still contain the old localhost destination.
6. Confirm the resulting browser URL remains on GitHub Pages and the signed-in session is established. If the link still goes to localhost, inspect the actual confirmation email template and Auth URL configuration before retrying.

The code change is committed, but the final live test remains pending until deployment and the Supabase dashboard settings have both been verified.


## 2026-10-09 — Enterprise workflow expansion candidate

- Added \`docs/ENTERPRISE_MANAGEMENT_BLUEPRINT.md\` and the \`/system-blueprint/\` route as a target operating model covering ERP/finance, HR/payroll, procurement/warehouse, CRM, project controls, engineering/CAD/BIM/GIS, GRC, records management, reporting and AURA.
- Added dedicated warehouse routes for warehouse master, goods receipt/QC, stock movement, stock opname and project material issue. They currently create audited workflow/register records; do not treat these as a stock ledger or automatic valuation/GL posting.
- Added dedicated \`nusa_payroll_runs\` and \`nusa_payroll_lines\` tables with RLS role restrictions and a separate payroll worksheet. Payroll is linked to active employee master records and verified attendance records; overtime gross arithmetic is transparent. PPh 21 and BPJS inputs still require validation against current rules. This is not yet a certified/statutory payroll engine.
- Payroll access depends on membership role codes \`owner\`, \`admin\`, \`hr_manager\`, \`payroll_manager\`, \`payroll\`, \`finance_manager\`, or \`finance\`. Verify role assignment through an authorized admin process before pilot.
- The latest automated gates must pass on this branch before deployment. Even after they pass, overall production state remains AMBER until signed-in E2E verifies role restrictions, attendance-to-payroll linkage, independent approval, payment evidence, tenant isolation, backup/restore and transaction integrity.
