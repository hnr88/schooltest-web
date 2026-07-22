---
id: 188
title: BLOCKED — `Avg. score`, `Trend` and `Of grade Top 15%` are a composite and a cohort percentile
layer: ui
kind: verify
slice: Refusal record for the app-chrome child-profile StatCluster.
target: (no source change) .qa/design/screens/app--child-profile.html L29-31
contract: C-CONTRACTS B-5
design: .qa/design/spec/02-portal-children.md §C.2 StatCluster, §METRIC INVENTORY rows "C hero"
status: BLOCKED
depends_on: ["181", "185"]
---

## Objective

Record why the three hero stats of `app--child-profile.html` are not built, and which real blocks
occupy the equivalent screen space.

## Contract

`.qa/CONTRACTS.md` **B-5**, verbatim:

> | **B-5** | `Avg. score 86%`, `Trend +4%`, `Of grade Top 15%` | `app--child-profile.html:29-31` |
> Composite + cohort percentile. No cohort/percentile data is parent-reachable and composites are
> forbidden. |

Supporting clauses:
- `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:46` — "There is **no cross-skill composite score** anywhere
  in the system."
- `DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:394` — the v1 cross-skill comparison schema "is deleted. It
  averaged probabilities from different models and thresholds into numbers that looked precise and
  meant little."
- No parent-reachable endpoint in `.qa/CONTRACTS.md` or `.qa/intake/api-inventory.md` returns a class,
  cohort or percentile; `C-PARENT-CHILD-PROGRESS` is explicitly scoped to the caller's own child and
  its projection excludes `teacher` and `class`.

## Design source

`app--child-profile.html` L28-31 (§C.2 StatCluster): `86%` / `Avg. score`, `+4%` (`#16A34A`) / `Trend`,
`Top 15%` / `Of grade`. §METRIC INVENTORY names the computations: "Mean of all completed test scores",
"Recent-window avg minus prior-window avg", "Child's percentile rank within the grade cohort" — all
three require data this product deliberately does not produce or expose to a parent.

## Files

None.

## Depends on

- `181` (the KPI strip) and `185` (the Skills card) — the real blocks that occupy this space.

## Steps

1. Confirm the child detail screen shows band / phase / streak / last-assessed / band-movement and the
   four readiness rows in place of the three refused stats.
2. Grep `src/modules/children` for `avg|average|percentile|trend|cohort|top \d` — expect zero
   user-facing hits.
3. Terminal state stays `BLOCKED`.

## Project rules

- `.qa/DECISIONS.md` D-SCOPE-1.4; `.qa/PLAN.md` finding 3.

## Done criteria

- Zero user-facing hits for the grep above.
- Playwright: `/dashboard/children/{documentId}` contains no `Top ` + `%` percentile string and no
  average/trend stat.
- Evidence carries the screenshot of the honest blocks in that screen region.

## Assumptions

None.

## Evidence

<!-- BLOCKED: B-5. -->
