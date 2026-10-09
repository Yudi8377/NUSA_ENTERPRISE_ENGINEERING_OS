# AURA × NUSA Integration and Demo Data

## Integration status

- NUSA exposes the AURA Integration Hub at /aura/ and includes it in the Command Center navigation.\n- AURA also appears as a floating, animated voice avatar on all NUSA routes. It supports Indonesian browser speech recognition and speech synthesis where the browser/device provides those capabilities, a text fallback, contextual menu guidance, and simple voice navigation commands. This is an embedded avatar interface, not a table or form.\n- The browser avatar is a lightweight navigation/help interface. It is not yet a live connection to the native AURA Android/Windows cognitive runtime or a remote LLM agent; the native bridge remains a separate, security-gated integration.
- The hub links to the official AURA source and its Android and Windows GitHub Actions workflows.
- AURA's repository contains native Android and JVM desktop runtimes plus a browser extension. The NUSA GitHub Pages app is a static web client; it cannot execute the native AURA runtime inside the browser tab.
- A live device-to-NUSA bridge is **not yet connected**. Before enabling it, implement a signed/authenticated API or local device bridge, tenant-scoped authorization, replay protection, payload validation, audit events, and human approval gates for consequential actions.
- CI success indicates a build workflow passed; it does not establish that a runtime is connected to the signed-in NUSA session.

## Sample master data

From **Master Data → Muat 25 data contoh**, an authenticated user can load clearly labelled synthetic records into the selected tenant. If no tenant exists, the action creates a tenant named "NUSA Demo Engineering (DATA CONTOH)" first. The button now displays progress and verifies the final counts of 5 projects, 10 employees, and 10 assets before reporting completion.

The sample batch contains 25 child records:
- 5 projects: DEMO-PRJ-01 through DEMO-PRJ-05
- 10 employees: DEMO-EMP-01 through DEMO-EMP-10
- 10 assets: DEMO-AST-01 through DEMO-AST-10

All records are labelled synthetic, use example.com emails, are related to projects/employees in the same tenant, and include the authenticated actor fields required by the existing audit model. The loader checks existing DEMO codes before insert so rerunning it can continue a partially completed batch without intentionally duplicating those codes. Data is written only after a user clicks the button and confirms the prompt; no production data is seeded automatically.

## Synthetic projects

| Code | Name | Budget (IDR) |
|---|---|---:|
| DEMO-PRJ-01 | Gedung Kantor NUSA | 12,500,000,000 |
| DEMO-PRJ-02 | Gudang dan Logistik | 7,800,000,000 |
| DEMO-PRJ-03 | Renovasi Fasilitas | 1,850,000,000 |
| DEMO-PRJ-04 | Infrastruktur Kawasan | 5,600,000,000 |
| DEMO-PRJ-05 | Workshop Engineering | 2,350,000,000 |

## Synthetic employees

| Code | Name | Role |
|---|---|---|
| DEMO-EMP-01 | Andi Pratama | Direktur Operasional |
| DEMO-EMP-02 | Siti Rahmawati | Project Manager |
| DEMO-EMP-03 | Bima Santoso | Site Engineer |
| DEMO-EMP-04 | Dewi Anggraini | Arsitek |
| DEMO-EMP-05 | Rizky Firmansyah | Structural Engineer |
| DEMO-EMP-06 | Nadia Putri | Quantity Surveyor |
| DEMO-EMP-07 | Fajar Hidayat | Procurement Officer |
| DEMO-EMP-08 | Intan Permata | HR & Administration |
| DEMO-EMP-09 | Bagus Wicaksono | HSE Officer |
| DEMO-EMP-10 | Maya Lestari | Document Controller |

## Synthetic assets

| Code | Name | Acquisition cost (IDR) |
|---|---|---:|
| DEMO-AST-01 | Laptop Engineering 01 | 18,500,000 |
| DEMO-AST-02 | Laptop Engineering 02 | 18,500,000 |
| DEMO-AST-03 | Workstation CAD | 32,500,000 |
| DEMO-AST-04 | Total Station | 68,000,000 |
| DEMO-AST-05 | Drone Survey | 42,000,000 |
| DEMO-AST-06 | Generator Portable | 27,500,000 |
| DEMO-AST-07 | Concrete Test Hammer | 9,500,000 |
| DEMO-AST-08 | Pickup Operasional | 285,000,000 |
| DEMO-AST-09 | Printer A3 | 16,500,000 |
| DEMO-AST-10 | Safety Kit Set | 7,500,000 |

These names, budgets, staff, costs, and assignments are illustrative only. Do not treat them as actual organization records, payroll inputs, audited asset valuations, or engineering evidence.
