---
id: 23
title: E2E — student magic link: request in the app → Mailhog → verify → /home
layer: integration
kind: verify
slice: the full passwordless flow across schooltest-app + api + Mailhog
target: schooltest-app/tests/e2e/magic-link-live.spec.ts (new, playwright there) or a node-driven spec here — DECIDE: put it in schooltest-app/tests/e2e-live/ with its own playwright config pointed at the renderer on :3002
contract: C-ML-REQUEST, C-ML-VERIFY, C-ML-ME
status: DONE
depends_on: [05, 07]
---
## Objective
REAL end-to-end for the desktop flow (browser-level renderer, per the mission note):
1. Start the schooltest-app renderer: `pnpm dev:next` in schooltest-app on port 3002
   (NEXT_PUBLIC_API_URL=http://localhost:5500 in its .env.local; DEV_AUTH unset).
2. Drive: open http://localhost:3002/en/ → the login screen renders → enter
   mia.keller@schooltest.local → submit → "email sent" state renders (translated copy
   from the app's messages).
3. Poll Mailhog API (:8025) for the newest message to mia.keller@schooltest.local →
   extract the `http://localhost:3002/en/auth/student/verify?token=<hex>` link from the
   HTML body → page.goto it → the verify page consumes C-ML-VERIFY → lands on /home
   (authenticated content visible per the app's own copy).
4. Assert /api/auth/student/me returns 200 with the session (call from the page context
   or via the JWT in localStorage schooltest-auth).
ONE email consumed per run (never re-request the same token path twice per
zero-tolerance UI-loop rule; a fresh token is minted per run anyway).
## Files
- schooltest-app/tests/e2e-live/magic-link.spec.ts + playwright.live.config.ts
  (webServer: `pnpm dev:next` port 3002) + support/mailhog.ts helper
## Done criteria
- Spec green against the real api; the Mailhog message is real; the verify landing is
  the app's real page; tsc zero in schooltest-app.
## Evidence
Independently verified 2026-07-18 (not the builder's self-report — personally re-ran
everything against the live stack).

- **Live spec re-run by verifier**: `pnpm exec playwright test
  --config=tests/e2e-live/playwright.live.config.ts` in schooltest-app → `1 passed
  (32.5s)`, against the real `:5500` api, this mission's real dockerized Mailpit
  (`127.0.0.1:8125/api/v1`), and real Postgres.
- **Real persistence confirmed**: fresh `student_magic_links` row (id 25, `used=true`,
  `created_at` 22:44:01) via direct `psql`; `schooltest-web/.qa/api.log` shows the
  matching real `POST /api/auth/student/magic-link/request` 200 → `GET
  .../verify?token=...` 200 → `GET /api/auth/student/me` 200 (×2) sequence at
  22:44:01–06; Mailpit's own search for `mia.keller@schooltest.local` moved 9→10
  messages across the run.
- **D21's two environmental findings independently reproduced**: port 3002 confirmed
  held by an unrelated neighbor process (`/proc/<pid>/cwd` → `RCS/park-rcs`), left
  untouched; CORS preflight (`curl -X OPTIONS ... -H "Origin: http://localhost:3003"`)
  now echoes `Access-Control-Allow-Origin: http://localhost:3003`, `:3100` still works
  too; api process start time matches the claimed restart; `schooltest-api/.env`'s
  `FRONTEND_ORIGIN` change confirmed gitignored/untracked (`git status` clean).
- **UI/copy not fabricated**: all strings the spec asserts on ("Sign in to SchoolTest",
  "Check your inbox", "You're signed in", "What would you like to work on today?", "Hi
  {firstName}!") are real, pre-existing keys in `src/i18n/messages/en.json`; the verify
  and home pages are real pre-existing route files.
- **Static checks**: `pnpm exec tsc -p tests/e2e-live/tsconfig.json --noEmit` → 0;
  root `pnpm tsc --noEmit` → 0; `pnpm exec eslint tests/e2e-live/**/*.ts` → 0; full
  `pnpm lint` → same 4 errors/5 warnings, all pre-existing and outside
  `tests/e2e-live/` (line-for-line confirmed pre-existing).
- **No fixtures**: `grep -rniE "mock|fake|stub|dummy|placeholder|hardcod"
  tests/e2e-live/` returns only a descriptive comment ("no mocks anywhere"), zero
  fixture code.
- **Backend contract not regressed by the CORS/env change** (spot-checked against
  CONTRACTS.md C-ML-REQUEST/VERIFY/ME): unknown-email request → `200 {ok:true}`
  (enumeration-safe); malformed token → `400 {error:{status:400,message:"Invalid
  sign-in link"}}`; reused token (this run's now-used token) → `401
  {error:{status:401,message,reason:"used"}}`; unauthenticated `/api/auth/student/me`
  → `401`. All exact matches.
- `:3100` and `:5500` both healthy after the run; port 3003 torn down cleanly by
  Playwright's `webServer`.
- Axe scan not run: not a Done Criterion for this task and no new UI was shipped
  (pure integration e2e against pages already axe-covered by their own owning tasks).

Full machine-readable evidence recorded in `.qa/STATE.json` task 23's `verify` object.
