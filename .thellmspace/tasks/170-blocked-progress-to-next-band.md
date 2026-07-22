---
id: 170
title: BLOCKED — `Progress to {nextLevel} 68%` requires a CEFR scorer the product forbids
layer: ui
kind: verify
slice: Refusal record for the band-progress percentage on both the children card (cell 1) and the child-detail KPI strip (cell 2).
target: (no source change) .qa/design/screens/portal--my-children-list.html L23 · .qa/design/screens/portal--child-detail.html L20
contract: C-CONTRACTS B-4
design: .qa/design/spec/02-portal-children.md §A.5 cell 1, §B.2 KPI 2, §METRIC INVENTORY rows "A card · to {nextLevel}" and "B KPI · Progress to {nextLevel}"
status: BLOCKED
depends_on: ["168", "181"]
---

## Objective

Record that the "68% of the way to B2" metric is refused, and that the level ladder (task `183`)
carries the same intent honestly as a discrete band position.

## Contract

`.qa/CONTRACTS.md` **B-4**, verbatim:

> | **B-4** | `Progress to {next} 68%` | `portal--my-children-list.html:23`,
> `portal--child-detail.html:20` | Requires band-entry thresholds and a CEFR score.
> `DOC0_PLATFORM_PRD_V2.md:193` — "Do not build a CEFR scorer". CEFR is a Crosswalk lookup, not a scale. |

Supporting clauses:
- `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:193` — "Do not build a CEFR scorer; do not build any
  cross-skill composite."
- `docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:192` — "label, ACARA phase, CEFR, and readiness are **not**
  computed by R. R returns probabilities; Strapi derives display values via the versioned Crosswalk."
- `.qa/CONTRACTS.md` C-DASH-HOUSEHOLD: `cefrStageIndex` is "0-based index into CEFR_LADDER" — a
  position, deliberately not a distance.

## Design source

`portal--my-children-list.html` L23 (`{{k.progress}}%` / `to {{k.nextLevel}}`, seeds 68/34) and
`portal--child-detail.html` L20 (`Progress to {{kid.nextLevel}}` / `{{kid.progress}}%`).
`.qa/design/spec/02-portal-children.md` §METRIC INVENTORY states the computation the design assumes:
"% of the way from current CEFR band to the next; **needs band-entry score thresholds + latest
composite score**" — both of which the product docs forbid building.

## Files

None.

## Depends on

- `168` and `181` — the two slots this metric would have occupied must already be filled by real
  metrics before the refusal is closed.

## Steps

1. Confirm the honest carriers are live: the six-tick ladder (task `183`) shows the band the child is
   at, with future bands rendered as future — the discrete truth the percentage was approximating.
2. Confirm no client helper computes a band distance: grep for `nextLevel`, `nextBand`,
   `progressToNext`, `bandProgress` across `src/` and expect zero hits.
3. Terminal state stays `BLOCKED`.

## Project rules

- `.qa/PLAN.md` finding 3 and Definition of done.
- `.qa/DECISIONS.md` D-SCOPE-1.4.

## Done criteria

- Zero hits for `nextLevel|nextBand|progressTo|bandProgress` in `src/`.
- Playwright: neither `/dashboard/children` nor a child detail page renders a `%` next to a band.
- The ladder from task `183` is visible on the detail page in the same screenshot.

## Assumptions

None.

## Evidence

<!-- BLOCKED: B-4. Record the grep output and the ladder screenshot that replaces the percentage. -->
