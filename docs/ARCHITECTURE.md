# NUSA architecture

## Control plane
Next.js web application provides command center, module navigation, workflow UI and report surfaces.

## Data plane
Supabase/Postgres is the intended multi-tenant data plane. Each exposed table must use least-privilege grants and Row Level Security. Auth identities map to application profiles, memberships and roles.

## AI plane
NUSA Orchestrator decomposes intent into typed tasks. Specialist agents operate with scoped tools. Every run stores model, prompt/version, tools, inputs, outputs, evidence and approval state.

## Engineering bridge
A local Windows bridge is the trust boundary for licensed desktop software such as SAP2000 OAPI, AutoCAD/BricsCAD, Revit and SketchUp. Cloud requests are queued; the bridge executes only allowlisted operations and uploads signed evidence/result packages.

## Evidence
Critical outputs carry project, model/version, run id, timestamp, source, unit, reviewer and approval status.

## Governance
ISO/IEC 42001:2023 is used as the AI management-system reference. This is an implementation blueprint, not a certification claim.
