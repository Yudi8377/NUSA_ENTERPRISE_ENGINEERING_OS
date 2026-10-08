# NUSA Go-Live Verification Plan

NUSA is not considered production-ready merely because the UI builds.

## Gates
1. Static quality: lint + production build.
2. Database: migrations applied, required tables present, RLS enabled.
3. Security: Supabase Security Advisor has zero findings for NUSA-owned policies.
4. Isolation: tenant-scoped reads/writes and approval records require membership.
5. Governance: critical engineering runs cannot be treated as approved without human approval and evidence.
6. Provenance: knowledge and engineering outputs retain source/hash/context metadata.
7. Recovery: failed ingestion and engineering jobs expose explicit failed/retry state.
8. UX: desktop and mobile layouts remain usable; destructive actions are confirmed.
9. Deployment: GitHub Pages deployment completes and the published page returns the expected application shell.
10. Engineering safety: no AI-only claim of structural safety, IFC readiness, or construction readiness.

## Release levels
- GREEN: all automated gates pass and deployment is verified.
- AMBER: build works but one or more operational/manual gates remain.
- RED: build/security/deployment failure or an unsafe governance bypass exists.

A production release requires GREEN. Engineering certification remains a human-controlled process even at GREEN.
