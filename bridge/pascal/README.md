# NUSA ↔ Pascal Spatial Engine

Pascal is integrated as a **local architectural/spatial authoring engine**, not as NUSA's system of record and not as a replacement for AutoCAD, Revit or SAP2000.

## Contract

NUSA emits a versioned job manifest:

- schema: nusa.pascal.job.v1
- action: CREATE_SCENE | OPEN_SCENE | IMPORT | EXPORT | QUERY_SCENE
- project/model identifiers
- normalized architectural intent
- geometry parameters in SI units (metres)
- source/evidence references
- approval state

The local Windows bridge is the execution boundary. It may launch Pascal CLI/MCP or another approved local adapter. The bridge MUST:

1. validate the manifest against the allowlist;
2. create a snapshot before mutation;
3. execute only an approved action;
4. hash returned artifacts;
5. write evidence metadata to NUSA;
6. never mark structural safety/construction readiness;
7. require human approval for critical engineering decisions.

## Recommended flow

NUSA Orchestrator → Architect Agent → Pascal Adapter → Pascal scene → artifacts → Evidence → Structural/MEP/QS agents.

## First pilot

Yayasan Ngawi:
- footprint: 26 m × 8 m
- floors: 2
- approximate area: 416 m²
- preliminary architectural model only
- structural calculations remain separately governed.

## Local installation

Use the Pascal project's documented local CLI/MCP workflow on the Windows engineering workstation. Keep the adapter thin so Pascal can be upgraded independently.

Do not place Pascal secrets, local absolute paths, or service credentials in Git.
