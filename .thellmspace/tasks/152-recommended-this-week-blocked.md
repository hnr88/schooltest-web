---
id: 152
title: BLOCKED — "Recommended this week" has neither a recommendation source nor an Assign action
layer: ui
kind: build
slice: Design §6.2, the right cell of the second dashboard grid
target: (none — nothing is built)
contract: n/a — no content-type, and the implied action is not granted to parents
design: .qa/design/screens/portal--main.html:98-117 · .qa/design/spec/01-portal-dashboard.md#6.2
status: BLOCKED
depends_on: ["131"]
---

## Objective
Record that the three-item "Recommended this week" list cannot be built, and that the note grid
therefore renders as a single full-width cell (150) rather than a card beside an empty one.

## Contract
No contract exists. Two independent blockers:

1. **No recommendation data.** There is no recommendation, activity, drill, exercise or assignment
   content-type anywhere in the parent-reachable API (`.qa/intake/api-inventory.md` §1/§2 lists all
   26 endpoints). The design's items ("Speaking drill — describe your day", "10 min", "builds
   toward Friday's presentation") have no field to read from — the duration, the target child, the
   rationale and the ordering are all authored prose in the export.
2. **No Assign action.** Assigning work would mean creating a session.
   `.qa/intake/api-inventory.md` §3.2: `POST /api/sessions` → `api::session.session.createSession`
   is granted to **student, teacher, admin** — not parent. A parent cannot create work for a child,
   and the "builds toward Friday's presentation" rationale additionally depends on the same
   scheduling model that **B-1/B-2** already record as absent.

`.qa/DECISIONS.md` D-SCOPE-1: "Only add design that is functional." A list of three static rows with
two dead "Assign" buttons and one dead "Done ✓" is not functional design.

## Design source (recorded for whoever unblocks it)
`portal--main.html:98-117`, spec §6.2:
- Card: `background:#FFFFFF; border-radius:24px; padding:28px 30px; box-shadow:0 1px 2px
  rgba(14,35,80,.04)`; `<h2>` **"Recommended this week"** `16px / 600 / #0E2350`.
- List `display:flex; flex-direction:column; gap:6px; margin-top:14px`; item row
  `display:flex; align-items:center; gap:14px; padding:11px 0`.
- Index circle `26×26; radius 999px; border 1.5px solid #D8DFEA; 11px / 700 / #7C8698`.
- Title `14px / 600 / #0E2350`; meta `12.5px / #7C8698 / margin-top:1px`;
  action `13px / 600 / #2563EB`.
- The three items and their actions: `Assign`, `Assign`, `Done ✓` (U+2713) — the third is the
  completed variant, same colour, only the text differs; no struck-through or dimmed treatment
  exists in the markup.

## Consequence for the layout (this is the actionable part)
The note grid (`portal--main.html:88`) is
`grid-template-columns:repeat(auto-fit,minmax(380px,1fr))`. With one child it collapses to a single
full-width column automatically — **no change is needed and no filler must be added**. Specifically
forbidden: an "coming soon" card, a disabled ghost card, a promo card moved into the slot to fill
it, or hard-coding the grid to one column (which would break if a second real card is ever added).

## What must NOT happen
- No hardcoded practice suggestions in TSX or in any locale catalog.
- No "Assign" button, enabled or disabled — a parent cannot assign.
- No client-side recommendation heuristic derived from `focusSkill` (e.g. "focus is speaking ⇒
  suggest a speaking drill"). That is a product recommendation engine, invented in the UI layer,
  with no content behind the suggestion.

## Unblocking condition
A recommendation/activity content-type with per-child targeting and a duration; a parent-reachable
read endpoint plus a `C-*` entry and grant; and — for Assign — a parent-permitted write path, which
is a permissions and product decision (today `createSession` is deliberately not a parent action).

## Files
none

## Depends on
- **131** — the grid whose single-cell collapse this task justifies.

## Steps
none — terminal.

## Project rules
- `.qa/DECISIONS.md` D-SCOPE-1 clause 4 and "Only add design that is functional."
- `.claude/rules/quality.md` — no non-operable controls.

## Done criteria
BLOCKED, with the refusal provable:
- `grep -rniE "Recommended this week|Speaking drill|Picture words|Read together|Assign" src/ tests/e2e src/i18n/messages/`
  returns zero hits (excluding this file).
- On `/dashboard` the note grid contains exactly one card, `[data-slot="dashboard-school-note"]`,
  and it spans the full grid width at 1280px (its `getBoundingClientRect().width` equals the grid's
  content width within 1px).
- No element on `/dashboard` has an accessible name `Assign` or `Done ✓`.

## Assumptions
none

## Evidence
Blocking evidence, `.qa/intake/api-inventory.md` §3.2: `POST /api/sessions`
(`api::session.session.createSession`) is granted to student, teacher and admin only —
`permissions-action-refs.ts:26-28`. No recommendation/activity content-type exists in the
parent-reachable surface.
