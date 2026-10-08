import fs from "node:fs";
import assert from "node:assert/strict";
const required=["app/page.tsx","app/globals.css","lib/supabase.ts","lib/knowledge.ts","lib/intelligence.ts","lib/ingestion.ts","supabase/migrations/0001_nusa_core.sql","supabase/migrations/0004_nusa_knowledge_intelligence.sql","supabase/migrations/0005_nusa_knowledge_graph.sql","supabase/migrations/0006_nusa_ingestion.sql","supabase/migrations/0007_nusa_engineering_governance.sql"];
for(const p of required) assert.equal(fs.existsSync(p),true,"missing "+p);
const page=fs.readFileSync("app/page.tsx","utf8"), css=fs.readFileSync("app/globals.css","utf8"), sql=fs.readFileSync("supabase/migrations/0007_nusa_engineering_governance.sql","utf8");
assert.match(page,/NUSA Intelligence Studio/); assert.match(page,/ASK NUSA/); assert.match(css,/prefers-reduced-motion/); assert.match(sql,/nusa_engineering_runs/); assert.match(sql,/nusa_approvals/); assert.match(sql,/for update to authenticated/);
console.log("NUSA smoke checks: PASS");
