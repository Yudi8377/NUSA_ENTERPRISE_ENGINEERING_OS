# NUSA Generative Engineering Pipeline

## Objective

NUSA accepts natural-language prompts, floorplan images/scans, CAD/BIM/3D models, site/geotechnical evidence, project documents, and voice instructions, then produces a traceable engineering project package.

## Canonical pipeline

INTENT → REQUIREMENTS → SPACE PROGRAM → 2D INTERPRETATION → 3D SPATIAL MODEL → ARCHITECTURE → STRUCTURE/MEP → QUANTITY → COST → SCHEDULE → DOCUMENTS → REVIEW → APPROVAL.

Every generated artifact receives provenance and source hashes.

## 2D → 3D

NUSA can use Pascal's floorplan vision capability to extract walls, rooms, approximate dimensions and confidence, then normalize the result into a spatial manifest and create a scene. Reconstruction remains approximate until scale and dimensions are verified.

## Prompt → Project

Example intent: “Buat rancangan awal gedung yayasan Islam-Jawa 26 x 8 meter, dua lantai, kapasitas 150 orang, ruang pengurus, aula, perpustakaan, ruang belajar, toilet pria/wanita, tangga, ruang wudhu, akses difabel, gaya modern Jawa-Islami.”

NUSA decomposes it into project brief, assumptions, space program, adjacency requirements, site constraints, architectural concept, 2D plans, 3D spatial scene, elevations/sections, engineering inputs, preliminary QTO/RAB, schedule, and review gates.

## Governance

AI may generate, calculate, compare, detect, explain and recommend.

AI must not silently approve structural safety, declare construction-ready, issue final IFC/shop drawings, approve critical NCRs, or certify compliance without evidence. Critical engineering outputs require human approval.

## Target project package

Brief/requirements, concept, plans, elevations, sections, RCP, roof plan, schedules, finishes, structural drawings, MEP, fire/life safety, accessibility, BOQ/QTO, RAB, specifications, method statements, schedule, QA/QC, HSE, tender package, presentation/render package, and revision/audit package.
