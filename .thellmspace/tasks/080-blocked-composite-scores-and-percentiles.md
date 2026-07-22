---
id: 080
title: BLOCKED — no backend may serve composite scores, band-progress percentages or cohort percentiles (B-3, B-4, B-5, B-6)
layer: backend
kind: verify
slice: The percentage/score/grade metrics — refused on product-doc authority, with the sanctioned substitute named
target: no file is created — this task's product is the recorded refusal and the substitute vocabulary for W5/W6
contract: C-DASH-HOUSEHOLD · C-CHILD-RESULT-HISTORY (BLOCKED rows B-3, B-4, B-5, B-6)
design: .qa/design/screens/portal--my-children-list.html:23,27 · portal--child-detail.html:20 · app--child-profile.html:29-31 · app--result-detail.html
status: BLOCKED
depends_on: []
---

## Objective

Four of the design's most prominent numbers — `74%`, `68%`, `86%`, `+4%`, `Top 15%`, letter grades,
subject bars — are forbidden by the product's own specification. W2 is the wave that would have
computed them; this task refuses them in writing and names the sanctioned vocabulary that takes
their place, so W5/W6 build the design's LAYOUT with honest content rather than quietly dropping
the slots.

## Contract

`.qa/CONTRACTS.md` → **BLOCKED**, quoted verbatim:

| id | Design metric | Slice | Why blocked |
|---|---|---|---|
| **B-3** | `last result` `74%` | `portal--my-children-list.html:27` | A single percentage across a sitting is a composite score. `DOC0_PLATFORM_PRD_V2.md:25,46` — "no cut scores", "no cross-skill composite score anywhere in the system". The slot renders CEFR band + readiness + date instead. |
| **B-4** | `Progress to {next} 68%` | `portal--my-children-list.html:23`, `portal--child-detail.html:20` | Requires band-entry thresholds and a CEFR score. `DOC0_PLATFORM_PRD_V2.md:193` — "Do not build a CEFR scorer". CEFR is a Crosswalk lookup, not a scale. |
| **B-5** | `Avg. score 86%`, `Trend +4%`, `Of grade Top 15%` | `app--child-profile.html:29-31` | Composite + cohort percentile. No cohort/percentile data is parent-reachable and composites are forbidden. |
| **B-6** | Subject bars Math/Danish/English, class average, letter grade | `app--child-profile.html`, `app--result-detail.html` | These slices are a generic school-test composition, not SchoolTest's domain. The product measures four English skills (reading/listening/speaking/writing) against CEFR/ACARA — there are no subjects, no letter grades, no class averages in the data model. |

And the addendum's governing rule for **every** W2 surface:

> **No composite scores.** `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:25,46,193` forbid cut scores,
> cross-skill composites and any computed CEFR score. No field below returns one.

**Terminal state: BLOCKED.** No percentage field exists in C-DASH-HOUSEHOLD or
C-CHILD-RESULT-HISTORY, and none may be added.

## Design source

The exact slots being refused, so W5/W6 know precisely which pixels change content:

- **B-3, `last result`** — `.qa/design/spec/02-portal-children.md` §A.5 ChildCard MetricStrip cell 3
  (`portal--my-children-list.html` L27): value `{{k.lastScore}}` → `74%` / `61%`, label literal
  `last result`. Value `20px/700/#0E2350/-0.01em` (`--color-navy-900`), label
  `12px/#7C8698/margin-top:2px`. Also §B.2 KpiStrip cell 4 (`portal--child-detail.html` L24),
  value `24px/700/-0.01em/#0E2350`, label `12px/#9AA6B8/margin-bottom:6px`.
  Also §B.6 ResultRow score cell `B1 · 74%` (`14px/700/#0E2350`) — the `B1 ·` half is servable, the
  `74%` half is not.
- **B-4, `Progress to {next}`** — §A.5 cell 1: value `{{k.progress}}%` → `68%` / `34%`, label
  `to {{k.nextLevel}}` → `to B2`. §B.2 cell 2: label `Progress to {{kid.nextLevel}}`, value
  `{{kid.progress}}%`.
- **B-5** — `app--child-profile.html:29-31`: `Avg. score 86%`, `Tests taken 14`, `vs last month
  +4%` (`#16A34A` = `--color-success`) / `−2%` (`#DC2626` = `--color-destructive`, U+2212 minus),
  `Of grade Top 15%`. (`.qa/design/spec/01-portal-dashboard.md` §10.1 lists the same set for the
  `app--parent-overview.html` variant.)
- **B-6** — `app--child-profile.html` SubjectCard ×3 (Math/Danish/English) and
  `app--result-detail.html` PerformanceByTopic + ScoreHistoryChart, class average, letter grade.
  Note these two screens are additionally **out of scope** per `.qa/DECISIONS.md` D-SCOPE-2 (App
  chrome, not the parent portal) — B-6 is recorded so the composition is never ported into the
  portal as "inspiration".

**The sanctioned substitute vocabulary** (`.qa/PLAN.md` finding 3; `.qa/intake/docs-constraints.md`),
served by tasks 060-077 and to be rendered in the same geometry:

| Blocked slot | Renders instead | Served by |
|---|---|---|
| `last result` `74%` | `cefrBand` + `readiness` + `publishedAt` | 065 (`children[].skills[]`), 070 (history rows) |
| `Progress to B2` `68%` | `cefrStageIndex` position on the real 6-tick ladder, no percentage | 065 |
| `Avg. score 86%` | nothing — the cell is removed, not zeroed | — |
| `Trend +4%` | band-to-band change via `previousResultDocumentId` (`first attempt` when null) | 072 |
| `Of grade Top 15%` | nothing — no cohort data is parent-reachable | — |
| skill bar `78%` | per-attribute mastery map (`attributes`: `mastered/emerging/not_mastered/not_assessed`) + `readiness` | 075 |
| letter grade / class average / subject | nothing — not this product's domain | — |

## Files

None. This task creates no source file. Its outputs are this file's Evidence section and the
`status: BLOCKED` fragment entry.

## Depends on

Nothing.

## Steps

1. Re-verify the ban against the product docs directly, not against the digest:
   - read `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md` lines 25, 46 and 193 and paste them verbatim
     into Evidence;
   - `grep -rniE "cut score|composite|percentile|cohort" docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md`
     and record the hits.
2. Re-verify the data-side absence:
   - `grep -rniE "percent|pct|score(?!s_)|letter_grade|class_average|subject"
     schooltest-api/src/api/*/content-types/*/schema.json` — expect only `productive_scores`
     (a per-rubric json on `result`, not a composite) and nothing percentage-shaped;
   - `select column_name from information_schema.columns where table_name = 'results'` — confirm no
     percentage/score/percentile column;
   - confirm no cohort/percentile/class-average endpoint is parent-reachable
     (`.qa/intake/api-inventory.md` §3.2).
3. **Audit W2's own output for leakage.** Run against the three live endpoints with a parent JWT:
   `JSON.stringify(body)` must match NOTHING in
   `/\b(score|percent|pct|avg|average|composite|percentile|grade|subject|progressTo|trend)\b/i` —
   except the legitimate `productive_scores` key on the C-PARENT-RESULT-VIEW body, which is a
   per-rubric json defined by `src/contracts/results.ts:82` and is NOT a composite. Whitelist it
   explicitly and explain why in Evidence.
4. Record the substitute table above into Evidence as the binding instruction for W5/W6, and note
   that each of those waves' tasks must cite THIS task id as the authority for the substitution.

## Project rules

- `.qa/CONTRACTS.md` addendum governing rule "No composite scores".
- `.qa/DECISIONS.md` **D-SCOPE-1(3)** — "The dashboard's METRICS are a hard requirement: exactly the
  metrics the design shows, **computed from real API data**" — and **D-SCOPE-1(4)** — "'Do not
  invent' is absolute."
- `.qa/DECISIONS.md` **D-SCOPE-2** — `app--child-profile` / `app--result-detail` are App chrome and
  out of mission.
- `.qa/intake/docs-constraints.md` — the product's binding reporting vocabulary.
- `schooltest-api/CLAUDE.md` §2 rule 1 ("DO EXACTLY WHAT IS ASKED. No bonus features").

## Done criteria

- The three verbatim PRD lines (25, 46, 193) are pasted into Evidence, read from the file, not
  recalled.
- Every grep/SQL probe in step 2 is run and its actual output pasted into Evidence.
- The step-3 leakage audit passes against all three live W2 endpoints, with the
  `productive_scores` whitelist justified in writing.
- `status: BLOCKED` in this file's frontmatter and in `.qa/fragments/w2.json`.
- The substitute table is recorded as a binding instruction for W5/W6.
- **Zero source files created or modified.**
- No i18n change. No UI → motion / 375px / axe **n/a**.
- Baseline regression untouched.

## Assumptions

- `productive_scores` (json, per-rubric writing/speaking scores on `api::result.result`) is NOT a
  blocked composite: it is per-skill rubric evidence already defined in `src/contracts/results.ts`
  and already served to student/teacher/admin. It is exposed to a parent unchanged by task 075. If
  a later reading of Doc 0 shows otherwise, that is a new BLOCKED row, not a silent removal.
- `.qa/intake/docs-constraints.md` lists 6 rule conflicts; if any of them contradicts the reading
  above, the CONTRACT addendum and this task are both corrected per D-CONTRACT-1 rather than
  either being ignored.

## Evidence

**Blocking rules, quoted from `.qa/CONTRACTS.md`:**

> **B-3** — "A single percentage across a sitting is a composite score.
> `DOC0_PLATFORM_PRD_V2.md:25,46` — 'no cut scores', 'no cross-skill composite score anywhere in
> the system'. The slot renders CEFR band + readiness + date instead."
>
> **B-4** — "Requires band-entry thresholds and a CEFR score. `DOC0_PLATFORM_PRD_V2.md:193` — 'Do
> not build a CEFR scorer'. CEFR is a Crosswalk lookup, not a scale."
>
> **B-5** — "Composite + cohort percentile. No cohort/percentile data is parent-reachable and
> composites are forbidden."
>
> **B-6** — "These slices are a generic school-test composition, not SchoolTest's domain. The
> product measures four English skills (reading/listening/speaking/writing) against CEFR/ACARA —
> there are no subjects, no letter grades, no class averages in the data model."

<!-- PRD lines, probe output, leakage-audit output and the W5/W6 substitute table are appended here -->
