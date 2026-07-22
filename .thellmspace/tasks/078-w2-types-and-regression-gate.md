---
id: 078
title: Regenerate Strapi types, typecheck both packages, and prove W2 changed no existing endpoint
layer: regression
kind: verify
slice: Wave W2 exit gate — types regenerated, no schema drift, every pre-existing parent surface byte-identical
target: schooltest-api/types/generated/ · schooltest-web/tests/e2e/w2-regression.spec.ts
contract: C-DASH-HOUSEHOLD · C-PARENT-RESULT-VIEW · C-CHILD-RESULT-HISTORY
design: n/a — regression gate
status: TODO
depends_on: [068, 074, 077]
---

## Objective

Close W2 with proof that the three new surfaces cost nothing: no content-type changed, generated
types are current, both packages typecheck and lint, and every endpoint a parent could already
reach returns exactly what it returned before the wave started.

## Contract

All three W2 entries in `.qa/CONTRACTS.md`. The load-bearing claim being verified is the addendum's
own note:

> these three surfaces need **NO** `schema.json` change — they read existing columns.

`schooltest-api/CLAUDE.md` §9 definition of done: "Schema changes followed by
`pnpm strapi ts:generate-types`". This task runs the generator to prove the "no schema change"
claim: if generated output changes, a schema DID change and that is a finding, not a formality.

`.qa/PLAN.md` regression baseline (recorded before any edit):

> `pnpm exec playwright test` at 2026-07-22 ~20:55 — **157 passed / 1 failed / 2 skipped / 2 did
> not run** of 162. The single red is pre-existing and owned by W9:
> `notification-preference-controls.spec.ts:75`. Any additional red at any point in this mission is
> a regression this mission caused, and is a stop-and-fix.

## Design source

n/a — regression gate, no UI.

## Files

- RUN (no edit expected) `cd schooltest-api && pnpm strapi ts:generate-types`
- CREATE `schooltest-web/tests/e2e/w2-regression.spec.ts`
- If the generator DOES produce a diff, commit the regenerated `types/generated/*` and record why —
  never hand-edit generated files, never `.gitignore` the diff away.

## Depends on

- **068**, **074**, **077** — the three security gates. This task runs after all of W2's code
  has landed.

## Steps

1. `cd schooltest-api && pnpm strapi ts:generate-types` (explicitly allowed by
   `schooltest-api/CLAUDE.md` §8 and `.qa/RULES.md` command policy). Then
   `git status --porcelain types/generated/` — expected: EMPTY.
2. `cd schooltest-api && pnpm tsc --noEmit && pnpm lint`.
3. `cd schooltest-web && pnpm tsc --noEmit && pnpm lint`.
4. `git diff --stat` over `schooltest-api/src/api/*/content-types/` — expected: EMPTY. The addendum
   says no schema.json change; prove it rather than assert it.
5. Banned-pattern grep over the whole W2 diff (`git diff` against the wave's base commit):
   `entityService` · `populate: '*'` · `auth: true` · `strapi.db.query(` outside
   `src/bootstrap/` · `: any` · `console.log` · `@ts-ignore` · `@ts-expect-error` ·
   `TODO` · `FIXME` · a bare `throw new Error(`. Expected: zero hits.
6. Write `tests/e2e/w2-regression.spec.ts` — a response-shape snapshot over the endpoints W2 could
   plausibly have disturbed.
7. Run the full suite.

## Project rules

- `schooltest-api/CLAUDE.md` §9 definition of done (every checkbox), §2 rules 5, 6, 10, 11, 16, 17,
  20, 21, 23.
- `schooltest-web/CLAUDE.md` §6 — allowed commands only; never `pnpm dev`/`build`/`start`.
- `.qa/RULES.md` command policy table.
- `.qa/PLAN.md` "Execution discipline" — one commit per wave on `main`, task-referenced; never
  branch, never revert, never rewrite history.
- `.qa/DECISIONS.md` **D-VERIFY-1**.

## Done criteria

- `pnpm strapi ts:generate-types` produces **no diff** under `schooltest-api/types/generated/`.
  If it does, the diff is committed and the schema change that caused it is named in Evidence.
- `git diff` shows **zero** changes under `schooltest-api/src/api/*/content-types/`.
- `cd schooltest-api && pnpm tsc --noEmit && pnpm lint` clean.
- `cd schooltest-web && pnpm tsc --noEmit && pnpm lint` clean.
- Banned-pattern grep over the W2 diff returns **zero** hits for every pattern listed in step 5.
- `pnpm exec playwright test tests/e2e/w2-regression.spec.ts` passes, asserting that each of these
  pre-existing parent endpoints returns the same shape and the same values as before W2, using a
  parent JWT and `runSql` ground truth:
  - `GET /api/my/students` — same field whitelist (`given_name, family_name, year_level,
    nationality, current_year_level, target_entry_year, target_entry_term, status, email,
    createdAt, updatedAt` + `documentId`), same default `status $ne archived` behaviour, same
    `meta.pagination`;
  - `GET /api/my/students/:documentId` — same `STUDENT_DETAIL_FIELDS` projection, `photo` and
    `voice_intro` still populated, `passport_number` still absent;
  - `GET /api/my/students/:documentId/progress` — `metrics` still exactly the four scalars,
    `recentResults` still **≤ 5** rows with exactly the seven keys `documentId, skill, displayLabel,
    cefrBand, readiness, status, publishedAt`, `?anything` still `400`. **This is the endpoint most
    at risk**: 070-073 add a sibling route under the same path root and 075 touches the result
    service;
  - `GET /api/notifications`, `GET /api/notifications/unread-count`,
    `GET /api/notification-preferences/me`, `GET /api/search-preferences/me`,
    `POST /api/search/schools`, `POST /api/search/agents`, `GET /api/users/me` — all still `200`
    with unchanged top-level key sets;
  - route-shadowing check: `GET /api/my/students/<id>` still returns the student detail OBJECT, not
    the results array — the 070 insertion did not capture the wildcard;
  - `pnpm strapi routes:list` (allowed) contains `/my/progress` and
    `/my/students/:documentId/results` exactly once each.
- **Full suite:** `pnpm exec playwright test` → the baseline 157 passed / 1 failed
  (`notification-preference-controls.spec.ts:75` only) / 2 skipped / 2 did not run, **plus** every
  W2 spec passing. Any other red is a stop-and-fix, not a note.
- Grant matrix snapshot: `runSql` dumps every `up_permissions` row for the parent role; the set
  equals the pre-W2 set plus exactly three actions —
  `api::student.parent-dashboard.getHouseholdProgress`,
  `api::student.parent-results.listChildResults`, `api::result.result.getResult`. No other role
  gained anything.
- No i18n change anywhere in W2 (`git diff --stat src/i18n/messages/` is EMPTY) — W3 owns the six
  catalogs for these surfaces. No UI → motion / 375px / axe **n/a** for the whole wave; state it
  explicitly so the wave critic can see it was considered, not forgotten.

## Assumptions

- The wave's base commit is whatever `main` pointed at when task 060 started; the external
  auto-commit daemon (root `.qa` OP-12) may have interleaved commits, so compare against that
  recorded SHA rather than `HEAD~1`.
- `2 skipped / 2 did not run` in the baseline are pre-existing and are not this wave's to fix;
  record their names so a later wave can pick them up.

## Evidence

<!-- filled in as the task runs: generator diff, grep output, full suite tally, grant snapshot -->
