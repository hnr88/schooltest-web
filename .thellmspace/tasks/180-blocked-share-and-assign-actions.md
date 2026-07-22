---
id: 180
title: BLOCKED — "Share with teacher" and "Assign practice" have no model, no endpoint and no handler
layer: ui
kind: verify
slice: Refusal record for the two unbound buttons in the child-detail header.
target: (no source change) .qa/design/screens/portal--child-detail.html L12-13
contract: C-CONTRACTS B-1 (scheduling/assignment) · no contract exists for teacher sharing
design: .qa/design/spec/02-portal-children.md §B.1, §UNKNOWNS "Handlers"
status: BLOCKED
depends_on: ["179"]
---

## Objective

Record that neither header button is buildable, and that task `179` fills their two slots with the
two operations that do exist.

## Contract

**Assign practice** falls under `.qa/CONTRACTS.md` **B-1**, verbatim:

> No scheduling model exists anywhere: no `scheduled_at`/`due_at`/`assignment`/`sitting` field on any
> content-type; `class` is only `{name, year_band, teacher, students}`. Nothing to count.

Assigning practice requires exactly that missing assignment/scheduling model, plus a parent-callable
write route that `.qa/intake/api-inventory.md` does not list (the parent write surface is
`POST /api/students`, `PUT /api/students/:documentId`, archive/unarchive, push and preference routes —
nothing session-creating).

**Share with teacher** has no contract at all: no share, invite, export or teacher-link operation
exists in `.qa/CONTRACTS.md` or in the API inventory, and `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:54-58`
gives the parent no teacher-facing capability. `SCHOOLTEST_ONSHORE_HANDOFF.md:45` mentions exported
profiles only as something a **teacher** does.

## Design source

`.qa/design/spec/02-portal-children.md §UNKNOWNS`:

> **Handlers.** In `portal--child-detail.html`, "Share with teacher" (L12), "Assign practice" (L13),
> "All reports →" (L61) and "Report" (L68) have `cursor:pointer` but **no** `onClick` binding — their
> destinations are undetermined.

## Files

None.

## Depends on

- `179` — the two pill slots must already carry Edit and Archive/Unarchive before this refusal is closed.

## Steps

1. Confirm the header renders exactly two pills and neither promises sharing or assignment.
2. Grep the wave diff for `assign|share|invite|export` in `src/modules/children` — expect zero
   user-facing affordances.
3. Terminal state stays `BLOCKED`. Re-openable only by a future mission that adds an assignment
   content-type and a parent-callable route, with its own contract entry.

## Project rules

- `.qa/DECISIONS.md` D-SCOPE-1.4 — "'Do not invent' is absolute."
- `.qa/PLAN.md` finding 3 — a design screen with no data behind it is not to be faked.

## Done criteria

- No "Share with teacher" or "Assign practice" control exists in the DOM at
  `/dashboard/children/{documentId}` (Playwright `getByRole('button', { name: /share|assign/i })`
  → count 0).
- The grep above returns zero user-facing hits.
- The header screenshot in Evidence shows the two real actions in the design's pill geometry.

## Assumptions

None.

## Evidence

<!-- BLOCKED: B-1 (assignment) + no contract (sharing). Record the grep output and the header screenshot. -->
