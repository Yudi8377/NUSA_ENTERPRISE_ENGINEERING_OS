# NUSA ENTERPRISE ENGINEERING OS

Enterprise Operating System + Engineering Intelligence Platform + Multi-Agent AI + Digital Twin.

## Delivery target
Controlled rollout from foundation to production across ERP, CRM, HRD/Payroll, Finance/Tax, Procurement/Asset, Project/Construction, CAD/BIM/SAP2000, Interior/AR/VR/MR, NUSA Voice, AI Governance, Self-Healing, Reporting and Forecasting.

## Rp0 architecture
- GitHub: source control, Actions and GitHub Pages static control plane
- Supabase Free: PostgreSQL, Auth, RLS, Storage and future pgvector/PostGIS
- Windows/local engineering bridge: SAP2000 OAPI, AutoCAD/BricsCAD, Revit/SketchUp and licensed desktop engineering software
- AI/model providers remain replaceable; no Vercel, Cloudflare or Hostinger dependency
- Evidence-first audit trail and human approval gates

## Current foundation
- Supabase project: NUSA_ENTERPRISE_ENGINEERING_OS
- Region: ap-southeast-1
- Core tenant, membership, settings, project, agent and command tables
- RLS enabled on all NUSA core tables
- Workspace creation through authenticated RPC
- Seeded NUSA engineering agent fleet
- Yayasan Ngawi is the first pilot seed

The dashboard is a product foundation, not a claim that engineering safety has been automatically certified.
