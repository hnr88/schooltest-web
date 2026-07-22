---
id: "099"
title: Derive the honest band delta ("Since joining", per-row change) from the result history
layer: data
kind: build
slice: The sanctioned replacement for the design's `+6% vs May` and `+2 levels` — CEFR ladder steps, never percentages
target: src/modules/children/lib/result-history-delta.ts · src/modules/children/types/children.types.ts · src/modules/children/index.ts · tests/e2e/w3-child-result-history-contract.spec.ts
contract: C-CHILD-RESULT-HISTORY · C-DASH-HOUSEHOLD
design: .qa/design/spec/02-portal-children.md#B.2 KPI strip (row 5 `Since joining`) · #B.6 Component: RecentResults (delta column)
status: TODO
depends_on: ["097", "091"]
---

## Objective

The design shows two deltas: a per-row `+6% vs May` and a KPI `Since joining +2 levels`. Percentages
are forbidden (`.qa/CONTRACTS.md` B-4, `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:25,46,193`); CEFR
ladder steps are not. Derive the step delta from the real history rows, including the design's own
"first attempt" case, and give W6 a model it can render without doing arithmetic in JSX.

## Contract

`.qa/CONTRACTS.md` → **C-CHILD-RESULT-HISTORY**, the fields consumed:

- `cefrBand` (nullable), `skill` (null when `scope='combined'`), `publishedAt` (nullable),
  `createdAt` (ALWAYS present), and
  `previousResultDocumentId` — quoted: *"nullable — enables the design's `+N vs {month}` delta"*.
- Sort is `published_at_field:desc, createdAt:desc` (newest first); the helper must not re-sort.

And **C-DASH-HOUSEHOLD**'s governing rule:

> **No composite scores.** … forbid cut scores, cross-skill composites and any computed CEFR score.

Binding consequence: every value this file emits is either a **signed integer count of ladder steps**
or `null`. There is no float, no percentage, no "score". A delta may only be computed between two
results **of the same `skill`** — comparing a reading band to a writing band would be exactly the
cross-skill composite the docs ban.

## Design source

`.qa/design/spec/02-portal-children.md`:

**§B.2 KPI strip, row 5** (`portal--child-detail.html` L26): label `Since joining`, value
`{{kid.growth}}` → `+2 levels`, rendered blue (`#2563EB` → `--color-brand-600`). Per the spec's
metric table (line 503) its real derivation is `currentBandIndex − bandIndexAtSignup`. That is a
ladder-step count — buildable, and this task builds it.

**§B.6 RecentResults delta column** (`portal--child-detail.html` L67):
`font-size:12px; font-weight:600; flex:none; width:90px; text-align:right`, colour from
`r.deltaColor`. Design examples: `+6% vs May`, `+3% vs Jun`, `+4% vs May`, and
**`first attempt`** rendered in neutral grey `#9AA6B8` (portal muted-foreground-2) instead of blue.
The spec states plainly: *"`deltaColor` is a neutral-grey (`#9AA6B8`) when there is no prior attempt,
blue otherwise. No negative-delta example exists in the design — see UNKNOWNS."*

What this task delivers against that:
- `+6%` → **refused (B-4)**. The row's delta becomes `+1 band` / `no change` / `-1 band`, phrased by
  task 101's catalog keys.
- `vs May` → the month of the PREVIOUS result, taken from `previousResultDocumentId`'s row when that
  row is in the loaded history; `null` when it is not (the helper never fetches).
- `first attempt` → the `previousResultDocumentId === null` case, kept exactly, neutral tone.
- The undesigned **negative** delta gets an explicit tone (`down`) so W6 has a token to bind rather
  than inventing one at render time.

## Files

Create:
- `src/modules/children/lib/result-history-delta.ts`

Touch:
- `src/modules/children/types/children.types.ts` — add `ResultBandDelta`, `ResultDeltaTone`.
- `src/modules/children/index.ts` — export the helpers and types.
- `tests/e2e/w3-child-result-history-contract.spec.ts` — add one `test()`
  (`'band delta is a ladder step count over the live history'`).

`src/modules/children/lib/` already contains `child-results.ts` and `child-skills.ts` — do NOT edit
them (they serve the existing ≤5-row progress surface, which stays working per D-SCOPE-3). Add a new
file.

## Depends on

- **097** — `ChildResultHistoryRow` type.
- **091** — `getBandDelta` / `CEFR_LADDER` from `@/modules/results` (barrel import, cross-module rule).

## Steps

1. Types in `types/children.types.ts`:
   ```
   export type ResultDeltaTone = 'up' | 'flat' | 'down' | 'first' | 'unknown';
   export interface ResultBandDelta {
     steps: number | null;          // signed ladder steps; null when not computable
     tone: ResultDeltaTone;
     previousDocumentId: string | null;
     previousAt: string | null;     // ISO — previous row's publishedAt ?? createdAt
   }
   ```
2. `lib/result-history-delta.ts`, pure:
   - `getRowBandDelta(row: ChildResultHistoryRow, rows: ChildResultHistoryRow[]): ResultBandDelta`
     - `previousResultDocumentId === null` ⇒ `{ steps: null, tone: 'first', previousDocumentId: null, previousAt: null }`
       (the design's `first attempt`).
     - previous row not present in `rows` (it is on another page) ⇒ `tone: 'unknown'`, `steps: null`,
       `previousDocumentId` populated so W6 can link to it. **Never fetch from a lib function.**
     - previous row found but either band is `null` ⇒ `tone: 'unknown'`, `steps: null`.
     - previous row found with a DIFFERENT `skill` ⇒ `tone: 'unknown'`, `steps: null`, and the reason
       is documented in one comment line: a cross-skill comparison is a banned composite.
     - otherwise `steps = getBandDelta(previous.cefrBand, row.cefrBand)`; `tone = steps > 0 ? 'up'
       : steps < 0 ? 'down' : 'flat'`; `previousAt = previous.publishedAt ?? previous.createdAt`.
   - `getSinceJoiningDelta(rows: ChildResultHistoryRow[], skill?: Skill): ResultBandDelta` —
     the §B.2 KPI. Over the rows of ONE skill (or, when `skill` is omitted, only when every banded row
     shares a single skill — otherwise `tone: 'unknown'`), compare the OLDEST banded row's band with
     the NEWEST banded row's band. Rows arrive newest-first, so this reads the last and first banded
     entries; it does not re-sort. `previousAt` = the oldest row's `publishedAt ?? createdAt`.
     Documented limitation, stated in the file and in Evidence: this is "since the oldest result on
     the loaded pages", which equals "since joining" only when the whole history is loaded — W6 must
     therefore request it with a page size covering `meta.pagination.total`, or label it
     `since {date}`. No estimate is invented to cover the gap.
   - Nothing in this file formats a string. All phrasing is task 101's catalog keys, chosen by `tone`.
3. Barrel exports.
4. e2e case, over the LIVE history for the seeded child:
   - every returned `ResultBandDelta.steps` is `null` or an integer in `[-5, 5]` (the ladder has 6
     rungs, so no larger step exists);
   - a row whose `previousResultDocumentId` is `null` yields `tone: 'first'`;
   - `getSinceJoiningDelta` on a single-skill filtered read (`?skill=reading`) returns a `steps`
     value equal to `CEFR_LADDER.indexOf(newestBand) - CEFR_LADDER.indexOf(oldestBand)`, computed
     independently in the spec from the raw payload.

## Project rules

- `schooltest-web/.claude/rules/module-pattern.md` — pure utilities in `lib/`, types in `types/`;
  no business logic in components; cross-module import via the `@/modules/results` barrel.
- `schooltest-web/.claude/rules/i18n.md` — never hardcode a user-facing string; this file returns a
  `tone` enum, never English copy.
- `schooltest-web/.claude/rules/quality.md` — 200-line cap; no `any`.
- `.qa/CONTRACTS.md` **B-3 / B-4** and `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:25,46,193` — no
  percentage, no cut score, no computed CEFR score, no cross-skill composite.
- `.qa/DECISIONS.md` **D-SCOPE-1.4** — no invention: an uncomputable delta is `unknown`, never zero.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/w3-child-result-history-contract.spec.ts` passes including the
  new delta case, computed over LIVE rows.
- `grep -rniE "%|percent|toFixed|\* ?100" src/modules/children/lib/result-history-delta.ts` → zero hits.
- Evidence shows, for the seeded child, the actual `{ steps, tone, previousAt }` per row and the
  `getSinceJoiningDelta` result, plus the raw bands they were derived from — so a reviewer can check
  the arithmetic by eye.
- `grep -rn "as any\|: any\|@ts-ignore" src/modules/children/lib/result-history-delta.ts` → zero hits.
- `src/modules/children/lib/child-results.ts` and `child-skills.ts` unchanged (`git diff` proves it).
- No user-facing string → six catalogs untouched, still key-identical.
- Non-UI slice: no motion / viewport / axe criteria.
- Playwright baseline unchanged (157 passed / 1 known W9 red).

## Assumptions

- The seeded child has at least two official results in one skill. If not, the spec asserts the
  `first`/`unknown` branches only and Evidence records the gap explicitly; the verifier may create a
  second official result through the normal API flow, never by SQL insert.

## Evidence

<!-- filled in as the task runs -->
