---
id: 138
title: BLOCKED — "coming up" hero stat has no data source (B-1)
layer: ui
kind: build
slice: Design metric inventory row 2, the middle hero stat
target: (none — nothing is built)
contract: C-DASH-HOUSEHOLD (does not carry this field) · BLOCKED B-1
design: .qa/design/screens/portal--main.html:34 · .qa/design/spec/01-portal-dashboard.md#4.2 #10 (row 2)
status: BLOCKED
depends_on: ["135"]
---

## Objective
Record, as a first-class task with a terminal BLOCKED state, that the design's second hero stat
cannot be built. No file is created. No number is rendered. No placeholder is rendered.

## Contract
`.qa/CONTRACTS.md`, "BLOCKED — design metrics with no honest data source", verbatim:

> | **B-1** | `coming up` hero stat (`2`) | `portal--main.html:34` | No scheduling model exists
> anywhere: no `scheduled_at`/`due_at`/`assignment`/`sitting` field on any content-type; `class` is
> only `{name, year_band, teacher, students}`. Nothing to count. |

Corroborated by `.qa/intake/api-inventory.md` **G18 — No scheduling / upcoming-test data**: sessions
are created on demand by `POST /api/sessions` (student/teacher/admin only). "Next test" is
unrepresentable.

`C-DASH-HOUSEHOLD` deliberately returns no upcoming/scheduled field. There is nothing to read.

## Design source
`portal--main.html:34`, spec §4.2:
- Visible label: **`coming up`**
- Example value: **`2`**
- Format: integer. No sub-label, no delta, no icon. Cell styling identical to §4.1.
- The design's own data is self-inconsistent: spec §4.2 records that the "Coming up" list (§7)
  renders **3** rows while this stat says `2`. Recorded, not resolved.

## What must NOT happen
- No `resultsPublished`, `childCount`, `activeSessions` or any other number relabelled as
  "coming up". Task 135 forbids filling the third slot and asserts `[data-metric="coming-up"]`
  count is 0.
- No `—`, `–`, `0`, `?`, `N/A` or greyed-out cell. An honest layout of two stats is correct; a
  third cell that says nothing is a lie about the design being implemented.
- No client-side "next test" invention from `createdAt` + a cadence guess.

## Unblocking condition (for whoever revisits this)
A scheduling surface must exist first: a content-type carrying a due/scheduled timestamp per
student, a parent-reachable read endpoint for it, a `C-*` contract entry, and a grant registered in
`schooltest-api/src/bootstrap/permissions-actions.ts`. That is a product decision and new backend
scope, not a redesign task. Until then this stays BLOCKED.

## Files
none

## Depends on
- **135** — the row that documents the two-cell composition this task justifies.

## Steps
none — this task is terminal.

## Project rules
- `.qa/DECISIONS.md` **D-SCOPE-1** clause 4: "'Do not invent' is absolute. A design screen with no
  data behind it is not to be faked."
- `.qa/PLAN.md` "Definition of done" — nothing is marked done that is not provable against real data.

## Done criteria
This task is DONE when it is BLOCKED and the refusal is provable:
- `grep -rniE "coming.?up" src/modules/dashboard src/i18n/messages` returns zero hits.
- The Playwright assertion in 135 (`[data-metric="coming-up"]` count === 0) passes.
- The hero stat row shows exactly two cells at 1280px and 375px.

## Assumptions
none

## Evidence
Blocking rule, quoted from `.qa/CONTRACTS.md` B-1: "No scheduling model exists anywhere: no
`scheduled_at`/`due_at`/`assignment`/`sitting` field on any content-type; `class` is only
`{name, year_band, teacher, students}`. Nothing to count."
Corroborating gap, `.qa/intake/api-inventory.md` G18: "'Next test' is unrepresentable."
