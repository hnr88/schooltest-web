---
id: 02
title: Student schema — +email +parent fields, types regenerated
layer: data
kind: build
slice: additive student schema fields + pnpm strapi ts:generate-types
target: schooltest-api/src/api/student/content-types/student/schema.json, types/generated/
contract: schema (CONTRACTS.md "Schema changes")
status: DONE
depends_on: []
---
## Objective
Add to the student content-type (additive, no existing field touched):
`"email": { "type": "string", "required": false }` and
`"parent": { "type": "relation", "relation": "manyToOne", "target": "plugin::users-permissions.user", "inversedBy": "students" }`.
Then regenerate types (`pnpm strapi ts:generate-types` — run against the RUNNING api or
via the CLI; it writes types/generated/*) and confirm the api restarts healthy (schema
change triggers a dev restart; Postgres gets the two new columns — verify with a psql
describe or a document create in a later task).
## Files
- the schema.json above; schooltest-api/types/generated/contentTypes.d.ts (regenerated)
## Steps
1. Edit schema.json (fields block alphabetical order per existing style). 2. Regenerate
   types. 3. Api healthy (auto-restarts; check /api/health). 4. `pnpm tsc --noEmit` zero.
## Done criteria
- Generated types contain `email` + `parent` on the student content-type; api healthy;
  no data loss (existing students intact — count rows before/after via strapi console).
## Evidence
PASS (independent verifier, 2026-07-18): student schema has email + parent (inversedBy students); users-permissions extension carries ALL 9 stock attributes + students inverse (diffed vs stock); types regenerated; DB: email column + students_parent_lnk join; 35 students intact before/after; 6 seed users confirmed+blocked=false+passwords+role links; teacher login → JWT → GET /api/students 200; current boot clean (crash loop predates it); tsc 0, lint 0 errors. Incident: 12 QA-fixture users emptied (D12, no suite references).
(filled by builder/verifier)
