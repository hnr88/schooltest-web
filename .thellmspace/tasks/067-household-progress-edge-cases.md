---
id: 067
title: Harden /api/my/progress edge cases — zero children, archived children, empty week, unknown enum
layer: backend
kind: fix
slice: GET /api/my/progress — every non-happy data path returns a truthful, contract-valid body
target: schooltest-api/src/api/student/services/parent-dashboard.ts · controllers/parent-dashboard.ts · schooltest-web/tests/e2e/household-progress-edges.spec.ts
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/06-auth-states-landing.md (empty states) · .qa/design/spec/02-portal-children.md#a7-true-empty-state
status: TODO
depends_on: [066]
---

## Objective

The dashboard is the first screen a new parent sees, and the seeded household is not
representative: most children have no results and no practice. Prove that every degenerate shape
this endpoint can produce is a valid, honest response rather than a 500, an omitted key, or a zero
standing in for "unknown".

## Contract

`.qa/CONTRACTS.md` → **C-DASH-HOUSEHOLD**. The behaviours this task pins:

Per **AMENDMENT A1** (`.qa/CONTRACTS.md`), there is no per-child `cefrBand`/`cefrStageIndex`/
`acaraPhase` to null out — those keys are DELETED (B-9). The degenerate shape for a child is
`skills[]` with all four entries `readiness: "not_assessed"`, never `skills: []`.

| Situation | Required response |
|---|---|
| Parent with **0 children** | `200`, `household` all zeros, `practiceByDay` still **7 entries** all `seconds: 0`, `strongestDay: null`, `children: []` |
| Child with no sessions and no results | child row present with `testsCompleted: 0`, `practiceSecondsThisWeek: 0`, `practiceDayStreak: 0`, `lastActivityAt: null`, `focusSkill: null`, `skills: [4 entries, all `readiness: "not_assessed"`, `cefrBand: null`, `resultDocumentId: null`]` |
| Week with zero practice | `practiceSecondsThisWeek: 0`, all 7 buckets `0`, `strongestDay: **null**` (never a 0-second "strongest" day) |
| `archived` / `enrolled` children | **included** in `children[]` with their real `status`; `childCount` counts them |
| `family_name` null (mononym) | `familyName: null`, never `""` — `M-CT-STUDENT-NAME` |
| `cefr_band` outside `CEFR_LADDER` | `500 ApplicationError` from the service guard, never a `-1` index on the wire |
| any query parameter | `400 ValidationError('household progress does not accept query parameters')` |
| non-parent role | `403 ForbiddenError('Only parents can view household progress')` |

## Design source

- `.qa/design/spec/02-portal-children.md` §A.7 "True empty state" — the design's own zero-children
  composition. The API contract for it is "zeros and empty arrays", never absent keys, so the UI
  can render §A.7 without null-guarding every field.
- `.qa/design/spec/01-portal-dashboard.md` §4.4: the chart is **always 7 columns**
  (`min-height:120px`, `gap:14px`). A short array would break the layout, which is why
  `practiceByDay` is `.length(7)` even for a parent with nothing.
- `.qa/design/spec/01-portal-dashboard.md` §10 row 5: the strongest-day caption is only meaningful
  when there IS a strongest day; `null` is what lets W5 hide the caption instead of printing
  "0 min".
- No colour/size work in this task — no UI ships.

## Files

- EDIT `schooltest-api/src/api/student/services/parent-dashboard.ts`
- EDIT `schooltest-api/src/api/student/controllers/parent-dashboard.ts` (only if the query/role
  guards need tightening)
- CREATE `schooltest-web/tests/e2e/household-progress-edges.spec.ts`

## Depends on

- **066** — the finished C-DASH-HOUSEHOLD shape this hardens.

## Steps

1. Re-read the service's short-circuit path from 062 and make sure the zero-children branch still
   emits the full stage-6 shape (7 zeroed buckets, `strongestDay: null`), not the stage-1 shape.
2. Confirm `strongestDay` uses `argmaxDay`'s "null when every value is 0" rule (061) and that no
   later edit reintroduced a `[0]` fallback.
3. Confirm the children filter has **no** `status` predicate — unlike
   `GET /api/my/students`, which defaults to `{ status: { $ne: 'archived' } }`
   (`src/utils/parent-student-read-actions.ts:76-80`). Add a code comment stating the divergence
   and why (the dashboard needs the household total; the UI filters on `status`).
4. Add the `CEFR_LADDER.indexOf(...) < 0` guard as a typed `ApplicationError` if 065 left it
   implicit.
5. Verify the controller rejects query params BEFORE `validateQuery`/`sanitizeQuery`, exactly as
   `controllers/parent-progress.ts:24-26` does, so `?foo=1` is a 400 and not a silently-stripped
   no-op.
6. `cd schooltest-api && pnpm tsc --noEmit && pnpm lint`.
7. Write the edge spec. Use `registerParent` + Mailpit confirmation from
   `tests/e2e/helpers/throwaway-parent.ts` to get a **genuinely childless parent** — do not mutate
   the seeded household. Clean up with `deleteAuthEmailRows` in `afterAll`, the existing convention.

## Project rules

- `schooltest-api/CLAUDE.md` §2 rule 21 (typed `@strapi/utils` errors — never a bare throw that
  leaks as a 500 with no body), rule 10 (sanitize), rule 23.
- `.claude/rules/controllers.md` — guard ordering on replaced actions.
- `schooltest-web/.claude/rules/testing.md` + `.qa/DECISIONS.md` **D-VERIFY-1** — proof is a real
  Playwright run against the running app.
- `.qa/DECISIONS.md` **D-AUTH-1** — accounts come only from the seed or the real register contract;
  never the Strapi admin UI.

## Done criteria

- `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/household-progress-edges.spec.ts` passes, covering every row
  of the table above with a real request:
  - a freshly registered, confirmed, childless parent → `200` with the exact zero-shape, including
    `practiceByDay.length === 7` and `strongestDay === null`;
  - the seeded parent's zero-activity child `ol10bd2bui8jf2mjzziol1iq` returns the full null/zero
    child row (assert every one of the 11 A1 child keys present — `documentId, givenName,
    familyName, yearLevel, status, testsCompleted, practiceSecondsThisWeek, practiceDayStreak,
    lastActivityAt, focusSkill, skills` — and that `skills` is 4 `not_assessed` entries, not `[]`);
  - `?page=1`, `?foo=1` and `?pagination[page]=1` each → `400` `ValidationError` with the exact
    message;
  - a **teacher** JWT (`teacher@schooltest.local`, password read from `schooltest-api/.env` via
    `apiEnv('SEED_TEACHER_PASSWORD')` — never hardcoded, `.qa/DECISIONS.md` D-AUTH-1) → `403`
    `ForbiddenError`. If the grant layer answers first, assert `403` and record which layer
    produced it;
  - an archived child is present in `children[]` with `status: 'archived'` and is counted in
    `childCount`. Create the state by calling the REAL `POST /api/students/:documentId/archive`
    endpoint on a throwaway parent's own child and unarchiving it afterwards — a real write that
    survives a reload, then reverted.
- `psql` confirms the archived child's row (`select status from students where document_id = …`)
  actually changed and changed back — the persistence proof for this task.
- No i18n change. No UI → motion / 375px / axe **n/a**.
- Baseline regression: full `pnpm exec playwright test` still 157 passed / 1 pre-existing fail.

## Assumptions

- The throwaway parent is created through `POST /api/auth/local/register` + the real Mailpit
  confirmation link, per `tests/e2e/helpers/throwaway-parent.ts`. Registration-dependent specs stay
  serial (D20 register race) — mark the file `test.describe.configure({ mode: 'serial' })`.
- If `SEED_TEACHER_PASSWORD` is absent from `schooltest-api/.env` the role-403 assertion falls back
  to the second seeded parent `parent-t06@schooltest.local` for the ownership half and the task is
  marked with the gap in Evidence rather than skipping the assertion silently.

## Evidence

<!-- filled in as the task runs -->
