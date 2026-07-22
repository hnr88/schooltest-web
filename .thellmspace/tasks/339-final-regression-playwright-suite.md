---
id: 339
title: FINAL REGRESSION — the whole Playwright suite green, at or above the 157-passing baseline, with the one known red fixed
layer: regression
kind: verify
slice: The mission's terminal gate — one full `pnpm exec playwright test` run against the running stack
target: The entire tests/e2e suite; no source change except a fix for a red this run exposes
contract: n/a
design: n/a
status: TODO
depends_on: ["320", "321", "322", "323", "324", "325", "326", "327", "328", "329", "330", "331", "332", "333", "334", "335", "336", "337", "338"]
---

## Objective

Run the **entire** Playwright suite against the running app and require: zero failures, a pass
count **at or above** the recorded baseline plus every spec this mission added, and the single
pre-existing red fixed by W9. This is the mission's terminal gate — nothing is DONE until this is.

## Contract

n/a. The binding statements, quoted verbatim from `.qa/PLAN.md` § Regression baseline:

> `pnpm exec playwright test` at 2026-07-22 ~20:55 — **157 passed / 1 failed / 2 skipped / 2 did
> not run** of 162. The single red is pre-existing and owned by W9:
> `notification-preference-controls.spec.ts:75` — after writing both opt-outs off and reloading,
> the "Text messages" switch still reports `aria-checked="true"`. Any additional red at any point
> in this mission is a regression this mission caused, and is a stop-and-fix.

And `.qa/PLAN.md` § Definition of done (per task), which this run is the aggregate proof of:

> Contract conformance on the success path AND every error/auth/ownership path; a real row read
> or written in the real Postgres that survives a reload; a passing Playwright run against the
> running app; motion present with a `prefers-reduced-motion` variant; correct at 375px and
> 1280px; zero axe serious/critical violations on the touched surface; all six locale catalogs
> key-identical; `pnpm tsc --noEmit` + `pnpm lint` clean; zero banned-pattern grep hits.

`.qa/DECISIONS.md` **D-VERIFY-1** — *"The 48 pre-existing e2e specs are a regression baseline
that must stay green."*

`.qa/DECISIONS.md` **D-OPS-2** — servers are started and kept alive by the watchdog and by
Playwright's own `webServer` block (`reuseExistingServer: true`); `pnpm dev`/`build`/`start` are
never run by hand. `pnpm exec playwright test` is explicitly allowed.

**D5** — the live Google OAuth consent round-trip stays a named `test.skip` with its reason
(no `GOOGLE_CLIENT_ID`/`SECRET` in this workspace). It is a sanctioned skip, not a red and not a
fake pass.

## Design source

n/a.

## Files

- No new file. A red exposed by this run is fixed in the owning module, and that fix is part of
  this task.
- `.qa/STATE.json` / `.qa/REPORT.md` are updated by the orchestration layer, not by this task's
  source edits.

## Depends on

- **320-338** — every W11 task. This is the aggregate gate; running it before the audits and the
  security tasks land would gate an intermediate state.
- Wave gate (prose): every wave **W0-W10** DONE and committed.

## Steps

1. Confirm the stack is up before starting (report only, never restart — the root watchdog owns
   liveness per `.qa/qa-watchdog.sh`): api `:5500`, web `:3100`, postgres `:5540`, redis `:6390`,
   mailpit `:1125/:8125`, minio `:9010`, r-scoring `:8790`. If anything is down, wait for the
   root watchdog rather than starting it by hand (D-OPS-2, CLAUDE.md law 12).
2. Run `pnpm tsc --noEmit` and `pnpm lint` and require both clean **before** the suite — a type
   error makes the run meaningless.
3. Run the full suite: `pnpm exec playwright test` (chromium, `fullyParallel`, baseURL
   `http://localhost:3100`, `webServer.reuseExistingServer: true`). Capture the HTML report.
4. Record the exact tallies: `<passed> passed / <failed> failed / <skipped> skipped /
   <did not run> did not run` of `<total>`. Compare against the baseline
   **157 / 1 / 2 / 2 of 162**.
5. Assert the terminal conditions:
   - **`failed === 0`.**
   - `passed >= 158` — the baseline's 157 plus the one red W9 fixed — **and** `passed >=` the
     baseline plus the number of tests this mission's new specs contribute. Compute the second
     number from the report, do not assume it.
   - `notification-preference-controls.spec.ts:75` is **passing**: after writing both opt-outs
     off and reloading, the "Text messages" switch reports `aria-checked="false"`.
   - `skipped` contains **only** D5's Google consent skip (and any skip that carries a cited
     BLOCKED reason in its title). Any other skip is treated as a hidden red and must be
     un-skipped or justified.
   - `did not run` is **0** — the baseline's 2 "did not run" were downstream of the single
     failure; with zero failures nothing may be left unrun.
6. Assert no spec was deleted to make the number work: `ls tests/e2e/*.spec.ts | wc -l` is **>=**
   the count at the start of the mission (56 spec files per `.qa/intake/web-inventory.md` §7)
   plus the specs W11 added, and every baseline spec filename still exists. Diff the spec file
   list against the intake list and report any removal with its justification.
7. If **any** test is red: stop, diagnose, and fix it at its source in the owning module. Never
   weaken an assertion, never `test.skip` it, never retry it into green, never delete it. Re-run
   the full suite from step 2 after the fix. Repeat until step 5 holds.
8. Re-run the suite a **second consecutive time** and require the same green result — this proves
   the suite is not flaky-green. Record both runs with timestamps and tallies.
9. Attach the final evidence: both runs' tallies, the HTML report path, the
   `notification-preference-controls.spec.ts:75` assertion output, the spec-file count
   comparison, and the `tsc`/`lint` exit codes.

## Project rules

- `schooltest-web/CLAUDE.md` §0 law 12 — never run `pnpm dev`/`build`/`start`; allowed:
  `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test --run`, `pnpm exec playwright test`,
  `git status/log/diff`.
- `.claude/rules/testing.md` — never write the test after the implementation; never weaken a
  test to make it pass.
- `.qa/RULES.md` command policy — never `git revert`, `reset --hard`, `push --force`, `rebase`,
  or amend a commit not authored this session.
- `.qa/DECISIONS.md` D-OPS-2, D-VERIFY-1, D5.
- `.qa/PLAN.md` regression baseline — any additional red is a stop-and-fix, not an accepted loss.

## Done criteria

- `pnpm tsc --noEmit` exit 0 and `pnpm lint` exit 0, recorded immediately before the run.
- `pnpm exec playwright test` reports **0 failed**, **0 did not run**, and `passed >= 158` and
  `>=` the baseline-plus-new-specs figure computed from the report.
- `notification-preference-controls.spec.ts:75` passes — the pre-existing red is proven fixed,
  not skipped.
- The only skipped tests are the ones carrying a cited BLOCKED reason (D5's Google consent
  round-trip); every other baseline skip is accounted for in Evidence.
- No baseline spec file was deleted; the spec-file count is >= the intake count plus W11's
  additions, verified by a filename diff.
- The green result reproduces on a **second consecutive** full run; both runs are timestamped in
  Evidence.
- The HTML report is retained and its path recorded.

## Assumptions

- The full suite's runtime fits the watchdog's stall window; if it does not, the run is split by
  `--shard` and the shard tallies are summed in Evidence — never by dropping specs.
- W9 genuinely fixed the SMS opt-out persistence defect. If it did not, this task does **not**
  paper over it: it is reported as the one outstanding red with its exact evidence and the
  mission does not close.

## Evidence

<!-- filled in as the task runs: both runs' tallies, report path, spec-count diff, tsc/lint exit codes -->
