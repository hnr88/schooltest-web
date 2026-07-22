---
id: 20
title: E2E — invalid credentials show the styled error
layer: integration
kind: verify
slice: bulletproof error model on the styled login page
target: tests/e2e/parent-auth.spec.ts (extend)
contract: C-AUTH-LOGIN
status: DONE
depends_on: [12]
---
## Objective
Same spec file: wrong password → stays on /sign-in, styled Alert error with the
translated invalid-credentials message (NO Strapi page, NO "Invalid identifier" English
leak — assert the translated key from messages); unknown email → SAME message
(enumeration-safe); empty submit → field-level zod messages (translated). ONE attempt
per case (never loop logins per zero-tolerance).
## Done criteria
- Both cases assert the translated error from de+en? — assert en catalog value; axe on
  the errored page still clean.
## Evidence
Independently verified 2026-07-18 (independent explore verifier). Real evidence gathered
against the live stack (web :3100, api :5500):

- **Backend contract (curl, live :5500):** wrong-password
  (`parent@schooltest.local`/`WrongPass123!`) and unknown-email
  (`no-such-parent-e2e@schooltest.local`) both return the byte-identical real 400
  `{"data":null,"error":{"status":400,"name":"ValidationError","message":"Invalid
  identifier or password","details":{}}}` — exactly CONTRACTS.md's C-AUTH-LOGIN 400 shape,
  no enumeration signal. Sanity re-check: correct creds still return real 200 `{jwt,user}`.
- **E2E (own run, not the builder's self-report):** extended
  `tests/e2e/parent-auth.spec.ts` — `pnpm exec playwright test tests/e2e/parent-auth.spec.ts
  --reporter=line` → 4 passed. `--repeat-each=3` → 12/12 passed, zero flakes.
- **Code-level confirmation:** `SignInForm.tsx`'s `classifyError` maps any axios 400 to the
  single `loginError` translation key regardless of response body — the tests prove this
  end-to-end: the real network response carries the raw Strapi string while the DOM's
  `[data-slot="alert"]` renders only the translated `Auth.loginError` value, with the raw
  string asserted absent from the page (`toHaveCount(0)`).
- **Empty submit:** asserted zero `POST /api/auth/local` requests fire (via
  `page.on('request')`), translated `Auth.emailRequired`/`Auth.passwordRequired` visible,
  `aria-invalid="true"` on both fields.
- **Zero-tolerance:** each login case makes exactly one submit click, no retry loops.
- **Accessibility:** axe scan on the wrong-password errored `/sign-in` page ran for real
  inside the test (not skipped) — zero serious/critical violations.
- **watchErrors:** deliberately omitted only on the two error-case tests, matching the
  pre-existing identical pattern in `sign-in.spec.ts`'s own wrong-password test (Chromium
  logs every non-2xx response as `console.error` regardless of app handling).
- **Static checks:** `pnpm tsc --noEmit` → 0 errors. `pnpm lint` → 0 errors (1
  pre-existing unrelated warning in untouched `CreateArticleForm.tsx`, same as tasks
  12-19). `pnpm exec prettier --check tests/e2e/parent-auth.spec.ts` → clean.
- **Regression:** full suite `pnpm exec playwright test --reporter=line` → 58 passed, zero
  regressions.
- **Fixture grep:** `grep -ni "mock|fake|stub|dummy|placeholder|hardcoded"
  tests/e2e/parent-auth.spec.ts` → only a benign negative comment ("no hardcoded copy").
- **Writes:** none in this task (failed/blocked logins only) — no DB-persistence check
  applies.

Full evidence recorded in `.qa/STATE.json` task 20's `verify` object.
