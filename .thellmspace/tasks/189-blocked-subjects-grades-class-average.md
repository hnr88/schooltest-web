---
id: 189
title: BLOCKED — subject bars, letter grades and class averages are not this product's domain
layer: ui
kind: verify
slice: Refusal record for every Math/Danish/English element, the letter grade, the score donut and the class-average chart.
target: (no source change) .qa/design/screens/app--child-profile.html L38-49 · .qa/design/screens/app--result-detail.html L19-59
contract: C-CONTRACTS B-6
design: .qa/design/spec/02-portal-children.md §C.3, §C.4, §D.2, §D.4, §D.5, §D.6
status: BLOCKED
depends_on: ["186", "190"]
---

## Objective

Record that the two App-chrome children screens are a generic school-test composition, and that the
honest equivalents in this product are the per-attribute mastery map and the official-result stream.

## Contract

`.qa/CONTRACTS.md` **B-6**, verbatim:

> | **B-6** | Subject bars Math/Danish/English, class average, letter grade | `app--child-profile.html`,
> `app--result-detail.html` | These slices are a generic school-test composition, not SchoolTest's
> domain. The product measures four English skills (reading/listening/speaking/writing) against
> CEFR/ACARA — there are no subjects, no letter grades, no class averages in the data model. |

Supporting clauses:
- `docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:281-304` — the Result record has `scope`, `skill`,
  `attributes`, `display_label`, `acara_phase`, `cefr_band`, `readiness`, `low_confidence`,
  `effort_valid`, `previous_result`, `productive_scores`, `status`, `destination`, `published_at`.
  There is no subject, no grade letter, no cohort field.
- `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:25` — "no cut scores and no admit/reject decision".

## Design source

Refused elements, enumerated so none is silently smuggled back in:
- §C.3 SubjectCard x3 (`Math 91%`, `Danish 85%`, `English 74%`) and their captions
  (`6 tests · strongest subject`).
- §C.4 TestHistory rows keyed by `Math · Fractions & decimals` etc., its `Score` column percentages,
  and its `SCHEDULED` status (also B-1: no scheduling model).
- §D.2 ScoreDonut (`92%` conic sweep), `Correct 22/24`, `Of grade 4 Top 12%`, `Grade A`.
- §D.4 PerformanceByTopic percentages, §D.5 ScoreHistoryChart + `Class average 78%` +
  `Emma's average 86% · +8 pts`, §D.6 RecommendedNext (a recommendation engine that does not exist).

## Files

None.

## Depends on

- `186` (per-attribute mastery map) and `190` (official result rows) — the honest replacements.

## Steps

1. Confirm the child detail screen carries the mastery map and the result stream in place of the
   subject/topic/chart blocks.
2. Grep `src/modules/children` for `math|danish|subject|letterGrade|classAverage|donut|topic` —
   expect zero user-facing hits.
3. Terminal state stays `BLOCKED`.

## Project rules

- `.qa/DECISIONS.md` D-SCOPE-1.4; `.qa/PLAN.md` finding 3.

## Done criteria

- Zero user-facing hits for the grep above.
- Playwright: no element on any children surface renders a subject name, a letter grade, a class
  average or a score donut.
- Evidence carries the screenshot of the mastery map + result stream that occupy the space.

## Assumptions

None.

## Evidence

<!-- BLOCKED: B-6. -->
