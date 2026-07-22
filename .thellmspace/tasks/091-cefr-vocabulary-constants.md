---
id: "091"
title: Encode the real CEFR ladder, skill order and readiness rank as shared constants + pure lookups
layer: data
kind: build
slice: The single client-side source of truth for CEFR band ordering, focus-skill ranking and the design's six-tick journey rail
target: src/modules/results/constants/vocab.constants.ts · src/modules/results/lib/cefr-ladder.ts · src/modules/results/index.ts · tests/e2e/w3-result-view-contract.spec.ts
contract: C-DASH-HOUSEHOLD · C-CHILD-RESULT-HISTORY · C-PARENT-RESULT-VIEW
design: .qa/design/spec/02-portal-children.md#B.4 Component: LevelJourney (L30–42) · .qa/design/spec/01-portal-dashboard.md#4.5 Metric 5 — Per-child CEFR journey stage
status: TODO
depends_on: ["090"]
---

## Objective

Put the CEFR ladder, the skill declaration order and the readiness rank in ONE place on the client,
with pure lookups over them, so every later slice (journey rail, level pill, focus-skill pill,
band delta, "Since joining") derives from the same six-value ladder instead of re-declaring it.
This is also the file that records the design↔data ladder conflict in code, permanently.

## Contract

From `.qa/CONTRACTS.md` → **C-DASH-HOUSEHOLD**, verbatim:

> **`CEFR_LADDER`** is exactly the API enum, in order:
> `["pre_A1","A1","A2","B1","B2","C1"]` (`result/content-types/result/schema.json`,
> `docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:43-53`). **The design draws six ticks labelled
> `A1 A2 B1 B2 C1 C2`; `C2` does not exist in this system and `pre_A1` does.** The UI renders the
> real ladder with the design's tick visual. Recorded as a design↔data conflict, not silently reconciled.

And the focus-skill rule, verbatim:

> **`focusSkill` derivation** (design says "the weakest skill"; the docs forbid a composite %):
> rank each skill's latest official result by `readiness` — `not_yet`(0) < `approaching`(1) <
> `met`(2), `not_assessed` excluded — and take the lowest. Ties break on the lower mean of that
> result's per-attribute `prob` values in `attributes` (the primary datum per
> `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:45`). Still tied ⇒ the skill enum's declaration order.
> No percentage is ever surfaced to the user.

The API computes `focusSkill` and `cefrStageIndex` server-side; this module holds the SAME ordering
so the client can render ticks, compare bands and order skills without a second request — and so a
drift between the two is a failing assertion rather than a silent visual lie.

## Design source

`.qa/design/spec/02-portal-children.md` §B.4 **LevelJourney** (`portal--child-detail.html` L30–42),
exact values this constant set must serve:

- Track: `display:flex; align-items:center; gap:0; margin-top:26px`; **6 steps**, each
  `flex:1; display:flex; flex-direction:column; align-items:center; gap:8px; position:relative`.
- Dot: `20px × 20px; border-radius:999px; border:2px solid; box-sizing:border-box`.
  done/current → fill + border `#0E2350` (`--color-navy-900`); future → fill `#FFFFFF`
  (W0's tinted card token, never literal `#fff` per CLAUDE.md §5.12), border `#D8DFEA` (portal input/border).
  Current only → inner pip `6px × 6px; border-radius:99px` white.
- Connector: `position:absolute; top:9px; height:2px`; `left:'50%'` for the first step else `'0'`;
  `right:'50%'` for the last step else `'0'`; `background:#0E2350` when `i <= journeyStage-1`, else
  `#EEF1F6` (portal hairline).
- Label: `font-size:12px`; current → weight `700`, `#0E2350`; done → weight `500`, `#0E2350`;
  future → weight `500`, `#9AA6B8` (portal muted-foreground-2).
- `.qa/design/spec/01-portal-dashboard.md` §4.5: the same six ticks appear inline in each
  "My children" row of the dashboard.

**The one thing this task changes about the design:** tick 1 is `pre_A1`, not `A1`, and there is no
`C2` tick. Six ticks stay six ticks — the visual is preserved exactly, the labels are the real enum.

## Files

Create:
- `src/modules/results/constants/vocab.constants.ts`
- `src/modules/results/lib/cefr-ladder.ts`

Touch:
- `src/modules/results/index.ts` — add the new public exports.
- `tests/e2e/w3-result-view-contract.spec.ts` — add one `test()` (title:
  `'CEFR ladder constant matches the API result enum'`).

## Depends on

- **090** — the `results` module, its barrel and `ResultCefrBand`/`ResultSkill`/`ResultReadiness`
  types, which these constants are typed against.

## Steps

1. `constants/vocab.constants.ts` (pure data, zero imports beyond `type` imports — it MUST be
   importable from a Node Playwright spec without pulling axios or `@/lib/env` in):
   - `export const CEFR_LADDER = ['pre_A1','A1','A2','B1','B2','C1'] as const;` with a comment citing
     `result/content-types/result/schema.json` and `docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:43-53`.
   - `export const CEFR_TICK_COUNT = CEFR_LADDER.length;` (6 — same count the design draws.)
   - `export const SKILL_ORDER = ['reading','listening','speaking','writing'] as const;` — the enum's
     declaration order, which is the final focus-skill tiebreak.
   - `export const READINESS_RANK = { not_yet: 0, approaching: 1, met: 2 } as const;` — `not_assessed`
     is deliberately ABSENT (the contract excludes it from ranking); the lookup below returns `null`
     for it rather than inventing a rank.
   - `export const CEFR_DESIGN_TICK_LABELS = ['A1','A2','B1','B2','C1','C2'] as const;` — recorded
     ONLY as the documented conflict, exported so the W11 sweep can assert nothing renders it.
     A comment states plainly: this array must never reach the DOM.
2. `lib/cefr-ladder.ts` — pure functions, no React, no I/O:
   - `getCefrStageIndex(band: ResultCefrBand | null): number | null` — 0-based index into
     `CEFR_LADDER`, `null` when `band` is `null` or unknown. Must agree with the API's
     `cefrStageIndex` field (C-DASH-HOUSEHOLD).
   - `isBandReached(band, stageIndex)` → the journey rail's `i <= journeyStage-1` predicate,
     expressed against the 0-based index so the off-by-one lives in exactly one place.
   - `getBandDelta(fromBand, toBand): number | null` — signed integer difference in ladder steps,
     `null` when either side is unknown. This is the ONLY honest form of the design's
     `Since joining +2 levels`; it is a step count, never a percentage (`.qa/CONTRACTS.md` B-4).
   - `getReadinessRank(readiness: ResultReadiness | null): number | null` — `READINESS_RANK` lookup;
     `null` for `not_assessed` and `null`.
   - `compareSkillsByFocus(a, b)` — implements the contract's three-step ordering (readiness rank →
     lower mean attribute `prob` → `SKILL_ORDER` index) over a minimal structural input
     `{ skill, readiness, meanProb: number | null }`. It returns an ORDER, never a score; no caller
     can obtain a percentage from it.
3. Barrel: export `CEFR_LADDER`, `CEFR_TICK_COUNT`, `SKILL_ORDER`, `READINESS_RANK`,
   `CEFR_DESIGN_TICK_LABELS` and the five functions from `src/modules/results/index.ts`.
4. Add the e2e case to `tests/e2e/w3-result-view-contract.spec.ts`: fetch the API's own vocabulary
   through a live result — assert every `cefr_band` value the live API returns for the seeded
   parent's results is a member of `CEFR_LADDER`, and assert `CEFR_LADDER` does not contain `'C2'`
   while it does contain `'pre_A1'`. Import the constant with `@/modules/results/constants/vocab.constants`.

## Project rules

- `schooltest-web/.claude/rules/module-pattern.md` — constants/config objects live in
  `constants/x.constants.ts`; pure utilities in `lib/x.ts`; kebab-case file names; UPPER_SNAKE_CASE
  constant names (`CLAUDE.md` §4).
- `schooltest-web/.claude/rules/quality.md` — 200-line cap; no `any`; no unsolicited comments —
  the comments called for above are contract citations, which the mission explicitly requires.
- `.qa/CONTRACTS.md` "No composite scores" governing rule + `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:25,46,193`
  — nothing in this file may compute or expose a CEFR score, a percentage, or a cross-skill composite.
- `.qa/DECISIONS.md` **D-SCOPE-1.4** — "Do not invent" is absolute.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/w3-result-view-contract.spec.ts` passes, including the new
  `'CEFR ladder constant matches the API result enum'` case run against the LIVE API.
- `getCefrStageIndex` agrees with the live data: the same spec asserts, for every official result
  the seeded parent can reach, that `CEFR_LADDER[getCefrStageIndex(view.cefr_band)!] === view.cefr_band`
  whenever `cefr_band` is non-null. (The stronger client↔server drift alarm —
  `getCefrStageIndex(child.cefrBand) === child.cefrStageIndex` against `GET /api/my/progress` — is
  owned by task 095, which is where that endpoint's hook lands.)
- `grep -rn "'C2'" src/ --include=*.tsx` → zero hits (the design label array is exported from a
  `.ts` constant for the sweep to assert against, and never rendered).
- `grep -rn "as any\|: any\|@ts-ignore" src/modules/results/` → zero hits.
- Non-UI slice: no motion, viewport or axe criteria.
- No user-facing string added → all six locale catalogs untouched and still key-identical.
- Playwright baseline unchanged (157 passed / 1 known W9 red).

## Assumptions

- The API's `cefr_band` enum has not changed since intake. The e2e assertion above is what catches it
  if it has — that is the point of the check, not an assumption to be waved through.

## Evidence

<!-- filled in as the task runs -->
