---
id: 127
title: Shell wave close-out — full regression, six-locale parity, axe sweep, and the re-baseline record
layer: regression
kind: verify
slice: The whole W4 shell as delivered: every pre-existing behaviour re-proven, every re-baselined assertion accounted for
target: tests/e2e/shell.spec.ts, tests/e2e/shell-a11y.spec.ts, src/i18n/messages/*.json, .qa/evidence/
contract: n/a — this is the wave's proof pass against PLAN.md's definition of done
design: .qa/design/screens/portal--detached-sidebar.html, .qa/design/spec/01-portal-dashboard.md#1-page-shell
status: TODO
depends_on: ["116", "123", "125", "126"]
---

## Objective

Close W4 by proving, in one run against the live stack, that the shell was RE-SKINNED and nothing
was lost: the full Playwright suite is green against the recorded baseline, every assertion this
wave re-baselined is listed with its old and new value and its design citation, the six catalogs
are key-identical, and axe is clean on every shell state.

## Contract

n/a. The gates are PLAN.md's own:

> **Regression baseline (recorded before any edit):** `pnpm exec playwright test` at 2026-07-22
> ~20:55 — **157 passed / 1 failed / 2 skipped / 2 did not run** of 162. The single red is
> pre-existing and owned by W9: `notification-preference-controls.spec.ts:75` … Any additional red
> at any point in this mission is a regression this mission caused, and is a stop-and-fix.

and the per-task definition of done: contract conformance on every path; a real row that survives a
reload; a passing Playwright run; motion + reduced-motion; 375 and 1280; zero axe serious/critical;
six locale catalogs key-identical; `tsc` + `lint` clean; zero banned-pattern grep hits.

## Design source

The wave's deliverable, restated for the final visual check against
`.qa/design/screens/portal--detached-sidebar.html` and `01-portal-dashboard.md` §1:

- detached white card, **248px**, radius **24px**, shadow `0 1px 2px rgba(14,35,80,.04), 0 8px 32px rgba(14,35,80,.06)`, padding **28/16/16**, inset **24px** on a `#EEF1F6` well;
- logo **26px** at `0 12px 36px`; group overlines **11px/600/.08em/uppercase**;
- nav items `gap 12 · padding 11/14 · radius 12 · 14.5px`, idle **500**, active **600 on `#0E2350` with white ink**;
- account card `#F4F6FA`, radius **16px**, padding **12/14**, **36px** navy avatar, name **13.5/600**, role **12px**;
- top row chrome-less over the well, with the **44px** round white search pill (**240px**) and bell.

## Files

- `tests/e2e/shell.spec.ts`, `tests/e2e/shell-a11y.spec.ts` — final tidy only (keep each under the
  200-line rule; split by concern if needed and say which file took what).
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — parity check; the only key W4 added is
  `Shell.sidebar.accountRole` (task 117).
- `.qa/evidence/w4-shell/` — the run logs, screenshots and the re-baseline table.

## Depends on

- **116, 123, 125, 126** — the BLOCKED record, the keyboard pass, the composition pass and the
  motion audit are the four gates whose outputs this pass consolidates (they transitively cover
  110-115, 117-122, 124).

## Steps

1. **Full suite:** `pnpm exec playwright test` against the running stack (web :3100, api :5500,
   postgres :5540). Compare pass/fail/skip counts to the baseline line-by-line. The ONLY acceptable
   red is `notification-preference-controls.spec.ts:75` (pre-existing, W9-owned).
2. **Re-baseline register:** produce a table of every assertion W4 changed, with columns
   `spec:line · old expected · new expected · design citation · task id`. Expected entries include
   at minimum: nav item `border-radius` 10px→**12px** (114), `padding` `10px 12px`→**`11px 14px`**
   (114), the two active class-name regexes → a **measured `rgb(14,35,80)`** colour leg (115). Any
   assertion that was deleted rather than retargeted is a **failure of this task**, not a finding.
3. **i18n parity:** a script that loads all six catalogs, flattens the key paths, and asserts the
   six sets are identical — expected count **1152** (1151 baseline + `Shell.sidebar.accountRole`).
   Also assert no shell component contains a hardcoded user-facing string
   (`rg -n ">[A-Z][a-z]+ [a-z]" src/modules/shell/components` reviewed by hand).
4. **axe sweep:** `/dashboard`, `/dashboard/children`, `/dashboard/search`, `/dashboard/settings`,
   `/dashboard/notifications` at 1280 and 375, plus the 375 Sheet-open state and the 1280 collapsed
   rail. Serious/critical must be zero; the two documented exemptions
   (`scrollable-region-focusable` on the vendored table container; the vendored English `SheetTitle`
   from task 122) are LOGGED with their reasons, never filtered silently.
5. **Banned patterns:** `rg -n "\bany\b|p-\[|w-\[|h-\[|text-\[|bg-\[|#[0-9A-Fa-f]{6}" src/modules/shell src/app/\[locale\]/dashboard`
   → zero hits outside provenance comments.
6. **Behaviour checklist** (each re-proven live, not read from code):
   - sidebar 248px / rail 48px / Ctrl+B round trip;
   - the 4 catalog-labelled links land on `/dashboard`, `/dashboard/children`, `/dashboard/search`,
     `/dashboard/settings`;
   - breadcrumb section + record crumb on a real child page;
   - user menu → Sign out clears `app.auth.token`, redirects to `/sign-in`, and the cleared session
     survives a reload;
   - mobile Sheet opens, lists all 4 links, closes on Escape and on scrim;
   - notification bell count matches the live API and survives a mark-read + reload;
   - `/dashboard/billing` is a not-found, not a half-built screen (task 116's refusal).
7. Write `.qa/evidence/w4-shell/REPORT.md` with the four tables (suite counts, re-baseline
   register, parity, axe) and the screenshot index.

## Project rules

- `.claude/rules/testing.md` + `D-VERIFY-1` — a real Playwright run against the running app is the
  only proof; the builder never passes their own task (an independent verifier repeats this run).
- `.claude/rules/i18n.md` — six catalogs, identical shape, no hardcoded strings.
- `CLAUDE.md` §0 law 12 — never start a server; Playwright's `webServer` reuses the running one.
- `.qa/RULES.md` workspace section — never revert, never branch, never amend a foreign commit.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- Full `pnpm exec playwright test`: **no red other than the one pre-existing W9 failure**, and the
  pass count is ≥ the baseline's 157 (W4 adds legs, so it should be higher — state the exact number).
- The re-baseline register is complete and every row cites a design line; zero deleted assertions.
- Six catalogs key-identical at 1152 keys; a locale-parity assertion runs in CI-visible form.
- axe serious/critical = 0 across the eight page/viewport/state combinations above, with the two
  exemptions logged verbatim.
- Zero banned-pattern hits.
- `.qa/evidence/w4-shell/REPORT.md` exists with the four tables and links to
  `shell-desktop.png`, `shell-desktop-collapsed.png`, `shell-mobile.png`,
  `shell-mobile-sheet-open.png`, `125-shell-375.png`, `125-shell-1280.png`.

## Assumptions

- The pre-existing red (`notification-preference-controls.spec.ts:75`, the SMS opt-out persistence
  defect) stays red; it is W9's and fixing it here would be an out-of-scope change.

## Evidence

_(filled in as the task runs: suite counts, the re-baseline register, parity output, the axe table)_
