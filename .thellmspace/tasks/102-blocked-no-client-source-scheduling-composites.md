---
id: "102"
title: BLOCKED — no query hook may be authored for the scheduling and composite-score metrics
layer: data
kind: verify
slice: The explicit, evidenced refusal to build a client data source for design metrics B-1 … B-6
target: (no source file) — .qa/fragments/w3.json · this task file's Evidence section
contract: C-DASH-HOUSEHOLD (by exclusion) · .qa/CONTRACTS.md BLOCKED table B-1 … B-6
design: .qa/design/screens/portal--main.html (L34, L120-140) · .qa/design/screens/portal--my-children-list.html (L23, L27) · .qa/design/screens/portal--child-detail.html (L20) · .qa/design/screens/app--child-profile.html (L29-31) · .qa/design/screens/app--result-detail.html
status: BLOCKED
depends_on: []
---

## Objective

W3's job is to author one typed query hook per backend operation. Six of the design's metrics have
**no backend operation to mirror**, and never will under this product's rules. This task exists so
that absence is a recorded, evidenced refusal with a named blocking rule — not a gap a later agent
fills with a plausible-looking number.

**Terminal state: BLOCKED.** No file in `src/**` is created or edited by this task.

## Contract

Quoted verbatim from `.qa/CONTRACTS.md` → **BLOCKED — design metrics with no honest data source**:

| id | Design metric | Slice | Why blocked |
|---|---|---|---|
| **B-1** | `coming up` hero stat (`2`) | `portal--main.html:34` | No scheduling model exists anywhere: no `scheduled_at`/`due_at`/`assignment`/`sitting` field on any content-type; `class` is only `{name, year_band, teacher, students}`. Nothing to count. |
| **B-2** | "Coming up" list (3 dated rows) | `portal--main.html:120-140` | Same as B-1. |
| **B-3** | `last result` `74%` | `portal--my-children-list.html:27` | A single percentage across a sitting is a composite score. `DOC0_PLATFORM_PRD_V2.md:25,46` — "no cut scores", "no cross-skill composite score anywhere in the system". The slot renders CEFR band + readiness + date instead. |
| **B-4** | `Progress to {next} 68%` | `portal--my-children-list.html:23`, `portal--child-detail.html:20` | Requires band-entry thresholds and a CEFR score. `DOC0_PLATFORM_PRD_V2.md:193` — "Do not build a CEFR scorer". CEFR is a Crosswalk lookup, not a scale. |
| **B-5** | `Avg. score 86%`, `Trend +4%`, `Of grade Top 15%` | `app--child-profile.html:29-31` | Composite + cohort percentile. No cohort/percentile data is parent-reachable and composites are forbidden. |
| **B-6** | Subject bars Math/Danish/English, class average, letter grade | `app--child-profile.html`, `app--result-detail.html` | These slices are a generic school-test composition, not SchoolTest's domain. The product measures four English skills (reading/listening/speaking/writing) against CEFR/ACARA — there are no subjects, no letter grades, no class averages in the data model. |

And the governing rule that forecloses a client-side workaround, quoted from the same file:

> **No composite scores.** `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:25,46,193` forbid cut scores,
> cross-skill composites and any computed CEFR score. No field below returns one.

Deriving any of B-3 … B-6 **on the client** from data the parent CAN reach would produce exactly the
forbidden composite, one layer further from review. That is the specific temptation this task blocks.

**Cross-reference: `.qa/CONTRACTS.md` AMENDMENT A1 — `C-DASH-HOUSEHOLD` v2** applies the identical
logic to the endpoint itself: v1 of C-DASH-HOUSEHOLD served a per-child `cefrBand`/
`cefrStageIndex`/`acaraPhase`, which is the same forbidden cross-skill composite one layer up (a
per-child LEVEL rather than a per-sitting PERCENTAGE). AMENDMENT A1 deletes those three fields and
records the refusal as new BLOCKED row **B-9**. The client-side temptation this task blocks
(deriving B-3…B-6 from reachable data) extends to B-9 too: no client helper may reduce a child's
`skills[]` back down to one band.

## Design source

- `.qa/design/screens/portal--main.html:34` — hero stat cell 2: value `2`, label `coming up`,
  value `24px/700/-0.02em/#FFFFFF`, label `12px/400/#8FA3C7`. The design's own data is internally
  inconsistent here: the "Coming up" list below it renders **3** rows (25 Jul, 29 Jul, 04 Aug)
  against a stat of `2` (`.qa/design/spec/01-portal-dashboard.md` §4.2).
- `.qa/design/screens/portal--main.html:120-140` — "Coming up" card, three dated rows with a
  `56px` date block and a `Full calendar →` link whose hover is `#2563EB`.
- `.qa/design/screens/portal--my-children-list.html:23,27` — MetricStrip cells 1 and 3:
  `{{k.progress}}%` / `to {{k.nextLevel}}`, and `{{k.lastScore}}` / `last result`; values
  `20px/700/-0.01em/#0E2350`, labels `12px/#7C8698`.
- `.qa/design/screens/portal--child-detail.html:20` — KPI 2 `Progress to {{kid.nextLevel}}` / `68%`.
- `.qa/design/screens/app--child-profile.html:29-31` — `Avg. score 86%`, `Trend +4%`, `Of grade Top 15%`.

## Files

None. This task creates and edits **no source file**. Its output is:
- `status: BLOCKED` in `.qa/fragments/w3.json`;
- the Evidence section below, filled with the reproduction commands and their real output.

## Depends on

None. The blocking rules are product documents and schema facts that hold independently of every
other task in this mission.

## Steps

1. Re-verify the blocking facts against the CURRENT repo, so the refusal is evidence and not a quote:
   - `grep -rn "scheduled_at\|due_at\|dueAt\|scheduledAt\|assignment\|sitting" /home/hnr/Code/schooltest/schooltest-api/src/api/*/content-types/*/schema.json`
     → expect zero hits (B-1/B-2).
   - `cat /home/hnr/Code/schooltest/schooltest-api/src/api/class/content-types/class/schema.json`
     → confirm the attribute set is `{name, year_band, teacher, students}` with no temporal field.
   - `grep -n "cut score\|composite\|CEFR scorer" /home/hnr/Code/schooltest/docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md`
     → capture lines 25, 46, 193 verbatim (B-3/B-4/B-5).
   - `grep -rn "percentile\|cohort\|class_average\|letter_grade\|subject" /home/hnr/Code/schooltest/schooltest-api/src/contracts/`
     → expect no parent-reachable field (B-5/B-6).
2. Confirm the W3 schemas carry no field for any of them:
   `grep -rniE "comingup|coming_up|scheduled|dueat|avgscore|percentile|lettergrade|classaverage|subject" src/modules/dashboard/schemas/ src/modules/children/schemas/ src/modules/results/schemas/`
   → zero hits.
3. Confirm no catalog string exists for them (task 101 must not have added one):
   `grep -niE "coming up|avg\. score|of grade|class average" src/i18n/messages/*.json` → zero hits.
4. Record where the honest substitutes live, so the W5/W6 builders are not left guessing:
   - B-1/B-2 → the hero's third stat cell and the "Coming up" card are handled by **W5**, which
     removes the cell rather than rendering a zero (a `0` is a claim that nothing is scheduled; the
     truth is that scheduling does not exist).
   - B-3 → `cefrBand` + `readiness` + `publishedAt` from C-CHILD-RESULT-HISTORY (task 097).
   - B-4 → the six-step ladder position, computed client-side PER SKILL via `getCefrStageIndex`
     (task 091) over each `children[].skills[]` entry's own `cefrBand` — not a per-child
     `cefrStageIndex`, which AMENDMENT A1 deletes — with no "progress to next".
   - B-5/B-6 → out of scope entirely (`.qa/DECISIONS.md` D-SCOPE-2: `app--child-profile` and
     `app--result-detail` are the teacher/school and generic-school compositions).
   - B-9 (per-child `Level {band}` pill, AMENDMENT A1) → superseded by the per-skill bands in
     `skills[]`; no client helper collapses them back to one value.
5. Write the outcome into Evidence, then set `status: BLOCKED` in the fragment. Do not open a
   follow-up task, do not add a placeholder hook, do not add a feature flag.

## Project rules

- `.qa/DECISIONS.md` **D-SCOPE-1.4** — "Do not invent" is absolute. A design screen with no data
  behind it is not to be faked.
- `.qa/RULES.md` [schooltest-web] law 5 — when in doubt, in this unattended run, mark BLOCKED with
  the precise gap.
- `.qa/PLAN.md` "Definition of done" — a task is done on real data or it is not done.
- `.qa/CONTRACTS.md` "No composite scores" governing rule.

## Done criteria

- `status: BLOCKED` in both this file's frontmatter and `.qa/fragments/w3.json`, with B-1 … B-6 named.
- Every grep in Steps 1–3 recorded in Evidence with its ACTUAL output (zero-hit greps included —
  a blank result is the evidence).
- `git status --porcelain src/` shows no change attributable to this task.
- No query hook, schema field, constant, catalog key or TODO comment exists anywhere in `src/**` for
  any of B-1 … B-6.
- The verifier (a different agent) independently reproduces the greps and confirms the same absence.
- Non-UI, non-writing slice: no motion / viewport / axe / persistence criteria.

## Assumptions

None. Every claim above is a citation to a file in this workspace, re-checked by the Steps.

## Evidence

<!-- filled in as the task runs: the grep commands from Steps 1-3 and their verbatim output -->
