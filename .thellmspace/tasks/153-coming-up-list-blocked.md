---
id: 153
title: BLOCKED — the "Coming up" list has no scheduling data source (B-2)
layer: ui
kind: build
slice: Design §7, the dashboard's last section
target: (none — nothing is built)
contract: BLOCKED B-2
design: .qa/design/screens/portal--main.html:120-144 · .qa/design/spec/01-portal-dashboard.md#7
status: BLOCKED
depends_on: ["131"]
---

## Objective
Record that the dashboard's final section — three dated event rows under a "Coming up" heading —
cannot be built, and that the dashboard therefore ends after the note grid. No placeholder row, no
empty-state card, no "no upcoming tests" copy that implies the system would know.

## Contract
`.qa/CONTRACTS.md`, BLOCKED table, verbatim:

> | **B-2** | "Coming up" list (3 dated rows) | `portal--main.html:120-140` | Same as B-1. |

and B-1, which it refers to:

> No scheduling model exists anywhere: no `scheduled_at`/`due_at`/`assignment`/`sitting` field on
> any content-type; `class` is only `{name, year_band, teacher, students}`. Nothing to count.

Corroborated by `.qa/intake/api-inventory.md` **G18 — No scheduling / upcoming-test data**:
"sessions are created on demand by `POST /api/sessions` (student/teacher/admin only). 'Next test' is
unrepresentable."

## Design source (recorded for whoever unblocks it)
`portal--main.html:121-144`, spec §7:
- Container: `background:#FFFFFF; border-radius:24px; padding:8px 30px; box-shadow:0 1px 2px
  rgba(14,35,80,.04)`.
- Header `padding:22px 0 6px`; `<h2>` **"Coming up"** `19px / 600 / -0.01em / #0E2350`; action
  **"Full calendar →"** `13.5px / 500 / #7C8698`, hover `#2563EB`, **no handler bound**.
- Event row `display:flex; align-items:center; gap:20px; padding:18px 0; border-bottom:1px solid
  #EEF1F6`; last row `padding:18px 0 24px`, no border.
- Date block `width:56px; text-align:center`; day `21px / 700 / #0E2350 / line-height 1`; month
  `11px / 600 / .08em / #9AA6B8 / margin-top:3px`, literal uppercase 3-letter, day zero-padded to 2.
- Vertical rule `width:1px; height:34px; background:#EEF1F6`.
- Title `14.5px / 600 / #0E2350`; detail `13px / #7C8698 / margin-top:2px`.
- Status label two variants: emphasis `12px / 600 / #2563EB`, quiet `12px / 500 / #7C8698`.
- The three rows: `25 JUL` "English placement — all four skills" / "Due Friday" (emphasis);
  `29 JUL` "Reading & listening check-in" / "Window open" (quiet); `04 AUG`
  "Parent–teacher review call" / "Scheduled" (quiet).

Note the design's own inconsistency, already recorded in spec §4.2: the hero stat says `2` while
this list shows `3` rows.

## What must NOT happen
- No section rendered at all — not an empty card, not "Nothing coming up", not a skeleton. An empty
  "Coming up" card asserts that the system checked and found nothing scheduled; it has no way to
  check. That is a subtler lie than a fabricated row and is equally forbidden.
- No "Full calendar →" link — there is no calendar route and the design binds no handler.
- No derivation of upcoming items from `createdAt`, `target_entry_year`, `target_entry_term`, or any
  cadence guess.

## Unblocking condition
Same as B-1: a scheduling content-type carrying a per-student due/scheduled timestamp, a
parent-reachable read endpoint, a `C-*` contract entry and a registered grant. Then this section is
a straight build from the spec above.

## Files
none

## Depends on
- **131** — the section stack this section would have terminated.

## Steps
none — terminal.

## Project rules
- `.qa/DECISIONS.md` D-SCOPE-1 clause 4 — "'Do not invent' is absolute."
- `.qa/PLAN.md` finding 3 — blocked metrics get the sanctioned vocabulary or nothing; never a fake.

## Done criteria
BLOCKED, with the refusal provable:
- `grep -rniE "Coming up|Full calendar|Due Friday|Window open|placement — all four" src/ tests/e2e src/i18n/messages/`
  returns zero hits (excluding this file).
- `/dashboard` has no `<h2>` whose text is "Coming up" and no `[data-slot="dashboard-coming-up"]`.
- The dashboard's last section at 1280px and 375px is the note grid — asserted by comparing the
  last child of `[data-slot="dashboard-overview"]`.

## Assumptions
none

## Evidence
Blocking rule, `.qa/CONTRACTS.md` B-2 (referring to B-1): "No scheduling model exists anywhere: no
`scheduled_at`/`due_at`/`assignment`/`sitting` field on any content-type; `class` is only
`{name, year_band, teacher, students}`. Nothing to count."
