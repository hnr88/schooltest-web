---
id: "103"
title: Make the three student mutations invalidate the new household and result-history caches
layer: data
kind: wire
slice: Cache coherence — adding, editing or archiving a child updates the dashboard aggregate instead of leaving a stale number on screen
target: src/modules/student-wizard/queries/use-create-student-full.mutation.ts · src/modules/children/queries/use-update-student.mutation.ts · src/modules/children/queries/use-archive-student.mutation.ts · tests/e2e/w3-cache-invalidation.spec.ts
contract: C-DASH-HOUSEHOLD · C-STUDENT-CREATE · C-CHILD-RESULT-HISTORY
design: .qa/design/spec/01-portal-dashboard.md#4.1 Metric 1 — Tests completed · .qa/design/spec/02-portal-children.md#A.5 Component: ChildCard
status: TODO
depends_on: ["095", "098"]
---

## Objective

Three mutations today invalidate exactly `['dashboard','students']`
(`use-create-student-full.mutation.ts:29`, `use-update-student.mutation.ts:29`,
`use-archive-student.mutation.ts:22`). Once the dashboard reads a household aggregate, that is no
longer sufficient: `household.childCount` and the per-child rows come from a DIFFERENT key and would
keep showing the pre-mutation value until a hard reload. Wire the new keys in, without changing what
the mutations already do.

## Contract

- `.qa/CONTRACTS.md` **C-DASH-HOUSEHOLD** — `household.childCount` is "active + enrolled children of
  this parent" and `children[]` is the per-child row set. Both change when a child is created,
  edited (status/name/year level) or archived. The endpoint is read-only, so the ONLY way the client
  learns about the change is an invalidation.
- **C-STUDENT-CREATE** (`POST /api/students`) — the controller sets `parent=<caller>` server-side and
  returns `{ data: Student }`; the new child immediately belongs to the household aggregate.
- The existing archive/unarchive operations (`POST /api/students/:documentId/archive` /
  `/unarchive`) move a child between `active` and `archived`, which is exactly the `status` field
  C-DASH-HOUSEHOLD projects.
- `.claude/rules/state-data.md` — "**Always invalidate or `setQueryData` after successful mutation.**"
  This task is that rule applied to the new keys.

Nothing about the mutations' request, response, error handling or existing invalidations changes.
This is additive only (`.qa/DECISIONS.md` **D-SCOPE-3**: functional wiring is preserved, never discarded).

## Design source

`.qa/design/spec/01-portal-dashboard.md` §4.1 — the hero's `tests completed` cell
(`24px/700/-0.02em/#FFFFFF` value over a `12px/400/#8FA3C7` label) and
`.qa/design/spec/02-portal-children.md` §A.5 — the ChildCard MetricStrip
(values `20px/700/-0.01em/#0E2350`, labels `12px/#7C8698`). Both are read straight from the
household payload. A parent who adds a child and sees the old `childCount` in the same session is
looking at a wrong number in the design's most prominent slot — which is what this task prevents.
No markup is produced here.

## Files

Touch:
- `src/modules/student-wizard/queries/use-create-student-full.mutation.ts`
- `src/modules/children/queries/use-update-student.mutation.ts`
- `src/modules/children/queries/use-archive-student.mutation.ts`

Create:
- `tests/e2e/w3-cache-invalidation.spec.ts`

Do NOT create a new "registry" module or a central invalidation helper — three call sites do not
justify an abstraction, and `CLAUDE.md` law 1 (zero extras) applies.

## Depends on

- **095** — `HOUSEHOLD_PROGRESS_QUERY_KEY`.
- **098** — `CHILD_RESULTS_QUERY_KEY_ROOT` / `childResultHistoryQueryKey`.

## Steps

1. In each of the three mutation files, keep the existing
   `queryClient.invalidateQueries({ queryKey: ['dashboard', 'students'] })` call exactly as it is, and
   add alongside it `queryClient.invalidateQueries({ queryKey: HOUSEHOLD_PROGRESS_QUERY_KEY })`.
   Import the key from the dashboard barrel (`@/modules/dashboard`) in `student-wizard` and
   `children` — cross-module imports go through the barrel only
   (`.claude/rules/module-pattern.md`).
2. In `use-update-student.mutation.ts` and `use-archive-student.mutation.ts` also invalidate that
   child's result history prefix:
   `queryClient.invalidateQueries({ queryKey: [...CHILD_RESULTS_QUERY_KEY_ROOT, documentId] })`.
   Prefix invalidation (not the fully-parameterised key) is required so every loaded page and every
   skill filter for that child is refreshed together. **Do not** invalidate the whole
   `['children']` prefix — that would needlessly refetch `['children','progress',otherChildId]` for
   siblings whose data did not change.
   `use-create-student-full.mutation.ts` does NOT touch result history (a brand-new child has none),
   so it invalidates only students + household.
3. No `setQueryData` anywhere here: the mutations' responses do not carry a household aggregate, so
   writing one into the cache would be fabricating a value. Invalidate and refetch.
4. TDD, `tests/e2e/w3-cache-invalidation.spec.ts`, driving the REAL running app:
   - log in as the seeded parent, land on `/dashboard`, and record the rendered child count /
     `GET /api/my/progress` response for the session;
   - add a child through the real add-child flow that exists today (the same path
     `tests/e2e/dashboard-students.spec.ts` / the wizard specs already drive) — a real
     `POST /api/students`, a real Postgres row;
   - **without reloading the page**, assert a new `GET /api/my/progress` request is issued
     (`page.waitForResponse`) and that the rendered household figure reflects the new child;
   - then reload and assert the same value persists (the persistence half of the mission's
     definition of done);
   - clean up with the existing `tests/e2e/helpers/student-cleanup.ts` helper so the seeded fixture
     is not polluted for other specs.
   If the dashboard does not yet RENDER the household figure (W5 owns that markup), assert at the
   network + cache layer instead: the `GET /api/my/progress` refetch fires after the mutation
   resolves, and its `data.household.childCount` has incremented. Record in Evidence which of the two
   assertions was used and why.

## Project rules

- `schooltest-web/.claude/rules/state-data.md` — always invalidate or `setQueryData` after a
  successful mutation; array keys starting with the resource name; mutations live in
  `queries/use-x.mutation.ts`.
- `schooltest-web/.claude/rules/module-pattern.md` — cross-module imports through the barrel only.
- `schooltest-web/CLAUDE.md` law 1 (zero extras), law 3 (never break existing logic), law 4 (touch
  nothing else).
- `.qa/DECISIONS.md` **D-SCOPE-3** — existing wiring is preserved and extended, never replaced.
- `.qa/PLAN.md` definition of done — a real row in the real Postgres that survives a reload.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/w3-cache-invalidation.spec.ts` passes against the running app:
  real `POST /api/students`, a refetch of `/api/my/progress` observed without a reload, and the new
  value still correct after a reload.
- Persistence proof in Evidence: the created student's row read back from Postgres
  (`psql` read via `tests/e2e/helpers/auth-db.ts` conventions, 127.0.0.1:5540) with its
  `documentId`, plus the `students_parent_lnk` join proving ownership.
- `git diff` on the three mutation files shows ONLY added `invalidateQueries` lines and their
  imports — no existing line removed or reordered.
- `pnpm exec playwright test tests/e2e/dashboard-students.spec.ts tests/e2e/students-list.spec.ts tests/e2e/053-wizard-controls.spec.ts`
  all still pass.
- `grep -rn "setQueryData" src/modules/children/queries/use-archive-student.mutation.ts src/modules/children/queries/use-update-student.mutation.ts src/modules/student-wizard/queries/use-create-student-full.mutation.ts`
  → zero hits (no fabricated cache writes).
- Test cleanup verified: the child created by the spec is removed, and a second consecutive run of
  the spec passes (no accumulated fixture drift).
- No user-facing string → six catalogs untouched, still key-identical.
- Non-UI slice: no motion / viewport / axe criteria.
- Playwright baseline unchanged (157 passed / 1 known W9 red).

## Assumptions

- The add-child path used by the spec is the one that exists TODAY; W7 redesigns the wizard, and when
  it does, this spec's selectors move with it. The assertion (a household refetch after a real
  create) is what must survive, not the selector.

## Evidence

<!-- filled in as the task runs -->
