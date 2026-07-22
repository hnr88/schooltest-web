---
id: 21
title: E2E — parent adds a student; persists after reload
layer: integration
kind: verify
slice: C-STUDENT-CREATE through the dialog with DB-truth reload
target: tests/e2e/dashboard-students.spec.ts
contract: C-STUDENT-CREATE
status: DONE
depends_on: [17]
---
## Objective
Login as parent → open Add student → fill (unique email per run:
e2e+<timestamp>@schooltest.local, year 9) → submit → row appears in the list without
manual reload → HARD reload the page → row still there (persistence proof) → ALSO
prove via a direct api GET /api/students with the parent JWT (fetch inside the test
with the stored token? — read localStorage app.auth.token from the page and call the
api directly: the row exists with parent=<the parent user>).
Validation: a second student with year_level 5 is blocked by the form (no request
fired).
## Done criteria
- Spec green; the api-direct assertion proves parent ownership on the row.
## Evidence
DONE — independently verified 2026-07-18 by an explore verifier (not the builder's
self-report). tests/e2e/dashboard-students.spec.ts (2 tests) run live: 2/2 passed.
Test 1: fresh throwaway parent (never seeded parent@schooltest.local) → real
AddStudentDialog create (given/family name, year 9, unique email) → row appears with
zero manual reload (query invalidation) → real hard `page.reload({waitUntil:'load'})` →
row still visible → reads the real JWT from `localStorage['app.auth.token']` on the
reloaded page and calls `GET /api/my/students` directly via `page.request`, bypassing
TanStack Query/React → asserts exactly one row matching what was submitted → negative
ownership check: a second unrelated parent's own token does NOT see the first parent's
row. Test 2: a second student with year_level 5 cannot even be selected in the form
(option count 0), submitting with no year level selected renders the field error, dialog
stays open, and zero `POST /api/students` requests fire; confirmed via UI and a direct
`/api/my/students` call that the list still holds exactly one row.

Documented deviation (present in the spec file's own header comment): the task text says
"prove via a direct api GET /api/students," but live-curled against the real api with
the seeded parent JWT, `GET /api/students` and `GET /api/students/:id` both 403
(PolicyError, IS_TEACHER policy per CONTRACTS.md D16) for the parent role — independently
reproduced this myself with my own curl, confirming the deviation is real, not
fabricated. The test correctly uses `GET /api/my/students` (C-STUDENT-LIST), which forces
`filters[parent][documentId][$eq]=<caller>` server-side and is itself the ownership proof
the task asks for.

Independent evidence gathered personally:
- DB-truth: psql against the live Postgres (127.0.0.1:5540/schooltest) confirms the
  created rows genuinely persisted (student ids 872 "Nora Reload"/9/email, 873 "First
  Student"/9) and `students_parent_lnk` ties each to its OWN distinct throwaway parent —
  real per-caller ownership, not incidental.
- Backend contract conformance via curl (fresh throwaway parent, not the seeded one):
  C-STUDENT-CREATE 200 `{data:Student}` with a smuggled `parent` override silently
  stripped and the caller's own parent injected instead; all three documented 400 paths
  (year_level=5, missing given_name, invalid email) byte-match CONTRACTS.md's
  `{error:{status:400,name:"ValidationError",details:{fields,issues}}}` envelope;
  unauthenticated POST → 403 masked-forbidden (pre-existing D15/D16 install quirk,
  non-blocking). Curl-created student cleaned up via direct Postgres delete (parent role
  has no DELETE grant, 403 confirmed); re-confirmed via `GET /api/my/students` that the
  seeded parent@schooltest.local fixture is still exactly Mia(8)+Jonas(10), zero
  pollution.
- `pnpm tsc --noEmit` → clean. `pnpm lint` → 0 errors, 1 pre-existing unrelated
  CreateArticleForm.tsx warning. `pnpm exec prettier --check` → clean.
  `grep -rniE "mock|fake|stub|dummy|placeholder|hardcoded"` on the new file → zero hits.
- Full suite re-run live 6x: 5/6 fully green (60/60); the 1 flake was isolated to
  `design-system.spec.ts:158`'s pre-existing popover/dialog overlay-close race, already
  independently logged in tasks 12/13/14/18/19's own verify evidence — unrelated to this
  task's file, which was green in every one of the 6 full-suite runs plus 2 standalone
  runs of just this spec.
- Axe: task 21 adds no new UI, so re-ran the existing `add-student-dialog.spec.ts` axe
  assertion (task 17's UI, reused here) 3x live (`--repeat-each=3`) → 12/12 green. A
  color-contrast violation surfaced once from my own ad-hoc verification script was
  root-caused to a self-inflicted measurement artifact (an extra pre-dialog full-page axe
  scan in that script, not present in the official test or the app) and ruled out as a
  real regression.

Full evidence recorded in `.qa/STATE.json` task 21's `verify` object and mirrored in
`.qa/STATE.md`.
