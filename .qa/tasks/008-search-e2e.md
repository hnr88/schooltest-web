---
id: 008
title: Search e2e — results, compact cards, images, agent search
layer: integration
kind: build
slice: e2e proof for school + agent search
target: schooltest-web/tests/e2e
contract: C-SEARCH-SCHOOLS, C-SEARCH-AGENTS
status: DOING
depends_on: [006, 007]
---
## Objective
Prove the mission spec flows against the real stack and reconcile existing specs with the
compact layout + map-default-closed change.
## Spec flows (mission-mandated)
- Search for a school and verify results appear with compact cards after image upload to Strapi.
- Search for an agent and verify functional search results are returned correctly.
## Files
- tests/e2e/unified-search.spec.ts, unified-search-states.spec.ts (already cover 312/q/reset — keep green)
- tests/e2e/school-search-presentation.spec.ts (cover <img> assertions now pass for many schools, not just Abbotsleigh)
- tests/e2e/school-map.spec.ts (map now default-closed — update expectations)
- tests/e2e/agent-search-polish.spec.ts
## Done criteria
- All search specs pass with E2E_PORT=3110 against api :5510; a school q-search shows cards
  with real cover images; agent search lists the 8 verified agents and filters work.
