---
id: 079
title: BLOCKED — no backend can serve the "coming up" hero stat or the "Coming up" list (B-1, B-2)
layer: backend
kind: verify
slice: The dashboard's scheduling metrics — refused, with the reason recorded, not faked
target: no file is created — this task's product is the recorded refusal and the substitute instruction for W5
contract: C-DASH-HOUSEHOLD (BLOCKED rows B-1, B-2)
design: .qa/design/screens/portal--main.html:34 · .qa/design/screens/portal--main.html:120-140 · .qa/design/spec/01-portal-dashboard.md#42-metric-2--coming-up · #7-coming-up
status: BLOCKED
depends_on: []
---

## Objective

Record, as a first-class artefact of this wave rather than as an omission, that two of the
dashboard's twelve metrics have no data source anywhere in the API, and specify what W5 renders
instead. W2 is the wave that would have built the backend for them; this task is where that
decision is refused in writing.

## Contract

`.qa/CONTRACTS.md` → **BLOCKED — design metrics with no honest data source**, quoted verbatim:

| id | Design metric | Slice | Why blocked |
|---|---|---|---|
| **B-1** | `coming up` hero stat (`2`) | `portal--main.html:34` | No scheduling model exists anywhere: no `scheduled_at`/`due_at`/`assignment`/`sitting` field on any content-type; `class` is only `{name, year_band, teacher, students}`. Nothing to count. |
| **B-2** | "Coming up" list (3 dated rows) | `portal--main.html:120-140` | Same as B-1. |

Corroborating gap, `.qa/intake/api-inventory.md`:

> **G18 — No scheduling / upcoming-test data.** No content-type in `src/api/` models a scheduled or
> upcoming test. `sessions` are created on demand by `POST /api/sessions` (student/teacher/admin
> only). "Next test" is unrepresentable.

**Terminal state: BLOCKED.** No endpoint, no field, no placeholder, no "0" standing in for
"unknown". `.qa/DECISIONS.md` **D-SCOPE-1(4)**: "'Do not invent' is absolute. A design screen with
no data behind it is not to be faked."

## Design source

What is being refused, at full fidelity so a later wave can build it the moment a scheduling model
exists:

- **B-1, hero stat 2** (`.qa/design/spec/01-portal-dashboard.md` §4.2, `portal--main.html:34`):
  value **`2`**, sub-label literal **`coming up`**. Value `24px / 700 / -0.02em / #FFFFFF`,
  sub-label `12px / 400 / #8FA3C7`, `margin-top:3px`; cell is `flex:none` in the hero stat row
  (`gap:16px 24px; padding-top:28px`), separated by `<div style="width:1px;
  background:rgba(255,255,255,.12)">`. Panel is `#0E2350` (`--color-navy-900`),
  `border-radius:24px; padding:32px 34px`.
- **B-2, the "Coming up" card** (§7, `portal--main.html:121-144`): container `#FFFFFF;
  border-radius:24px; padding:8px 30px; box-shadow:0 1px 2px rgba(14,35,80,.04)`. Header
  `padding:22px 0 6px`, `<h2>` **`Coming up`** `19px/600/-0.01em/#0E2350`, action
  **`Full calendar →`** `13.5px/500/#7C8698` hover `#2563EB` (`--color-brand-600`). Event row
  `display:flex; align-items:center; gap:20px; padding:18px 0; border-bottom:1px solid #EEF1F6`;
  last row `padding:18px 0 24px`, no border. Date block `width:56px; text-align:center`, day
  `21px/700/#0E2350/line-height:1`, month `11px/600/.08em/#9AA6B8` uppercase 3-letter; vertical
  rule `width:1px; height:34px; background:#EEF1F6`; title `14.5px/600/#0E2350`; detail
  `13px/#7C8698`; status label either emphasis `12px/600/#2563EB` or quiet `12px/500/#7C8698`.
  Three rows: `25 JUL` / `29 JUL` / `04 AUG`.
- The design's own data is internally inconsistent: the hero says `2`, the list renders `3`
  (§4.2 cross-check). Recorded, not resolved.

## Files

None. This task creates no source file. Its outputs are:
- this file's Evidence section, and
- the `status: BLOCKED` fragment entry that `.qa/STATE.json` derives readiness from.

## Depends on

Nothing.

## Steps

1. Re-verify the blocking claim against the CODE, not against the doc — the doc could be stale:
   - `grep -rniE "scheduled_at|due_at|due_date|assignment|sitting|calendar|starts_at|window_open"
     schooltest-api/src/api/*/content-types/*/schema.json` → expected: no match.
   - `python3 -c` dump of every attribute of `api::class.class` → expected exactly
     `{name, year_band, teacher, students}` and nothing date-shaped.
   - `grep -rn "scheduled" schooltest-api/src/` → expected: nothing that models a future sitting.
   - `select column_name from information_schema.columns where table_name in
     ('sessions','classes','forms','students') and (column_name like '%due%' or column_name like
     '%sched%')` → expected: 0 rows.
2. If ANY of those finds a real scheduling column, this task is **not** blocked: reopen it, and the
   contract addendum's B-1/B-2 rows are corrected per `.qa/DECISIONS.md` **D-CONTRACT-1** (code is
   authoritative over contract docs).
3. Record the verified output in Evidence and set the task terminal state to BLOCKED.
4. **Write the substitute instruction for W5** into Evidence so the UI wave has an unambiguous
   directive rather than a hole:
   - the hero's third stat cell is **removed**, not zeroed — the row becomes two stats
     (`tests completed`, `practice this week`) with one separator. A `0` next to `coming up` is a
     factual claim ("you have nothing scheduled") that the system cannot make.
   - the "Coming up" card is **not rendered at all** on the dashboard. No skeleton, no empty state,
     no "nothing scheduled yet" — an empty state is also a claim.
   - the `Full calendar →` action is removed with it.
   - W5's task for this slot cites THIS task id as its authority.

## Project rules

- `.qa/DECISIONS.md` **D-SCOPE-1(4)** — "'Do not invent' is absolute."
- `.qa/DECISIONS.md` **D-CONTRACT-1** — code is authoritative over contract docs; every
  disagreement is recorded.
- `.qa/PLAN.md` finding 3 — "Some design metrics are forbidden by the product docs, and one has no
  data at all. … Those metrics are BLOCKED (`.qa/CONTRACTS.md` B-1 … B-8) and get the sanctioned
  vocabulary instead — … Nothing is faked."
- `schooltest-api/CLAUDE.md` §2 rule 24 — "WHEN IN DOUBT, ASK. Never assume schema fields."
  In this unattended run that becomes: mark BLOCKED with the precise gap (`.qa/RULES.md` law 5).

## Done criteria

- Every grep/SQL probe in step 1 is run and its **actual output pasted into Evidence** — a claim
  of "no scheduling model" that was not re-verified against code is not acceptable.
- `status: BLOCKED` in this file's frontmatter and in `.qa/fragments/w2.json`.
- The substitute instruction for W5 is written into Evidence, unambiguous enough that a W5 builder
  needs no further judgement.
- **Zero source files created or modified** — `git status` shows no `schooltest-api/src` change
  attributable to this task.
- No fabricated number reaches any contract, service, controller or test. `grep -rn "comingUp\|
  coming_up\|upcoming\|scheduled" schooltest-api/src/api/student/` returns nothing.
- No i18n change. No UI → motion / 375px / axe **n/a**.
- Baseline regression untouched (this task runs no code).

## Assumptions

None. The blocking reason is a verified absence, re-checked against code by step 1.

## Evidence

**Blocking rule, quoted from `.qa/CONTRACTS.md`:**

> **B-1** — `coming up` hero stat (`2`), `portal--main.html:34`: "No scheduling model exists
> anywhere: no `scheduled_at`/`due_at`/`assignment`/`sitting` field on any content-type; `class` is
> only `{name, year_band, teacher, students}`. Nothing to count."
>
> **B-2** — "Coming up" list (3 dated rows), `portal--main.html:120-140`: "Same as B-1."

<!-- step-1 probe output, and the W5 substitute instruction, are appended here as the task runs -->
