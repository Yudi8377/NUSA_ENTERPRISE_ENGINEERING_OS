# NUSA Go-Live Runbook

GitHub is the source/version-control/CI/CD/static-hosting plane. Supabase Free is the data/auth/RLS plane. The Windows engineering workstation is the local SAP2000/CAD/BIM/local-AI bridge. The baseline does not require Vercel, Cloudflare, Hostinger or paid runtime.

## Gates
1. Build and lint pass.
2. GitHub Pages deployment succeeds.
3. Supabase security review is clean for NUSA tables.
4. Auth sign-up/sign-in works.
5. Tenant isolation is verified.
6. Audit/evidence and approval workflow is present.
7. AI provider defaults to local execution.
8. Engineering bridge uses an allowlist.
9. Engineering outputs carry provenance/evidence.
10. Critical engineering actions require human approval.
11. Backup/export procedure is tested.
12. Yayasan Ngawi remains PRELIMINARY / NOT FOR CONSTRUCTION until site and geotechnical data are verified.

## Free-tier controls
Keep large CAD/DWG/BIM/raw video outside PostgreSQL. Store metadata, hashes, indexes and compact evidence in Supabase. Review the Free-plan quotas before approaching limits.
