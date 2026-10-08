# NUSA Windows Engineering Bridge

Local worker boundary for SAP2000 OAPI, CAD/BIM, Pascal/MCP and local AI. Production execution must use an allowlist, snapshots, evidence hashes and human approval for critical engineering commands.

## Engines
- Pascal: architectural/spatial authoring and floorplan reconstruction
- AutoCAD/BricsCAD: DWG/DXF drafting
- Revit/BIM: governed BIM authoring/exchange
- SAP2000: structural analysis
- SketchUp: visualization/interior workflows
- Local AI/Vision: OCR, drawing understanding, image/video inspection and engineering assistance

## Pascal flow
NUSA Orchestrator → Architect Agent → Pascal MCP → scene → validation → evidence → downstream engineering agents.

## Safety
The bridge fails closed for unknown commands. It never independently approves structural safety, construction readiness, critical NCRs or final IFC/shop drawings.

## Evidence
Every execution should produce job manifest, input/source hashes, engine/version, timestamp, output artifact hashes, validation results, and approval state.
