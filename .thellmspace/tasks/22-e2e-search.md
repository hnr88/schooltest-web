---
id: 22
title: E2E — global search filters results
layer: integration
kind: verify
slice: C-STUDENT-SEARCH through the dashboard search bar
target: tests/e2e/dashboard-search.spec.ts
contract: C-STUDENT-SEARCH
status: TODO
depends_on: [18]
---
## Objective
Login as parent → type "mia" in the search field → results panel shows Mia only (not
Jonas) → click the result → students table filtered to Mia → clear → both students
back → type "zzz" → translated no-results row → Escape closes the panel. Route-watcher
asserts GET /api/search/students?q=mia fired.
## Done criteria
- Spec green; debounce respected (the watcher fires once for the settled value).
## Evidence
(filled by builder/verifier)
