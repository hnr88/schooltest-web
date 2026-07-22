---
id: "093"
title: Turn the raw `attributes` map into an ordered per-attribute mastery view model
layer: data
kind: build
slice: The honest replacement for the design's invented skill percentages — per-attribute mastery probability, ordered, never composited
target: src/modules/results/lib/result-attributes.ts · src/modules/results/types/result.types.ts · src/modules/results/index.ts · tests/e2e/w3-result-view-contract.spec.ts
contract: C-PARENT-RESULT-VIEW
design: .qa/design/spec/02-portal-children.md#B.5 Component: SkillsCard (L43–55)
status: TODO
depends_on: ["090", "091"]
---

## Objective

`ResultView.attributes` is a `Record<string, {status, prob, prob_se?, items, delta} | 'not_assessed'>`
— unordered, sparse, and carrying a literal-string branch. Convert it, once, into a stable ordered
array the Skills surface can render, and expose the ONE internal aggregate the contract sanctions
(mean `prob`, for focus-skill tie-breaking only). No component may ever touch the raw map.

## Contract

`.qa/CONTRACTS.md` → **C-PARENT-RESULT-VIEW**, the consumed field:

> `attributes` (`{status, prob, prob_se?, items, delta}` per attribute code)

and the governing rule for the whole addendum:

> **No composite scores.** `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:25,46,193` forbid cut scores,
> cross-skill composites and any computed CEFR score. No field below returns one.

and, from **C-DASH-HOUSEHOLD**'s focusSkill derivation:

> Ties break on the lower mean of that result's per-attribute `prob` values in `attributes` (the
> primary datum per `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:45`). … **No percentage is ever
> surfaced to the user.**

Binding consequence for this file: `meanAttributeProb` exists, is exported for ordering, and is
typed so it cannot be mistaken for a display value — it returns a `number | null` on the 0..1 scale
and its docblock states it is ordering-only. Nothing in `src/**` may format it as a percentage; the
W11 sweep greps for that.

`'not_assessed'` (the literal string) means ZERO administered items — the api's CT-7 null discipline.
It maps to a row with `status: 'not_assessed'`, `prob: null`, `items: 0`, and is EXCLUDED from the
mean. It is never coerced to `0`, never to `0.5`, never dropped silently.

## Design source

`.qa/design/spec/02-portal-children.md` §B.5 **SkillsCard** (`portal--child-detail.html` L43–55) —
the exact geometry this model must be able to feed in W6:

- Rows wrapper: `display:flex; flex-direction:column; gap:13px`.
- SkillRow: `display:grid; grid-template-columns:76px 1fr 38px; align-items:center; gap:14px`.
- Name cell: `font-size:13px; color:#7C8698` (portal muted-foreground).
- Track: `height:6px; background:#EEF1F6; border-radius:99px`; fill `height:100%; border-radius:99px`,
  `background` = `#0E2350` (`--color-navy-900`) normally, `#2563EB` (`--color-brand-600`) for the
  focus/weakest row.
- Grade cell: `font-size:12px; font-weight:600; text-align:right`, tinted the same as the fill.

The design's `sk.pct` values (`78%`, `70%`, `52%`, `64%`) are **BLOCKED B-3/B-5 territory** and are
not produced by this helper. What the fill width binds to in W6 is `prob` for the per-attribute
rendering, and for a skill-level row the design's bar becomes a CEFR-band position on the six-step
ladder (task 091's `getCefrStageIndex`), which is the ordinal the product actually defines. This
task ships the data; W6 ships the binding.

## Files

Create:
- `src/modules/results/lib/result-attributes.ts`

Touch:
- `src/modules/results/types/result.types.ts` — add `ResultAttributeRow`.
- `src/modules/results/index.ts` — export the helper(s) and the type.
- `tests/e2e/w3-result-view-contract.spec.ts` — add one `test()`
  (`'attribute view model is total over the live result'`).

## Depends on

- **090** — `ResultAttributeEntry` / `ResultView` types.
- **091** — `SKILL_ORDER` and `compareSkillsByFocus`, which this file feeds with `meanProb`.

## Steps

1. Add to `types/result.types.ts`:
   ```
   export interface ResultAttributeRow {
     code: string;
     status: ResultAttributeStatus | 'not_assessed';
     prob: number | null;      // 0..1 mastery probability; null when not assessed
     probSe: number | null;
     items: number;            // administered item count; 0 when not assessed
     delta: number | null;
     isAssessed: boolean;
   }
   ```
   (`code` stays the API's attribute code verbatim — do not prettify it here; a code→label lookup is
   a locale concern and belongs to task 101's catalog keys.)
2. `lib/result-attributes.ts`, pure, no React, no I/O:
   - `toAttributeRows(attributes: ResultView['attributes']): ResultAttributeRow[]` —
     `null` in ⇒ `[]` out (status `scoring` and combined parents legitimately carry `null`).
     Object entries sorted by `code` with `localeCompare(undefined, { numeric: true })` so
     `attr_2` precedes `attr_10` and the row order is stable across renders and locales.
     The `'not_assessed'` literal branch produces `{ status:'not_assessed', prob:null, probSe:null,
     items:0, delta:null, isAssessed:false }`.
   - `getAssessedAttributeCount(rows): number`.
   - `meanAttributeProb(rows): number | null` — arithmetic mean of `prob` over rows where
     `isAssessed && prob !== null`; `null` when that set is empty. Docblock states, in one line,
     that this value exists ONLY to break focus-skill ties per C-DASH-HOUSEHOLD and must never be
     rendered.
   - `hasAnyEvidence(rows): boolean` — `true` when at least one row `isAssessed`. This is the
     predicate W6 uses to choose between the Skills card and the honest "not assessed yet" empty
     state (`Children.skillsPendingTitle` already exists in the catalogs).
3. Barrel export.
4. e2e case in `tests/e2e/w3-result-view-contract.spec.ts`: over the LIVE result fetched in task 090's
   case, assert `toAttributeRows(view.attributes).length === Object.keys(view.attributes ?? {}).length`
   (totality — no entry silently dropped), that every `'not_assessed'` entry became
   `{ isAssessed:false, items:0, prob:null }`, and that `meanAttributeProb` is either `null` or within
   `[0,1]`.

## Project rules

- `schooltest-web/.claude/rules/module-pattern.md` — pure utilities live in `lib/x.ts`, types in
  `types/x.types.ts`; components carry no business logic, so this transformation may not later be
  inlined into a card component.
- `schooltest-web/.claude/rules/quality.md` — 200-line cap; no `any`; narrow `unknown`.
- `.qa/CONTRACTS.md` "No composite scores" + `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:25,46,193`.
- `.qa/intake/docs-constraints.md` — the sanctioned reporting vocabulary (CEFR band lookup, ACARA
  phase, readiness, per-attribute mastery probability). Nothing outside it may be produced here.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/w3-result-view-contract.spec.ts` passes including the new
  totality case, run against a LIVE result body.
- `grep -rn "meanAttributeProb" src/ | grep -v "modules/results/lib/result-attributes.ts\|modules/results/index.ts"`
  returns only ordering call sites (task 091's comparator / task 095's household derivation) —
  never a formatting or rendering site.
- `grep -rniE "toFixed\(|\* ?100|percent" src/modules/results/` → zero hits.
- `grep -rn "as any\|: any\|@ts-ignore" src/modules/results/` → zero hits.
- Non-UI slice: no motion / viewport / axe criteria.
- No user-facing string → six catalogs untouched, still key-identical.
- Playwright baseline unchanged.

## Assumptions

- Attribute codes are opaque strings on the wire (the api types them `z.record(str, …)`), so the
  client sorts them lexicographically-numerically rather than by a curriculum order it does not have.
  If W2 exposes an ordered attribute list, this sort is replaced — not supplemented — in W6.

## Evidence

<!-- filled in as the task runs -->
