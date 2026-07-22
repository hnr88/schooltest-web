---
id: 176
title: Prove the redesigned children list at 375/1280 — motion, axe, six locales, and the e2e regression
layer: regression
kind: verify
slice: The whole "My children" list surface, verified against the running app at both widths in all six locales.
target: tests/e2e/students-list.spec.ts, tests/e2e/children-list-redesign.spec.ts (new), .qa/screenshots/
contract: C-STUDENT-LIST · C-DASH-HOUSEHOLD
design: .qa/design/screens/portal--my-children-list.html · .qa/design/spec/02-portal-children.md §A, §ANIMATIONS, §RESPONSIVE SUMMARY
status: TODO
depends_on: ["166", "167", "168", "171", "172", "173", "174", "175"]
---

## Objective

One verification pass over the finished list: every card value traced to a live API field, motion and
its reduced-motion variant present, both widths clean, six locales rendering, axe clean, and the three
pre-existing specs still green.

## Contract

Both source contracts are read-only; this task writes nothing to the database except through the
archive flow it re-exercises. Every asserted number must be read from the live response body in the
same test — never a hardcoded literal (the standard `children-profile.spec.ts` already set).

## Design source

`.qa/design/spec/02-portal-children.md` §RESPONSIVE SUMMARY: the list's only responsive mechanism is
`repeat(auto-fit,minmax(360px,1fr))` + `flex-wrap` on the header — so the acceptance is:
1 column below ~740px of content box, 2 columns ~740-1120px, 3 columns above.
§ANIMATIONS hover inventory H-1 (card elevation), H-2 (Add-a-child background), H-3 (tile border+color).

## Files

- `tests/e2e/children-list-redesign.spec.ts` (new) — the redesign's own assertions.
- `tests/e2e/students-list.spec.ts` — extended only where markup legitimately moved; every existing
  guarantee (seeded parent sees both children, empty parent sees the empty state, six-locale heading)
  is kept.
- Screenshots into `.qa/screenshots/` at 375 and 1280.

## Depends on

- All list build tasks: `166`, `167`, `168`, `171`, `172`, `173`, `174`, `175`.

## Steps

1. Log in as the seeded parent (`tests/e2e/helpers/auth.ts`), capture `GET /api/my/students` and
   `GET /api/my/progress`, then assert per card: name, `Year {n}`, status pill, `Level {band}` (or
   `notBanded`), streak, tests completed, last-assessed date, focus note — each against the captured body.
2. Assert the grid's computed `grid-template-columns` yields 1 track at 375, 2 at 900, 3 at 1440.
3. Hover the first card and assert the elevation layer's `opacity` transitions (non-zero
   `getAnimations()` before reduced motion, zero after `emulateMedia({ reducedMotion: 'reduce' })`).
4. Loop the six locales as `students-list.spec.ts` already does, asserting the header, the streak
   label and the focus note come from that locale's catalog.
5. Run `AxeBuilder` at 375 and 1280; assert zero `serious`/`critical`.
6. Assert `document.documentElement.scrollWidth <= window.innerWidth` at 375.
7. Run the full suite: the regression baseline is 157 passed / 1 known-red
   (`notification-preference-controls.spec.ts:75`, owned by W9). Any additional red is a stop-and-fix.

## Project rules

- `.claude/rules/testing.md` + `.qa/DECISIONS.md` D-VERIFY-1 — a real Playwright run against the
  running app is the only proof; the builder never passes their own task.
- `.qa/RULES.md` command policy — `pnpm exec playwright test` only; never `pnpm dev`/`build`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/children-list-redesign.spec.ts tests/e2e/students-list.spec.ts
  tests/e2e/dashboard-students.spec.ts tests/e2e/children-profile.spec.ts` all green.
- Full-suite run shows no new red versus the recorded baseline.
- axe zero serious/critical at both widths; no h-scroll at 375.
- Six catalogs key-identical (key-diff script output in Evidence).
- Zero banned-pattern grep hits across the wave's list diff.
- Screenshots at 375 and 1280 attached in Evidence.

## Assumptions

The seeded parent keeps Mia + Jonas; a household-progress entry may legitimately be missing for them
(no sessions seeded), in which case the honest empty slots are what the test asserts.

## Evidence

<!-- filled in as the task runs -->
