---
id: 194
title: Prove the redesigned child detail at 375/1280 — motion, axe, six locales, security and regression
layer: regression
kind: verify
slice: The whole child-detail surface, verified end to end against the running app and the real database.
target: tests/e2e/children-profile.spec.ts, tests/e2e/child-detail-redesign.spec.ts (new), .qa/screenshots/
contract: C-PARENT-CHILD-PROGRESS · C-DASH-HOUSEHOLD · C-CHILD-RESULT-HISTORY · C-PARENT-RESULT-VIEW
design: .qa/design/screens/portal--child-detail.html · .qa/design/spec/02-portal-children.md §B, §ANIMATIONS, §RESPONSIVE SUMMARY
status: TODO
depends_on: ["178", "179", "181", "182", "183", "184", "185", "186", "187", "190", "191", "192", "193"]
---

## Objective

One verification pass over the finished detail screen: every value traced to a live response, every
ownership boundary re-proven, motion and reduced motion present, both widths clean, six locales
rendering, and the full suite at or better than the recorded baseline.

## Contract

All four contracts are read-only except the archive/unarchive flow this spec re-exercises, which must
show a real Postgres row change that survives a reload (`GET /api/my/students` with and without
`filters[status][$in]`). `C-PARENT-RESULT-VIEW`'s security note requires all four of its paths to be
proven with real requests.

## Design source

`.qa/design/spec/02-portal-children.md` §RESPONSIVE SUMMARY for the detail screen:
`flex-wrap` on the identity row with `min-width:200px` on the text stack (buttons drop to a new line);
`flex-wrap` + `gap:20px 0` on the KPI strip with `min-width:140px` per cell;
`repeat(auto-fit,minmax(380px,1fr))` for Journey/Skills.
§ANIMATIONS hover inventory H-4 (back link), H-5 (secondary pill), H-6 (primary pill), H-7 (All reports).

## Files

- `tests/e2e/child-detail-redesign.spec.ts` (new).
- `tests/e2e/children-profile.spec.ts` — retains every existing guarantee; the tab assertions were
  retargeted in task `177` and are re-verified here.
- Screenshots at 375 and 1280 into `.qa/screenshots/`.

## Depends on

- Every detail build task: `178`, `179`, `181`, `182`, `183`, `184`, `185`, `186`, `187`, `190`,
  `191`, `192`, `193`.

## Steps

1. Capture the three reads for a seeded child and assert, against the parsed bodies: header name and
   meta, all five KPI cells, the ladder's current step, the four skill rows, the four session metrics,
   and every visible result row.
2. Assert the six-band ladder never renders `C2` and the whole page renders no `%`, no letter grade,
   no subject and no cohort string (the four BLOCKED records, tasks `169`, `170`, `188`, `189`).
3. Expand a skill: exactly one `GET /api/results/{id}` → `200`; attribute statuses and `items` match
   the body. Then prove `404` for a foreign result id, `404` for a transient one, `401` with no JWT.
4. Archive from the detail header with a throwaway parent's child → toast → redirect → status
   `archived` in the API → reload → still archived → unarchive → `active`.
5. Page the results card (or prove the API boundaries `pageSize=51` → `400`, unknown key → `400` when
   the child has one page of data).
6. Motion: assert `getAnimations()` is non-empty for the ladder connectors and the stack entrance,
   that none of them animates `width` or `background-position`, and that all are absent under
   `emulateMedia({ reducedMotion: 'reduce' })`.
7. Six locales: load the detail route with each `NEXT_LOCALE` and assert the headings, the readiness
   values and the KPI labels come from that catalog.
8. `AxeBuilder` at 375 and 1280, zero serious/critical; `scrollWidth <= innerWidth` at 375.
9. Full-suite run; compare against the baseline of 157 passed / 1 known-red
   (`notification-preference-controls.spec.ts:75`, owned by W9).

## Project rules

- `.qa/DECISIONS.md` D-VERIFY-1 — real Playwright run, real DB proof, independent verifier.
- `.claude/rules/testing.md` — Server Components are proven through Playwright, not JSDOM.
- `.qa/RULES.md` command policy — never `pnpm dev`/`build`/`start`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/child-detail-redesign.spec.ts tests/e2e/children-profile.spec.ts
  tests/e2e/students-list.spec.ts tests/e2e/dashboard-students.spec.ts` green.
- Full suite shows no new red versus the baseline.
- All four `C-PARENT-RESULT-VIEW` security paths proven with real status codes recorded in Evidence.
- Archive/unarchive persistence proven by API re-query after a reload.
- axe zero serious/critical at both widths; no h-scroll at 375.
- Six catalogs key-identical (key-diff output in Evidence).
- Zero banned-pattern grep hits across the wave's detail diff (`any`, raw hex, arbitrary `[...]`
  classes, `<div onClick`, `%` bound to a result value).
- Screenshots at 375 and 1280 attached.

## Assumptions

Where the seeded children carry no official results, the honest unassessed branches are the asserted
paths and a throwaway parent + API-created result is used for the assessed paths where one is needed.

## Evidence

<!-- filled in as the task runs -->
