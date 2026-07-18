---
id: 19
title: E2E — parent password login lands on dashboard with students
layer: integration
kind: verify
slice: full C-AUTH-LOGIN flow through the real UI
target: tests/e2e/parent-auth.spec.ts
contract: C-AUTH-LOGIN
status: TODO
depends_on: [07, 16]
---
## Objective
Playwright: visit /sign-in → fill parent@schooltest.local / Parent1234! → submit →
URL becomes /dashboard → Mia Keller + Jonas Keller visible in the students list
(catalog-driven assertions from messages). ALSO assert the network truth: the page made
POST /api/auth/local (route watcher) and the students response contains both students.
## Files
- tests/e2e/parent-auth.spec.ts (+ helpers/auth.ts with loginAsParent(page))
## Done criteria
- Spec green against the real stack (api :5500, web :3100 webServer); assertions read
  copy from en.json; no hardcoded waits (expect-based).
## Evidence
(filled by builder/verifier)
