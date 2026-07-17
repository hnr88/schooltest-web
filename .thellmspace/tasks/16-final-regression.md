---
id: 16
title: Final regression — full suite, gates, critic-clean, report
layer: regression
kind: verify
slice: whole-mission regression + quality gate + .qa/REPORT.md
target: tests/e2e/, .qa/REPORT.md
contract: C-E2E (all)
status: TODO
depends_on: [13, 14, 15]
---
## Objective
Final proof of the whole mission: full Playwright suite + tsc + lint green, banned-pattern
scan empty, all task files carry evidence, report written.

## Steps
1. `pnpm tsc --noEmit` and `pnpm lint` — zero errors.
2. Full `pnpm exec playwright test` (all specs incl. original home.spec) — green.
3. Banned-pattern grep over all touched files (git diff --name-only origin/main...HEAD):
   case-insensitive mock|fake|stub|dummy|placeholder|TODO|FIXME|lorem → ZERO in shipped
   code (test/task/.qa docs exempt; report any hit).
4. Hardcoded-copy sweep: grep landing + design-system modules for JSX text literals that
   are not t() calls → zero (icons/numbers-as-props exempt).
5. Verify every task file 01–15 status=DONE with Evidence filled; STATE.json reconciled.
6. Write .qa/REPORT.md: delivered per feature (tokens/fonts/assets, design-system module,
   showcase page, landing 13 sections, i18n en+de, e2e suite), files created/changed,
   e2e evidence (spec counts, run output), screenshots list, decisions (DECISIONS.md ref),
   deviations (font choice, legal-link omission, print-variant exclusion, App Screens
   exclusion), security/a11y findings (axe moderate list), what was NOT built (out of
   scope per D2).
7. Update STATE.md/STATE.json (this task DONE after verifier passes).

## Done criteria
- All gates green on a FRESH run by the independent verifier; report exists; two
  consecutive critic+grep clean passes recorded (wave critics + this final scan).
## Evidence
(filled by builder/verifier)
