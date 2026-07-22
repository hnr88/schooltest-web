---
id: 169
title: BLOCKED — the design's `last result 74%` metric has no honest data source
layer: ui
kind: verify
slice: Refusal record for the `lastScore` percentage on the children list card and the "Last result" KPI cell on child detail.
target: (no source change) .qa/design/screens/portal--my-children-list.html L27 · .qa/design/screens/portal--child-detail.html L24
contract: C-CONTRACTS B-3
design: .qa/design/spec/02-portal-children.md §A.5 cell 3, §B.2 KPI 4, §METRIC INVENTORY rows "A card · last result" and "B KPI · Last result"
status: BLOCKED
depends_on: ["168"]
---

## Objective

Record, permanently and citably, that the design's `74%` "last result" value is refused rather than
fabricated, and point at the slice that replaces it.

## Contract

`.qa/CONTRACTS.md` **B-3**, verbatim:

> | **B-3** | `last result` `74%` | `portal--my-children-list.html:27` | A single percentage across a
> sitting is a composite score. `DOC0_PLATFORM_PRD_V2.md:25,46` — "no cut scores", "no cross-skill
> composite score anywhere in the system". The slot renders CEFR band + readiness + date instead. |

Supporting product clauses (`.qa/intake/docs-constraints.md` §3c):
- `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:25` — "There are **no cut scores and no admit/reject decision**".
- `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:46` — "Per-skill **mainstream-readiness indicators** replace
  any overall pass line. There is **no cross-skill composite score** anywhere in the system."
- `docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:304` — "**There are no cross-skill composite fields.**"

## Design source

`portal--my-children-list.html` L27: `{{k.lastScore}}` / `last result`, seed values `74%` / `61%`
(`Parent Portal.dc.html` L863, L881). `portal--child-detail.html` L24: `Last result` / `{{kid.lastScore}}`.
No API field anywhere in `.qa/intake/api-inventory.md` returns a per-sitting percentage to a parent;
`result.attributes[].prob` is a per-attribute mastery probability and is explicitly not a sitting score.

## Files

None. This task changes no source file. Its output is this record plus the Evidence block.

## Depends on

- `168` — the honest replacement (CEFR band + date cell) must exist before this refusal is closed, so
  the slot is filled with truth rather than left blank.

## Steps

1. Confirm the replacement is live: card cell 3 (task `168`) and KPI cell 4 (task `181`) show
   `cefrBand` + the `lastActivityAt`/`publishedAt` date + the skill's `readiness`.
2. Grep the whole `src/` diff of this wave for a `%` bound to a result value; expect zero hits.
3. Terminal state stays `BLOCKED`. It is never re-opened by adding a client-side computation.

## Project rules

- `.qa/PLAN.md` "Definition of done" + finding 3: "Nothing is faked."
- `.qa/DECISIONS.md` D-SCOPE-1.4 — "'Do not invent' is absolute."

## Done criteria

- No source file renders a per-sitting percentage for a result, proven by
  `grep -rnE "lastScore|last result|[0-9]+%" src/modules/children` returning zero result-percentage hits.
- Playwright: `/dashboard/children` and `/dashboard/children/{documentId}` contain no `%` character in
  any result-derived element.
- The card/KPI slot renders the CEFR band + readiness + date replacement instead of an empty box.

## Assumptions

None.

## Evidence

<!-- BLOCKED: B-3. Record here the grep output, the replacement screenshot, and the API response
     showing that no percentage field exists on the parent-reachable result shape. -->
