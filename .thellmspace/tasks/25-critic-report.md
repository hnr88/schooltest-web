---
id: 25
title: Final regression — critic loop ×2 clean + REPORT.md
layer: regression
kind: verify
slice: whole-mission adversarial review + report
target: .qa/REPORT.md
contract: all
status: DONE
depends_on: [24]
---
## Objective
1. Fresh full gates: tsc+lint zero (all 3 packages touched), full Playwright suites
   green (web suite incl. M1 specs + the live magic-link spec).
2. Banned-pattern grep over all touched code (mock|fake|stub|dummy|TODO|FIXME|lorem) —
   ZERO in shipped paths (test helpers exempt if real, e.g. Mailhog client).
3. Fresh CRITIC pass over the whole delivered surface (contracts vs real responses,
   enumeration-safety, ownership leaks, enumeration of error paths, i18n parity, no
   hardcoded copy) + a second consecutive clean pass required by the gate.
4. Write .qa/REPORT.md: delivered per feature with DB proofs (console outputs, Mailhog
   evidence, e2e tails), endpoints/models/pages created, the Google BLOCKED item with
   its precise unblock step, seeds (D9), security findings (enumeration-safe request
   endpoint, hashed single-use tokens, parent ownership enforcement, rate limits).
5. Reconcile STATE.json/STATE.md; stop the watchdog.
## Done criteria
- Two consecutive clean critic passes + clean greps; report written; board closed.
## Evidence
Independently verified 2026-07-18 against the live stack — fresh evidence gathered
personally, not reused from the builder's self-report.

- `.qa/REPORT.md` exists (322 lines) and `.qa/STATE.md` was genuinely resynced,
  matching the self-report exactly.
- Re-curled every CONTRACTS.md endpoint against live :5500: login success/
  enumeration-safe-failure (byte-identical 400 for wrong-password vs unknown-email),
  `/users/me` role:{type:"parent"}, `/my/students` exactly Mia(8)+Jonas(10),
  `/search/students` q=mia/empty/zzz exact contracted shapes, create 400-validation
  paths byte-matching CONTRACTS.md's `{error:{details:{fields,issues}}}` envelope.
- Ran a fresh ownership-override probe myself (`POST /api/students` with a spoofed
  `parent` documentId): server silently stripped it and injected the caller's own
  documentId; confirmed the created row (id 948) genuinely PERSISTED in Postgres via
  `docker exec psql`; confirmed parent-role DELETE is 403; cleaned up via direct psql
  delete; re-confirmed the seeded parent's list back to exactly Mia+Jonas.
- Ran the full magic-link round trip myself end-to-end: request → real Mailpit
  delivery (fetched via `/api/v1/search` + `/api/v1/message`) → extracted the raw
  64-hex token → computed sha256 locally and matched the `student_magic_links.token`
  DB column exactly → verify (200, exp-iat 28800s) → `/auth/student/me` (200) →
  token reuse (401 reason:"used"); unknown-email request also 200 `{ok:true}`
  (enumeration-safe); malformed token 400.
- Read `src/api/student/controllers/student.ts` directly and confirmed the ownership
  filter/injection genuinely happens AFTER `sanitizeQuery`/`sanitizeInput`.
- CORS preflight: `:3100`/`:3003` both echo `Access-Control-Allow-Origin`; an
  arbitrary unlisted origin gets no CORS header (no wildcard leak).
- `pnpm tsc --noEmit`: 0 errors in schooltest-web, schooltest-api, and
  schooltest-app (root + `tests/e2e-live/tsconfig.json`), run myself.
- `pnpm lint`: schooltest-web 0 errors (1 pre-existing unrelated warning);
  schooltest-api 0 errors/0 warnings; schooltest-app `tests/e2e-live/` scoped 0/0,
  full-repo lint shows the same 4 pre-existing errors confirmed untouched via git
  status (no diff in those files).
- Grepped every touched file in both repos myself
  (mock|fake|stub|dummy|placeholder|TODO|FIXME|lorem|hardcod, case-insensitive):
  zero fixture/mock hits — only HTML `placeholder=` props, TanStack's
  `placeholderData`, the real `isPlaceholder()` env-secret check, i18n key names,
  and honest negative comments.
- i18n parity recomputed with my own script: 360 keys × 6 locales
  (en/ko/ms/th/vi/zh), zero missing/extra.
- Full Playwright suite (schooltest-web) run 3× by me: 2 of 3 runs 71 passed/
  1 skipped/0 failed, exactly matching the report; the 1 flake reproduced was
  `design-system.spec.ts:158`'s pre-existing overlay-close timing race, already
  independently documented as non-blocking/unrelated in tasks 12/13/14/18/19/21/24's
  own verify evidence — never touched by any auth/dashboard/task-25 file.
- `schooltest-app/tests/e2e-live/magic-link.spec.ts`: my first attempt hit a 429
  that I root-caused to MY OWN prior curl testing having exhausted the shared
  5-requests/60min rate-limit budget on `mia.keller@schooltest.local` (confirmed via
  psql: exactly 5 rows in the trailing window); polled the DB read-only (never
  re-triggering the endpoint) until a slot aged out, then re-ran the spec once
  cleanly → 1 passed (2.0m), `:3003` torn down cleanly afterward — a self-inflicted
  test-fixture collision, not a real defect.
- Prettier confirms both flagged cosmetic-drift files
  (`tests/e2e/sign-in.spec.ts`, `src/extensions/users-permissions/strapi-server.ts`)
  really do carry formatting warnings while `pnpm lint` stays 0 errors for both,
  exactly as claimed — correctly left unfixed (out of scope for a verify-only task).
- git status confirmed zero source pollution from this verification pass
  (schooltest-api clean; schooltest-web's uncommitted set unchanged before/after,
  55 porcelain lines both times); the seeded parent's list was re-checked exactly
  Mia+Jonas at the end.

**Verdict: PASS.** Full evidence in `.qa/STATE.json` task 25's `verify` object.
