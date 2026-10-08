# Runtime Acceptance Blocker

As of 2026-10-09 the release pipeline is green, but browser-level runtime verification is not yet evidenced.

The public GitHub Pages URL cannot be verified through the available repository connector, and the external browser fetch is unavailable in the current execution environment.

Therefore the release must remain:

**DEPLOYED — OPERATIONAL ACCEPTANCE PENDING**

Do not promote to FULL GO LIVE solely from CI success.

Required evidence:
- production page loads
- static assets resolve
- Supabase auth session works
- authenticated tenant/project isolation works
- ASK NUSA persists commands
- knowledge retrieval returns evidence
- critical engineering run creates approval
- approval is tenant-scoped
- ingestion lifecycle is observable
- mobile/responsive smoke test passes
