# B04 — repair the three stale regression specs wave 1 uncovered

Scope: `tests/e2e/zz-redesign-school-admin.spec.ts` (defects 1–2, fixed) and
`tests/e2e/class-detail.spec.ts` (defect 3, diagnosed — fix belongs to J05/J06).

Verified with the plain Playwright CLI because the managed `tests.run` runner is
broken project-wide ("did not produce a readable JSON report") — that is row B02,
not this task. All runs:

```
pnpm --dir schooltest-web exec playwright test <file> --project=chromium --workers=1
```

against the already-running web dev server (:3002) and Strapi (:5500). Several runs
during the day were masked by the shared per-IP 429 login budget (workers running
concurrently); the outputs pasted below are from clean solo runs.

---

## Defect 1 — "Account: tabs…" asserted a tab the app no longer ships

### Reproduced failure (before any edit)

```
[7/11] [chromium] › tests/e2e/zz-redesign-school-admin.spec.ts:230:7 › … › Account: tabs, plan and seats, and the 2x2 allowance grid from the live API
    Error: Missing catalog key: SchoolAdmin.account.tabs.account
    > 57 |     throw new Error(`Missing catalog key: ${fullKey}`);
  2 failed, 9 passed
```

### Which side was wrong: the SPEC

- `src/modules/school-admin/constants/account.constants.ts` ships tabs
  `details`, `plan`, `settings`, `signout` — no `account` tab.
- The design authority `mvp/school-admin/designs/School Admin Portal.dc.html`
  draws exactly four panels: `acctDetails`, `acctPlan`, `acctSettings`,
  `acctSignOut` — the same set.
- Both agree, so the spec's i18n key `SchoolAdmin.account.tabs.account` was stale.
  `account.constants.ts` was NOT changed (explicitly out of scope and correct).

### Fix (spec only)

- Tab loop now iterates `['details', 'plan', 'settings', 'signout'] as const`.
- Added a click on the `plan` tab before asserting the `account-plan-card`,
  matching how the app actually reveals that panel.

## Defect 2 — "05: the shared confirm…" depended on roster page-one ordering

### Root cause (ordering, not a confirm-dialog bug)

The demo school holds ~134 archived students. The Students roster's default
ordering lets those archived rows dominate page one, so the old spec — which
picked whatever row landed on page one — found only archived rows and could not
open the destructive confirm on a non-archived student. Verified the roster is
URL-backed (`use-searchParams` in `use-directory-state.ts`) and that
`schooltest-api/src/api/school/controllers/students.ts` serves a `status` filter
and a `$containsi` `q` on given/family name — so a deterministic target is
available without touching shared data.

### Fix (spec only, deterministic)

After `signIn`, the spec now picks its target via the API
(`apiJson('/api/schools/me/children?status=active&pageSize=1')`), asserts a target
exists, and navigates to `/en/dashboard/school/students?q=<name>` so the exact
active student is on screen. All downstream confirm-dialog assertions are
unchanged. No students were deleted or unarchived.

### Passing run after both fixes (full spec, solo)

```
[11/11] [chromium] › tests/e2e/zz-redesign-school-admin.spec.ts:364:7 › … › 05: the shared confirm renders destructive on a live row and refuses backdrop dismissal
  11 passed (58.8s)
```

## Defect 3 — class-detail.spec.ts "flow 4": seed/data gap, diagnosed, NOT fixed here

### Reproduced failure (clean solo run, no 429)

```
  1 failed
    [chromium] › tests/e2e/class-detail.spec.ts:90:7 › class detail (spec §1) › flow 4: the roster table renders every student, in the API order, with real results
    Error: no student with a scored Test A — the fixture seed must run first
    > 110 |     expect(done, 'no student with a scored Test A — the fixture seed must run first').toBeTruthy();
  2 did not run
  3 passed (25.9s)
```

### Diagnosis

- Live check as the seeded school admin: `GET /api/schools/me/classes/hr2i9jmhfs6uf4mxcajj923m`
  (journey class "Reading 8A — Okonkwo") returns 20 students, every one with
  Test A `not_started`, `score: null` — no scored Test A exists.
- DB confirms it: `results` by status = complete 383 / scoring_failed 14 /
  scoring 4, but ZERO results linked to any `a1s%` (Reading 8A) student. The
  complete results that do exist belong to `a2s%` students (Reading 8B —
  Alvarez) and are ephemeral leftovers from concurrent J05/J06 runtime journeys,
  not a stable seed.
- No seed writer produces one. `schooltest-api/src/bootstrap/seed.ts` runs only
  the writers in `seed-writers.registry.ts` (users/roles, config, crosswalks,
  rubrics, items, Test A config, anchors, forms, schools, agents, entitlements,
  classes, messages, journey fixture) — none write sittings/sessions/responses/
  results. `seed-journey-fixture.ts:65-66` explicitly states the state catalogue
  (which includes a `status-complete` descriptor for studentIndex 6) "does not
  execute a second writer or mutate the shared proof database" — the descriptors
  are metadata only.
- The only producer of a scored result is the runtime API journey
  `schooltest-api/tests/e2e/mission-journey-student-sitting.spec.ts` (J05's),
  and it deletes its sitting in `test.afterAll`, so nothing persists.
- The web helper `tests/e2e/helpers/class-detail.ts:24-28` already documents the
  intent ("The deterministic journey class with completed A/B evidence") — the
  writer was never implemented.

### What is missing (for J05/J06)

A seed writer that produces, for a "Reading 8A — Okonkwo" student, an **ended
slot-A sitting** (session status complete/terminated) plus a **complete official
reading Result** (overall_score, acara_phase, subskills). The natural home is
implementing the existing `status-complete` descriptor (studentIndex 6, a1s07)
in `seed-journey-fixture.ts` or a companion writer registered in
`seed-writers.registry.ts`. The API read side
(`src/api/class/lib/class-detail-build.ts`) already renders status/evidence once
those rows exist — verified by reading it.

Per the task brief, fixing this requires new code in `schooltest-api/src` (J06)
or driving sittings/scoring (J05) — both out of scope for B04 — so
`class-detail.spec.ts` and `tests/e2e/helpers/class-detail.ts` are intentionally
UNCHANGED and this defect is reported rather than repaired.

---

## Gates

```
$ pnpm --dir schooltest-web typecheck
$ tsc --noEmit          # clean, no output

$ pnpm --dir schooltest-web lint
✖ 3 problems (0 errors, 3 warnings)   # all pre-existing react-hooks/incompatible-library
check-no-posteriors: clean (7 of 7 known legacy entries still present)
```
