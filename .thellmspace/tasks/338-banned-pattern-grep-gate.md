---
id: 338
title: Banned-pattern grep gate — zero mock/fake/stub/dummy/placeholder/TODO/FIXME and zero hardcoded array standing in for a query
layer: regression
kind: verify
slice: The mission-wide honesty gate over the whole delivered diff
target: The full mission diff across schooltest-web/src/**, schooltest-web/tests/**, schooltest-api/src/** ; findings become fixes in the owning module
contract: n/a
design: n/a
status: TODO
depends_on: ["330", "331", "332", "333", "334", "335", "336", "337"]
---

## Objective

Run the mission's honesty gate over the entire delivered diff and prove it comes back **empty**:
no mock/fake/stub/dummy/placeholder scaffolding left behind, no `TODO`/`FIXME` deferrals, no
hardcoded array or object standing in for a real query result, no invented metric, and no
suppressed rule. `.qa/PLAN.md` execution discipline makes this gate one of the two conditions
that must come back empty **twice consecutively** for the mission's quality loop to terminate.

## Contract

n/a. The binding statements, quoted:

`.qa/PLAN.md` § Execution discipline — *"After every wave, a fresh CRITIC agent asks what is
missing / faked / stubbed / unpersisted / off-contract across the whole delivered surface, and
its findings become new tasks. The quality loop terminates only when the critic AND the
banned-pattern grep both come back empty **twice consecutively**."*

`.qa/PLAN.md` § Definition of done — *"…zero banned-pattern grep hits in the diff."*

`.qa/DECISIONS.md` **D-SCOPE-1** binding reading §4 — *"'Do not invent' is absolute. A design
screen with no data behind it is not to be faked."*

`schooltest-web/CLAUDE.md` §0 law 15 — never add unsolicited comments or docs in code (so a
`// TODO:` is doubly banned) — and §8 — no hallucinated APIs, no invented patterns.

## Design source

n/a. The refusal list that this gate enforces is `.qa/CONTRACTS.md` § BLOCKED **B-1 … B-8**:
`coming up` (B-1), the "Coming up" list (B-2), `last result 74%` (B-3),
`Progress to {next} 68%` (B-4), `Avg. score 86% / Trend +4% / Of grade Top 15%` (B-5),
subject bars + class average + letter grade (B-6), all billing/credits/invoices (B-7),
per-child unread notification count (B-8).

## Files

- No new source file. The gate is a set of greps run over the mission diff, recorded in Evidence.
- Fixes land in whichever module the hit is in.
- A single reusable script may be written to `.qa/` (not `src/`) if it helps rerun the gate —
  it is tooling, not product code.

## Depends on

- **330-337** — every audit and every API-security task must be DONE, because their fixes are
  part of the diff this gate inspects.
- Wave gate (prose): every wave **W0-W10** DONE; this gate covers all of them.

## Steps

1. Establish the mission diff range: the commit immediately before the first
   `st-portal-redesign` commit → `HEAD`. Record both SHAs in Evidence. Note root `.qa` **OP-12**:
   an external auto-commit daemon sweeps the repos, so the range is computed from the log, not
   assumed.
2. **Word gate.** Over the diff's **added** lines in `schooltest-web/src/**`,
   `schooltest-web/tests/**` and `schooltest-api/src/**`, grep case-insensitively for:
   `mock`, `fake`, `stub`, `dummy`, `placeholder`, `TODO`, `FIXME`, `HACK`, `XXX`,
   `lorem`, `ipsum`, `sample data`, `for now`, `temporary`, `not implemented`, `coming soon`.
   Permitted exceptions, each of which must be enumerated explicitly in Evidence with its file
   and line (never a blanket ignore):
   - `placeholder` as the **HTML input attribute** (`placeholder={t('…')}`) — the attribute is
     legitimate; a *hardcoded* placeholder string is still a failure and is caught by task 337.
   - Playwright's `page.route(...).fulfill(...)` used to force a **real contracted error
     envelope** (500/403/400) in an error-path test — this is fault injection against a real
     shape, not a fake feature. Each occurrence must fulfil with the API's real envelope and be
     accompanied by a comment citing the contract.
   Everything else is a failure and is removed or implemented.
3. **Hardcoded-data gate.** Grep the diff for array/object literals with ≥3 entries that sit in a
   component, screen or page file (not in `constants/`, not in a test fixture) and that carry
   product data shapes — keys like `documentId`, `givenName`, `cefrBand`, `skill`, `title`,
   `name`, `count`, `total`, `seconds`, `readiness`. Every hit must be traced to a real query
   hook; if it is not backed by a query, it is a faked dataset and must be replaced with the real
   hook or removed. Legitimate enum/option constants (`AGENT_SERVICES`, `SCHOOL_TYPES`,
   `YEAR_LEVEL_VALUES`, `COUNTRY_CODES`, `WIZARD_STEP_KEYS`, `LOCALES`, `NAV_ITEMS`, …) live in
   `constants/` per `.claude/rules/module-pattern.md` and are exempt **by location**, not by
   name.
4. **Invented-metric gate.** Grep the whole `src/**` tree (not only the diff) for the BLOCKED
   values and their labels, and assert **zero** hits outside `.qa/` documentation:
   `coming up`, `Coming up`, `74%`, `68%`, `Avg. score`, `avgScore`, `Trend`, `Of grade`,
   `Top 15%`, `class average`, `classAverage`, `letter grade`, `letterGrade`,
   `Math`/`Danish` as a subject, `credits`, `invoice`, `Family plan`, `auto top-up`,
   `perChildUnread`. Any hit is an invented metric and a hard failure.
5. **Suppression gate.** Assert zero of the following in `src/**` and `tests/**`:
   `eslint-disable`, `@ts-ignore`, `@ts-expect-error` (without a cited reason and a linked
   task), `axe` `disableRules(`, an axe results allow-list, `test.skip(` without a cited
   BLOCKED reason (D5's Google consent skip is the one sanctioned skip and must carry its
   reason), `test.fixme(`, `.only(`, and `expect(...).toBeTruthy()` used where a real value was
   contracted.
6. **`any` gate.** Assert zero `: any`, `as any`, `<any>` in the diff (CLAUDE.md law 14).
7. **Vendored-file gate.** Assert zero files under `schooltest-web/src/components/ui/` appear in
   the diff (CLAUDE.md law 11).
8. **Dependency gate.** Diff `package.json` and `pnpm-lock.yaml` and assert no dependency was
   added without an explicit decision recorded in `.qa/DECISIONS.md` (D-DESIGN-3 forbids a new
   animation dependency; §2 of CLAUDE.md requires user confirmation for any new library).
9. Fix every hit at its source. Re-run the whole gate. **Run it a second time in a later
   session/pass and require empty again** — the PLAN's "twice consecutively" condition. Record
   both runs in Evidence with timestamps.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 4, 11, 14, 15; §8 (no hallucinated APIs, no invented
  patterns, no unsolicited improvements).
- `.claude/rules/quality.md` — file/naming limits; no dead code.
- `.claude/rules/module-pattern.md` — constants belong in `constants/`, which is what makes the
  location-based exemption in step 3 meaningful.
- `.qa/PLAN.md` execution discipline + definition of done.
- `.qa/CONTRACTS.md` B-1..B-8.
- `.qa/RULES.md` command policy — `git status/log/diff` only; never revert, reset, force-push,
  rebase or amend.

## Done criteria

- The word gate returns **zero** hits over the mission diff, except the two enumerated exception
  classes, each listed individually in Evidence with file:line and its justification.
- The hardcoded-data gate returns **zero** unbacked product-data literals in component/screen/page
  files; every remaining literal is traced to a real query hook or lives in `constants/`.
- The invented-metric gate returns **zero** hits for every B-1..B-8 string across the whole
  `src/**` tree.
- The suppression gate returns **zero** hits; the only `test.skip` in the suite is D5's Google
  consent skip with its cited reason.
- Zero `any` in the diff; zero files under `src/components/ui/` in the diff; zero unapproved
  dependency added.
- The full gate has been run and come back empty **twice consecutively**, both runs timestamped
  in Evidence.
- `pnpm tsc --noEmit` + `pnpm lint` clean at the moment of the second empty run.

## Assumptions

- The mission's first commit is discoverable from `git log` (D-OPS: one commit per wave on
  `main`, task-referenced). If the auto-commit daemon (OP-12) has interleaved generated commits,
  the range still starts at the last pre-mission commit — the range is widened, never narrowed.
- `.qa/**` documentation legitimately contains the BLOCKED strings (that is where they are
  recorded); the gate excludes `.qa/` and `dashbaord-design/` from step 4 by path.

## Evidence

<!-- filled in as the task runs: diff range SHAs, each gate's output, both empty runs with timestamps -->
