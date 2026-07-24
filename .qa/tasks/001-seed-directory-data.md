---
id: 001
title: Seed 312 schools + 8 agents into st-portal DB (fixes "search no results")
layer: data
kind: fix
slice: school/agent search returns real results again
target: schooltest-api bootstrap seeders (seed-schools, seed-agents)
contract: C-SEARCH-SCHOOLS, C-SEARCH-AGENTS
status: DONE
depends_on: []
---
## Objective
Root cause of "the search got fucked up, there are no results": the st-portal postgres
(127.0.0.1:5550) held 0 schools / 0 agents while code+contract were intact. Re-seed the
directory corpus through the real persistence layer.
## Steps
- Run ONLY seedSchools + seedAgents via `strapi console` (dist imports) with PORT override;
  never SEED=true (config-v3 blueprint gap, OP-35).
## Done criteria
- POST /api/search/schools {page:1,pageSize:1} -> total 312; /api/search/agents -> 8;
  q="Paterson" -> exactly A B Paterson College.
## Evidence
Seeded 2026-07-24 15:03 EEST: `[seed-schools] Done — 312 schools seeded`,
`[seed-agents] created 8 / reused 0`, `SEED_OK`. Live API: schools total=312 (first "A B
Paterson College"), agents total=8, q=Paterson -> 1 result. Verified by Agent G.
