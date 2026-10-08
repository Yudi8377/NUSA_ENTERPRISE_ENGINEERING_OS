# NUSA Operational Acceptance

## Current release
Production commit: `11e272b49a22667068f2239716b409f60f60a844`

## Automated gates
- Quality Gate: PASS
- GitHub Pages deployment: PASS
- Supabase Security Advisor: 0 findings
- Performance Advisor: INFO-only unused-index notices on an empty/low-traffic database

## Runtime acceptance checklist
1. Load production URL and verify static assets.
2. Sign-in/session bootstrap.
3. Tenant/workspace creation and project isolation.
4. ASK NUSA command creation and audit trail.
5. Knowledge retrieval shows indexed evidence/provenance.
6. Critical engineering run creates pending human approval.
7. Approval state changes are tenant-scoped and auditable.
8. Ingestion queue renders status without pretending browser upload is complete ingestion.
9. Mobile navigation and reduced-motion behavior.
10. Failure/retry states do not bypass governance.

## Safety boundary
NUSA must not label structural, seismic, geotechnical, construction-ready, IFC, or critical NCR outputs as approved/safe without the required human engineering review and evidence.

## Database acceptance
See `docs/OPERATIONAL_ACCEPTANCE_SQL.md` for read-only assertions.
