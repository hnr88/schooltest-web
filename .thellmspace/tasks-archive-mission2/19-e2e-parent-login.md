---
id: 19
title: E2E — parent password login lands on dashboard with students
layer: integration
kind: verify
slice: full C-AUTH-LOGIN flow through the real UI
target: tests/e2e/parent-auth.spec.ts
contract: C-AUTH-LOGIN
status: DONE
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
Independently verified 2026-07-18 (independent explore verifier — did not build this).
- curl POST /api/auth/local with parent@schooltest.local/Parent1234! → real 200
  {jwt:"eyJ...", user:{email:"parent@schooltest.local",...}} (no `role` on `user` —
  pre-existing D19 CONTRACTS.md deviation, non-blocking, nothing here reads role).
- curl GET /api/my/students with that jwt → real 200 {data:[Jonas Keller(10),
  Mia Keller(8)], meta:{pagination}}, both present.
- Own run of tests/e2e/parent-auth.spec.ts against the live web:3100/api:5500 stack
  (not the builder's self-report): 1/1 passed; `--repeat-each=5` → 5/5 passed, zero
  flakes.
- Confirmed loginAsParent() drives the real /sign-in DOM via catalog keys that exist
  and match the rendered form (Auth.emailLabel/passwordLabel/signInButton), waits for
  a real `**/dashboard` navigation (no hardcoded sleeps), and the spec asserts network
  truth via `page.waitForResponse` on the real POST /api/auth/local (jwt matches
  `/^eyJ/`, user.email matches) and GET /api/my/students (body contains "Mia Keller"
  and "Jonas Keller"), plus UI truth (Dashboard.title heading + both rows visible) and
  a real JWT in localStorage under the app's actual `app.auth.token` key
  (src/lib/axios/strapi.ts's AUTH_TOKEN_KEY, not fabricated), zero console/page errors.
- `pnpm tsc --noEmit`: 0 errors. `pnpm lint`: 0 errors (1 pre-existing unrelated
  React-Compiler warning in untouched CreateArticleForm.tsx). `pnpm exec prettier
  --check` on both new files: clean.
- Full suite re-run twice: first run 54/55 (1 failure in design-system.spec.ts:158,
  "DS interactions...toBeHidden" strict-mode overlay race); re-ran that file alone
  twice more — failed once, passed once, then passed again — confirming a genuine
  pre-existing intermittent flake, already independently documented in tasks
  12/13/14/18's own STATE.json verify evidence, unrelated to either file this task
  touches (parent-auth.spec.ts, helpers/auth.ts — both new, zero edits to
  design-system.spec.ts or any DS component).
- Grepped both new files for mock/fake/stub/dummy/placeholder/hardcoded: zero fixture
  hits (only match is the honest negative comment "no hardcoded copy").
- No new write path in this task (login + list-read only), so no DB-persistence-
  across-reload check applies.
- Full evidence recorded in .qa/STATE.json task 19's `verify` object.
